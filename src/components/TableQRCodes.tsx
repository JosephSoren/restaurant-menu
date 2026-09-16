import React, { useState, useEffect } from 'react';
import { RestaurantInfo } from '../types';
import { QrCode, ExternalLink, Printer, Settings, Check, Utensils, Hash } from 'lucide-react';

interface TableQRCodesProps {
  restaurantInfo: RestaurantInfo;
  onUpdateSettings: (info: Partial<RestaurantInfo>) => Promise<void>;
  onSelectTableForCustomer: (table: string) => void;
}

export function TableQRCodes({
  restaurantInfo,
  onUpdateSettings,
  onSelectTableForCustomer
}: TableQRCodesProps) {
  const [name, setName] = useState(restaurantInfo.name);
  const [tagline, setTagline] = useState(restaurantInfo.tagline);
  const [currency, setCurrency] = useState(restaurantInfo.currency);
  const [taxRatePercent, setTaxRatePercent] = useState(String((restaurantInfo.taxRate * 100).toFixed(2)));
  const [tableCount, setTableCount] = useState(String(restaurantInfo.tables.length || 12));
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(restaurantInfo.name);
    setTagline(restaurantInfo.tagline);
    setCurrency(restaurantInfo.currency);
    setTaxRatePercent(String((restaurantInfo.taxRate * 100).toFixed(2)));
    setTableCount(String(restaurantInfo.tables.length || 12));
  }, [restaurantInfo]);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const count = Math.max(1, Math.min(50, Number(tableCount) || 12));
      const tablesArray = Array.from({ length: count }, (_, i) => i + 1);

      await onUpdateSettings({
        name: name.trim(),
        tagline: tagline.trim(),
        currency: currency.trim() || '₹',
        taxRate: (Number(taxRatePercent) || 5.0) / 100,
        tables: tablesArray
      });

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      
      {/* Top Banner & Print Action */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-600" />
            <span>Tabletop QR Codes &amp; Setup</span>
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Place these QR cards on dining tables. When guests scan with their phone camera, the menu opens instantly with their table number pre-selected.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs"
        >
          <Printer className="w-4 h-4" />
          <span>Print Table Cards</span>
        </button>
      </div>

      {/* QR Codes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {restaurantInfo.tables.map(tableNum => {
          const tableUrl = `${currentOrigin}?table=${tableNum}`;
          const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(tableUrl)}&color=29-25-24&margin=10`;

          return (
            <div
              key={tableNum}
              className="bg-white rounded-2xl border-2 border-stone-200/90 p-5 flex flex-col items-center text-center shadow-2xs hover:shadow-md transition-all group"
            >
              {/* Header */}
              <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-stone-100">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800">
                  {restaurantInfo.name}
                </span>
                <span className="text-[10px] bg-stone-100 text-stone-600 font-semibold px-2 py-0.5 rounded-full">
                  Scan to Order
                </span>
              </div>

              {/* Table Number Highlight */}
              <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex flex-col items-center justify-center font-bold mb-3 shadow-xs">
                <span className="text-[9px] uppercase tracking-wider opacity-80 leading-none">
                  TABLE
                </span>
                <span className="text-xl font-extrabold leading-none mt-0.5">
                  {tableNum}
                </span>
              </div>

              {/* QR Image */}
              <div className="w-44 h-44 bg-white p-2 rounded-xl border border-stone-200 shadow-2xs mb-3 flex items-center justify-center">
                <img
                  src={qrImageUrl}
                  alt={`QR Code for Table ${tableNum}`}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>

              <p className="text-xs text-stone-500 font-medium">
                Point phone camera to view menu &amp; order
              </p>

              {/* Action Button: Test Scan as Customer */}
              <button
                onClick={() => onSelectTableForCustomer(String(tableNum))}
                className="mt-3 w-full py-2 px-3 bg-stone-50 hover:bg-amber-50 hover:text-amber-800 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Test as Table {tableNum}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Restaurant Settings Form */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-7 shadow-2xs">
        <h4 className="text-base font-bold text-stone-900 flex items-center gap-2 mb-4">
          <Settings className="w-4 h-4 text-stone-600" />
          <span>Restaurant Info &amp; Tax Settings</span>
        </h4>

        <form onSubmit={handleSaveSettings} className="space-y-4 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Restaurant Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                required
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                placeholder="₹"
                className="w-full text-sm px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Tagline / Subtitle
            </label>
            <input
              type="text"
              value={tagline}
              onChange={e => setTagline(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={taxRatePercent}
                onChange={e => setTaxRatePercent(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Number of Tables
              </label>
              <input
                type="number"
                min="1"
                max="50"
                required
                value={tableCount}
                onChange={e => setTableCount(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs flex items-center gap-2"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Settings Saved!</span>
                </>
              ) : (
                <span>Save Restaurant Settings</span>
              )}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
