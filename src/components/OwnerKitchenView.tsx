import React, { useState } from 'react';
import { Order, OrderStatus, RestaurantInfo } from '../types';
import { 
  Clock, 
  ChefHat, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Bell, 
  Filter, 
  ChevronRight,
  TrendingUp,
  RotateCcw,
  Ban,
  Calendar,
  Layers,
  Receipt
} from 'lucide-react';

interface OwnerKitchenViewProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  restaurantInfo: RestaurantInfo;
  soundAlerts: boolean;
  onToggleSoundAlerts: () => void;
  onSimulateOrder: () => void;
}

interface PaymentCollectedCaptchaActionProps {
  orderId: string;
  isUpdating: boolean;
  onConfirmArchive: () => void;
}

function PaymentCollectedCaptchaAction({
  orderId,
  isUpdating,
  onConfirmArchive
}: PaymentCollectedCaptchaActionProps) {
  const [captchaInput, setCaptchaInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    if (captchaInput.trim() === '7') {
      setError(null);
      onConfirmArchive();
    } else {
      if (!captchaInput.trim()) {
        setError('Please enter 7 to confirm payment');
      } else {
        setError('Incorrect captcha! Enter 7 (3+4)');
      }
    }
  };

  return (
    <div className="space-y-1.5 pt-0.5">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5">
        {/* Captcha display pill */}
        <div 
          className="px-2.5 py-2 bg-white border border-stone-300 rounded-xl text-xs font-mono font-extrabold text-stone-800 select-none shadow-2xs shrink-0 flex items-center justify-between sm:justify-start gap-1"
          title="Security Captcha: 3+4=7"
        >
          <span className="text-stone-400 font-sans text-[10px] font-semibold uppercase tracking-wider">Captcha:</span>
          <span className="text-amber-700 font-bold">3 + 4 = ?</span>
        </div>

        {/* Captcha input */}
        <input
          id={`order-captcha-${orderId}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={captchaInput}
          onChange={(e) => {
            setCaptchaInput(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleConfirm();
            }
          }}
          placeholder="Enter 7"
          disabled={isUpdating}
          className={`w-full sm:w-20 px-2.5 py-2 bg-white text-stone-900 border rounded-xl text-xs font-bold text-center placeholder:text-stone-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-2xs transition-colors shrink-0 ${
            error ? 'border-red-500 bg-red-50/50 ring-2 ring-red-400/20' : 'border-stone-300 focus:border-stone-500'
          }`}
        />

        {/* Payment Collected button */}
        <button
          id={`order-payment-collected-${orderId}`}
          type="button"
          onClick={handleConfirm}
          disabled={isUpdating}
          className={`flex-1 py-2 px-3 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs whitespace-nowrap ${
            captchaInput.trim() === '7'
              ? 'bg-emerald-700 hover:bg-emerald-800'
              : 'bg-stone-900 hover:bg-stone-800'
          } disabled:opacity-50`}
          title="Verify captcha and collect payment"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Payment Collected</span>
        </button>
      </div>

      {error && (
        <p className="text-[11px] font-semibold text-red-600 flex items-center gap-1 pl-1 animate-in fade-in duration-150">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}

export function OwnerKitchenView({
  orders,
  onUpdateStatus,
  restaurantInfo,
  soundAlerts,
  onToggleSoundAlerts,
  onSimulateOrder
}: OwnerKitchenViewProps) {
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (filterStatus === 'active') {
      return order.status !== 'completed' && order.status !== 'cancelled';
    }
    if (filterStatus === 'all') return true;
    return order.status === filterStatus;
  });

  // Calculate live statistics
  const totalOrdersCount = orders.length;
  const completedOrdersCount = orders.filter(o => o.status === 'completed').length;
  const activeOrdersCount = orders.filter(
    o => o.status !== 'completed' && o.status !== 'cancelled'
  ).length;
  const receivedCount = orders.filter(o => o.status === 'received').length;
  const preparingCount = orders.filter(o => o.status === 'preparing').length;
  const readyCount = orders.filter(o => o.status === 'ready').length;
  const todayRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const handleStatusClick = async (order: Order, nextStatus: OrderStatus) => {
    setUpdatingOrderId(order.id);
    try {
      await onUpdateStatus(order.id, nextStatus);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'received':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-800 border border-red-200 flex items-center gap-1.5 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
            </span>
            <span className="animate-pulse">New Order</span>
          </span>
        );
      case 'preparing':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
            <ChefHat className="w-3.5 h-3.5" />
            Preparing
          </span>
        );
      case 'ready':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Ready to Serve
          </span>
        );
      case 'served':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Served at Table
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-stone-100 text-stone-600">
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700">
            Cancelled
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Live Metrics Header */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Orders Metric Card */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Total Orders
            </span>
            <Receipt className="w-4 h-4 text-stone-700" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-2">
            {totalOrdersCount}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-stone-500">
            <span className="text-emerald-700 font-bold">{completedOrdersCount} done</span>
            <span>•</span>
            <span className="text-amber-700 font-bold">{activeOrdersCount} live</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Active Orders
            </span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-2">
            {activeOrdersCount}
          </p>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500">
            <span className="text-blue-600 font-bold">{receivedCount} new</span>
            <span>•</span>
            <span className="text-amber-600 font-bold">{preparingCount} cooking</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              In Preparation
            </span>
            <ChefHat className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-2">
            {preparingCount}
          </p>
          <p className="text-[11px] text-stone-500 mt-1">
            Actively cooking in kitchen
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Ready to Serve
            </span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-2">
            {readyCount}
          </p>
          <p className="text-[11px] text-stone-500 mt-1">
            Plated for runners
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Total Revenue
            </span>
            <TrendingUp className="w-4 h-4 text-stone-700" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-2">
            {restaurantInfo.currency}{todayRevenue.toFixed(2)}
          </p>
          <p className="text-[11px] text-stone-500 mt-1">
            From {orders.filter(o => o.status !== 'cancelled').length} orders today
          </p>
        </div>
      </div>

      {/* Control Bar: Filters & Quick Actions */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-stone-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {[
            { key: 'active', label: 'All Active', count: activeOrdersCount },
            { key: 'received', label: 'New / Received', count: receivedCount },
            { key: 'preparing', label: 'In Kitchen', count: preparingCount },
            { key: 'ready', label: 'Ready to Serve', count: readyCount },
            { key: 'completed', label: 'Completed', count: completedOrdersCount },
            { key: 'all', label: 'Total Orders', count: totalOrdersCount }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                filterStatus === f.key
                  ? 'bg-stone-900 text-white shadow-xs'
                  : f.key === 'received' && f.count > 0
                  ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <span>{f.label}</span>
              {f.key === 'received' && f.count > 0 ? (
                <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-red-600 text-white animate-pulse flex items-center gap-1 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  <span>{f.count} NEW</span>
                </span>
              ) : (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  filterStatus === f.key ? 'bg-stone-700 text-amber-300' : 'bg-stone-200 text-stone-600'
                }`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Chime Toggle */}
          <button
            onClick={onToggleSoundAlerts}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              soundAlerts
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-stone-50 border-stone-200 text-stone-500'
            }`}
          >
            <Bell className={`w-3.5 h-3.5 ${soundAlerts ? 'text-amber-600' : 'text-stone-400'}`} />
            <span>{soundAlerts ? 'Chime ON' : 'Chime Muted'}</span>
          </button>

          {/* Simulate Order Button for Testing */}
          <button
            onClick={onSimulateOrder}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-2xs flex items-center gap-1"
            title="Create a test customer order at Table 3 to observe live updates"
          >
            <span>+ Test Customer Order</span>
          </button>
        </div>
      </div>

      {/* Orders Grid / Kitchen Display */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 p-6">
          <ChefHat className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-800">No orders in this view</h3>
          <p className="text-xs text-stone-500 mt-1 mb-4">
            {filterStatus === 'active'
              ? 'Great job! The kitchen is all caught up with current table orders.'
              : 'Try selecting a different status filter above.'}
          </p>
          <button
            onClick={onSimulateOrder}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl"
          >
            Create Sample Table Order
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredOrders.map(order => {
            const elapsedMins = Math.max(
              0,
              Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)
            );
            const isLate = elapsedMins >= 18 && order.status !== 'served' && order.status !== 'completed';
            const isUpdating = updatingOrderId === order.id;

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border transition-all flex flex-col justify-between shadow-2xs ${
                  isLate
                    ? 'border-red-300 ring-2 ring-red-100'
                    : order.status === 'received'
                    ? 'border-red-400 ring-2 ring-red-300/60 shadow-md'
                    : 'border-stone-200/90'
                }`}
              >
                {/* Order Card Header */}
                <div className="p-4 sm:p-5 border-b border-stone-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex flex-col items-center justify-center font-black shadow-xs">
                        <span className="text-[10px] font-bold tracking-wider uppercase opacity-80 leading-none">
                          TABLE
                        </span>
                        <span className="text-xl leading-none mt-0.5 font-extrabold">
                          {order.tableNumber}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-stone-900">
                            Order #{order.orderNumber}
                          </h4>
                          {isLate && (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" /> Rush
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span className={isLate ? 'text-red-600 font-bold' : ''}>
                            {elapsedMins === 0 ? 'Just now' : `${elapsedMins} min ago`}
                          </span>
                          <span>•</span>
                          <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>

                    <div>{getStatusBadge(order.status)}</div>
                  </div>
                </div>

                {/* Items List */}
                <div className="p-4 sm:p-5 space-y-3 flex-1">
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-start justify-between text-sm">
                        <div className="flex-1 pr-2">
                          <div className="flex items-baseline gap-2">
                            <span className="font-extrabold text-stone-900 bg-stone-100 px-1.5 py-0.5 rounded text-xs">
                              {item.quantity}×
                            </span>
                            <span className="font-semibold text-stone-800">
                              {item.name}
                            </span>
                          </div>
                          {item.notes && (
                            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200/60 rounded px-2 py-0.5 mt-1 font-medium">
                              ★ Note: {item.notes}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-stone-400 font-medium">
                          {restaurantInfo.currency}{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Customer General Instructions */}
                  {order.customerNotes && (
                    <div className="mt-3 p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700">
                      <span className="font-bold text-amber-800">Customer Request: </span>
                      {order.customerNotes}
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="p-4 sm:p-5 pt-3 bg-stone-50/80 border-t border-stone-100 rounded-b-2xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span>
                      {order.items.reduce((s, i) => s + i.quantity, 0)} items total
                    </span>
                    <span className="text-sm font-bold text-stone-900">
                      {restaurantInfo.currency}{order.totalAmount.toFixed(2)}
                    </span>
                  </div>

                  {/* Dynamic Primary Workflow Button */}
                  {order.status === 'received' && (
                    <button
                      id={`order-start-prep-${order.id}`}
                      onClick={() => handleStatusClick(order, 'preparing')}
                      disabled={isUpdating}
                      className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs"
                    >
                      <ChefHat className="w-4 h-4" />
                      <span>Start Preparing (In Kitchen)</span>
                    </button>
                  )}

                  {order.status === 'preparing' && (
                    <button
                      id={`order-mark-ready-${order.id}`}
                      onClick={() => handleStatusClick(order, 'ready')}
                      disabled={isUpdating}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Mark Ready to Serve</span>
                    </button>
                  )}

                  {order.status === 'ready' && (
                    <button
                      id={`order-mark-served-${order.id}`}
                      onClick={() => handleStatusClick(order, 'served')}
                      disabled={isUpdating}
                      className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark Served to Table {order.tableNumber}</span>
                    </button>
                  )}

                  {order.status === 'served' && (
                    <PaymentCollectedCaptchaAction
                      orderId={order.id}
                      isUpdating={isUpdating}
                      onConfirmArchive={() => handleStatusClick(order, 'completed')}
                    />
                  )}

                  {/* Secondary actions */}
                  {order.status !== 'completed' && order.status !== 'cancelled' && (
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleStatusClick(order, 'cancelled')}
                        className="text-[11px] text-stone-400 hover:text-red-600 transition-colors"
                      >
                        Cancel Order
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
