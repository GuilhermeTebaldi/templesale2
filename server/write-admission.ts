import type { NextFunction, Request, Response } from "express";

type WriteHandler = (req: Request, res: Response) => Promise<void>;
type Reservation = { running: boolean; release: () => void; timer: ReturnType<typeof setTimeout> };

// Per-process budget: reject excess writes rather than building an unbounded queue.
// A slot remains occupied until the operation ends, even if the client disconnects.
export function createWriteAdmission(maxConcurrent: number, underPressure: () => boolean = () => false) {
  let active = 0;
  let admitted = 0, rejected = 0, completed = 0, failed = 0, peak = 0, maxDurationMs = 0;
  const reservations = new WeakMap<Request, Reservation>();
  const limit = Number.isFinite(maxConcurrent) ? Math.max(1, Math.floor(maxConcurrent)) : 16;
  const reserve = (req: Request, res: Response) => {
    if (reservations.has(req)) return true;
    if (active >= limit || underPressure()) {
      rejected += 1;
      res.setHeader("Retry-After", "2");
      res.status(503).json({ error: "Servidor ocupado. Aguarde alguns segundos antes de tentar novamente.", code: "WRITE_BUSY" });
      return false;
    }
    active += 1;
    admitted += 1;
    peak = Math.max(peak, active);
    const startedAt = Date.now();
    let released = false;
    const reservation: Reservation = {
      running: false,
      release: () => {
        if (released) return;
        released = true; clearTimeout(reservation.timer); active -= 1; completed += 1;
        if (res.statusCode >= 400 || !res.writableEnded) failed += 1;
        maxDurationMs = Math.max(maxDurationMs, Date.now() - startedAt);
        reservations.delete(req);
      },
      timer: setTimeout(() => {
        if (!reservation.running) { req.destroy(); reservation.release(); }
      }, 60000),
    };
    reservation.timer.unref();
    reservations.set(req, reservation);
    return true;
  };
  const beforeBody = (req: Request, res: Response, next: NextFunction) => {
    if (!reserve(req, res)) return;
    const reservation = reservations.get(req)!;
    const onEnd = () => { if (!reservation.running) reservation.release(); };
    res.once('finish', onEnd); res.once('close', onEnd);
    next();
  };
  const admit = (handler: WriteHandler) => async (req: Request, res: Response, next: NextFunction) => {
    if (!reserve(req, res)) return;
    const reservation = reservations.get(req)!;
    reservation.running = true; clearTimeout(reservation.timer);
    try { await handler(req, res); }
    catch (error) { next(error); }
    finally { reservation.running = false; reservation.release(); }
  };
  return Object.assign(admit, { beforeBody, snapshot: () => ({ active, limit, admitted, rejected, completed, failed, peak, maxDurationMs }) });
}
