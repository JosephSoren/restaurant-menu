import { Utensils, Bell, ShoppingBag, Radio, Sparkles, ChefHat, QrCode, Menu } from 'lucide-react';
import { RestaurantInfo, Order } from '../types';

interface NavbarProps {
  restaurantInfo: RestaurantInfo;
  currentMode: 'customer' | 'owner';
  onModeChange: (mode: 'customer' | 'owner') => void;
  selectedTable: string;
  onChangeTableClick: () => void;
  cartCount: number;
  onOpenCart: () => void;
  activeOrders: Order[];
  onOpenTracker: () => void;
  isRealtimeConnected: boolean;
  soundAlerts: boolean;
  onToggleSoundAlerts: () => void;
  unacknowledgedOrdersCount?: number;
}

export function Navbar({
  restaurantInfo,
  currentMode,
  onModeChange,
  selectedTable,
  onChangeTableClick,
  cartCount,
  onOpenCart,
  activeOrders,
  onOpenTracker,
  isRealtimeConnected,
  soundAlerts,
  onToggleSoundAlerts,
  unacknowledgedOrdersCount = 0
}: NavbarProps) {
  // Check if this table has an active order
  const tableActiveOrders = activeOrders.filter(
    o => o.status !== 'completed' && o.status !== 'cancelled'
  );

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Brand & Restaurant Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-sm">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-stone-900 leading-tight">
                  {restaurantInfo.name}
                </h1>
                {/* Real-time SSE Pulse Badge */}
                <div 
                  className={`hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                    isRealtimeConnected 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                  title={isRealtimeConnected ? 'Real-time sync active (Live updates connected)' : 'Connecting to live events...'}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isRealtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span>{isRealtimeConnected ? 'Live' : 'Connecting'}</span>
                </div>
              </div>
              <p className="hidden md:block text-xs text-stone-500 truncate max-w-xs">
                {restaurantInfo.tagline}
              </p>
            </div>
          </div>

          {/* Center: Mode Switcher (Customer vs Owner/Kitchen) */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              id="nav-customer-mode-btn"
              onClick={() => onModeChange('customer')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentMode === 'customer'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Menu className="w-4 h-4 text-amber-600" />
              <span>Customer Menu</span>
            </button>
            <button
              id="nav-owner-mode-btn"
              onClick={() => onModeChange('owner')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentMode === 'owner'
                  ? 'bg-stone-900 text-white shadow-sm'
                  : unacknowledgedOrdersCount > 0
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'text-stone-600 hover:text-stone-900'
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
              <span>Kitchen &amp; Owner</span>
              {unacknowledgedOrdersCount > 0 ? (
                <span 
                  id="nav-unacknowledged-orders-badge"
                  className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-red-600 text-white shadow-xs animate-pulse flex items-center gap-1 ring-1 ring-red-400"
                  title={`${unacknowledgedOrdersCount} new unacknowledged order${unacknowledgedOrdersCount > 1 ? 's' : ''}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  <span>{unacknowledgedOrdersCount} NEW</span>
                </span>
              ) : tableActiveOrders.length > 0 ? (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs font-bold bg-amber-500 text-stone-950">
                  {tableActiveOrders.length}
                </span>
              ) : null}
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentMode === 'customer' ? (
              <>
                {/* Table Number Pill */}
                <button
                  id="nav-change-table-btn"
                  onClick={onChangeTableClick}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs sm:text-sm font-semibold text-amber-900 transition-colors"
                  title="Click to switch table number"
                >
                  <span className="text-amber-700">Table</span>
                  <span className="bg-amber-600 text-white px-1.5 py-0.5 rounded text-xs">
                    {selectedTable ? `#${selectedTable}` : 'Choose'}
                  </span>
                </button>

                {/* Track Order Status Button (if active orders exist) */}
                {tableActiveOrders.length > 0 && (
                  <button
                    id="nav-track-order-btn"
                    onClick={onOpenTracker}
                    className="relative flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs sm:text-sm font-semibold text-emerald-800 transition-colors"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="hidden sm:inline">Track Order</span>
                    <span className="sm:hidden">Status</span>
                  </button>
                )}

                {/* Cart Drawer Button */}
                <button
                  id="nav-cart-btn"
                  onClick={onOpenCart}
                  className="relative flex items-center gap-2 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-sm"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Cart</span>
                  {cartCount > 0 && (
                    <span className="bg-amber-500 text-stone-950 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center">
                      {cartCount}
                    </span>
                  )}
                </button>
              </>
            ) : (
              <>
                {/* Kitchen Chime Sound Toggle */}
                <button
                  id="nav-sound-toggle-btn"
                  onClick={onToggleSoundAlerts}
                  className={`p-2 rounded-lg border text-xs sm:text-sm flex items-center gap-1.5 transition-colors ${
                    soundAlerts
                      ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                      : 'bg-stone-100 border-stone-200 text-stone-500 hover:text-stone-700'
                  }`}
                  title={soundAlerts ? 'Sound Alert is ON for new orders' : 'Sound Alert is MUTED'}
                >
                  <Bell className={`w-4 h-4 ${soundAlerts ? 'text-amber-600' : 'text-stone-400'}`} />
                  <span className="hidden md:inline">{soundAlerts ? 'Chime ON' : 'Chime Muted'}</span>
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
