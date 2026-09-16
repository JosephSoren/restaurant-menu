import React, { useState, useMemo } from 'react';
import { MenuItem, DietaryTag, RestaurantInfo, Order, CartItem } from '../types';
import { 
  Search, 
  Sparkles, 
  Flame, 
  Leaf, 
  Plus, 
  Minus, 
  Check, 
  Clock, 
  ArrowRight,
  SlidersHorizontal,
  X,
  Utensils,
  Receipt
} from 'lucide-react';
import { TableOrderHistory } from './TableOrderHistory';

interface CustomerViewProps {
  menu: MenuItem[];
  restaurantInfo: RestaurantInfo;
  selectedTable: string;
  onChangeTableClick: () => void;
  onAddToCart: (item: MenuItem, quantity: number, notes?: string) => void;
  activeOrders: Order[];
  onOpenTracker: (orderId?: string) => void;
  onOpenCart: () => void;
  cartCount: number;
  allOrders?: Order[];
  cart?: CartItem[];
}

export function CustomerView({
  menu,
  restaurantInfo,
  selectedTable,
  onChangeTableClick,
  onAddToCart,
  activeOrders,
  onOpenTracker,
  onOpenCart,
  cartCount,
  allOrders = [],
  cart = []
}: CustomerViewProps) {
  const [customerTab, setCustomerTab] = useState<'menu' | 'history'>('menu');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDietary, setSelectedDietary] = useState<DietaryTag[]>([]);
  const [selectedDishModal, setSelectedDishModal] = useState<MenuItem | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [modalNotes, setModalNotes] = useState('');
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  // Extract all categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    menu.forEach(item => {
      if (item.category) set.add(item.category);
    });
    return ['All', ...Array.from(set)];
  }, [menu]);

  // Dietary options
  const dietaryOptions: DietaryTag[] = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Spicy'];

  // Filtered menu
  const filteredMenu = useMemo(() => {
    return menu.filter(item => {
      // Category filter
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      // Dietary filter
      if (selectedDietary.length > 0) {
        const itemDietary = item.dietary || [];
        const matchesAllDietary = selectedDietary.every(d => itemDietary.includes(d));
        if (!matchesAllDietary) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCat) return false;
      }
      return true;
    });
  }, [menu, selectedCategory, selectedDietary, searchQuery]);

  const toggleDietaryFilter = (tag: DietaryTag) => {
    setSelectedDietary(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleQuickAdd = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.isAvailable) return;
    onAddToCart(item, 1);
    setRecentlyAddedId(item.id);
  };

  const handleOpenDishModal = (item: MenuItem) => {
    setSelectedDishModal(item);
    setModalQuantity(1);
    setModalNotes('');
  };

  const handleConfirmModalAdd = () => {
    if (!selectedDishModal) return;
    onAddToCart(selectedDishModal, modalQuantity, modalNotes.trim() || undefined);
    setRecentlyAddedId(selectedDishModal.id);
    setSelectedDishModal(null);
  };

  // Find latest active order for banner
  const latestActiveOrder = activeOrders.find(
    o => o.status !== 'completed' && o.status !== 'cancelled'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Table Welcome Banner */}
      <div className="bg-stone-900 text-white rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Digital Tabletop Menu</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Dining at Table #{selectedTable || '1'}
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 max-w-xl">
            Order directly from your phone. Your selections go straight to our kitchen with real-time status tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative z-10">
          <button
            id="table-change-button"
            onClick={onChangeTableClick}
            className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded-xl text-xs sm:text-sm font-medium border border-stone-700 transition-colors"
          >
            Change Table
          </button>
          {cartCount > 0 && (
            <button
              onClick={onOpenCart}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>View Cart ({cartCount})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Real-time Order Tracking Banner if active order exists */}
      {latestActiveOrder && (
        <div 
          onClick={() => onOpenTracker(latestActiveOrder.id)}
          className="bg-amber-500/10 border-2 border-amber-500/40 hover:border-amber-500 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer transition-all shadow-sm hover:shadow-md"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold flex-shrink-0">
              <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                  Active Order #{latestActiveOrder.orderNumber}
                </span>
                <span className="text-xs text-stone-500">
                  Table {latestActiveOrder.tableNumber}
                </span>
              </div>
              <p className="text-sm sm:text-base font-bold text-stone-900 mt-0.5">
                Status: <span className="text-amber-700 uppercase">{latestActiveOrder.status}</span>
                {latestActiveOrder.status === 'received' && ' — Sent to Kitchen'}
                {latestActiveOrder.status === 'preparing' && ' — Chef is Cooking Now'}
                {latestActiveOrder.status === 'ready' && ' — Plated & Ready to Serve!'}
                {latestActiveOrder.status === 'served' && ' — Delivered to Your Table'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-800 bg-white px-3 py-1.5 rounded-xl border border-amber-200 flex-shrink-0 shadow-2xs">
            <span>Track Live</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Primary Customer Tab Bar: Menu vs Order History */}
      <div className="bg-white p-1.5 rounded-2xl border border-stone-200 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            id="customer-tab-menu"
            onClick={() => setCustomerTab('menu')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              customerTab === 'menu'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Utensils className="w-4 h-4 text-amber-400" />
            <span>Browse Menu</span>
          </button>

          <button
            id="customer-tab-history"
            onClick={() => setCustomerTab('history')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              customerTab === 'history'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Receipt className="w-4 h-4 text-amber-500" />
            <span>Order History</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                customerTab === 'history'
                  ? 'bg-amber-500 text-stone-950'
                  : 'bg-stone-100 text-stone-700'
              }`}
            >
              Table #{selectedTable}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 px-2 text-xs text-stone-500 font-medium">
          {customerTab === 'menu' ? (
            <span>{filteredMenu.length} dishes available</span>
          ) : (
            <span>Table #{selectedTable} past orders</span>
          )}
        </div>
      </div>

      {customerTab === 'history' ? (
        <TableOrderHistory
          selectedTable={selectedTable}
          restaurantInfo={restaurantInfo}
          menu={menu}
          onAddToCart={onAddToCart}
          onOpenMenuTab={() => setCustomerTab('menu')}
          onOpenCart={onOpenCart}
          liveOrders={allOrders && allOrders.length > 0 ? allOrders : activeOrders}
        />
      ) : (
        <>
          {/* Search & Filter Controls */}
          <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="menu-search-input"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search dishes, ingredients, or drinks..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Dietary toggles */}
          <div className="flex flex-wrap items-center gap-1.5">
            {dietaryOptions.map(tag => {
              const active = selectedDietary.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleDietaryFilter(tag)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                    active
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {tag === 'Vegetarian' && <Leaf className="w-3 h-3 text-emerald-500" />}
                  {tag === 'Spicy' && <Flame className="w-3 h-3 text-red-500" />}
                  <span>{tag}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Horizontal Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {categories.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu Grid */}
      {filteredMenu.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 p-6">
          <Utensils className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-800">No dishes match your filter</h3>
          <p className="text-xs text-stone-500 mt-1 mb-4">
            Try clearing your search query or dietary filters to view all menu items.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSelectedDietary([]);
            }}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMenu.map(item => {
            const isAdded = recentlyAddedId === item.id;
            const inCartItem = cart?.find(c => c.menuItem.id === item.id);
            const inCart = Boolean(inCartItem);
            const isHighlightedYellow = isAdded || inCart;

            return (
              <div
                key={item.id}
                onClick={() => handleOpenDishModal(item)}
                className={`bg-white rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer ${
                  isHighlightedYellow
                    ? 'border-2 border-yellow-400 ring-2 ring-yellow-400/50 bg-yellow-50/15'
                    : 'border border-stone-200/80'
                } ${
                  !item.isAvailable ? 'opacity-60 grayscale-30' : ''
                }`}
              >
                <div>
                  {/* Dish Image */}
                  <div className="relative aspect-16/10 bg-stone-100 overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-400">
                        <Utensils className="w-10 h-10 stroke-1" />
                      </div>
                    )}

                    {/* Sold out badge */}
                    {!item.isAvailable && (
                      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-2xs flex items-center justify-center">
                        <span className="px-3 py-1 bg-stone-900 text-white text-xs font-bold uppercase tracking-wider rounded-lg border border-stone-700">
                          86&apos;d / Sold Out
                        </span>
                      </div>
                    )}

                    {/* Prep time badge */}
                    {item.prepTimeMinutes && item.isAvailable && (
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-stone-900/80 text-white text-[10px] font-medium flex items-center gap-1 backdrop-blur-xs">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>~{item.prepTimeMinutes} min</span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                          {item.category}
                        </span>
                        <h3 className="text-base font-bold text-stone-900 leading-snug group-hover:text-amber-600 transition-colors">
                          {item.name}
                        </h3>
                      </div>
                      <span className="text-base font-bold text-stone-900 flex-shrink-0">
                        {restaurantInfo.currency}{item.price.toFixed(2)}
                      </span>
                    </div>

                    <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                      {item.description || 'Delicious freshly prepared culinary specialty.'}
                    </p>

                    {/* Dietary Tags */}
                    {item.dietary && item.dietary.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.dietary.map(d => (
                          <span
                            key={d}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-600"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 pt-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    id={`dish-add-btn-${item.id}`}
                    onClick={(e) => handleQuickAdd(item, e)}
                    disabled={!item.isAvailable}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      !item.isAvailable
                        ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                        : isHighlightedYellow
                        ? 'bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-stone-950 border-2 border-yellow-500 shadow-xs active:scale-98'
                        : 'bg-stone-900 hover:bg-stone-800 text-white shadow-xs active:scale-98'
                    }`}
                  >
                    {isHighlightedYellow ? (
                      <>
                        <Check className="w-4 h-4 text-stone-950 stroke-[2.5]" />
                        <span>
                          {inCartItem && inCartItem.quantity > 1 ? `In Cart (${inCartItem.quantity}×)` : 'Added to Order'} • {restaurantInfo.currency}{item.price.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Add to Order • {restaurantInfo.currency}{item.price.toFixed(2)}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>
      )}

      {/* Dish Details & Customizer Modal */}
      {selectedDishModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Image */}
            <div className="relative aspect-16/9 bg-stone-100">
              {selectedDishModal.imageUrl ? (
                <img
                  src={selectedDishModal.imageUrl}
                  alt={selectedDishModal.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-300">
                  <Utensils className="w-16 h-16" />
                </div>
              )}
              <button
                onClick={() => setSelectedDishModal(null)}
                className="absolute top-3 right-3 p-1.5 bg-stone-900/70 hover:bg-stone-900 text-white rounded-full backdrop-blur-xs transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                    {selectedDishModal.category}
                  </span>
                  <h3 className="text-xl font-bold text-stone-900">
                    {selectedDishModal.name}
                  </h3>
                </div>
                <span className="text-xl font-extrabold text-stone-900">
                  {restaurantInfo.currency}{selectedDishModal.price.toFixed(2)}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {selectedDishModal.description}
              </p>

              {/* Dietary Tags */}
              {selectedDishModal.dietary && selectedDishModal.dietary.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedDishModal.dietary.map(d => (
                    <span
                      key={d}
                      className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              )}

              {/* Special Instructions Input */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-stone-700">
                  Custom Preparation Notes (Optional)
                </label>
                <input
                  type="text"
                  value={modalNotes}
                  onChange={e => setModalNotes(e.target.value)}
                  placeholder="e.g., Dressing on side, extra hot, no cilantro..."
                  className="w-full text-xs sm:text-sm px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Quantity Controls & Add Button */}
              <div className="flex items-center gap-3 pt-3 border-t border-stone-200">
                <div className="flex items-center border border-stone-300 rounded-xl bg-white overflow-hidden">
                  <button
                    onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                    className="p-2.5 hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-3.5 text-sm font-bold text-stone-900">
                    {modalQuantity}
                  </span>
                  <button
                    onClick={() => setModalQuantity(modalQuantity + 1)}
                    className="p-2.5 hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleConfirmModalAdd}
                  disabled={!selectedDishModal.isAvailable}
                  className="flex-1 py-3 px-4 bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 disabled:bg-stone-200 text-stone-950 font-extrabold rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2 border-2 border-yellow-500 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-stone-950" />
                  <span>
                    Add to Order • {restaurantInfo.currency}{(selectedDishModal.price * modalQuantity).toFixed(2)}
                  </span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
