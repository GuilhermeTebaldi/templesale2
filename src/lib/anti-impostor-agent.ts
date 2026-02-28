const DEFAULT_SITE_ID = "ugo3ifae3";
const MAX_EVENTS = 30;
const STATUS_POLL_INTERVAL_MS = 60_000;

declare global {
  interface Window {
    __templesaleAntiImpostorInstalled?: boolean;
  }
}

function textSafe(value: unknown, maxLen: number): string {
  const raw = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (!raw) {
    return "-";
  }
  return raw.length > maxLen ? `${raw.slice(0, maxLen)}...` : raw;
}

function normalizeSiteId(value: unknown): string {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized || !/^[a-z0-9_-]{3,64}$/i.test(normalized)) {
    return "";
  }
  return normalized;
}

function buildAgentApiBase(): string {
  const configuredBase = String(import.meta.env.VITE_AGENT_API_BASE_URL ?? "")
    .trim()
    .replace(/\/+$/, "");
  if (configuredBase) {
    return configuredBase;
  }
  return "";
}

function buildAgentUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const apiBase = buildAgentApiBase();
  return apiBase ? `${apiBase}${normalizedPath}` : normalizedPath;
}

export function installAntiImpostorAgent(): void {
  if (typeof window === "undefined") {
    return;
  }
  if (window.__templesaleAntiImpostorInstalled) {
    return;
  }
  window.__templesaleAntiImpostorInstalled = true;

  const siteId = normalizeSiteId(import.meta.env.VITE_AGENT_SITE_ID ?? DEFAULT_SITE_ID);
  if (!siteId) {
    return;
  }

  const statusUrl = buildAgentUrl(`/api/agent/status/${encodeURIComponent(siteId)}`);
  const reportUrl = buildAgentUrl(`/api/agent/report?siteId=${encodeURIComponent(siteId)}`);
  let sentEvents = 0;
  const dedupe: Record<string, true> = {};

  const markOnce = (key: string): boolean => {
    if (dedupe[key]) {
      return false;
    }
    dedupe[key] = true;
    return true;
  };

  const sendEvent = (type: string, target: string, status = "Monitored") => {
    if (sentEvents >= MAX_EVENTS) {
      return;
    }
    sentEvents += 1;

    void fetch(reportUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteId,
        type: textSafe(type, 120),
        source: textSafe(`${window.location.origin}${window.location.pathname}`, 160),
        target: textSafe(target, 260),
        status: textSafe(status, 80),
      }),
      keepalive: true,
    }).catch(() => {});
  };

  const runPageChecks = () => {
    if (window.location.protocol !== "https:") {
      if (markOnce("no_https")) {
        sendEvent("Agent: Site sem HTTPS", `Página em HTTP: ${window.location.href}`, "Monitored");
      }
    }

    const insecureScripts = document.querySelectorAll('script[src^="http://"]');
    if (insecureScripts.length > 0 && markOnce("insecure_scripts")) {
      sendEvent(
        "Agent: Script externo inseguro",
        `Scripts HTTP detectados: ${insecureScripts.length}`,
        "Monitored",
      );
    }

    const insecureForms = Array.from(document.forms).filter((form) => {
      const action = form.getAttribute("action") ?? "";
      return /^http:\/\//i.test(action);
    });
    if (insecureForms.length > 0 && markOnce("insecure_forms")) {
      sendEvent(
        "Agent: Formulário inseguro",
        `Formulários HTTP detectados: ${insecureForms.length}`,
        "Monitored",
      );
    }

    const hasPassword = document.querySelector('input[type="password"]');
    if (hasPassword && window.location.protocol !== "https:" && markOnce("password_no_https")) {
      sendEvent("Agent: Senha sem HTTPS", "Campo de senha em página sem HTTPS", "Monitored");
    }
  };

  const installRuntimeChecks = () => {
    window.addEventListener("securitypolicyviolation", (event: SecurityPolicyViolationEvent) => {
      const key = `csp_${textSafe(event.violatedDirective ?? "-", 120)}`;
      if (!markOnce(key)) {
        return;
      }
      sendEvent(
        "Agent: CSP violada",
        `Diretiva: ${textSafe(event.violatedDirective ?? "-", 100)} | Recurso: ${textSafe(
          event.blockedURI ?? "-",
          120,
        )}`,
        "Monitored",
      );
    });

    window.addEventListener("error", (event: ErrorEvent) => {
      const message = textSafe(event.message ?? "erro_js", 120);
      const key = `js_${message}`;
      if (!markOnce(key)) {
        return;
      }
      sendEvent(
        "Agent: Erro JavaScript",
        `${message} | Arquivo: ${textSafe(`${event.filename ?? "-"}:${event.lineno ?? 0}`, 120)}`,
        "Monitored",
      );
    });

    window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
      const rejectionReason = (() => {
        if (event.reason instanceof Error) {
          return event.reason.message;
        }
        if (
          typeof event.reason === "object" &&
          event.reason !== null &&
          "message" in event.reason
        ) {
          return String((event.reason as { message?: unknown }).message ?? "");
        }
        return String(event.reason ?? "");
      })();

      const reason = textSafe(rejectionReason || "promise_rejeitada", 120);
      const key = `promise_${reason}`;
      if (!markOnce(key)) {
        return;
      }
      sendEvent("Agent: Promise rejeitada", reason, "Monitored");
    });
  };

  const checkSecurity = async () => {
    try {
      const response = await fetch(statusUrl, { cache: "no-store" });
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as { protected?: unknown };
      if (payload.protected === true) {
        console.log("AntiImpostor Active: Site Protected");
      } else {
        console.warn("AntiImpostor Warning: Protection Disabled by Admin");
        if (markOnce("protection_off")) {
          sendEvent(
            "Agent: Proteção desligada",
            "A proteção está desativada no painel",
            "Monitored",
          );
        }
      }
    } catch {
      console.error("AntiImpostor Connection Error");
    }
  };

  runPageChecks();
  installRuntimeChecks();
  void checkSecurity();
  window.setInterval(() => {
    void checkSecurity();
  }, STATUS_POLL_INTERVAL_MS);
}
