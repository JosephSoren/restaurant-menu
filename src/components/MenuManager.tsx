import React, { useState, useRef } from 'react';
import { MenuItem, DietaryTag, RestaurantInfo } from '../types';
import { 
  UploadCloud, 
  Upload,
  FileText, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Download, 
  RotateCcw, 
  Sparkles, 
  AlertCircle,
  Search,
  Eye,
  EyeOff,
  Camera,
  FolderOpen,
  Image as ImageIcon,
  ChevronDown
} from 'lucide-react';

// Client-side image optimizer for fast dish upload from device
function processDishImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select a valid image file (JPEG, PNG, WebP).'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1000;
        const maxHeight = 800;
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          if (width / maxWidth > height / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(rawDataUrl);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };
      img.onerror = () => resolve(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

interface MenuManagerProps {
  menu: MenuItem[];
  restaurantInfo: RestaurantInfo;
  onAddItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  onUpdateItem: (id: string, item: Partial<MenuItem>) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onToggleAvailability: (id: string) => Promise<void>;
  onUploadMenu: (data: {
    items?: any[];
    rawContent?: string;
    mode?: 'append' | 'replace';
    useAi?: boolean;
  }) => Promise<{ addedCount: number; totalCount: number }>;
  onResetSample: () => Promise<void>;
}

export function MenuManager({
  menu,
  restaurantInfo,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onToggleAvailability,
  onUploadMenu,
  onResetSample
}: MenuManagerProps) {
  // Tabs: Catalog vs Upload Menu
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'upload'>('catalog');

  // Search & Filter in catalog
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Add / Edit Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Mains');
  const [formPrice, setFormPrice] = useState('14.50');
  const [formDesc, setFormDesc] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formDietary, setFormDietary] = useState<DietaryTag[]>([]);
  const [formPrepTime, setFormPrepTime] = useState('15');
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Upload state
  const [uploadMode, setUploadMode] = useState<'append' | 'replace'>('append');
  const [rawTextContent, setRawTextContent] = useState('');
  const [useAiExtraction, setUseAiExtraction] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalGalleryInputRef = useRef<HTMLInputElement>(null);
  const modalCameraInputRef = useRef<HTMLInputElement>(null);
  const rowGalleryInputRef = useRef<HTMLInputElement>(null);
  const rowCameraInputRef = useRef<HTMLInputElement>(null);
  const [quickTargetItemId, setQuickTargetItemId] = useState<string | null>(null);
  const [quickUploadingId, setQuickUploadingId] = useState<string | null>(null);

  const menuCategories = Array.from(new Set(menu.map(i => i.category).filter(Boolean)));
  const commonCategories = [
    'Starters',
    'Mains',
    'Breads & Roti',
    'Biryani & Rice',
    'Curries & Gravies',
    'Tandoor & Kebabs',
    'Snacks & Chaat',
    'Pizzas',
    'Pastas',
    'Desserts',
    'Beverages',
    'Combos & Thali'
  ];
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const allAvailableCategories = Array.from(
    new Set([...menuCategories, ...customCategories, ...commonCategories])
  );

  const categories = Array.from(new Set(menu.map(i => i.category)));
  const allCategories = ['All', ...categories];

  // Category dropdown & custom category state
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  const dietaryOptions: DietaryTag[] = [
    'Vegetarian',
    'Vegan',
    'Gluten-Free',
    'Dairy-Free',
    'Spicy',
    'Nut-Free'
  ];

  // Open add item modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName('');
    const defaultCat = menuCategories[0] || 'Starters';
    setFormCategory(defaultCat);
    setIsCustomCategory(false);
    setCustomCategoryName('');
    setFormPrice('180');
    setFormDesc('');
    setFormImage('');
    setFormDietary([]);
    setFormPrepTime('15');
    setImageError(null);
    setIsEditModalOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setIsCustomCategory(false);
    setCustomCategoryName('');
    setFormPrice(String(item.price));
    setFormDesc(item.description);
    setFormImage(item.imageUrl || '');
    setFormDietary(item.dietary || []);
    setFormPrepTime(String(item.prepTimeMinutes || 15));
    setImageError(null);
    setIsEditModalOpen(true);
  };

  // Process image selected by user for modal form
  const handleModalImageSelect = async (file: File) => {
    if (!file) return;
    setIsProcessingImage(true);
    setImageError(null);
    try {
      const dataUrl = await processDishImageFile(file);
      setFormImage(dataUrl);
    } catch (err: any) {
      setImageError(err.message || 'Could not process image.');
    } finally {
      setIsProcessingImage(false);
      if (modalGalleryInputRef.current) modalGalleryInputRef.current.value = '';
      if (modalCameraInputRef.current) modalCameraInputRef.current.value = '';
    }
  };

  // Process quick row image upload from device
  const handleRowImageSelect = async (file: File) => {
    if (!file || !quickTargetItemId) return;
    const targetId = quickTargetItemId;
    setQuickUploadingId(targetId);
    try {
      const dataUrl = await processDishImageFile(file);
      await onUpdateItem(targetId, { imageUrl: dataUrl });
    } catch (err: any) {
      alert(err.message || 'Failed to upload dish image from device.');
    } finally {
      setQuickUploadingId(null);
      setQuickTargetItemId(null);
      if (rowGalleryInputRef.current) rowGalleryInputRef.current.value = '';
      if (rowCameraInputRef.current) rowCameraInputRef.current.value = '';
    }
  };

  // Save Item
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveCategory = isCustomCategory ? customCategoryName.trim() : formCategory.trim();
    if (!formName.trim() || !effectiveCategory || isNaN(Number(formPrice))) return;

    if (isCustomCategory && customCategoryName.trim()) {
      setCustomCategories(prev => Array.from(new Set([...prev, customCategoryName.trim()])));
    }

    setIsSaving(true);
    try {
      if (editingItem) {
        await onUpdateItem(editingItem.id, {
          name: formName.trim(),
          category: effectiveCategory,
          price: Number(formPrice),
          description: formDesc.trim(),
          imageUrl: formImage.trim() || undefined,
          dietary: formDietary,
          prepTimeMinutes: Number(formPrepTime) || 15
        });
      } else {
        await onAddItem({
          name: formName.trim(),
          category: effectiveCategory,
          price: Number(formPrice),
          description: formDesc.trim(),
          imageUrl: formImage.trim() || undefined,
          dietary: formDietary,
          prepTimeMinutes: Number(formPrepTime) || 15,
          isAvailable: true
        });
      }
      setIsEditModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle File Selection (JSON or CSV/TXT)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) return;
      processUpload(content);
    };
    reader.readAsText(file);
  };

  const processUpload = async (content: string) => {
    setIsUploading(true);
    setUploadMessage(null);
    try {
      // Check if it's JSON
      let result;
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          result = await onUploadMenu({
            items: parsed,
            mode: uploadMode
          });
        } else {
          result = await onUploadMenu({
            rawContent: content,
            mode: uploadMode,
            useAi: useAiExtraction
          });
        }
      } catch {
        result = await onUploadMenu({
          rawContent: content,
          mode: uploadMode,
          useAi: useAiExtraction
        });
      }

      setUploadMessage({
        type: 'success',
        text: `Success! Added ${result.addedCount} items to the menu. Total: ${result.totalCount} dishes.`
      });
      setRawTextContent('');
    } catch (err: any) {
      setUploadMessage({
        type: 'error',
        text: err.message || 'Failed to parse menu items. Please check format.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Download Current Menu as JSON
  const handleExportMenu = () => {
    const jsonStr = JSON.stringify(menu, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${restaurantInfo.name.toLowerCase().replace(/\s+/g, '_')}_menu.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter items in catalog
  const filteredCatalog = menu.filter(item => {
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Sub tabs: Catalog vs Upload */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-stone-200 shadow-2xs">
        <div className="flex items-center bg-stone-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('catalog')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeSubTab === 'catalog'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Menu Items ({menu.length})
          </button>
          <button
            id="menu-upload-tab-btn"
            onClick={() => setActiveSubTab('upload')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'upload'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <UploadCloud className="w-4 h-4 text-amber-400" />
            <span>Upload &amp; Import Menu</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'catalog' && (
            <button
              id="menu-add-dish-btn"
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Dish</span>
            </button>
          )}

          <button
            onClick={handleExportMenu}
            className="p-2 sm:px-3 sm:py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5"
            title="Download Menu as JSON"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={onResetSample}
            className="p-2 sm:px-3 sm:py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5"
            title="Reset to sample restaurant menu"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset Demo</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: UPLOAD MENU */}
      {activeSubTab === 'upload' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-7 shadow-2xs space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-amber-600" />
              <span>Upload Restaurant Menu</span>
            </h3>
            <p className="text-xs sm:text-sm text-stone-500">
              Upload existing menu files (JSON, CSV, or TXT) or paste raw text. The system automatically structures your dishes, prices, and categories.
            </p>
          </div>

          {/* Mode & AI extraction settings */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-stone-50 rounded-xl border border-stone-200">
            <div>
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-1.5">
                Import Behavior
              </span>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="uploadMode"
                    value="append"
                    checked={uploadMode === 'append'}
                    onChange={() => setUploadMode('append')}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span>Add dishes to existing menu</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="uploadMode"
                    value="replace"
                    checked={uploadMode === 'replace'}
                    onChange={() => setUploadMode('replace')}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-red-700">Replace entire menu</span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer bg-white px-3 py-2 rounded-lg border border-stone-200 shadow-2xs">
                <input
                  type="checkbox"
                  checked={useAiExtraction}
                  onChange={e => setUseAiExtraction(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>AI Structured Parser (Gemini)</span>
              </label>
            </div>
          </div>

          {/* Drag & Drop File Zone */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-2xl p-8 text-center cursor-pointer bg-stone-50/60 hover:bg-amber-50/20 transition-all"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <FileText className="w-10 h-10 text-stone-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-stone-800">
              Click to browse or drop menu file here
            </p>
            <p className="text-xs text-stone-500 mt-1">
              Supports .json (structured menu), .csv, or .txt files
            </p>
          </div>

          {/* Paste Raw Text Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Or Paste Menu Text Directly
              </label>
              <button
                type="button"
                onClick={() => setRawTextContent(
`[Starters]
Paneer Tikka - ₹240 - Charcoal grilled cottage cheese with peppers and mint chutney
Truffle Arancini - ₹220 - Crispy risotto balls infused with truffle oil

[Mains]
Butter Chicken - ₹360 - Tender tandoori chicken simmered in rich makhani tomato gravy
Dal Makhani - ₹260 - Slow-cooked black lentils with cream and butter
Dum Biryani - ₹320 - Fragrant basmati rice layered with spiced herbs and saffron

[Breads & Sides]
Garlic Naan - ₹60 - Clay oven baked flatbread brushed with garlic butter
Tandoori Roti - ₹35 - Whole wheat clay oven bread

[Beverages]
Mango Lassi - ₹120 - Chilled sweet yogurt drink with Alphonso mango
Masala Chai - ₹60 - Traditional slow-brewed spiced Indian tea`
                )}
                className="text-xs text-amber-700 hover:text-amber-800 underline font-medium"
              >
                Insert Sample Format
              </button>
            </div>

            <textarea
              id="menu-raw-text-input"
              value={rawTextContent}
              onChange={e => setRawTextContent(e.target.value)}
              placeholder={`[Category Name]\nDish Name - ₹Price - Description`}
              rows={6}
              className="w-full text-xs font-mono p-3 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />

            <div className="flex justify-end">
              <button
                id="menu-submit-upload-btn"
                onClick={() => processUpload(rawTextContent)}
                disabled={isUploading || !rawTextContent.trim()}
                className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-colors shadow-sm"
              >
                {isUploading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Parsing &amp; Importing...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 text-amber-400" />
                    <span>Process &amp; Upload Dishes</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Feedback message */}
          {uploadMessage && (
            <div className={`p-4 rounded-xl text-xs sm:text-sm flex items-center gap-3 ${
              uploadMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {uploadMessage.type === 'success' ? (
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <span>{uploadMessage.text}</span>
            </div>
          )}

        </div>
      )}

      {/* SUB-VIEW 2: CATALOG & ITEM MANAGEMENT */}
      {activeSubTab === 'catalog' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search menu catalog..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {allCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-stone-900 text-white'
                      : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Dishes Table */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 border-b border-stone-200 text-xs font-bold text-stone-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Dish / Item</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredCatalog.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-stone-400 text-xs">
                        No dishes found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredCatalog.map(item => (
                      <tr key={item.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-stone-100 overflow-hidden flex-shrink-0 border border-stone-200">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-stone-300">
                                  <ImageIcon className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="font-bold text-stone-900 leading-snug">
                                {item.name}
                              </h4>
                              <p className="text-xs text-stone-500 line-clamp-1 max-w-sm mt-0.5">
                                {item.description || 'No description provided'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-stone-100 text-stone-700">
                            {item.category}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-bold text-stone-900">
                          {restaurantInfo.currency}{item.price.toFixed(2)}
                        </td>

                        <td className="px-4 py-3">
                          <button
                            onClick={() => onToggleAvailability(item.id)}
                            className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors ${
                              item.isAvailable
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                            }`}
                            title="Click to toggle Available / 86'd"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${item.isAvailable ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <span>{item.isAvailable ? 'In Stock' : "86'd / Out"}</span>
                          </button>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setQuickTargetItemId(item.id);
                                rowGalleryInputRef.current?.click();
                              }}
                              disabled={quickUploadingId === item.id}
                              className="p-1.5 text-stone-500 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors"
                              title="Upload dish photo from device"
                            >
                              {quickUploadingId === item.id ? (
                                <span className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin inline-block" />
                              ) : (
                                <Upload className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors"
                              title="Edit dish details"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteItem(item.id)}
                              className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete dish"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Dish Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 border border-stone-100">
            <div className="p-5 bg-stone-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold">
                {editingItem ? 'Edit Dish Details' : 'Add New Dish to Menu'}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-stone-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Dish Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g., Artisanal Margherita Pizza"
                  className="w-full text-sm px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="dish-category-select" className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                      Category *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isCustomCategory) {
                          setIsCustomCategory(true);
                          setCustomCategoryName('');
                        } else {
                          setIsCustomCategory(false);
                          setFormCategory(menuCategories[0] || 'Starters');
                        }
                      }}
                      className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {isCustomCategory ? (
                        <span>Choose Existing</span>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          <span>+ New Category</span>
                        </>
                      )}
                    </button>
                  </div>

                  {!isCustomCategory ? (
                    <div className="relative">
                      <select
                        id="dish-category-select"
                        required
                        value={formCategory}
                        onChange={(e) => {
                          if (e.target.value === '__NEW__') {
                            setIsCustomCategory(true);
                            setCustomCategoryName('');
                          } else {
                            setFormCategory(e.target.value);
                          }
                        }}
                        className="w-full text-sm px-3 py-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none pr-8 cursor-pointer font-medium text-stone-800"
                      >
                        <option value="" disabled>Select a category...</option>
                        
                        {/* Current Menu Categories */}
                        {menuCategories.length > 0 && (
                          <optgroup label="Categories in Menu">
                            {menuCategories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </optgroup>
                        )}

                        {/* Popular Categories */}
                        <optgroup label="Popular Categories">
                          {allAvailableCategories
                            .filter(cat => !menuCategories.includes(cat))
                            .map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </optgroup>

                        {/* Option to create a new category */}
                        <option value="__NEW__" className="font-bold text-amber-700 bg-amber-50">
                          + Add New Category...
                        </option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex gap-1.5 items-center">
                        <input
                          id="dish-new-category-input"
                          type="text"
                          required
                          autoFocus
                          value={customCategoryName}
                          onChange={e => setCustomCategoryName(e.target.value)}
                          placeholder="Type new category (e.g. Biryani)..."
                          className="w-full text-sm px-3 py-2 border-2 border-amber-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/30 text-stone-900 placeholder:text-stone-400 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomCategory(false);
                            setCustomCategoryName('');
                          }}
                          className="px-2.5 py-2 text-xs text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl whitespace-nowrap transition-colors"
                          title="Choose existing category"
                        >
                          Cancel
                        </button>
                      </div>
                      <p className="text-[11px] text-amber-700">
                        This category will be saved and added to your menu filters.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="dish-price-input" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Price ({restaurantInfo.currency || '₹'}) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-semibold pointer-events-none">
                      {restaurantInfo.currency || '₹'}
                    </span>
                    <input
                      id="dish-price-input"
                      type="number"
                      step="1"
                      min="0"
                      required
                      value={formPrice}
                      onChange={e => setFormPrice(e.target.value)}
                      placeholder="180"
                      className="w-full text-sm pl-8 pr-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  placeholder="Ingredients, preparation method, culinary notes..."
                  rows={2}
                  className="w-full text-sm px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Photo URL & Device Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Photo URL (Optional)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      id="upload-dish-modal-btn"
                      onClick={() => modalGalleryInputRef.current?.click()}
                      disabled={isProcessingImage}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/90 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Upload dish photo from your phone or PC"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-600" />
                      <span>Upload from Device</span>
                    </button>
                    <button
                      type="button"
                      id="camera-dish-modal-btn"
                      onClick={() => modalCameraInputRef.current?.click()}
                      disabled={isProcessingImage}
                      className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Capture photo using camera"
                    >
                      <Camera className="w-3.5 h-3.5 text-stone-600" />
                      <span className="hidden sm:inline">Camera</span>
                    </button>
                  </div>
                </div>

                {/* Input row: Photo URL input WITH prominent Upload Image button right beside it */}
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={formImage}
                      onChange={e => {
                        setFormImage(e.target.value);
                        setImageError(null);
                      }}
                      placeholder="Paste image URL (https://...) or click Upload Image beside this"
                      className="w-full text-xs sm:text-sm px-3 py-2 pr-8 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    {formImage && (
                      <button
                        type="button"
                        onClick={() => setFormImage('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5 rounded-full"
                        title="Clear photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Upload button beside the Photo URL input */}
                  <button
                    type="button"
                    id="upload-dish-image-btn"
                    onClick={() => modalGalleryInputRef.current?.click()}
                    disabled={isProcessingImage}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs whitespace-nowrap transition-colors disabled:opacity-50"
                    title="Upload dish image from device"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{isProcessingImage ? 'Uploading...' : 'Upload Image'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => modalCameraInputRef.current?.click()}
                    disabled={isProcessingImage}
                    className="sm:hidden p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 rounded-xl"
                    title="Take photo with camera"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                {/* Error notice if upload fails */}
                {imageError && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span>{imageError}</span>
                  </div>
                )}

                {/* Live Preview Card */}
                {formImage ? (
                  <div className="flex items-center gap-3 p-2.5 bg-stone-50 border border-stone-200 rounded-xl">
                    <div className="w-16 h-16 rounded-lg bg-stone-200 overflow-hidden flex-shrink-0 border border-stone-300">
                      <img
                        src={formImage}
                        alt="Dish preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={() => setImageError('Failed to preview image. The URL might be broken or blocked.')}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                          {formImage.startsWith('data:') ? 'Uploaded from Device' : 'Web URL'}
                        </span>
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Ready
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 truncate mt-1">
                        {formImage.startsWith('data:') ? 'Optimized image ready for customer menu' : formImage}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => modalGalleryInputRef.current?.click()}
                          className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 hover:underline"
                        >
                          Change image
                        </button>
                        <span className="text-stone-300">•</span>
                        <button
                          type="button"
                          onClick={() => setFormImage('')}
                          className="text-[11px] font-semibold text-red-600 hover:text-red-700 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => modalGalleryInputRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleModalImageSelect(file);
                    }}
                    className="flex items-center justify-between px-3 py-2 border border-dashed border-stone-300 hover:border-amber-500 bg-stone-50/70 hover:bg-amber-50/30 rounded-xl cursor-pointer transition-colors text-xs text-stone-600"
                  >
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-stone-400" />
                      <span>Or drag & drop dish image here (JPEG, PNG, WebP)</span>
                    </div>
                    <span className="text-amber-700 font-semibold text-[11px]">Browse</span>
                  </div>
                )}

                {/* Estimated Prep Time */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Estimated Prep Time (minutes)
                  </label>
                  <input
                    type="number"
                    value={formPrepTime}
                    onChange={e => setFormPrepTime(e.target.value)}
                    placeholder="15"
                    className="w-full text-sm px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Dietary Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {dietaryOptions.map(tag => {
                    const isChecked = formDietary.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => {
                          setFormDietary(prev =>
                            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          isChecked
                            ? 'bg-amber-600 text-white'
                            : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  {isSaving ? 'Saving...' : editingItem ? 'Update Dish' : 'Add to Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden Device Upload Inputs */}
      <input
        ref={modalGalleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleModalImageSelect(file);
        }}
      />
      <input
        ref={modalCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleModalImageSelect(file);
        }}
      />
      <input
        ref={rowGalleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleRowImageSelect(file);
        }}
      />
      <input
        ref={rowCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleRowImageSelect(file);
        }}
      />

    </div>
  );
}
