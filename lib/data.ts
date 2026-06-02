export type ItemStatus = 'safe' | 'almost' | 'expired'

export interface InventoryItem {
  id: string
  name: string
  category: 'Dairy' | 'Produce' | 'Meat' | 'Pantry' | 'Frozen'
  quantity: number
  unit: string
  purchaseDate: string
  expirationDate: string
  daysLeft: number
  status: ItemStatus
  icon: string
}

export interface Recipe {
  id: string
  title: string
  description: string
  time: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  tag?: string
  tagType?: 'urgent' | 'ai'
  image: string
  ingredients: string[]
  matchPercent: number
  steps: string[]
}

export interface WastedItem {
  id: string
  name: string
  category: string
  reason: string
  estLoss: number
  icon: string
}

// ── Inventory ──────────────────────────────────────────────

export const inventoryItems: InventoryItem[] = [
  {
    id: '1', name: 'Organic Eggs', category: 'Dairy', quantity: 12, unit: 'ct',
    purchaseDate: '2026-05-20', expirationDate: '2026-06-11',
    daysLeft: 14, status: 'safe', icon: '🥚',
  },
  {
    id: '2', name: 'Mozzarella Cheese', category: 'Dairy', quantity: 1.5, unit: 'lbs',
    purchaseDate: '2026-05-25', expirationDate: '2026-05-31',
    daysLeft: 3, status: 'almost', icon: '🧀',
  },
  {
    id: '3', name: 'Fresh Spinach', category: 'Produce', quantity: 0.5, unit: 'lbs',
    purchaseDate: '2026-05-21', expirationDate: '2026-05-27',
    daysLeft: -1, status: 'expired', icon: '🥬',
  },
  {
    id: '4', name: 'Whole Milk', category: 'Dairy', quantity: 1, unit: 'L',
    purchaseDate: '2026-05-22', expirationDate: '2026-05-29',
    daysLeft: 1, status: 'almost', icon: '🥛',
  },
  {
    id: '5', name: 'Salmon Fillet', category: 'Meat', quantity: 300, unit: 'g',
    purchaseDate: '2026-05-27', expirationDate: '2026-05-29',
    daysLeft: 1, status: 'almost', icon: '🐟',
  },
  {
    id: '6', name: 'Farm Eggs', category: 'Dairy', quantity: 6, unit: 'ct',
    purchaseDate: '2026-05-25', expirationDate: '2026-05-28',
    daysLeft: 0, status: 'almost', icon: '🥚',
  },
  {
    id: '7', name: 'Avocados', category: 'Produce', quantity: 3, unit: 'pcs',
    purchaseDate: '2026-05-24', expirationDate: '2026-06-03',
    daysLeft: 6, status: 'safe', icon: '🥑',
  },
  {
    id: '8', name: 'Ground Beef', category: 'Meat', quantity: 500, unit: 'g',
    purchaseDate: '2026-05-10', expirationDate: '2026-05-15',
    daysLeft: -13, status: 'expired', icon: '🥩',
  },
  {
    id: '9', name: 'Sourdough Loaf', category: 'Pantry', quantity: 1, unit: 'pcs',
    purchaseDate: '2026-05-23', expirationDate: '2026-06-02',
    daysLeft: 5, status: 'safe', icon: '🍞',
  },
  {
    id: '10', name: 'Organic Carrots', category: 'Produce', quantity: 400, unit: 'g',
    purchaseDate: '2026-05-18', expirationDate: '2026-06-08',
    daysLeft: 11, status: 'safe', icon: '🥕',
  },
]

// ── Recipes ─────────────────────────────────────────────────

export const recipes: Recipe[] = [
  {
    id: '1',
    title: 'Rustic Avocado Smash',
    description: 'Creamy avocado on toasted sourdough topped with a perfectly poached egg.',
    time: '15 min',
    difficulty: 'Easy',
    tag: 'Use soon: Sourdough & Avocado',
    tagType: 'urgent',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80',
    ingredients: ['Sourdough Bread', 'Avocados', 'Organic Eggs', 'Lemon', 'Chili flakes'],
    matchPercent: 95,
    steps: [
      'Toast the sourdough slices until golden and crispy.',
      'Mash avocados with a fork, season with salt, pepper, and lemon juice.',
      'Poach eggs in simmering water for 3–4 minutes.',
      'Spread avocado on toast, top with egg, drizzle olive oil and chili flakes.',
    ],
  },
  {
    id: '2',
    title: 'Harvest Grain Bowl',
    description: 'Warm roasted vegetables over farro with a tahini drizzle.',
    time: '25 min',
    difficulty: 'Medium',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
    ingredients: ['Organic Carrots', 'Fresh Spinach', 'Avocados', 'Lemon'],
    matchPercent: 80,
    steps: [
      'Preheat oven to 200°C. Toss carrots with olive oil, roast 20 mins.',
      'Cook farro according to package directions.',
      'Assemble bowl: farro base, roasted carrots, fresh spinach, avocado slices.',
      'Drizzle with tahini and lemon juice.',
    ],
  },
  {
    id: '3',
    title: 'Crispy Veggie Stir-Fry',
    description: 'Quick high-heat stir-fry with seasonal vegetables over jasmine rice.',
    time: '20 min',
    difficulty: 'Easy',
    tag: 'AI Suggested',
    tagType: 'ai',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80',
    ingredients: ['Fresh Spinach', 'Organic Carrots', 'Organic Eggs', 'Mozzarella Cheese'],
    matchPercent: 75,
    steps: [
      'Heat a wok over high heat with sesame oil.',
      'Add carrots first, stir-fry 3 minutes.',
      'Add spinach and cook until just wilted, 1–2 minutes.',
      'Season with soy sauce and serve over steamed rice.',
    ],
  },
  {
    id: '4',
    title: 'Warm Spinach Grain Bowl',
    description: 'A hearty and healthy bowl utilizing your fresh greens before they wilt.',
    time: '20 min',
    difficulty: 'Easy',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
    ingredients: ['Fresh Spinach', 'Organic Eggs', 'Organic Carrots'],
    matchPercent: 88,
    steps: [
      'Sauté spinach in olive oil until wilted.',
      'Soft-boil eggs for 7 minutes, peel and halve.',
      'Assemble with roasted carrots, soft eggs, and a light vinaigrette.',
    ],
  },
  {
    id: '5',
    title: 'Dill Lemon Salmon',
    description: 'Quick pan-seared salmon that perfectly utilizes your fresh fillet tonight.',
    time: '15 min',
    difficulty: 'Medium',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80',
    ingredients: ['Salmon Fillet', 'Lemon', 'Dill', 'Butter'],
    matchPercent: 92,
    steps: [
      'Pat salmon dry and season with salt and pepper.',
      'Heat butter in a pan over medium-high heat.',
      'Sear salmon 3–4 minutes per side.',
      'Finish with a squeeze of lemon and fresh dill.',
    ],
  },
  {
    id: '6',
    title: 'Kitchen-Sink Frittata',
    description: 'The ultimate clean-out-the-fridge meal using eggs, milk, and leftover veggies.',
    time: '30 min',
    difficulty: 'Easy',
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80',
    ingredients: ['Organic Eggs', 'Whole Milk', 'Mozzarella Cheese', 'Fresh Spinach'],
    matchPercent: 98,
    steps: [
      'Preheat oven to 180°C. Whisk eggs with milk, salt, and pepper.',
      'Sauté spinach in an oven-safe skillet until wilted.',
      'Pour egg mixture over spinach, scatter cheese on top.',
      'Bake 18–20 minutes until set and golden.',
    ],
  },
]

// ── Wasted Items ─────────────────────────────────────────────

export const wastedItems: WastedItem[] = [
  { id: '1', name: 'Organic Spinach', category: 'Produce', reason: 'Spoiled / Wilted', estLoss: 4.50, icon: '🥬' },
  { id: '2', name: 'Whole Milk', category: 'Dairy', reason: 'Passed Expiration', estLoss: 3.20, icon: '🥛' },
  { id: '3', name: 'Sourdough Loaf', category: 'Pantry', reason: 'Mold', estLoss: 6.00, icon: '🍞' },
  { id: '4', name: 'Avocados (2)', category: 'Produce', reason: 'Overripe', estLoss: 5.00, icon: '🥑' },
  { id: '5', name: 'Ground Beef', category: 'Meat', reason: 'Freezer Burn', estLoss: 8.50, icon: '🥩' },
]

export const wasteCategoryData = [
  { name: 'Produce', value: 45, color: '#4f6d35' },
  { name: 'Dairy', value: 30, color: '#adc491' },
  { name: 'Meat', value: 15, color: '#f4a261' },
  { name: 'Pantry', value: 10, color: '#e9c46a' },
]
