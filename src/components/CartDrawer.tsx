import React, { useState } from 'react';
import { CartItem, RestaurantInfo } from '../types';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, MessageSquare, AlertCircle, Utensils, User } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (menuItemId: string, newQuantity: number) => void;
  onUpdateNotes: (menuItemId: string, notes: string) => void;
  onRemoveItem: (menuItemId: string) => void;
  onClearCart: () => void;
  selectedTable: string;
  onSelectTable: (table: string) => void;
  restaurantInfo: RestaurantInfo;
  onSubmitOrder: (customerNotes: string) => Promise<void>;
  isSubmitting: boolean;
}

export function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onUpdateNotes,
  onRemoveItem,
  onClearCart,
  selectedTable,
  onSelectTable,
  restaurantInfo,
  onSubmitOrder,
  isSubmitting
}: CartDrawerProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tableInputError, setTableInputError] = useState(false);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );
  const tax = Number((subtotal * restaurantInfo.taxRate).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

  const handleCheckout = async () => {
    if (!selectedTable.trim()) {
      setTableInputError(true);
      return;
    }
    setTableInputError(false);

    const cleanName = customerName.trim().replace(/\s+/g, '');
    let finalNotes = customerNotes.trim();
    if (cleanName) {
      finalNotes = finalNotes ? `Name: ${cleanName} | ${finalNotes}` : `Name: ${cleanName}`;
    }

    await onSubmitOrder(finalNotes);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-4 sm:p-6 bg-stone-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold">Your Order Cart</h2>
              <span className="text-xs bg-stone-800 text-amber-300 font-semibold px-2 py-0.5 rounded-full">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)} items
              </span>
            </div>
            <button
              id="cart-drawer-close-btn"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Table Number Verification Bar */}
          <div className="p-4 bg-amber-50 border-b border-amber-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1.5">
              Confirm Your Table Number <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex flex-wrap gap-1.5">
                {restaurantInfo.tables.slice(0, 8).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      onSelectTable(String(t));
                      setTableInputError(false);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                      selectedTable === String(t)
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white border border-amber-200 text-stone-700 hover:bg-amber-100'
                    }`}
                  >
                    Table {t}
                  </button>
                ))}
              </div>
              <input
                id="cart-table-custom-input"
                type="text"
                value={selectedTable}
                onChange={e => {
                  onSelectTable(e.target.value);
                  setTableInputError(false);
                }}
                placeholder="Table #"
                className="w-20 px-2 py-1 bg-white border border-amber-300 rounded-md text-xs font-semibold text-center focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            {tableInputError && (
              <p className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Please specify your table number before placing order.
              </p>
            )}
          </div>

          {/* Name Input Box After Table Number */}
          <div className="p-4 bg-yellow-50/90 border-b border-yellow-200/90 space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="cart-customer-name-input" className="block text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-700" />
                <span>Your Name <span className="text-[10px] font-semibold text-stone-500 lowercase">(one word)</span></span>
              </label>
              <span className="text-[10px] font-bold text-yellow-900 bg-yellow-200/90 px-2 py-0.5 rounded-full border border-yellow-300">
                1 word only
              </span>
            </div>
            <div className="relative">
              <input
                id="cart-customer-name-input"
                type="text"
                value={customerName}
                onChange={e => {
                  // Allow one word only (no spaces)
                  setCustomerName(e.target.value.replace(/\s+/g, ''));
                }}
                placeholder="Enter your name (e.g. Alex)"
                className="w-full px-3 py-2 bg-white border border-yellow-400 rounded-xl text-xs sm:text-sm font-bold text-stone-900 placeholder:text-stone-400 placeholder:font-normal focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 focus:outline-none shadow-2xs"
              />
            </div>
            <p className="text-[10px] text-stone-500">
              Kitchen will use this name to identify your order at Table {selectedTable || '?'}.
            </p>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-16 text-stone-400">
                <ShoppingBag className="w-12 h-12 mx-auto mb-2 text-stone-300" />
                <p className="font-semibold text-stone-700">Your cart is empty</p>
                <p className="text-xs text-stone-400 mt-1">
                  Add delicious dishes from the menu to start ordering.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map(item => (
                  <div 
                    key={item.menuItem.id} 
                    className="p-3 bg-stone-50 border border-stone-200/80 rounded-xl space-y-2.5"
                  >
                    <div className="flex items-center gap-3">
                      {item.menuItem.imageUrl ? (
                        <img
                          src={item.menuItem.imageUrl}
                          alt={item.menuItem.name}
                          className="w-16 h-16 rounded-xl object-cover shrink-0 border border-stone-200 shadow-2xs"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-stone-200/70 flex items-center justify-center shrink-0 text-stone-400 border border-stone-200/60">
                          <Utensils className="w-6 h-6 text-stone-400" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="text-sm font-semibold text-stone-900 leading-snug line-clamp-2">
                            {item.menuItem.name}
                          </h4>
                          <span className="text-sm font-bold text-stone-900 shrink-0 ml-2">
                            {restaurantInfo.currency}{(item.menuItem.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-stone-500 block mt-0.5">
                          {restaurantInfo.currency}{item.menuItem.price.toFixed(2)} each
                        </span>
                      </div>
                    </div>

                    {/* Quantity & Notes Controls */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (editingNotesId === item.menuItem.id) {
                              setEditingNotesId(null);
                            } else {
                              setEditingNotesId(item.menuItem.id);
                            }
                          }}
                          className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 px-2 py-1 rounded bg-stone-200/60 hover:bg-stone-200 transition-colors"
                        >
                          <MessageSquare className="w-3 h-3 text-stone-500" />
                          <span>{item.notes ? 'Edit note' : 'Add note'}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-stone-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                          <button
                            onClick={() => onUpdateQuantity(item.menuItem.id, item.quantity - 1)}
                            className="p-1 hover:bg-stone-100 text-stone-600 transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2.5 text-xs font-bold text-stone-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.menuItem.id, item.quantity + 1)}
                            className="p-1 hover:bg-stone-100 text-stone-600 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.menuItem.id)}
                          className="p-1 text-stone-400 hover:text-red-600 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Active note or inline edit input */}
                    {(editingNotesId === item.menuItem.id || item.notes) && (
                      <div className="pt-1.5">
                        {editingNotesId === item.menuItem.id ? (
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={item.notes || ''}
                              onChange={e => onUpdateNotes(item.menuItem.id, e.target.value)}
                              placeholder="e.g., No onions, dressing on side..."
                              className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                              autoFocus
                            />
                            <button
                              onClick={() => setEditingNotesId(null)}
                              className="px-2.5 py-1 bg-stone-800 text-white text-xs rounded-lg font-medium"
                            >
                              Done
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-xs bg-amber-50/70 border border-amber-100 text-amber-800 px-2.5 py-1 rounded-lg">
                            <span>Note: {item.notes}</span>
                            <button
                              onClick={() => setEditingNotesId(item.menuItem.id)}
                              className="text-[10px] underline ml-2"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Overall Customer Request */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Special Instructions for Kitchen (Optional)
                  </label>
                  <textarea
                    id="cart-customer-notes"
                    value={customerNotes}
                    onChange={e => setCustomerNotes(e.target.value)}
                    placeholder="e.g., Bringing a toddler, please serve drinks immediately, allergy alerts..."
                    rows={2}
                    className="w-full text-xs p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer & Submit Order */}
          {cartItems.length > 0 && (
            <div className="p-4 sm:p-6 bg-white border-t border-stone-200 space-y-3">
              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{restaurantInfo.currency}{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({(restaurantInfo.taxRate * 100).toFixed(1)}%)</span>
                  <span>{restaurantInfo.currency}{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-stone-900 pt-1.5 border-t border-stone-100">
                  <span>Total Due</span>
                  <span className="text-amber-700">{restaurantInfo.currency}{total.toFixed(2)}</span>
                </div>
              </div>

              <button
                id="cart-submit-order-btn"
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-semibold rounded-xl flex items-center justify-center gap-2 text-sm transition-all shadow-md active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Transmitting to Kitchen...</span>
                  </>
                ) : (
                  <>
                    <span>Send Order to Kitchen (Table {selectedTable || '?'})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                onClick={onClearCart}
                className="w-full py-1 text-xs text-stone-400 hover:text-stone-600 transition-colors text-center"
              >
                Clear entire cart
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
