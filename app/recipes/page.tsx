'use client'

import { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Search, Sparkles, X, Clock, ChefHat } from 'lucide-react'

const PP = "'Poppins', sans-serif"

interface Recipe {
  id: string
  title: string
  description: string
  time: string
  difficulty: string
  tag?: string
  tagType?: 'urgent' | 'ai'
  image: string
  ingredients: string[]
  matchPercent: number
  steps: string[]
}

const sampleRecipes: Recipe[] = [
  {
    id: '1', title: 'Rustic Avocado Smash', description: 'Creamy avocado on toasted sourdough topped with a perfectly poached egg.', time: '15 min', difficulty: 'Easy', tag: 'Use soon: Sourdough & Avocado', tagType: 'urgent',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80',
    ingredients: ['Sourdough Bread', 'Avocados', 'Eggs', 'Lemon', 'Chili flakes'], matchPercent: 95,
    steps: ['Toast sourdough until golden.', 'Mash avocado with salt, pepper, and lemon.', 'Poach eggs 3–4 minutes.', 'Spread avocado on toast, top with egg and chili flakes.'],
  },
  {
    id: '2', title: 'Harvest Grain Bowl', description: 'Warm roasted vegetables over farro with a tahini drizzle.', time: '25 min', difficulty: 'Medium',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
    ingredients: ['Carrots', 'Spinach', 'Avocados', 'Lemon'], matchPercent: 80,
    steps: ['Preheat oven to 200°C. Roast carrots 20 mins.', 'Cook farro per package.', 'Assemble bowl with farro, carrots, spinach, avocado.', 'Drizzle with tahini and lemon.'],
  },
  {
    id: '3', title: 'Crispy Veggie Stir-Fry', description: 'Quick high-heat stir-fry with seasonal vegetables over jasmine rice.', time: '20 min', difficulty: 'Easy', tag: 'AI Suggested', tagType: 'ai',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80',
    ingredients: ['Spinach', 'Carrots', 'Eggs'], matchPercent: 75,
    steps: ['Heat wok over high heat with sesame oil.', 'Stir-fry carrots 3 minutes.', 'Add spinach, cook 1–2 minutes.', 'Season with soy sauce, serve over rice.'],
  },
  {
    id: '4', title: 'Kitchen-Sink Frittata', description: 'The ultimate clean-out-the-fridge meal using eggs, milk, and veggies.', time: '30 min', difficulty: 'Easy',
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80',
    ingredients: ['Eggs', 'Milk', 'Cheese', 'Spinach'], matchPercent: 98,
    steps: ['Preheat oven to 180°C. Whisk eggs with milk.', 'Sauté spinach in oven-safe skillet.', 'Pour egg mix, scatter cheese.', 'Bake 18–20 minutes until golden.'],
  },
  {
    id: '5', title: 'Dill Lemon Salmon', description: 'Quick pan-seared salmon that perfectly utilizes your fresh fillet tonight.', time: '15 min', difficulty: 'Medium',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80',
    ingredients: ['Salmon', 'Lemon', 'Dill', 'Butter'], matchPercent: 92,
    steps: ['Pat salmon dry, season with salt.', 'Melt butter in pan over medium-high.', 'Sear 3–4 min per side.', 'Finish with lemon and fresh dill.'],
  },
  {
    id: '6', title: 'Warm Spinach Grain Bowl', description: 'Hearty and healthy bowl utilizing your fresh greens before they wilt.', time: '20 min', difficulty: 'Easy',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
    ingredients: ['Spinach', 'Eggs', 'Carrots'], matchPercent: 88,
    steps: ['Sauté spinach in olive oil.', 'Soft-boil eggs 7 minutes.', 'Assemble with roasted carrots and vinaigrette.'],
  },
]

type DietFilter = 'All' | 'Breakfast' | 'Dinner' | 'Vegetarian' | 'Under 30 mins'

export default function RecipesPage() {
  const [search, setSearch] = useState('')
  const [dietFilter, setDietFilter] = useState<DietFilter>('All')
  const [selected, setSelected] = useState<Recipe | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  const filtered = sampleRecipes.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.ingredients.some(i => i.toLowerCase().includes(search.toLowerCase()))
  )

  const handleGenerate = () => {
    setGenerating(true)
    setTimeout(() => { setGenerating(false); setGenerated(true) }, 1800)
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 animate-slide-up">
        <div>
          <h1 style={{ fontFamily: PP, fontSize: '1.75rem', fontWeight: 700, color: '#1a1a14', marginBottom: '4px' }}>Recipe Discovery</h1>
          <p style={{ fontFamily: PP, fontSize: '13px', color: '#8a8070' }}>Find culinary inspiration based on your fresh inventory.</p>
        </div>
        <button onClick={handleGenerate} disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-60"
          style={{ background: '#3d5429', fontFamily: PP, fontSize: '13px', fontWeight: 600 }}>
          <Sparkles size={15} />
          {generating ? 'Analyzing fridge…' : 'Generate Recipe AI'}
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-4 mb-8 animate-slide-up stagger-1">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9a9585' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ingredient or cuisine..."
            style={{ fontFamily: PP, fontSize: '13px', paddingLeft: '32px', paddingRight: '16px', paddingTop: '10px', paddingBottom: '10px', borderRadius: '12px', borderWidth: '1.5px', borderStyle: 'solid', borderColor: '#e0dbc8', background: 'white', outline: 'none', width: '280px' }} />
        </div>
        <div className="flex gap-2">
          {(['All','Breakfast','Dinner','Vegetarian','Under 30 mins'] as DietFilter[]).map(tab => (
            <button key={tab} onClick={() => setDietFilter(tab)}
              className="px-4 py-2 rounded-full transition-all"
              style={{ fontFamily: PP, fontSize: '13px', fontWeight: dietFilter === tab ? 600 : 400, background: dietFilter === tab ? '#3d5429' : 'white', color: dietFilter === tab ? 'white' : '#6b6356', borderWidth: '1.5px', borderStyle: 'solid', borderColor: dietFilter === tab ? '#3d5429' : '#e0dbc8' }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {generating && (
        <div className="rounded-2xl p-5 mb-6 flex items-center gap-4 animate-fade-in"
          style={{ background: '#f4f7f0', borderWidth: '1.5px', borderStyle: 'solid', borderColor: '#cddcba' }}>
          <div className="animate-spin text-2xl">⚙️</div>
          <div>
            <p style={{ fontFamily: PP, fontSize: '13px', fontWeight: 600, color: '#3d5429' }}>Scanning your fridge...</p>
            <p style={{ fontFamily: PP, fontSize: '12px', color: '#6b8f4a', marginTop: '2px' }}>Finding the best recipes for your almost-expiring items</p>
          </div>
        </div>
      )}

      {generated && !generating && (
        <div className="rounded-2xl p-4 mb-6 flex items-center justify-between animate-fade-in"
          style={{ background: '#e6eddc', borderWidth: '1.5px', borderStyle: 'solid', borderColor: '#adc491' }}>
          <div className="flex items-center gap-3">
            <span className="text-xl">✨</span>
            <p style={{ fontFamily: PP, fontSize: '13px', fontWeight: 500, color: '#3d5429' }}>
              Recipes generated based on your expiring items — best matches shown first!
            </p>
          </div>
          <button onClick={() => setGenerated(false)}><X size={16} style={{ color: '#6b8f4a' }} /></button>
        </div>
      )}

      {/* Recipe Grid */}
      <div className="grid grid-cols-3 gap-5">
        {filtered.map((recipe, i) => (
          <div key={recipe.id} onClick={() => setSelected(recipe)}
            className={`bg-white rounded-2xl overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all animate-slide-up stagger-${Math.min(i+1,6)}`}
            style={{ border: '1px solid #e0dbc8' }}>
            <div className="relative h-44 bg-gray-100 overflow-hidden">
              <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
              {recipe.tag && (
                <span className="absolute top-2 left-2 text-xs px-2.5 py-1 rounded-lg"
                  style={{ fontFamily: PP, fontWeight: 600, background: recipe.tagType === 'urgent' ? 'rgba(254,226,226,0.95)' : 'rgba(230,237,220,0.95)', color: recipe.tagType === 'urgent' ? '#dc2626' : '#3d5429' }}>
                  {recipe.tagType === 'urgent' ? '⚠️' : '✨'} {recipe.tag}
                </span>
              )}
              <div className="absolute bottom-2 right-2 text-xs px-2 py-1 rounded-lg"
                style={{ fontFamily: PP, fontWeight: 600, background: 'rgba(255,255,255,0.9)', color: '#3d5429' }}>
                {recipe.matchPercent}% match
              </div>
            </div>
            <div className="p-4">
              <h3 style={{ fontFamily: PP, fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{recipe.title}</h3>
              <p className="mb-3 line-clamp-2" style={{ fontFamily: PP, fontSize: '12px', color: '#8a8070', lineHeight: 1.5 }}>{recipe.description}</p>
              <div className="flex items-center gap-3" style={{ color: '#9a9585' }}>
                <span className="flex items-center gap-1" style={{ fontFamily: PP, fontSize: '12px' }}><Clock size={11} /> {recipe.time}</span>
                <span className="flex items-center gap-1" style={{ fontFamily: PP, fontSize: '12px' }}><ChefHat size={11} /> {recipe.difficulty}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up"
            style={{ border: '1px solid #e0dbc8' }} onClick={e => e.stopPropagation()}>
            <div className="relative h-56 bg-gray-100 overflow-hidden rounded-t-2xl">
              <img src={selected.image} alt={selected.title} className="w-full h-full object-cover" />
              <button onClick={() => setSelected(null)} className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white">
                <X size={16} />
              </button>
              <div className="absolute bottom-3 left-4 text-xl font-bold text-white"
                style={{ fontFamily: PP, fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                {selected.title}
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-5">
                <span className="text-sm px-3 py-1 rounded-full"
                  style={{ fontFamily: PP, fontWeight: 600, background: '#e6eddc', color: '#3d5429' }}>
                  {selected.matchPercent}% ingredient match
                </span>
                <span className="flex items-center gap-1 text-sm" style={{ fontFamily: PP, color: '#8a8070' }}><Clock size={13} /> {selected.time}</span>
                <span className="flex items-center gap-1 text-sm" style={{ fontFamily: PP, color: '#8a8070' }}><ChefHat size={13} /> {selected.difficulty}</span>
              </div>
              <p className="mb-5" style={{ fontFamily: PP, fontSize: '13px', color: '#6b6356', lineHeight: 1.6 }}>{selected.description}</p>
              <div className="mb-5">
                <h4 style={{ fontFamily: PP, fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Ingredients</h4>
                <div className="flex flex-wrap gap-2">
                  {selected.ingredients.map(ing => (
                    <span key={ing} className="px-3 py-1.5 rounded-full"
                      style={{ fontFamily: PP, fontSize: '12px', fontWeight: 500, background: 'var(--color-cream)', borderWidth: '1px', borderStyle: 'solid', borderColor: '#e0dbc8', color: '#6b6356' }}>
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 style={{ fontFamily: PP, fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Instructions</h4>
                <ol className="space-y-3">
                  {selected.steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: '#3d5429', fontFamily: PP }}>
                        {i + 1}
                      </span>
                      <p style={{ fontFamily: PP, fontSize: '13px', color: '#4a4030', lineHeight: 1.6 }}>{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
