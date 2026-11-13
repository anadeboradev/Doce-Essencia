import type {
  DeliveryMethod,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  StockMovement,
  StockMovementType,
  User,
  UserRole,
} from '../types';

const TOKEN_STORAGE_KEY = 'doce_essencia_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota errors
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Ocorreu um erro na requisição.');
  }
  return data as T;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export const api = {
  getMe: () => request<{ user: User | null }>('/api/auth/me'),
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (payload: {
    email: string;
    password: string;
    name?: string;
    phone?: string;
    address?: string;
  }) =>
    request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  resetPassword: (email: string, newPassword: string) =>
    request<{ ok: boolean; message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    }),

  getProducts: (includeAll = false) =>
    request<{ products: Product[] }>(`/api/products${includeAll ? '?all=1' : ''}`),
  createProduct: (payload: {
    name: string;
    category: string;
    price: number;
    description: string;
    imageUrl: string;
    nutritionalInfo: string;
    stock: number;
  }) =>
    request<{ product: Product }>('/api/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateProduct: (
    id: number,
    payload: Partial<{
      name: string;
      category: string;
      price: number;
      description: string;
      imageUrl: string;
      nutritionalInfo: string;
      active: boolean;
    }>
  ) =>
    request<{ product: Product }>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteProduct: (id: number) =>
    request<{ ok: boolean }>(`/api/products/${id}`, {
      method: 'DELETE',
    }),

  getUsers: () => request<{ users: User[] }>('/api/users'),
  createUser: (payload: {
    email: string;
    password: string;
    name?: string;
    role: UserRole;
    phone?: string;
    address?: string;
  }) =>
    request<{ user: User }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateUserRole: (id: number, role: UserRole) =>
    request<{ user: User }>(`/api/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
  deleteUser: (id: number) =>
    request<{ ok: boolean }>(`/api/users/${id}`, {
      method: 'DELETE',
    }),

  getMovements: () => request<{ movements: StockMovement[] }>('/api/stock-movements'),
  createMovement: (payload: {
    productId: number;
    type: StockMovementType;
    quantity: number;
    observation: string;
  }) =>
    request<{ movement: StockMovement; product: Product }>('/api/stock-movements', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  createOrder: (payload: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    deliveryMethod: DeliveryMethod;
    deliveryAddress: string;
    paymentMethod: PaymentMethod;
    notes: string;
    items: Array<{ productId: number; quantity: number }>;
  }) =>
    request<{ order: Order }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getOrders: () => request<{ orders: Order[] }>('/api/orders'),
  updateOrderStatus: (id: number, status: OrderStatus) =>
    request<{ order: Order }>(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};
