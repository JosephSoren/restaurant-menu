export type DietaryTag = 'Vegetarian' | 'Vegan' | 'Gluten-Free' | 'Dairy-Free' | 'Spicy' | 'Nut-Free';

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  imageUrl?: string;
  dietary?: DietaryTag[];
  isAvailable: boolean;
  prepTimeMinutes?: number;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export type OrderStatus = 'received' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: number;
  tableNumber: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  subtotal: number;
  tax: number;
  totalAmount: number;
  customerNotes?: string;
  statusHistory: StatusHistoryEntry[];
}

export interface RestaurantInfo {
  name: string;
  tagline: string;
  currency: string;
  taxRate: number;
  tables: number[];
}

export type RealtimeEvent =
  | { type: 'order:created'; order: Order }
  | { type: 'order:updated'; order: Order }
  | { type: 'menu:updated'; menu: MenuItem[] };
