import { MenuItem, Order, OrderStatus, RestaurantInfo } from '../types';

export async function fetchRestaurant(): Promise<{ info: RestaurantInfo; stats: any }> {
  const res = await fetch('/api/restaurant');
  if (!res.ok) throw new Error('Failed to fetch restaurant info');
  return res.json();
}

export async function updateRestaurant(info: Partial<RestaurantInfo>): Promise<{ success: boolean; info: RestaurantInfo }> {
  const res = await fetch('/api/restaurant', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(info)
  });
  if (!res.ok) throw new Error('Failed to update restaurant settings');
  return res.json();
}

export async function fetchMenu(): Promise<MenuItem[]> {
  const res = await fetch('/api/menu');
  if (!res.ok) throw new Error('Failed to fetch menu');
  return res.json();
}

export async function createMenuItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
  const res = await fetch('/api/menu', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create menu item');
  }
  return res.json();
}

export async function updateMenuItem(id: string, item: Partial<MenuItem>): Promise<MenuItem> {
  const res = await fetch(`/api/menu/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update menu item');
  }
  return res.json();
}

export async function toggleMenuItemAvailability(id: string): Promise<MenuItem> {
  const res = await fetch(`/api/menu/${id}/toggle`, {
    method: 'PATCH'
  });
  if (!res.ok) throw new Error('Failed to toggle item availability');
  return res.json();
}

export async function deleteMenuItem(id: string): Promise<{ success: boolean; id: string }> {
  const res = await fetch(`/api/menu/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete menu item');
  return res.json();
}

export async function uploadMenuData(data: {
  items?: any[];
  rawContent?: string;
  mode?: 'append' | 'replace';
  useAi?: boolean;
}): Promise<{ success: boolean; addedCount: number; totalCount: number; items: MenuItem[] }> {
  const res = await fetch('/api/menu/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to process menu upload');
  }
  return res.json();
}

export async function resetSampleMenu(): Promise<{ success: boolean; menu: MenuItem[] }> {
  const res = await fetch('/api/menu/reset-sample', {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to reset sample menu');
  return res.json();
}

export async function fetchOrders(table?: string, status?: string): Promise<Order[]> {
  const params = new URLSearchParams();
  if (table) params.append('table', table);
  if (status) params.append('status', status);
  const query = params.toString();
  const url = query ? `/api/orders?${query}` : '/api/orders';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

export async function fetchOrderById(id: string): Promise<Order> {
  const res = await fetch(`/api/orders/${id}`);
  if (!res.ok) throw new Error('Order not found');
  return res.json();
}

export async function createOrder(data: {
  tableNumber: string;
  items: { menuItemId: string; name?: string; price?: number; quantity: number; notes?: string }[];
  customerNotes?: string;
}): Promise<Order> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to place order');
  }
  return res.json();
}

export async function updateOrderStatus(id: string, status: OrderStatus, note?: string): Promise<Order> {
  const res = await fetch(`/api/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, note })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update order status');
  }
  return res.json();
}
