import React, { useState, useEffect, useCallback } from 'react';
import { 
  MenuItem, 
  Order, 
  OrderStatus, 
  RestaurantInfo, 
  CartItem 
} from './types';
import { 
  fetchRestaurant, 
  updateRestaurant, 
  fetchMenu, 
  createMenuItem, 
  updateMenuItem, 
  deleteMenuItem, 
  toggleMenuItemAvailability, 
  uploadMenuData, 
  resetSampleMenu, 
  fetchOrders, 
  createOrder, 
  updateOrderStatus 
} from './services/api';
import { useRealtime } from './hooks/useRealtime';
import { Navbar } from './components/Navbar';
import { CustomerView } from './components/CustomerView';
import { CartDrawer } from './components/CartDrawer';
import { OrderTracker } from './components/OrderTracker';
import { OwnerKitchenView } from './components/OwnerKitchenView';
import { MenuManager } from './components/MenuManager';
import { TableQRCodes } from './components/TableQRCodes';
import { TableSelectorModal } from './components/TableSelectorModal';
import { ChefHat, Menu, QrCode, Sparkles, Utensils, Receipt } from 'lucide-react';

export default function App() {
  // Navigation & Mode
  const [currentMode, setCurrentMode] = useState<'customer' | 'owner'>('customer');
  const [ownerSubTab, setOwnerSubTab] = useState<'kds' | 'menu' | 'tables'>('kds');

  // Restaurant & Menu Data
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo>({
    name: 'Nilkamal Hotel',
    tagline: 'Authentic Multi-Cuisine & Family Restaurant',
    currency: '₹',
    taxRate: 0.05,
    tables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  });
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  // Customer State
  const [selectedTable, setSelectedTable] = useState<string>('1');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [activeTrackerOrderId, setActiveTrackerOrderId] = useState<string | null>(null);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);

  // Owner settings
  const [soundAlerts, setSoundAlerts] = useState<boolean>(true);

  // Check URL params for table number on mount (e.g., ?table=5)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tableFromUrl = params.get('table');
      if (tableFromUrl) {
        setSelectedTable(tableFromUrl);
      } else {
        const saved = localStorage.getItem('bv_selected_table');
        if (saved) setSelectedTable(saved);
      }
    }
  }, []);

  const handleSetTable = (table: string) => {
    setSelectedTable(table);
    localStorage.setItem('bv_selected_table', table);
  };

  // Initial Data Load
  const loadAllData = useCallback(async () => {
    try {
      const [restRes, menuRes, ordersRes] = await Promise.all([
        fetchRestaurant(),
        fetchMenu(),
        fetchOrders()
      ]);
      setRestaurantInfo(restRes.info);
      setMenu(menuRes);
      setOrders(ordersRes);
    } catch (err) {
      console.error('Failed loading initial data:', err);
    } finally {
      setIsLoadingInitial(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Real-time EventSource Sync
  const { isConnected } = useRealtime({
    onOrderCreated: (newOrder) => {
      setOrders((prev) => {
        if (prev.some((o) => o.id === newOrder.id)) return prev;
        return [newOrder, ...prev];
      });
    },
    onOrderUpdated: (updatedOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
      );
    },
    onMenuUpdated: (newMenu) => {
      setMenu(newMenu);
    },
    enableSoundAlerts: soundAlerts
  });

  // Fallback background polling every 6 seconds to guarantee sync
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders()
        .then((latestOrders) => setOrders(latestOrders))
        .catch(() => {});
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Filter orders for the current customer table
  const currentTableOrders = orders.filter(
    (o) => String(o.tableNumber) === String(selectedTable)
  );

  // Unacknowledged new orders awaiting chef's attention (status === 'received')
  const unacknowledgedOrdersCount = orders.filter((o) => o.status === 'received').length;

  // Cart operations
  const handleAddToCart = (item: MenuItem, quantity: number, notes?: string) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (ci) => ci.menuItem.id === item.id && (ci.notes || '') === (notes || '')
      );
      if (existingIdx > -1) {
        const copy = [...prev];
        copy[existingIdx].quantity += quantity;
        return copy;
      }
      return [...prev, { menuItem: item, quantity, notes }];
    });
  };

  const handleUpdateCartQuantity = (menuItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveCartItem(menuItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.menuItem.id === menuItemId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const handleUpdateCartNotes = (menuItemId: string, notes: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.menuItem.id === menuItemId ? { ...item, notes } : item
      )
    );
  };

  const handleRemoveCartItem = (menuItemId: string) => {
    setCart((prev) => prev.filter((i) => i.menuItem.id !== menuItemId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Submit Order from Cart
  const handleSubmitOrder = async (customerNotes: string) => {
    if (cart.length === 0 || !selectedTable) return;
    setIsSubmittingOrder(true);
    try {
      const createdOrder = await createOrder({
        tableNumber: selectedTable,
        items: cart.map((c) => ({
          menuItemId: c.menuItem.id,
          name: c.menuItem.name,
          price: c.menuItem.price,
          quantity: c.quantity,
          notes: c.notes
        })),
        customerNotes
      });

      // Update state immediately
      setOrders((prev) => [createdOrder, ...prev.filter((o) => o.id !== createdOrder.id)]);
      setCart([]);
      setIsCartOpen(false);
      setActiveTrackerOrderId(createdOrder.id);
      setIsTrackerOpen(true);
    } catch (err: any) {
      alert(err.message || 'Could not send order to kitchen. Please try again.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Status updates for Owner/Kitchen
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const updated = await updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch (err: any) {
      console.error('Failed to update status:', err);
    }
  };

  // Menu Management Operations
  const handleAddMenuItem = async (item: Omit<MenuItem, 'id'>) => {
    const created = await createMenuItem(item);
    setMenu((prev) => [...prev, created]);
  };

  const handleUpdateMenuItem = async (id: string, item: Partial<MenuItem>) => {
    const updated = await updateMenuItem(id, item);
    setMenu((prev) => prev.map((m) => (m.id === id ? updated : m)));
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm('Are you sure you want to remove this item from the menu?')) return;
    await deleteMenuItem(id);
    setMenu((prev) => prev.filter((m) => m.id !== id));
  };

  const handleToggleAvailability = async (id: string) => {
    const updated = await toggleMenuItemAvailability(id);
    setMenu((prev) => prev.map((m) => (m.id === id ? updated : m)));
  };

  const handleUploadMenu = async (data: {
    items?: any[];
    rawContent?: string;
    mode?: 'append' | 'replace';
    useAi?: boolean;
  }) => {
    const res = await uploadMenuData(data);
    const updatedMenu = await fetchMenu();
    setMenu(updatedMenu);
    return { addedCount: res.addedCount, totalCount: res.totalCount };
  };

  const handleResetSampleMenu = async () => {
    if (!confirm('Reset menu back to artisan restaurant sample menu?')) return;
    const res = await resetSampleMenu();
    setMenu(res.menu);
  };

  const handleUpdateRestaurantSettings = async (info: Partial<RestaurantInfo>) => {
    const res = await updateRestaurant(info);
    setRestaurantInfo(res.info);
  };

  // Simulate Order for quick kitchen testing
  const handleSimulateTestOrder = async () => {
    const randomTable = String(Math.floor(Math.random() * 8) + 1);
    const availableDishes = menu.filter((m) => m.isAvailable);
    if (availableDishes.length === 0) return;

    const dish1 = availableDishes[Math.floor(Math.random() * availableDishes.length)];
    const dish2 = availableDishes[Math.floor(Math.random() * availableDishes.length)];

    await createOrder({
      tableNumber: randomTable,
      items: [
        { menuItemId: dish1.id, name: dish1.name, price: dish1.price, quantity: 1, notes: 'Extra crispy' },
        ...(dish1.id !== dish2.id
          ? [{ menuItemId: dish2.id, name: dish2.name, price: dish2.price, quantity: 2 }]
          : [])
      ],
      customerNotes: 'Guest requests water with lime'
    });
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Top Navbar */}
      <Navbar
        restaurantInfo={restaurantInfo}
        currentMode={currentMode}
        onModeChange={setCurrentMode}
        selectedTable={selectedTable}
        onChangeTableClick={() => setIsTableModalOpen(true)}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        activeOrders={currentTableOrders}
        onOpenTracker={() => {
          if (currentTableOrders.length > 0) {
            setActiveTrackerOrderId(currentTableOrders[0].id);
            setIsTrackerOpen(true);
          }
        }}
        isRealtimeConnected={isConnected}
        soundAlerts={soundAlerts}
        onToggleSoundAlerts={() => setSoundAlerts(!soundAlerts)}
        unacknowledgedOrdersCount={unacknowledgedOrdersCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {isLoadingInitial ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-stone-600">
              Loading restaurant menu &amp; live kitchen system...
            </p>
          </div>
        ) : currentMode === 'customer' ? (
          /* CUSTOMER DIGITAL MENU & TABLE VIEW */
          <CustomerView
            menu={menu}
            restaurantInfo={restaurantInfo}
            selectedTable={selectedTable}
            onChangeTableClick={() => setIsTableModalOpen(true)}
            onAddToCart={handleAddToCart}
            activeOrders={currentTableOrders}
            onOpenTracker={(orderId) => {
              setActiveTrackerOrderId(orderId || (currentTableOrders[0]?.id ?? null));
              setIsTrackerOpen(true);
            }}
            onOpenCart={() => setIsCartOpen(true)}
            cartCount={totalCartCount}
            cart={cart}
            allOrders={orders}
          />
        ) : (
          /* OWNER / KITCHEN / MANAGER VIEW */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            
            {/* Owner Section Navigation */}
            <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-stone-200 shadow-2xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  id="owner-tab-kds"
                  onClick={() => setOwnerSubTab('kds')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 relative ${
                    ownerSubTab === 'kds'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : unacknowledgedOrdersCount > 0
                      ? 'bg-red-50 text-red-700 border border-red-300 ring-2 ring-red-400/40 animate-pulse hover:bg-red-100'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  <div className="relative">
                    <ChefHat className="w-4 h-4 text-amber-400" />
                    {unacknowledgedOrdersCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-80" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
                      </span>
                    )}
                  </div>
                  <span>Live Kitchen Display (KDS)</span>

                  {/* Visual notification badge that blinks or pulses for new unacknowledged orders */}
                  {unacknowledgedOrdersCount > 0 && (
                    <span
                      id="kds-unacknowledged-badge"
                      className="ml-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-red-600 text-white shadow-sm ring-2 ring-red-400/60 animate-pulse tracking-wide"
                      title={`${unacknowledgedOrdersCount} new unacknowledged order${unacknowledgedOrdersCount > 1 ? 's' : ''} awaiting chef acknowledgement`}
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                      </span>
                      <span>{unacknowledgedOrdersCount} NEW</span>
                    </span>
                  )}
                </button>

                <button
                  id="owner-tab-menu"
                  onClick={() => setOwnerSubTab('menu')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                    ownerSubTab === 'menu'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  <Menu className="w-4 h-4 text-amber-500" />
                  <span>Menu &amp; Dishes</span>
                </button>

                <button
                  id="owner-tab-tables"
                  onClick={() => setOwnerSubTab('tables')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                    ownerSubTab === 'tables'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-stone-400" />
                  <span>Table QR Codes</span>
                </button>
              </div>

              <div className="flex items-center gap-2 px-2">
                <span className="text-xs text-stone-700 font-semibold bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200 flex items-center gap-1.5 shadow-2xs">
                  <Receipt className="w-3.5 h-3.5 text-amber-600" />
                  <span>Total Orders:</span>
                  <strong className="text-stone-900 font-bold">{orders.length}</strong>
                  <span className="text-stone-400 font-normal">•</span>
                  <span className="text-emerald-700 font-medium">{orders.filter((o) => o.status === 'completed').length} completed</span>
                </span>
              </div>
            </div>

            {/* Sub View Content */}
            {ownerSubTab === 'kds' && (
              <OwnerKitchenView
                orders={orders}
                onUpdateStatus={handleUpdateOrderStatus}
                restaurantInfo={restaurantInfo}
                soundAlerts={soundAlerts}
                onToggleSoundAlerts={() => setSoundAlerts(!soundAlerts)}
                onSimulateOrder={handleSimulateTestOrder}
              />
            )}

            {ownerSubTab === 'menu' && (
              <MenuManager
                menu={menu}
                restaurantInfo={restaurantInfo}
                onAddItem={handleAddMenuItem}
                onUpdateItem={handleUpdateMenuItem}
                onDeleteItem={handleDeleteMenuItem}
                onToggleAvailability={handleToggleAvailability}
                onUploadMenu={handleUploadMenu}
                onResetSample={handleResetSampleMenu}
              />
            )}

            {ownerSubTab === 'tables' && (
              <TableQRCodes
                restaurantInfo={restaurantInfo}
                onUpdateSettings={handleUpdateRestaurantSettings}
                onSelectTableForCustomer={(tableNum) => {
                  handleSetTable(tableNum);
                  setCurrentMode('customer');
                }}
              />
            )}

          </div>
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onUpdateNotes={handleUpdateCartNotes}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        selectedTable={selectedTable}
        onSelectTable={handleSetTable}
        restaurantInfo={restaurantInfo}
        onSubmitOrder={handleSubmitOrder}
        isSubmitting={isSubmittingOrder}
      />

      {/* Real-time Order Tracking Modal */}
      {isTrackerOpen && currentTableOrders.length > 0 && (
        <OrderTracker
          orders={currentTableOrders}
          activeOrderId={activeTrackerOrderId || currentTableOrders[0].id}
          onSelectOrder={(id) => setActiveTrackerOrderId(id)}
          onClose={() => setIsTrackerOpen(false)}
          onOrderMore={() => setIsTrackerOpen(false)}
          currency={restaurantInfo.currency}
        />
      )}

      {/* Table Selector Modal */}
      <TableSelectorModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        selectedTable={selectedTable}
        onSelectTable={handleSetTable}
        restaurantInfo={restaurantInfo}
      />

    </div>
  );
}
