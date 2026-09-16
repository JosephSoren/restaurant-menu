import React, { useState } from 'react';
import { RestaurantInfo } from '../types';
import { X, Utensils, Check } from 'lucide-react';

interface TableSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTable: string;
  onSelectTable: (table: string) => void;
  restaurantInfo: RestaurantInfo;
}

export function TableSelectorModal({
  isOpen,
  onClose,
  selectedTable,
  onSelectTable,
  restaurantInfo
}: TableSelectorModalProps) {
  const [customTable, setCustomTable] = useState('');

  if (!isOpen) return null;

  const handleSelect = (t: string) => {
    onSelectTable(t);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTable.trim()) {
      onSelectTable(customTable.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 border border-stone-100">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Select Your Table Number
              </h3>
              <p className="text-xs text-stone-500">
                {restaurantInfo.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Table Number Grid */}
        <p className="text-xs text-stone-600 font-semibold mb-3">
          Tap your table number as shown on your tabletop card:
        </p>

        <div className="grid grid-cols-4 gap-2.5 mb-5">
          {restaurantInfo.tables.map(tableNum => {
            const isSelected = selectedTable === String(tableNum);
            return (
              <button
                key={tableNum}
                onClick={() => handleSelect(String(tableNum))}
                className={`py-3 rounded-xl font-bold text-sm flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-400'
                    : 'bg-stone-50 hover:bg-amber-50 text-stone-800 border border-stone-200'
                }`}
              >
                <span className="text-[10px] uppercase font-semibold opacity-75">Table</span>
                <span className="text-base font-extrabold">{tableNum}</span>
              </button>
            );
          })}
        </div>

        {/* Custom table number input */}
        <form onSubmit={handleCustomSubmit} className="pt-3 border-t border-stone-100">
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Or enter custom table or booth identifier:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customTable}
              onChange={e => setCustomTable(e.target.value)}
              placeholder="e.g. Patio 3, Bar 2, Booth A"
              className="flex-1 text-xs sm:text-sm px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={!customTable.trim()}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-200 text-white text-xs font-semibold rounded-xl"
            >
              Set
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
