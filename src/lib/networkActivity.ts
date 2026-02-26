const NETWORK_LOADING_SHOW_DELAY_MS = 350;

type Listener = () => void;

const listeners = new Set<Listener>();
let activeRequests = 0;
let isOverlayVisible = false;
let showDelayTimer: ReturnType<typeof setTimeout> | null = null;

function emitChange() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.error("Erro ao notificar estado de carregamento global:", error);
    }
  });
}

function setOverlayVisible(nextVisible: boolean) {
  if (isOverlayVisible === nextVisible) {
    return;
  }
  isOverlayVisible = nextVisible;
  emitChange();
}

function startShowDelayTimer() {
  if (showDelayTimer !== null) {
    globalThis.clearTimeout(showDelayTimer);
  }

  showDelayTimer = globalThis.setTimeout(() => {
    showDelayTimer = null;
    if (activeRequests > 0) {
      setOverlayVisible(true);
    }
  }, NETWORK_LOADING_SHOW_DELAY_MS);
}

export function subscribeNetworkLoading(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getNetworkLoadingSnapshot(): boolean {
  return isOverlayVisible;
}

export function beginNetworkActivity(): () => void {
  activeRequests += 1;
  if (activeRequests === 1) {
    startShowDelayTimer();
  }

  let closed = false;
  return () => {
    if (closed) {
      return;
    }
    closed = true;

    activeRequests = Math.max(0, activeRequests - 1);
    if (activeRequests > 0) {
      return;
    }

    if (showDelayTimer !== null) {
      globalThis.clearTimeout(showDelayTimer);
      showDelayTimer = null;
    }
    setOverlayVisible(false);
  };
}

export async function trackedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const endNetworkActivity = beginNetworkActivity();
  try {
    return await fetch(input, init);
  } finally {
    endNetworkActivity();
  }
}
