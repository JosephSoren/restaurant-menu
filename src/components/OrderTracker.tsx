import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  Sparkles, 
  Utensils, 
  X, 
  RotateCw, 
  ArrowRight,
  AlertCircle,
  ShoppingBag
} from 'lucide-react';

interface OrderTrackerProps {
  orders: Order[];
  activeOrderId?: string;
  onSelectOrder: (id: string) => void;
  onClose: () => void;
  onOrderMore: () => void;
  currency: string;
}

export function OrderTracker({
  orders,
  activeOrderId,
  onSelectOrder,
  onClose,
  onOrderMore,
  currency
}: OrderTrackerProps) {
  // Find current order to display
  const currentOrder = orders.find(o => o.id === activeOrderId) || orders[0];

  if (!currentOrder) {
    return (
      <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl text-center">
          <Utensils className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-stone-800">No Orders Placed Yet</h3>
          <p className="text-sm text-stone-500 mt-1 mb-6">
            Browse our menu, select your dishes, and place an order to track it live here!
          </p>
          <button
            onClick={onOrderMore}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl transition-colors"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  // Define steps
  const steps: { key: OrderStatus; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      key: 'received',
      label: 'Received',
      desc: 'Sent to Kitchen',
      icon: <Clock className="w-4 h-4" />
    },
    {
      key: 'preparing',
      label: 'Preparing',
      desc: 'Chef cooking your meal',
      icon: <ChefHat className="w-4 h-4" />
    },
    {
      key: 'ready',
      label: 'Ready',
      desc: 'Plated & garnishing',
      icon: <Sparkles className="w-4 h-4" />
    },
    {
      key: 'served',
      label: 'Served',
      desc: 'Delivered to table',
      icon: <CheckCircle2 className="w-4 h-4" />
    }
  ];

  const statusOrderIndex: Record<OrderStatus, number> = {
    received: 0,
    preparing: 1,
    ready: 2,
    served: 3,
    completed: 4,
    cancelled: -1
  };

  const currentStepIdx = statusOrderIndex[currentOrder.status];
  const isCancelled = currentOrder.status === 'cancelled';
  const isCompleted = currentOrder.status === 'completed';

  // Calculate elapsed minutes
  const elapsedMinutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(currentOrder.createdAt).getTime()) / 60000)
  );

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden my-auto border border-stone-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-stone-900 text-white p-5 sm:p-6 relative">
          <button
            id="tracker-close-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Real-Time Order Tracking</span>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Order #{currentOrder.orderNumber}
              </h2>
              <p className="text-stone-300 text-xs sm:text-sm mt-0.5">
                Dining at <strong className="text-white font-semibold">Table {currentOrder.tableNumber}</strong> • Placed {elapsedMinutes === 0 ? 'just now' : `${elapsedMinutes} min ago`}
              </p>
            </div>

            {/* Multiple orders switch tabs if user placed multiple orders */}
            {orders.length > 1 && (
              <div className="flex items-center gap-1.5 bg-stone-800 p-1 rounded-lg">
                <span className="text-xs text-stone-400 px-1">Orders:</span>
                {orders.map(ord => (
                  <button
                    key={ord.id}
                    onClick={() => onSelectOrder(ord.id)}
                    className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${
                      ord.id === currentOrder.id
                        ? 'bg-amber-500 text-stone-950'
                        : 'text-stone-300 hover:text-white'
                    }`}
                  >
                    #{ord.orderNumber}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status Tracker Body */}
        <div className="p-5 sm:p-6 space-y-6">
          
          {/* Status Message Highlight */}
          {isCancelled ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-800">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm">Order Cancelled</h4>
                <p className="text-xs text-red-600 mt-0.5">
                  This order was cancelled by the kitchen. Please speak to staff if you have questions.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-stone-500">Current Status</span>
                <span className="text-xs font-medium text-stone-500">
                  {currentOrder.status === 'served' || isCompleted ? 'Fulfilled' : 'In Progress'}
                </span>
              </div>

              {/* Progress Line */}
              <div className="relative my-6">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-stone-200 -translate-y-1/2" />
                <div 
                  className="absolute top-1/2 left-0 h-1 bg-amber-500 -translate-y-1/2 transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, (Math.min(currentStepIdx, 3) / 3) * 100))}%`
                  }}
                />

                <div className="relative flex justify-between">
                  {steps.map((step, idx) => {
                    const isDone = currentStepIdx > idx || isCompleted;
                    const isCurrent = currentStepIdx === idx && !isCompleted;

                    return (
                      <div key={step.key} className="flex flex-col items-center">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                            isDone
                              ? 'bg-amber-600 border-amber-600 text-white'
                              : isCurrent
                              ? 'bg-white border-amber-500 text-amber-600 ring-4 ring-amber-100 scale-110 shadow-sm'
                              : 'bg-white border-stone-300 text-stone-400'
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="w-5 h-5" /> : step.icon}
                        </div>
                        <span className={`text-xs mt-2 font-semibold ${isCurrent ? 'text-amber-700' : isDone ? 'text-stone-800' : 'text-stone-400'}`}>
                          {step.label}
                        </span>
                        <span className="hidden sm:block text-[10px] text-stone-400 text-center max-w-[70px] leading-tight">
                          {step.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Status Banner */}
              <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-stone-600">
                    {currentOrder.status === 'received' && 'Kitchen notified. Order queue verified.'}
                    {currentOrder.status === 'preparing' && 'The kitchen is actively preparing your dishes now.'}
                    {currentOrder.status === 'ready' && 'Your dishes are plated and being brought to your table!'}
                    {currentOrder.status === 'served' && 'Delivered to your table. Please enjoy your meal!'}
                    {isCompleted && 'Thank you for dining with us! Order is settled.'}
                  </span>
                </div>
                <span className="font-semibold text-stone-700">
                  {currentOrder.status === 'received' ? 'Est: 15-20 min' : currentOrder.status === 'preparing' ? 'Est: 5-10 min' : 'Ready'}
                </span>
              </div>
            </div>
          )}

          {/* Itemized Order List */}
          <div className="border border-stone-200 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
              Order Items ({currentOrder.items.reduce((sum, i) => sum + i.quantity, 0)})
            </h4>

            <div className="divide-y divide-stone-100 max-h-56 overflow-y-auto pr-1">
              {currentOrder.items.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-start justify-between text-sm">
                  <div className="flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-900">
                        {item.quantity}x
                      </span>
                      <span className="font-medium text-stone-800">
                        {item.name}
                      </span>
                    </div>
                    {item.notes && (
                      <p className="text-xs text-amber-700 italic mt-0.5 bg-amber-50 px-2 py-0.5 rounded inline-block">
                        Note: {item.notes}
                      </p>
                    )}
                  </div>
                  <span className="font-semibold text-stone-800">
                    {currency}{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Special Instructions Note */}
            {currentOrder.customerNotes && (
              <div className="mt-3 pt-3 border-t border-stone-100 text-xs text-stone-600 bg-stone-50 p-2.5 rounded-lg">
                <span className="font-semibold text-stone-700">Table Note: </span>
                {currentOrder.customerNotes}
              </div>
            )}

            {/* Subtotal, Tax, Total */}
            <div className="mt-4 pt-3 border-t border-stone-200 space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{currency}{currentOrder.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{currency}{currentOrder.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-stone-900 pt-1.5 border-t border-stone-100">
                <span>Total Amount</span>
                <span className="text-amber-700">{currency}{currentOrder.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              id="tracker-order-more-btn"
              onClick={onOrderMore}
              className="flex-1 py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-xl flex items-center justify-center gap-2 text-sm transition-colors shadow-sm"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>Order More for Table {currentOrder.tableNumber}</span>
            </button>
            <button
              onClick={onClose}
              className="py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-xl text-sm transition-colors"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
