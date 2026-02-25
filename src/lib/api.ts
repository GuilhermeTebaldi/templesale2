export interface ProductDto {
  id: number;
  name: string;
  category: string;
  price: string;
  image: string;
  images?: string[];
  description?: string;
  details?: Record<string, string>;
  ownerId?: number;
  latitude?: number;
  longitude?: number;
  sellerName?: string;
  sellerWhatsappCountryIso?: string;
  sellerWhatsappNumber?: string;
}

export type NotificationDto =
  | {
      id: string;
      type: "product_like";
      title: string;
      message: string;
      createdAt: number;
      actorUserId: number;
      productId: number;
    }
  | {
      id: string;
      type: "system_welcome";
      title: string;
      message: string;
      createdAt: number;
      actorUserId?: number;
      productId?: number;
    };

export interface CreateProductInput {
  name: string;
  category: string;
  price: string;
  image?: string;
  images?: string[];
  description: string;
  details?: Record<string, string>;
  latitude: number;
  longitude: number;
}

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  country?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
  whatsappCountryIso?: string;
  whatsappNumber?: string;
}

export interface UpdateProfileInput {
  name: string;
  country: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  whatsappCountryIso: string;
  whatsappNumber: string;
}

export interface AuthInput {
  email: string;
  password: string;
  name?: string;
}

export interface UploadImageResponse {
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
}

type ApiEnvelope = {
  success?: boolean;
  data?: unknown;
  error?: string;
  message?: string;
};

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL ?? "")
  .trim()
  .replace(/\/+$/, "");

function buildApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
}

function asEnvelope(value: unknown): ApiEnvelope | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as ApiEnvelope;
}

function extractApiError(payload: unknown): string | null {
  const envelope = asEnvelope(payload);
  if (!envelope) {
    return null;
  }
  if (typeof envelope.error === "string" && envelope.error.trim()) {
    return envelope.error.trim();
  }
  if (typeof envelope.message === "string" && envelope.message.trim()) {
    return envelope.message.trim();
  }
  return null;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildApiUrl(url), {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    if (isJson) {
      try {
        const payload = (await response.json()) as unknown;
        const apiError = extractApiError(payload);
        if (apiError) {
          message = apiError;
        }
      } catch {
        // Keep default HTTP message when JSON parsing fails.
      }
    } else {
      const text = await response.text();
      if (text.trim().startsWith("<!doctype")) {
        message =
          "A API não respondeu corretamente. Reinicie com: pkill -f \"tsx server.ts\" && npm run dev";
      }
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (!isJson) {
    const text = await response.text();
    if (text.trim().startsWith("<!doctype")) {
      throw new Error(
        "API desatualizada no dev server. Reinicie com: pkill -f \"tsx server.ts\" && npm run dev",
      );
    }
    throw new Error("Resposta inválida da API.");
  }

  const payload = (await response.json()) as unknown;
  const envelope = asEnvelope(payload);
  if (envelope) {
    if (envelope.success === false) {
      const message = extractApiError(payload) ?? "Falha na API.";
      throw new Error(message);
    }
    if ("data" in envelope && envelope.data !== undefined) {
      return envelope.data as T;
    }
  }

  return payload as T;
}

async function uploadProductImageFile(file: File): Promise<UploadImageResponse> {
  const response = await fetch(buildApiUrl("/api/uploads/product-image"), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": file.type || "image/jpeg",
      "X-File-Name": encodeURIComponent(file.name || "upload"),
    },
    body: file,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    if (isJson) {
      try {
        const payload = (await response.json()) as unknown;
        const apiError = extractApiError(payload);
        if (apiError) {
          message = apiError;
        }
      } catch {
        // Keep default HTTP message when JSON parsing fails.
      }
    }
    throw new Error(message);
  }

  if (!isJson) {
    throw new Error("Resposta inválida do upload de imagem.");
  }

  const payload = (await response.json()) as unknown;
  const envelope = asEnvelope(payload);
  if (envelope) {
    if (envelope.success === false) {
      const message = extractApiError(payload) ?? "Falha no upload.";
      throw new Error(message);
    }
    if (envelope.data && typeof envelope.data === "object") {
      return envelope.data as UploadImageResponse;
    }
  }

  return payload as UploadImageResponse;
}

export const api = {
  register(payload: AuthInput) {
    return request<SessionUser>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  login(payload: AuthInput) {
    return request<SessionUser>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  getCurrentUser() {
    return request<SessionUser>("/api/auth/me");
  },
  logout() {
    return request<{ success: boolean }>("/api/auth/logout", {
      method: "POST",
    });
  },
  updateProfile(payload: UpdateProfileInput) {
    return request<SessionUser>("/api/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  getProducts() {
    return request<ProductDto[]>("/api/products");
  },
  getMyProducts() {
    return request<ProductDto[]>("/api/my-products");
  },
  getLikedProducts() {
    return request<ProductDto[]>("/api/likes");
  },
  async getNotifications() {
    try {
      return await request<NotificationDto[]>("/api/notifications");
    } catch (error) {
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (message.includes("404") || message.includes("rota da api não encontrada")) {
          return [];
        }
      }
      throw error;
    }
  },
  createProduct(product: CreateProductInput) {
    return request<ProductDto>("/api/products", {
      method: "POST",
      body: JSON.stringify(product),
    });
  },
  updateProduct(id: number, product: CreateProductInput) {
    return request<ProductDto>(`/api/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(product),
    });
  },
  likeProduct(id: number) {
    return request<{ success: boolean }>(`/api/products/${id}/like`, {
      method: "POST",
    });
  },
  unlikeProduct(id: number) {
    return request<{ success: boolean }>(`/api/products/${id}/like`, {
      method: "DELETE",
    });
  },
  deleteProduct(id: number) {
    return request<{ success: boolean }>(`/api/products/${id}`, {
      method: "DELETE",
    });
  },
  uploadProductImage(file: File) {
    return uploadProductImageFile(file);
  },
};
