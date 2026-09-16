import React, { useState, useEffect, useCallback } from 'react';
import { Order, MenuItem, RestaurantInfo } from '../types';
import { fetchOrders } from '../services/api';
import { 
  Receipt, 
  Clock, 
  CheckCircle2, 
  RotateCw, 
  ShoppingBag, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  Utensils, 
  Sparkles, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface TableOrderHistoryProps {
  selectedTable: string;
  restaurantInfo: RestaurantInfo;
  menu: MenuItem[];
  onAddToCart: (item: MenuItem, quantity: number, notes?: string) => void;
  onOpenMenuTab: () => void;
  onOpenCart: () => void;
  liveOrders: Order[];
}

export function TableOrderHistory({
  selectedTable,
  restaurantInfo,
  menu,
  onAddToCart,
  onOpenMenuTab,
  onOpenCart,
  liveOrders
}: TableOrderHistoryProps) {
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTimelines, setExpandedTimelines] = useState<Record<string, boolean>>({});
  const [reorderSuccessMsg, setReorderSuccessMsg] = useState<string | null>(null);

  // Fetch completed orders for the current table from the backend API
  const loadCompletedOrders = useCallback(async () => {
    if (!selectedTable) return;
    setIsLoading(true);
    setError(null);
    try {
      // Query backend with both table and completed status
      const data = await fetchOrders(selectedTable, 'completed');
      
      // Fallback/merge: also check if any liveOrders for this table just completed
      const tableLiveCompleted = liveOrders.filter(
        o => String(o.tableNumber) === String(selectedTable) && o.status === 'completed'
      );
      
      const orderMap = new Map<string, Order>();
      data.forEach(o => orderMap.set(o.id, o));
      tableLiveCompleted.forEach(o => orderMap.set(o.id, o));
      
      const merged = Array.from(orderMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setCompletedOrders(merged);
    } catch (err: any) {
      console.error('Failed to fetch past completed orders:', err);
      // If network fails, use any completed orders present in liveOrders prop
      const fallback = liveOrders
        .filter(o => String(o.tableNumber) === String(selectedTable) && o.status === 'completed')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCompletedOrders(fallback);
      setError('Could not refresh orders from server. Showing cached history.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedTable, liveOrders]);

  // Load when table changes or mounts
  useEffect(() => {
    loadCompletedOrders();
  }, [selectedTable]);

  // Toggle timeline expansion
  const toggleTimeline = (orderId: string) => {
    setExpandedTimelines(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  // Re-order entire completed order
  const handleReorderAll = (order: Order) => {
    let addedCount = 0;
    let unavailableCount = 0;

    order.items.forEach(orderItem => {
      const menuItem = menu.find(m => m.id === orderItem.menuItemId);
      if (menuItem) {
        if (menuItem.isAvailable) {
          onAddToCart(menuItem, orderItem.quantity, orderItem.notes);
          addedCount += orderItem.quantity;
        } else {
          unavailableCount++;
        }
      } else {
        // Fallback reconstructed menu item if deleted from active catalog
        const fallbackItem: MenuItem = {
          id: orderItem.menuItemId,
          name: orderItem.name,
          description: '',
          price: orderItem.price,
          category: 'Past Favorites',
          isAvailable: true,
          dietary: []
        };
        onAddToCart(fallbackItem, orderItem.quantity, orderItem.notes);
        addedCount += orderItem.quantity;
      }
    });

    if (addedCount > 0) {
      const msg = unavailableCount > 0
        ? `Added ${addedCount} items to your cart (${unavailableCount} unavailable).`
        : `Added all items from Order #${order.orderNumber} to your cart!`;
      setReorderSuccessMsg(msg);
      setTimeout(() => setReorderSuccessMsg(null), 3500);
    }
  };

  // Quick single-item re-add
  const handleReorderSingleItem = (
    menuItemId: string,
    fallbackName: string,
    fallbackPrice: number,
    notes?: string
  ) => {
    const menuItem = menu.find(m => m.id === menuItemId);
    if (menuItem) {
      if (!menuItem.isAvailable) {
        setReorderSuccessMsg(`"${menuItem.name}" is currently unavailable.`);
        setTimeout(() => setReorderSuccessMsg(null), 2500);
        return;
      }
      onAddToCart(menuItem, 1, notes);
    } else {
      const fallbackItem: MenuItem = {
        id: menuItemId,
        name: fallbackName,
        description: '',
        price: fallbackPrice,
        category: 'Past Favorites',
        isAvailable: true,
        dietary: []
      };
      onAddToCart(fallbackItem, 1, notes);
    }
    setReorderSuccessMsg(`Added "${fallbackName}" to your cart!`);
    setTimeout(() => setReorderSuccessMsg(null), 2500);
  };

  // Format date nicely
  const formatOrderDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(d);
    } catch {
      return isoString;
    }
  };

  // Calculate table spent total
  const totalSpentAtTable = completedOrders.reduce((acc, order) => acc + order.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Toast banner for re-order */}
      {reorderSuccessMsg && (
        <div className="bg-emerald-800 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" />
            <span>{reorderSuccessMsg}</span>
          </div>
          <button
            onClick={onOpenCart}
            className="px-3 py-1 bg-white text-emerald-950 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 flex-shrink-0"
          >
            <span>View Cart</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* History Summary Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200/60">
              Table #{selectedTable}
            </span>
            <span className="text-xs text-stone-500 font-medium">
              Past Completed Orders
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-stone-900 mt-1">
            Order History &amp; Receipts
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            View completed bills, itemized dishes, and re-order your favorites with one click.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Stats Pill */}
          <div className="bg-stone-50 border border-stone-200 px-3.5 py-2 rounded-xl flex items-center gap-3">
            <div>
              <p className="text-[10px] uppercase font-semibold text-stone-500 tracking-wider">
                Completed
              </p>
              <p className="text-sm font-bold text-stone-900">
                {completedOrders.length} {completedOrders.length === 1 ? 'Order' : 'Orders'}
              </p>
            </div>
            <div className="h-6 w-px bg-stone-200" />
            <div>
              <p className="text-[10px] uppercase font-semibold text-stone-500 tracking-wider">
                Total Settled
              </p>
              <p className="text-sm font-bold text-amber-700">
                {restaurantInfo.currency}{totalSpentAtTable.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadCompletedOrders}
            disabled={isLoading}
            className="p-2.5 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-stone-700 rounded-xl border border-stone-200 transition-colors flex items-center justify-center shadow-2xs"
            title="Refresh order history"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Network or Error Banner */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Orders List or Empty State */}
      {isLoading && completedOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-stone-600">
            Fetching order history for Table #{selectedTable}...
          </p>
        </div>
      ) : completedOrders.length === 0 ? (
        <div className="bg-white p-8 sm:p-12 rounded-2xl border border-stone-200 shadow-2xs text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mx-auto">
            <Receipt className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-stone-900">
              No Past Completed Orders for Table #{selectedTable}
            </h4>
            <p className="text-sm text-stone-500 mt-1 max-w-md mx-auto">
              Once an order placed for Table #{selectedTable} is prepared, served, and settled by the kitchen, its receipt and itemized breakdown will appear here.
            </p>
          </div>
          <button
            onClick={onOpenMenuTab}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Utensils className="w-4 h-4 text-amber-400" />
            <span>Browse Menu &amp; Order</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {completedOrders.map(order => {
            const isTimelineExpanded = !!expandedTimelines[order.id];

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-stone-200 shadow-2xs hover:shadow-xs transition-shadow overflow-hidden"
              >
                {/* Order Top Bar */}
                <div className="p-4 sm:p-5 bg-stone-50/60 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center font-bold">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-extrabold text-stone-900">
                          Order #{order.orderNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Completed</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          {formatOrderDate(order.createdAt)}
                        </span>
                        <span>•</span>
                        <span>Table #{order.tableNumber}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <p className="text-xs text-stone-500 font-medium">Grand Total</p>
                      <p className="text-lg sm:text-xl font-black text-stone-900">
                        {restaurantInfo.currency}{order.totalAmount.toFixed(2)}
                      </p>
                    </div>

                    <button
                      onClick={() => handleReorderAll(order)}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-2xs flex items-center gap-1.5"
                      title="Add all dishes in this order to cart"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Re-order All</span>
                      <span className="sm:hidden">Re-order</span>
                    </button>
                  </div>
                </div>

                {/* Items List */}
                <div className="p-4 sm:p-5 divide-y divide-stone-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
                    Dishes Ordered ({order.items.reduce((s, i) => s + i.quantity, 0)} items)
                  </p>

                  {order.items.map((item, idx) => {
                    const menuItem = menu.find(m => m.id === item.menuItemId);
                    const dishImage = menuItem?.imageUrl;

                    return (
                      <div
                        key={idx}
                        className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          {/* Dish image thumbnail */}
                          <div className="w-12 h-12 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden flex-shrink-0 flex items-center justify-center text-stone-400">
                            {dishImage ? (
                              <img
                                src={dishImage}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <Utensils className="w-5 h-5 text-stone-400" />
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-stone-900 text-sm">
                                {item.name}
                              </span>
                              <span className="bg-amber-100 text-amber-900 text-xs font-bold px-1.5 py-0.2 rounded-md">
                                {item.quantity}×
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                              <span>
                                {restaurantInfo.currency}{item.price.toFixed(2)} each
                              </span>
                              {item.notes && (
                                <>
                                  <span>•</span>
                                  <span className="italic text-amber-700 font-medium">
                                    "{item.notes}"
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-stone-800">
                            {restaurantInfo.currency}{(item.price * item.quantity).toFixed(2)}
                          </span>

                          <button
                            onClick={() =>
                              handleReorderSingleItem(
                                item.menuItemId,
                                item.name,
                                item.price,
                                item.notes
                              )
                            }
                            className="p-1.5 text-stone-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-200 text-xs flex items-center gap-1"
                            title="Add 1 of this dish to cart"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span className="hidden md:inline text-[11px] font-semibold">+ Cart</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Subtotal & Details Footer */}
                <div className="px-4 sm:px-5 py-3.5 bg-stone-50/70 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-600">
                  <div className="space-y-1">
                    {order.customerNotes && (
                      <p className="text-xs text-stone-500">
                        <span className="font-semibold text-stone-700">Special Note:</span> "{order.customerNotes}"
                      </p>
                    )}
                    <button
                      onClick={() => toggleTimeline(order.id)}
                      className="text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span>{isTimelineExpanded ? 'Hide Kitchen Timeline' : 'View Kitchen Timeline'}</span>
                      {isTimelineExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-stone-400">Subtotal:</span>{' '}
                      <span className="font-medium text-stone-800">
                        {restaurantInfo.currency}{order.subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400">GST/Tax:</span>{' '}
                      <span className="font-medium text-stone-800">
                        {restaurantInfo.currency}{order.tax.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-stone-900 border-l border-stone-200 pl-3">
                      Total: {restaurantInfo.currency}{order.totalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Collapsible Kitchen Timeline */}
                {isTimelineExpanded && order.statusHistory && (
                  <div className="p-4 sm:p-5 bg-stone-100/50 border-t border-stone-200 animate-in fade-in duration-150">
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                      Kitchen &amp; Service Milestone Log
                    </p>
                    <div className="space-y-2">
                      {order.statusHistory.map((step, sIdx) => (
                        <div key={sIdx} className="flex items-start gap-2.5 text-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="font-bold uppercase tracking-wider text-stone-800">
                              {step.status}
                            </span>
                            {step.note && (
                              <span className="text-stone-600 ml-2">— {step.note}</span>
                            )}
                          </div>
                          <span className="text-stone-400 text-[11px] font-mono">
                            {formatOrderDate(step.timestamp)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
