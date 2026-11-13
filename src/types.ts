export type UserRole = 'admin' | 'cliente';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  phone: string;
  address: string;
  createdAt: string;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  imageUrl: string;
  nutritionalInfo: string;
  stock: number;
  active: boolean;
  createdAt: string;
}

export type StockMovementType = 'entrada' | 'saida';

export interface StockMovement {
  id: number;
  productId: number;
  productName: string;
  type: StockMovementType;
  quantity: number;
  observation: string;
  createdBy: string;
  createdAt: string;
}

export type OrderStatus = 'Pendente' | 'Em Preparo' | 'Pronto para Retirada' | 'Concluído';
export type DeliveryMethod = 'retirada';
export type PaymentMethod = 'pix' | 'cartao_retirada' | 'dinheiro';

export interface OrderItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number | null;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  deliveryMethod: DeliveryMethod;
  deliveryAddress: string;
  paymentMethod: PaymentMethod;
  notes: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface AccessibilityPrefs {
  theme: 'light' | 'dark';
  fontSize: 'default' | 'md' | 'lg';
  reduceMotion: boolean;
  extraSpacing: boolean;
}
