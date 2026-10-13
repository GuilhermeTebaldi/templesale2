import type { NextFunction, Request, Response } from "express";

type WriteHandler = (req: Request, res: Response) => Promise<void>;

// Per-process budget: reject excess writes rather than building an unbounded queue.
// A slot remains occupied until the operation ends, even if the client disconnects.
export function createWriteAdmission(maxConcurrent: number) {
  let active = 0;
  const limit = Number.isFinite(maxConcurrent) ? Math.max(1, Math.floor(maxConcurrent)) : 16;
  const admit = (handler: WriteHandler) => async (req: Request, res: Response, next: NextFunction) => {
    if (active >= limit) {
      res.setHeader("Retry-After", "2");
      res.status(503).json({ error: "Servidor ocupado. Aguarde alguns segundos antes de tentar novamente.", code: "WRITE_BUSY" });
      return;
    }
    active += 1;
    try { await handler(req, res); }
    catch (error) { next(error); }
    finally { active -= 1; }
  };
  return Object.assign(admit, { snapshot: () => ({ active, limit }) });
}
