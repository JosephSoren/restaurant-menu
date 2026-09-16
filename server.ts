import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { MenuItem, Order, OrderStatus, RestaurantInfo, RealtimeEvent } from "./src/types";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Lazy initialize Gemini client safely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// In-Memory Database State
let restaurantInfo: RestaurantInfo = {
  name: "Nilkamal Hotel",
  tagline: "Authentic Multi-Cuisine & Family Restaurant",
  currency: "₹",
  taxRate: 0.05, // 5% GST
  tables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
};

let menuItems: MenuItem[] = [
  {
    id: "item-1",
    name: "Truffle Arancini",
    category: "Starters",
    price: 240,
    description: "Crispy wild mushroom risotto spheres infused with black truffle oil, served with garlic parmesan aioli.",
    imageUrl: "https://images.unsplash.com/photo-1541529086526-db283c563270?w=600&auto=format&fit=crop&q=80",
    dietary: ["Vegetarian"],
    isAvailable: true,
    prepTimeMinutes: 10
  },
  {
    id: "item-2",
    name: "Burrata Caprese Rustica",
    category: "Starters",
    price: 320,
    description: "Creamy artisanal burrata with heirloom tomatoes, fresh basil pesto, aged Modena balsamic glaze, and toasted sourdough.",
    imageUrl: "https://images.unsplash.com/photo-1592417817098-8f3d69109853?w=600&auto=format&fit=crop&q=80",
    dietary: ["Vegetarian", "Nut-Free"],
    isAvailable: true,
    prepTimeMinutes: 8
  },
  {
    id: "item-3",
    name: "Wood-Fired Margherita D.O.P.",
    category: "Pizzas",
    price: 380,
    description: "San Marzano tomato coulis, fior di latte mozzarella, fresh torn sweet basil, and extra virgin olive oil.",
    imageUrl: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600&auto=format&fit=crop&q=80",
    dietary: ["Vegetarian"],
    isAvailable: true,
    prepTimeMinutes: 14
  },
  {
    id: "item-4",
    name: "Diavola & Hot Honey Pizza",
    category: "Pizzas",
    price: 450,
    description: "Spicy Calabrian soppressata, chili oil drizzle, roasted garlic, smoked provolone, and wildflower hot honey infusion.",
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80",
    dietary: ["Spicy"],
    isAvailable: true,
    prepTimeMinutes: 15
  },
  {
    id: "item-5",
    name: "Handmade Pappardelle Bolognese",
    category: "Pastas",
    price: 420,
    description: "Slow-simmered prime beef and pork ragù, rosemary reduction, and 24-month aged Parmigiano-Reggiano.",
    imageUrl: "https://images.unsplash.com/photo-1621996346565-e3d5d6281057?w=600&auto=format&fit=crop&q=80",
    dietary: ["Nut-Free"],
    isAvailable: true,
    prepTimeMinutes: 16
  },
  {
    id: "item-6",
    name: "Pan-Seared Chilean Sea Bass",
    category: "Mains",
    price: 680,
    description: "Crispy skin sea bass resting on saffron pea puree, roasted asparagus spears, and citrus caper emulsion.",
    imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80",
    dietary: ["Gluten-Free"],
    isAvailable: true,
    prepTimeMinutes: 20
  },
  {
    id: "item-7",
    name: "Grilled Prime Ribeye (12oz)",
    category: "Mains",
    price: 850,
    description: "Center-cut prime beef with rosemary-garlic butter, roasted baby fingerling potatoes, and charred broccolini.",
    imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
    dietary: ["Gluten-Free"],
    isAvailable: true,
    prepTimeMinutes: 22
  },
  {
    id: "item-8",
    name: "Artisan Tiramisu Tradizionale",
    category: "Desserts",
    price: 220,
    description: "Espresso-soaked savoiardi biscuits, layered with silky mascarpone zabaglione and dusted with Valrhona cocoa.",
    imageUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&auto=format&fit=crop&q=80",
    dietary: ["Vegetarian"],
    isAvailable: true,
    prepTimeMinutes: 5
  },
  {
    id: "item-9",
    name: "Sicilian Lemon Spritz",
    category: "Beverages",
    price: 150,
    description: "Freshly squeezed Meyer lemons, crushed mint sprigs, sparkling Italian soda, and elderflower mist.",
    imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80",
    dietary: ["Vegan", "Gluten-Free"],
    isAvailable: true,
    prepTimeMinutes: 4
  },
  {
    id: "item-10",
    name: "Cold Brew Affogato",
    category: "Beverages",
    price: 180,
    description: "Double shot of single-origin espresso poured over Madagascar vanilla bean gelato with hazelnut crunch.",
    imageUrl: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=600&auto=format&fit=crop&q=80",
    dietary: ["Vegetarian"],
    isAvailable: true,
    prepTimeMinutes: 4
  }
];

let nextOrderSeq = 101;

let orders: Order[] = [
  {
    id: "ord-sample-0",
    orderNumber: 100,
    tableNumber: "1",
    items: [
      { menuItemId: "item-1", name: "Truffle Arancini", price: 240, quantity: 1, notes: "Extra aioli on the side please" },
      { menuItemId: "item-3", name: "Wood-Fired Margherita D.O.P.", price: 380, quantity: 1 },
      { menuItemId: "item-9", name: "Sicilian Lemon Spritz", price: 150, quantity: 2 }
    ],
    status: "completed",
    createdAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    subtotal: 920.00,
    tax: 46.00,
    totalAmount: 966.00,
    customerNotes: "Please bring napkins and extra glasses",
    statusHistory: [
      { status: "received", timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(), note: "Order placed by customer at table 1" },
      { status: "preparing", timestamp: new Date(Date.now() - 48 * 60 * 1000).toISOString(), note: "Kitchen started preparing" },
      { status: "ready", timestamp: new Date(Date.now() - 36 * 60 * 1000).toISOString(), note: "Food plated and ready" },
      { status: "served", timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(), note: "Served at Table 1" },
      { status: "completed", timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(), note: "Bill settled & order closed" }
    ]
  },
  {
    id: "ord-sample-1",
    orderNumber: 101,
    tableNumber: "4",
    items: [
      { menuItemId: "item-1", name: "Truffle Arancini", price: 240, quantity: 1, notes: "Extra aioli on the side please" },
      { menuItemId: "item-3", name: "Wood-Fired Margherita D.O.P.", price: 380, quantity: 1 },
      { menuItemId: "item-9", name: "Sicilian Lemon Spritz", price: 150, quantity: 2 }
    ],
    status: "preparing",
    createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    subtotal: 920.00,
    tax: 46.00,
    totalAmount: 966.00,
    customerNotes: "Please bring drinks first!",
    statusHistory: [
      { status: "received", timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString() },
      { status: "preparing", timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString() }
    ]
  },
  {
    id: "ord-sample-2",
    orderNumber: 102,
    tableNumber: "7",
    items: [
      { menuItemId: "item-7", name: "Grilled Prime Ribeye (12oz)", price: 850, quantity: 1, notes: "Medium rare" },
      { menuItemId: "item-2", name: "Burrata Caprese Rustica", price: 320, quantity: 1 }
    ],
    status: "received",
    createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    subtotal: 1170.00,
    tax: 58.50,
    totalAmount: 1228.50,
    statusHistory: [
      { status: "received", timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString() }
    ]
  }
];

// Server-Sent Events (SSE) Client Connections
const sseClients: Set<Response> = new Set();

function broadcastEvent(event: RealtimeEvent) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(data);
    } catch {
      sseClients.delete(client);
    }
  }
}

// -------------------------------------------------------------
// Realtime SSE Endpoint
// -------------------------------------------------------------
app.get("/api/events", (req: Request, res: Response) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive"
  });

  res.write(`data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`);
  sseClients.add(res);

  // Heartbeat ping every 25 seconds
  const pingInterval = setInterval(() => {
    try {
      res.write(": ping\n\n");
    } catch {
      clearInterval(pingInterval);
      sseClients.delete(res);
    }
  }, 25000);

  req.on("close", () => {
    clearInterval(pingInterval);
    sseClients.delete(res);
  });
});

// -------------------------------------------------------------
// Restaurant Info APIs
// -------------------------------------------------------------
app.get("/api/restaurant", (req: Request, res: Response) => {
  const activeOrdersCount = orders.filter(o => o.status !== "completed" && o.status !== "cancelled").length;
  const preparingCount = orders.filter(o => o.status === "preparing").length;
  const readyCount = orders.filter(o => o.status === "ready").length;
  const totalOrdersCount = orders.length;
  const completedOrdersCount = orders.filter(o => o.status === "completed").length;
  const todayRevenue = orders
    .filter(o => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  res.json({
    info: restaurantInfo,
    stats: {
      totalOrdersCount,
      completedOrdersCount,
      activeOrdersCount,
      preparingCount,
      readyCount,
      todayRevenue: Number(todayRevenue.toFixed(2)),
      totalMenuCount: menuItems.length
    }
  });
});

app.put("/api/restaurant", (req: Request, res: Response) => {
  const { name, tagline, currency, taxRate, tables } = req.body;
  if (name) restaurantInfo.name = String(name);
  if (tagline) restaurantInfo.tagline = String(tagline);
  if (currency) restaurantInfo.currency = String(currency);
  if (typeof taxRate === "number") restaurantInfo.taxRate = taxRate;
  if (Array.isArray(tables)) restaurantInfo.tables = tables.map(Number).filter(n => !isNaN(n));
  res.json({ success: true, info: restaurantInfo });
});

// -------------------------------------------------------------
// Menu Management APIs
// -------------------------------------------------------------
app.get("/api/menu", (req: Request, res: Response) => {
  res.json(menuItems);
});

app.post("/api/menu", (req: Request, res: Response) => {
  const { name, category, price, description, imageUrl, dietary, isAvailable, prepTimeMinutes } = req.body;
  if (!name || !category || typeof price !== "number") {
    res.status(400).json({ error: "Missing required fields: name, category, price" });
    return;
  }

  const newItem: MenuItem = {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: String(name).trim(),
    category: String(category).trim(),
    price: Math.max(0, Number(price)),
    description: String(description || "").trim(),
    imageUrl: imageUrl ? String(imageUrl).trim() : undefined,
    dietary: Array.isArray(dietary) ? dietary : [],
    isAvailable: isAvailable !== false,
    prepTimeMinutes: typeof prepTimeMinutes === "number" ? prepTimeMinutes : 15
  };

  menuItems.push(newItem);
  broadcastEvent({ type: "menu:updated", menu: menuItems });
  res.status(201).json(newItem);
});

app.put("/api/menu/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const index = menuItems.findIndex(i => i.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Menu item not found" });
    return;
  }

  const current = menuItems[index];
  const { name, category, price, description, imageUrl, dietary, isAvailable, prepTimeMinutes } = req.body;

  menuItems[index] = {
    ...current,
    name: name !== undefined ? String(name).trim() : current.name,
    category: category !== undefined ? String(category).trim() : current.category,
    price: price !== undefined ? Math.max(0, Number(price)) : current.price,
    description: description !== undefined ? String(description).trim() : current.description,
    imageUrl: imageUrl !== undefined ? (imageUrl ? String(imageUrl).trim() : undefined) : current.imageUrl,
    dietary: Array.isArray(dietary) ? dietary : current.dietary,
    isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : current.isAvailable,
    prepTimeMinutes: typeof prepTimeMinutes === "number" ? prepTimeMinutes : current.prepTimeMinutes
  };

  broadcastEvent({ type: "menu:updated", menu: menuItems });
  res.json(menuItems[index]);
});

app.patch("/api/menu/:id/toggle", (req: Request, res: Response) => {
  const { id } = req.params;
  const item = menuItems.find(i => i.id === id);
  if (!item) {
    res.status(404).json({ error: "Menu item not found" });
    return;
  }

  item.isAvailable = !item.isAvailable;
  broadcastEvent({ type: "menu:updated", menu: menuItems });
  res.json(item);
});

app.delete("/api/menu/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const index = menuItems.findIndex(i => i.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Menu item not found" });
    return;
  }

  menuItems.splice(index, 1);
  broadcastEvent({ type: "menu:updated", menu: menuItems });
  res.json({ success: true, id });
});

// Reset to demo menu
app.post("/api/menu/reset-sample", (req: Request, res: Response) => {
  menuItems = [
    {
      id: "item-1",
      name: "Truffle Arancini",
      category: "Starters",
      price: 240,
      description: "Crispy wild mushroom risotto spheres infused with black truffle oil, served with garlic parmesan aioli.",
      imageUrl: "https://images.unsplash.com/photo-1541529086526-db283c563270?w=600&auto=format&fit=crop&q=80",
      dietary: ["Vegetarian"],
      isAvailable: true,
      prepTimeMinutes: 10
    },
    {
      id: "item-2",
      name: "Burrata Caprese Rustica",
      category: "Starters",
      price: 320,
      description: "Creamy artisanal burrata with heirloom tomatoes, fresh basil pesto, aged Modena balsamic glaze, and toasted sourdough.",
      imageUrl: "https://images.unsplash.com/photo-1592417817098-8f3d69109853?w=600&auto=format&fit=crop&q=80",
      dietary: ["Vegetarian", "Nut-Free"],
      isAvailable: true,
      prepTimeMinutes: 8
    },
    {
      id: "item-3",
      name: "Wood-Fired Margherita D.O.P.",
      category: "Pizzas",
      price: 380,
      description: "San Marzano tomato coulis, fior di latte mozzarella, fresh torn sweet basil, and extra virgin olive oil.",
      imageUrl: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600&auto=format&fit=crop&q=80",
      dietary: ["Vegetarian"],
      isAvailable: true,
      prepTimeMinutes: 14
    },
    {
      id: "item-4",
      name: "Diavola & Hot Honey Pizza",
      category: "Pizzas",
      price: 450,
      description: "Spicy Calabrian soppressata, chili oil drizzle, roasted garlic, smoked provolone, and wildflower hot honey infusion.",
      imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80",
      dietary: ["Spicy"],
      isAvailable: true,
      prepTimeMinutes: 15
    },
    {
      id: "item-5",
      name: "Handmade Pappardelle Bolognese",
      category: "Pastas",
      price: 420,
      description: "Slow-simmered prime beef and pork ragù, rosemary reduction, and 24-month aged Parmigiano-Reggiano.",
      imageUrl: "https://images.unsplash.com/photo-1621996346565-e3d5d6281057?w=600&auto=format&fit=crop&q=80",
      dietary: ["Nut-Free"],
      isAvailable: true,
      prepTimeMinutes: 16
    },
    {
      id: "item-6",
      name: "Pan-Seared Chilean Sea Bass",
      category: "Mains",
      price: 680,
      description: "Crispy skin sea bass resting on saffron pea puree, roasted asparagus spears, and citrus caper emulsion.",
      imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80",
      dietary: ["Gluten-Free"],
      isAvailable: true,
      prepTimeMinutes: 20
    },
    {
      id: "item-7",
      name: "Grilled Prime Ribeye (12oz)",
      category: "Mains",
      price: 850,
      description: "Center-cut prime beef with rosemary-garlic butter, roasted baby fingerling potatoes, and charred broccolini.",
      imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
      dietary: ["Gluten-Free"],
      isAvailable: true,
      prepTimeMinutes: 22
    },
    {
      id: "item-8",
      name: "Artisan Tiramisu Tradizionale",
      category: "Desserts",
      price: 220,
      description: "Espresso-soaked savoiardi biscuits, layered with silky mascarpone zabaglione and dusted with Valrhona cocoa.",
      imageUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&auto=format&fit=crop&q=80",
      dietary: ["Vegetarian"],
      isAvailable: true,
      prepTimeMinutes: 5
    },
    {
      id: "item-9",
      name: "Sicilian Lemon Spritz",
      category: "Beverages",
      price: 150,
      description: "Freshly squeezed Meyer lemons, crushed mint sprigs, sparkling Italian soda, and elderflower mist.",
      imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80",
      dietary: ["Vegan", "Gluten-Free"],
      isAvailable: true,
      prepTimeMinutes: 4
    },
    {
      id: "item-10",
      name: "Cold Brew Affogato",
      category: "Beverages",
      price: 180,
      description: "Double shot of single-origin espresso poured over Madagascar vanilla bean gelato with hazelnut crunch.",
      imageUrl: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=600&auto=format&fit=crop&q=80",
      dietary: ["Vegetarian"],
      isAvailable: true,
      prepTimeMinutes: 4
    }
  ];
  broadcastEvent({ type: "menu:updated", menu: menuItems });
  res.json({ success: true, menu: menuItems });
});

// Smart Menu Upload & Parsing (JSON, CSV, Plain Text, or AI via Gemini)
app.post("/api/menu/upload", async (req: Request, res: Response) => {
  try {
    const { items, rawContent, mode = "append", useAi = false } = req.body;
    let parsedItems: MenuItem[] = [];

    // Case 1: Direct structured items array provided
    if (Array.isArray(items) && items.length > 0) {
      parsedItems = items.map((raw: any, index: number) => ({
        id: `item-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
        name: String(raw.name || "Untitled Dish").trim(),
        category: String(raw.category || "Main Menu").trim(),
        price: Number(raw.price) > 0 ? Number(raw.price) : 10.0,
        description: String(raw.description || "").trim(),
        imageUrl: raw.imageUrl ? String(raw.imageUrl).trim() : undefined,
        dietary: Array.isArray(raw.dietary) ? raw.dietary : [],
        isAvailable: raw.isAvailable !== false,
        prepTimeMinutes: typeof raw.prepTimeMinutes === "number" ? raw.prepTimeMinutes : 15
      }));
    } 
    // Case 2: Raw text or string provided (can be parsed with Gemini AI or regex)
    else if (typeof rawContent === "string" && rawContent.trim()) {
      const text = rawContent.trim();
      let aiExtracted = false;

      // Try Gemini AI extraction if requested or if text is messy
      if (useAi) {
        const gemini = getGeminiClient();
        if (gemini) {
          try {
            const prompt = `You are a culinary data extraction specialist. Convert the following restaurant menu content into a JSON array of dish objects.
Return ONLY valid JSON matching this schema:
[
  {
    "name": "Dish Name",
    "category": "Starters" | "Mains" | "Pizzas" | "Pastas" | "Desserts" | "Beverages" | "Sides",
    "price": 12.50,
    "description": "Brief description",
    "dietary": ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Spicy", "Nut-Free"],
    "prepTimeMinutes": 15
  }
]

Menu Content:
${text}`;

            const aiResponse = await gemini.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt,
              config: {
                responseMimeType: "application/json"
              }
            });

            if (aiResponse.text) {
              const aiParsed = JSON.parse(aiResponse.text);
              if (Array.isArray(aiParsed) && aiParsed.length > 0) {
                parsedItems = aiParsed.map((raw: any, index: number) => ({
                  id: `item-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
                  name: String(raw.name || "Special").trim(),
                  category: String(raw.category || "Chef Specials").trim(),
                  price: Math.max(0.5, Number(raw.price) || 12.0),
                  description: String(raw.description || "").trim(),
                  imageUrl: undefined,
                  dietary: Array.isArray(raw.dietary) ? raw.dietary : [],
                  isAvailable: true,
                  prepTimeMinutes: Number(raw.prepTimeMinutes) || 15
                }));
                aiExtracted = true;
              }
            }
          } catch (e) {
            console.warn("AI extraction fallback to native regex:", e);
          }
        }
      }

      // If AI was not used or did not produce results, use smart deterministic parser
      if (!aiExtracted) {
        // Try JSON parse first
        try {
          const jsonParsed = JSON.parse(text);
          if (Array.isArray(jsonParsed)) {
            parsedItems = jsonParsed.map((raw: any, index: number) => ({
              id: `item-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
              name: String(raw.name || raw.title || "Item").trim(),
              category: String(raw.category || "Menu").trim(),
              price: Math.max(0.5, Number(raw.price) || 10.0),
              description: String(raw.description || "").trim(),
              imageUrl: raw.imageUrl ? String(raw.imageUrl).trim() : undefined,
              dietary: Array.isArray(raw.dietary) ? raw.dietary : [],
              isAvailable: true,
              prepTimeMinutes: 15
            }));
          }
        } catch {
          // CSV / Line-by-line fallback
          const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
          let currentCategory = "Chef's Specials";

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Category header detection (e.g., [Mains], # Desserts, CATEGORY: Drinks)
            if (line.startsWith("[") && line.endsWith("]")) {
              currentCategory = line.slice(1, -1).trim();
              continue;
            }
            if (line.startsWith("#")) {
              currentCategory = line.replace(/^#+\s*/, "").trim();
              continue;
            }
            if (line.toUpperCase().startsWith("CATEGORY:")) {
              currentCategory = line.replace(/^CATEGORY:\s*/i, "").trim();
              continue;
            }

            // CSV detection: Name, Category, Price, Description
            if (line.includes(",") || line.includes("\t")) {
              const delimiter = line.includes("\t") ? "\t" : ",";
              const cols = line.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ""));
              if (cols.length >= 2) {
                const name = cols[0];
                if (name.toLowerCase() === "name" || name.toLowerCase() === "item") continue; // Header row
                let price = 10.0;
                let category = currentCategory;
                let desc = "";

                // Check where price is located (accepts ₹, Rs, INR, $)
                const priceMatch = line.match(/(?:₹|\$|Rs\.?|INR\s*)?(\d+(\.\d{1,2})?)/i);
                if (priceMatch && priceMatch[1]) price = parseFloat(priceMatch[1]);

                if (cols.length >= 3 && isNaN(Number(cols[1]))) {
                  category = cols[1] || currentCategory;
                  desc = cols[3] || cols[2] || "";
                } else if (cols.length >= 3) {
                  desc = cols[2];
                }

                parsedItems.push({
                  id: `item-${Date.now()}-${i}`,
                  name: name || "Dish",
                  category: category || currentCategory,
                  price: price > 0 ? price : 150,
                  description: desc,
                  isAvailable: true,
                  dietary: [],
                  prepTimeMinutes: 15
                });
                continue;
              }
            }

            // Formatted line: "Butter Chicken - ₹320 - description" or "Dal Makhani 180"
            const itemMatch = line.match(/^([^-$0-9₹]+)[-\s:]+(?:₹|\$|Rs\.?|INR\s*)?(\d+(\.\d{1,2})?)(.*)$/i);
            if (itemMatch) {
              const name = itemMatch[1].trim();
              const price = parseFloat(itemMatch[2]);
              const remainder = (itemMatch[4] || "").replace(/^[-:\s]+/, "").trim();

              parsedItems.push({
                id: `item-${Date.now()}-${i}`,
                name: name,
                category: currentCategory,
                price: price > 0 ? price : 150,
                description: remainder,
                isAvailable: true,
                dietary: [],
                prepTimeMinutes: 15
              });
            } else if (line.length > 2) {
              // Just dish name, assign default price
              parsedItems.push({
                id: `item-${Date.now()}-${i}`,
                name: line,
                category: currentCategory,
                price: 12.00,
                description: "",
                isAvailable: true,
                dietary: [],
                prepTimeMinutes: 15
              });
            }
          }
        }
      }
    }

    if (parsedItems.length === 0) {
      res.status(400).json({ error: "No valid menu items could be detected. Please check format." });
      return;
    }

    if (mode === "replace") {
      menuItems = parsedItems;
    } else {
      menuItems = [...menuItems, ...parsedItems];
    }

    broadcastEvent({ type: "menu:updated", menu: menuItems });
    res.json({
      success: true,
      addedCount: parsedItems.length,
      totalCount: menuItems.length,
      items: parsedItems
    });
  } catch (err: any) {
    console.error("Menu upload error:", err);
    res.status(500).json({ error: err.message || "Failed to process menu upload" });
  }
});

// -------------------------------------------------------------
// Orders APIs (Customer + Owner)
// -------------------------------------------------------------
app.get("/api/orders", (req: Request, res: Response) => {
  const { table, status } = req.query;
  let filtered = [...orders];

  if (table) {
    filtered = filtered.filter(o => String(o.tableNumber) === String(table));
  }

  if (status) {
    const statuses = String(status).split(",").map(s => s.trim());
    filtered = filtered.filter(o => statuses.includes(o.status));
  }

  res.json(filtered);
});

app.get("/api/orders/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const order = orders.find(o => o.id === id);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(order);
});

// Customer places a new order
app.post("/api/orders", (req: Request, res: Response) => {
  const { tableNumber, items, customerNotes } = req.body;

  if (!tableNumber || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: "tableNumber and at least one order item are required" });
    return;
  }

  // Calculate totals
  let subtotal = 0;
  const sanitizedItems = items.map((it: any) => {
    const menuItem = menuItems.find(m => m.id === it.menuItemId);
    const price = menuItem ? menuItem.price : Number(it.price || 0);
    const quantity = Math.max(1, Number(it.quantity || 1));
    subtotal += price * quantity;

    return {
      menuItemId: String(it.menuItemId || ""),
      name: menuItem ? menuItem.name : String(it.name || "Item"),
      price: price,
      quantity: quantity,
      notes: it.notes ? String(it.notes).trim() : undefined
    };
  });

  const tax = Number((subtotal * restaurantInfo.taxRate).toFixed(2));
  const totalAmount = Number((subtotal + tax).toFixed(2));
  const now = new Date().toISOString();

  nextOrderSeq += 1;
  const newOrder: Order = {
    id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    orderNumber: nextOrderSeq,
    tableNumber: String(tableNumber).trim(),
    items: sanitizedItems,
    status: "received",
    createdAt: now,
    updatedAt: now,
    subtotal: Number(subtotal.toFixed(2)),
    tax,
    totalAmount,
    customerNotes: customerNotes ? String(customerNotes).trim() : undefined,
    statusHistory: [
      { status: "received", timestamp: now, note: "Order placed by customer at table " + tableNumber }
    ]
  };

  orders.unshift(newOrder); // Newest first
  broadcastEvent({ type: "order:created", order: newOrder });

  res.status(201).json(newOrder);
});

// Update order status (Owner / Kitchen)
app.patch("/api/orders/:id/status", (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, note } = req.body;

  const validStatuses: OrderStatus[] = ["received", "preparing", "ready", "served", "completed", "cancelled"];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: "Invalid status value" });
    return;
  }

  const order = orders.find(o => o.id === id);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const now = new Date().toISOString();
  order.status = status as OrderStatus;
  order.updatedAt = now;
  order.statusHistory.push({
    status: status as OrderStatus,
    timestamp: now,
    note: note ? String(note).trim() : undefined
  });

  broadcastEvent({ type: "order:updated", order });
  res.json(order);
});

// -------------------------------------------------------------
// Vite Middleware / Static Asset Serving
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Restaurant Table Ordering Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
