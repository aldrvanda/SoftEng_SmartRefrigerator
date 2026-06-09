'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Search, X, Clock, ChefHat, Plus, Trash2, BookOpen } from 'lucide-react'

const PP = "'Poppins', sans-serif"

interface Recipe {
  _id?: string
  id?: string
  title: string
  description: string
  time: string
  difficulty: string
  tag?: string
  category?: string
  image?: string
  ingredients: string[]
  steps: string[]
  source?: string
}

type DietFilter = 'All' | 'Breakfast' | 'Lunch' | 'Dinner' | 'Vegetarian' | 'Under 30 mins'
const RECIPE_CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Vegetarian', 'Snack'] as const
const FALLBACK = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80'

// Format cook time — ensure "min" suffix
function formatTime(raw: string): string {
  if (!raw) return '30 min'
  const trimmed = raw.trim()
  // Already has a unit
  if (/[a-zA-Z]/.test(trimmed)) return trimmed
  // Pure number → append min
  return `${trimmed} min`
}

const CURATED: Recipe[] = [
  { id: 'c1', title: 'Nasi Goreng Spesial', description: 'Nasi goreng khas Indonesia dengan telur, kecap manis, dan topping kerupuk renyah.', time: '20 min', difficulty: 'Easy', tag: 'Lunch', category: 'Lunch', image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80', ingredients: ['Nasi putih', 'Telur', 'Kecap manis', 'Bawang merah', 'Bawang putih', 'Cabai', 'Kerupuk'], steps: ['Tumis bawang merah, bawang putih, dan cabai hingga harum.', 'Masukkan nasi, tambahkan kecap manis dan garam.', 'Aduk rata di atas api besar.', 'Dadar telur di sisi wajan, campur dengan nasi.', 'Sajikan dengan kerupuk.'], source: 'curated' },
  { id: 'c2', title: 'Ayam Geprek Crispy', description: 'Ayam goreng crispy yang digeprek dengan sambal pedas — favorit semua orang.', time: '35 min', difficulty: 'Medium', tag: 'Dinner', category: 'Dinner', image: 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=400&q=80', ingredients: ['Ayam potong', 'Tepung terigu', 'Telur', 'Bawang putih', 'Cabai rawit', 'Garam'], steps: ['Marinasi ayam dengan garam dan bawang putih 20 menit.', 'Celupkan ke telur, gulingkan di tepung.', 'Goreng hingga keemasan.', 'Geprek dan siram sambal cabai.'], source: 'curated' },
  { id: 'c3', title: 'Soto Ayam Bening', description: 'Sup ayam bening dengan kuah kunyit segar, disajikan dengan lontong atau nasi.', time: '45 min', difficulty: 'Medium', tag: 'Lunch', category: 'Lunch', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80', ingredients: ['Ayam', 'Kunyit', 'Jahe', 'Serai', 'Daun salam', 'Tauge', 'Telur rebus'], steps: ['Rebus ayam dengan bumbu rempah hingga matang.', 'Suwir ayam, buang tulang.', 'Masak kembali kaldu dengan kunyit.', 'Sajikan dengan tauge dan telur.'], source: 'curated' },
  { id: 'c4', title: 'Tempe Orek Kering', description: 'Tempe goreng renyah dengan saus kecap manis — lauk sederhana yang nikmat dengan nasi.', time: '20 min', difficulty: 'Easy', tag: 'Vegetarian', category: 'Vegetarian', image: 'https://images.unsplash.com/photo-1625944526165-a3e8dda2a9ed?w=400&q=80', ingredients: ['Tempe', 'Kecap manis', 'Bawang merah', 'Bawang putih', 'Cabai merah', 'Gula merah'], steps: ['Potong tempe tipis, goreng hingga crispy.', 'Tumis bawang, cabai hingga layu.', 'Masukkan tempe, kecap manis, dan gula merah.', 'Aduk rata hingga kering.'], source: 'curated' },
  { id: 'c5', title: 'Mie Goreng Jawa', description: 'Mie goreng gaya Jawa dengan bumbu khas petis dan taburan bawang goreng.', time: '20 min', difficulty: 'Easy', tag: 'Dinner', category: 'Dinner', image: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=80', ingredients: ['Mie telur', 'Telur', 'Kol', 'Tauge', 'Kecap manis', 'Petis', 'Bawang merah', 'Bawang putih'], steps: ['Rebus mie hingga matang, tiriskan.', 'Tumis bumbu hingga harum, masukkan telur orak-arik.', 'Masukkan mie dan sayuran.', 'Sajikan dengan bawang goreng.'], source: 'curated' },
  { id: 'c6', title: 'Gado-Gado Jakarta', description: 'Salad sayuran rebus dengan saus kacang kental — makanan sehat khas Betawi.', time: '30 min', difficulty: 'Easy', tag: 'Vegetarian', category: 'Vegetarian', image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80', ingredients: ['Kangkung', 'Tauge', 'Kentang rebus', 'Telur rebus', 'Tahu', 'Kacang tanah'], steps: ['Rebus sayuran masing-masing hingga matang.', 'Goreng kacang tanah, haluskan dengan bumbu.', 'Tata sayuran, siram saus kacang.'], source: 'curated' },
  { id: 'c7', title: 'Rendang Daging Sapi', description: 'Daging sapi empuk dengan bumbu rendang yang kaya rempah — masakan Padang legendaris.', time: '180 min', difficulty: 'Hard', tag: 'Dinner', category: 'Dinner', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80', ingredients: ['Daging sapi', 'Santan', 'Serai', 'Daun jeruk', 'Lengkuas', 'Cabai merah', 'Bawang merah', 'Bawang putih'], steps: ['Haluskan bumbu: cabai, bawang, kunyit, jahe.', 'Tumis bumbu halus dengan rempah.', 'Masukkan daging, aduk rata.', 'Tuang santan, masak 2–3 jam hingga kering.'], source: 'curated' },
  { id: 'c8', title: 'Tom Yum Kung', description: 'Sup udang asam pedas Thailand dengan serai, daun jeruk, dan jamur enoki.', time: '25 min', difficulty: 'Medium', tag: 'Dinner', category: 'Dinner', image: 'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=400&q=80', ingredients: ['Udang', 'Serai', 'Daun jeruk', 'Lengkuas', 'Jamur', 'Cabai', 'Saus ikan', 'Jeruk nipis'], steps: ['Rebus kaldu dengan serai, daun jeruk, lengkuas.', 'Masukkan jamur dan cabai.', 'Tambahkan udang dan saus ikan.', 'Sajikan dengan koriander.'], source: 'curated' },
  { id: 'c9', title: 'Bibimbap Korea', description: 'Nasi campur Korea dengan sayuran berwarna-warni, telur ceplok, dan saus gochujang.', time: '40 min', difficulty: 'Medium', tag: 'Lunch', category: 'Lunch', image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&q=80', ingredients: ['Nasi putih', 'Wortel', 'Bayam', 'Jamur shiitake', 'Tauge', 'Telur', 'Gochujang'], steps: ['Tumis masing-masing sayuran dengan kecap dan minyak wijen.', 'Goreng telur dengan kuning setengah matang.', 'Tata semua topping di atas nasi panas.', 'Sajikan dengan saus gochujang.'], source: 'curated' },
  { id: 'c10', title: 'Pad Thai Klasik', description: 'Mie beras goreng ala Thailand dengan tauge, telur, dan saus asam manis pedas.', time: '25 min', difficulty: 'Medium', tag: 'Dinner', category: 'Dinner', image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&q=80', ingredients: ['Mie beras', 'Udang atau tofu', 'Telur', 'Tauge', 'Saus tamarind', 'Saus ikan', 'Kacang tanah'], steps: ['Rendam mie hingga lunak.', 'Tumis udang/tofu hingga matang.', 'Masukkan mie dan saus.', 'Tambahkan telur, aduk cepat. Sajikan dengan kacang.'], source: 'curated' },
  { id: 'c11', title: 'Omurice Jepang', description: 'Nasi goreng saus tomat yang dibungkus telur dadar lembut — comfort food favorit Jepang.', time: '25 min', difficulty: 'Medium', tag: 'Breakfast', category: 'Breakfast', image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&q=80', ingredients: ['Nasi putih', 'Telur', 'Dada ayam', 'Paprika', 'Saus tomat', 'Bawang bombay', 'Butter'], steps: ['Tumis ayam dan paprika dengan butter.', 'Masukkan nasi, tambahkan saus tomat.', 'Kocok 2 telur, dadar tipis dengan butter.', 'Letakkan nasi di tengah telur, lipat.'], source: 'curated' },
  { id: 'c12', title: 'Bulgogi Sapi Korea', description: 'Irisan daging sapi marinate khas Korea yang manis gurih, dimasak di atas wajan panas.', time: '30 min', difficulty: 'Easy', tag: 'Dinner', category: 'Dinner', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80', ingredients: ['Daging sapi iris tipis', 'Kecap asin', 'Gula merah', 'Minyak wijen', 'Bawang putih', 'Jahe'], steps: ['Marinate daging minimal 30 menit.', 'Panaskan wajan dengan api besar.', 'Masak daging hingga karamelisasi.', 'Taburi wijen, sajikan dengan nasi.'], source: 'curated' },
  { id: 'c13', title: 'Laksa Lemak', description: 'Sup mie santan khas Malaysia dengan kaldu rempah pedas dan udang segar.', time: '45 min', difficulty: 'Medium', tag: 'Lunch', category: 'Lunch', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80', ingredients: ['Mie kuning', 'Udang', 'Tahu goreng', 'Tauge', 'Santan', 'Serai', 'Pasta laksa'], steps: ['Tumis pasta laksa dengan serai hingga harum.', 'Tambahkan kaldu dan masak 10 menit.', 'Tuang santan, masak dengan api sedang.', 'Sajikan di atas mie dengan tauge.'], source: 'curated' },
  { id: 'c14', title: 'Gyoza Panggang', description: 'Pangsit Jepang dengan isian ayam dan kubis — renyah di bawah, lembut di atas.', time: '40 min', difficulty: 'Medium', tag: 'Breakfast', category: 'Breakfast', image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&q=80', ingredients: ['Kulit gyoza', 'Ayam cincang', 'Kubis', 'Daun bawang', 'Jahe', 'Kecap asin', 'Minyak wijen'], steps: ['Campur isian dan bungkus dalam kulit gyoza.', 'Goreng 2 menit, tuang air 50ml.', 'Tutup, kukus 5 menit.', 'Sajikan dengan saus celup.'], source: 'curated' },
  { id: 'c15', title: 'Pho Bo Vietnam', description: 'Sup mie bening Vietnam dengan kaldu sapi kaya rempah dan irisan daging sapi.', time: '120 min', difficulty: 'Hard', tag: 'Dinner', category: 'Dinner', image: 'https://images.unsplash.com/photo-1576577445504-6af96477db52?w=400&q=80', ingredients: ['Tulang sapi', 'Daging sapi iris tipis', 'Mie beras', 'Jahe', 'Bawang bombay', 'Bunga lawang', 'Saus ikan'], steps: ['Panggang tulang, jahe, bawang hingga gosong.', 'Rebus dengan rempah 2 jam.', 'Saring kaldu, bumbui.', 'Siram kaldu mendidih di atas mie dan daging.'], source: 'curated' },
  { id: 'c16', title: 'Mapo Tofu Sichuan', description: 'Tahu lembut dalam saus kaya minyak cabai Sichuan yang pedas dan gurih.', time: '20 min', difficulty: 'Medium', tag: 'Dinner', category: 'Dinner', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80', ingredients: ['Tahu lembut', 'Daging babi cincang', 'Saus kacang hitam', 'Minyak cabai Sichuan', 'Bawang putih', 'Jahe'], steps: ['Tumis bawang putih dan jahe.', 'Masukkan daging, masak hingga berubah warna.', 'Tambahkan saus dan tahu.', 'Kentalkan dengan larutan kanji.'], source: 'curated' },
  { id: 'c17', title: 'Banh Mi Vietnam', description: 'Sandwich baguette ala Vietnam dengan daging, acar sayuran, dan saus sambal.', time: '20 min', difficulty: 'Easy', tag: 'Lunch', category: 'Lunch', image: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&q=80', ingredients: ['Baguette', 'Daging ayam', 'Wortel', 'Lobak', 'Mentimun', 'Koriander', 'Mayones', 'Saus hoisin'], steps: ['Acar wortel dan lobak dalam cuka gula 15 menit.', 'Panggang daging dengan saus hoisin.', 'Belah baguette, oles mayones.', 'Tata isian dan koriander.'], source: 'curated' },
  { id: 'c18', title: 'Sayur Asem Segar', description: 'Sayur berkuah asam segar yang menyegarkan dengan aneka sayuran kampung.', time: '30 min', difficulty: 'Easy', tag: 'Vegetarian', category: 'Vegetarian', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80', ingredients: ['Kacang panjang', 'Jagung', 'Labu siam', 'Asam jawa', 'Lengkuas', 'Daun salam', 'Gula merah'], steps: ['Rebus air dengan lengkuas, daun salam, asam jawa.', 'Masukkan jagung dan labu siam.', 'Tambahkan kacang panjang, gula, garam.', 'Masak hingga matang.'], source: 'curated' },
  { id: 'c19', title: 'Ramen Shoyu Homemade', description: 'Ramen Jepang dengan kaldu shoyu gurih, telur marinate, dan ayam chashu.', time: '90 min', difficulty: 'Hard', tag: 'Dinner', category: 'Dinner', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80', ingredients: ['Mie ramen', 'Ayam', 'Kecap asin', 'Mirin', 'Sake', 'Bawang bombay', 'Jahe', 'Telur'], steps: ['Rebus ayam dengan bumbu 1 jam.', 'Marinate telur dalam kecap, mirin, sake.', 'Saring kaldu, tambahkan kecap shoyu.', 'Masak mie, tata dengan kaldu dan topping.'], source: 'curated' },
  { id: 'c20', title: 'Caprese Stuffed Avocado', description: 'Alpukat diisi tomat, mozzarella segar, dan balsamic glaze — sehat dan lezat.', time: '10 min', difficulty: 'Easy', tag: 'Vegetarian', category: 'Vegetarian', image: 'https://images.unsplash.com/photo-1518014723-3cd4a8d0e07b?w=400&q=80', ingredients: ['Alpukat', 'Tomat ceri', 'Mozzarella segar', 'Kemangi', 'Balsamic glaze', 'Minyak zaitun'], steps: ['Belah dan biji alpukat.', 'Potong tomat dan sobek mozzarella.', 'Isi alpukat dengan campuran tomat.', 'Siram balsamic dan minyak zaitun.'], source: 'curated' },
]

export default function RecipesPage() {
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dietFilter, setDietFilter] = useState<DietFilter>('All')
  const [selected, setSelected] = useState<Recipe | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all')
  const [addForm, setAddForm] = useState({ title: '', description: '', time: '', difficulty: 'Easy', category: 'Dinner', ingredients: '', steps: '', imagePreview: '' })

  const fetchUserRecipes = () => {
    setLoading(true)
    fetch('/api/recipes').then(r => r.json()).then(data => setUserRecipes((data.recipes || []).map((r: any) => ({ ...r, _id: String(r._id) })))).catch(() => setUserRecipes([])).finally(() => setLoading(false))
  }
  useEffect(() => { fetchUserRecipes() }, [])

  const allRecipes: Recipe[] = activeTab === 'mine' ? userRecipes : [...userRecipes, ...CURATED]

  const filtered = allRecipes.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase()) || r.ingredients.some(i => i.toLowerCase().includes(search.toLowerCase()))
    if (!matchSearch) return false
    if (dietFilter === 'All') return true
    if (dietFilter === 'Under 30 mins') { const m = parseInt(r.time); return !isNaN(m) && m < 30 }
    return r.tag === dietFilter || r.category === dietFilter
  })

  const handleAddManual = async () => {
    if (!addForm.title || !addForm.ingredients || !addForm.steps) return
    setSaving(true)
    try {
      const formattedTime = formatTime(addForm.time)
      const body = { title: addForm.title, description: addForm.description, time: formattedTime, difficulty: addForm.difficulty, category: addForm.category, tag: addForm.category, ingredients: addForm.ingredients.split('\n').map(s => s.trim()).filter(Boolean), steps: addForm.steps.split('\n').map(s => s.trim()).filter(Boolean), image: addForm.imagePreview || null, source: 'manual' }
      const res = await fetch('/api/recipes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      setUserRecipes(prev => [{ ...body, _id: String(data.id) }, ...prev])
      setShowAddModal(false)
      setAddForm({ title: '', description: '', time: '', difficulty: 'Easy', category: 'Dinner', ingredients: '', steps: '', imagePreview: '' })
    } catch (e) { console.error(e) } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/recipes/${id}`, { method: 'DELETE' })
      setUserRecipes(prev => prev.filter(r => String(r._id) !== id))
      if (selected && String(selected._id) === id) setSelected(null)
    } catch (e) { console.error(e) } finally { setDeleteConfirmId(null) }
  }

  const inputStyle = (field: string): React.CSSProperties => ({ width: '100%', fontFamily: PP, fontSize: '13px', background: 'var(--color-cream)', borderWidth: '1.5px', borderStyle: 'solid', borderColor: focusedField === field ? '#3d5429' : '#e0dbc8', borderRadius: '10px', padding: '10px 14px', outline: 'none', transition: 'border-color 0.15s' })

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 animate-slide-up">
        <div>
          <h1 style={{ fontFamily: PP, fontSize: 'clamp(1.3rem,5vw,1.75rem)', fontWeight: 700, color: '#1a1a14', marginBottom: '4px' }}>Recipes</h1>
          <p style={{ fontFamily: PP, fontSize: '13px', color: '#8a8070' }}>Koleksi resep pilihan untuk setiap kesempatan.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 rounded-xl text-white transition-all hover:opacity-90 flex-shrink-0"
          style={{ background: '#3d5429', fontFamily: PP, fontSize: '13px', fontWeight: 600, padding: '10px 16px' }}>
          <Plus size={15} /> <span className="hidden sm:inline">Add Recipe</span><span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 mb-5">
        {[{ key: 'all', label: 'All Recipes' }, { key: 'mine', label: 'My Recipes' }].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as 'all' | 'mine')} className="flex items-center gap-2 rounded-full transition-all"
            style={{ fontFamily: PP, fontSize: '13px', fontWeight: activeTab === tab.key ? 600 : 400, background: activeTab === tab.key ? '#3d5429' : 'white', color: activeTab === tab.key ? 'white' : '#6b6356', borderWidth: '1.5px', borderStyle: 'solid', borderColor: activeTab === tab.key ? '#3d5429' : '#e0dbc8', padding: '7px 16px' }}>
            {tab.label}
            {tab.key === 'mine' && <span style={{ fontSize: '10px', fontWeight: 700, background: activeTab === 'mine' ? 'rgba(255,255,255,0.25)' : '#f0ece0', color: activeTab === 'mine' ? 'white' : '#8a8070', borderRadius: '9999px', padding: '1px 6px' }}>{userRecipes.length}</span>}
          </button>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-slide-up stagger-1">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9a9585' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari resep atau bahan..."
            style={{ fontFamily: PP, fontSize: '13px', paddingLeft: '32px', paddingRight: '16px', paddingTop: '10px', paddingBottom: '10px', borderRadius: '12px', borderWidth: '1.5px', borderStyle: 'solid', borderColor: '#e0dbc8', background: 'white', outline: 'none', width: '100%' }} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {(['All', 'Breakfast', 'Lunch', 'Dinner', 'Vegetarian', 'Under 30 mins'] as DietFilter[]).map(tab => (
            <button key={tab} onClick={() => setDietFilter(tab)} className="rounded-full transition-all flex-shrink-0"
              style={{ fontFamily: PP, fontSize: '13px', fontWeight: dietFilter === tab ? 600 : 400, background: dietFilter === tab ? '#3d5429' : 'white', color: dietFilter === tab ? 'white' : '#6b6356', borderWidth: '1.5px', borderStyle: 'solid', borderColor: dietFilter === tab ? '#3d5429' : '#e0dbc8', padding: '7px 14px' }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {!loading && activeTab === 'mine' && userRecipes.length === 0 && (
        <div className="rounded-2xl flex flex-col items-center justify-center py-20 gap-5" style={{ background: 'white', border: '1px solid #e0dbc8' }}>
          <BookOpen size={48} style={{ color: '#c8c0b0' }} />
          <div className="text-center px-4">
            <h3 style={{ fontFamily: PP, fontSize: '16px', fontWeight: 600, color: '#1a1a14', marginBottom: '6px' }}>No saved recipes yet</h3>
            <p style={{ fontFamily: PP, fontSize: '13px', color: '#8a8070', lineHeight: 1.6 }}>Tambahkan resepmu sendiri ke koleksi pribadi.</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white hover:opacity-90" style={{ background: '#3d5429', fontFamily: PP, fontSize: '13px', fontWeight: 600 }}>
            <Plus size={15} /> Add Recipe
          </button>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: '#f0ece0' }}><div style={{ height: '160px', background: '#e0dbc8' }} /><div className="p-4 space-y-2"><div className="h-4 rounded" style={{ background: '#e0dbc8', width: '70%' }} /></div></div>)}
        </div>
      )}

      {/* Recipe grid — 1 col mobile, 2 col tablet, 3 col desktop */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((recipe, i) => {
            const rid = String(recipe._id || recipe.id || i)
            const isUser = !!recipe._id
            return (
              <div key={rid} className="rounded-2xl overflow-hidden cursor-pointer hover:shadow-md transition-all" style={{ background: 'white', border: '1px solid #e0dbc8' }} onClick={() => setSelected(recipe)}>
                <div className="relative overflow-hidden" style={{ height: '160px' }}>
                  <img src={recipe.image || FALLBACK} alt={recipe.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = FALLBACK }} />
                  {(recipe.tag || recipe.category) && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-white" style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, background: '#3d5429' }}>{recipe.tag || recipe.category}</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 style={{ fontFamily: PP, fontSize: '14px', fontWeight: 600, color: '#1a1a14', marginBottom: '4px' }} className="line-clamp-1">{recipe.title}</h3>
                  <p style={{ fontFamily: PP, fontSize: '12px', color: '#8a8070', marginBottom: '10px', lineHeight: 1.5 }} className="line-clamp-2">{recipe.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1" style={{ fontFamily: PP, fontSize: '11px', color: '#6b6356' }}><Clock size={11} /> {recipe.time}</span>
                      <span className="flex items-center gap-1" style={{ fontFamily: PP, fontSize: '11px', color: '#6b6356' }}><ChefHat size={11} /> {recipe.difficulty}</span>
                    </div>
                    {isUser && <button onClick={e => { e.stopPropagation(); setDeleteConfirmId(rid) }} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 size={12} style={{ color: '#dc2626', opacity: 0.6 }} /></button>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (activeTab === 'all' || userRecipes.length > 0) && (
        <div className="rounded-2xl flex flex-col items-center justify-center py-12 gap-3" style={{ background: 'white', border: '1px solid #e0dbc8' }}>
          <img src="https://img.icons8.com/ios/40/adc491/search--v1.png" alt="" width={40} height={40} />
          <p style={{ fontFamily: PP, fontSize: '14px', fontWeight: 600, color: '#1a1a14' }}>No recipes match</p>
          <p style={{ fontFamily: PP, fontSize: '13px', color: '#8a8070' }}>Coba kata kunci atau filter yang berbeda.</p>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(0,0,0,0.35)' }}>
          <div className="bg-white w-full sm:max-w-sm shadow-xl" style={{ border: '1px solid #e0dbc8', borderRadius: '20px 20px 0 0', padding: '24px' }} className="sm:rounded-2xl">
            <h3 style={{ fontFamily: PP, fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Delete Recipe?</h3>
            <p style={{ fontFamily: PP, fontSize: '13px', color: '#8a8070', marginBottom: '20px' }}>Resep ini akan dihapus permanen.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3 rounded-xl" style={{ background: '#f0ece0', color: '#6b6356', fontFamily: PP, fontSize: '14px', fontWeight: 600 }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirmId)} className="flex-1 py-3 rounded-xl text-white" style={{ background: '#dc2626', fontFamily: PP, fontSize: '14px', fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Recipe Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6" style={{ background: 'rgba(0,0,0,0.35)' }}>
          <div className="bg-white w-full sm:max-w-lg shadow-xl flex flex-col" style={{ border: '1px solid #e0dbc8', maxHeight: '92vh', borderRadius: '20px 20px 0 0' }} className="sm:rounded-2xl">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0" style={{ borderBottom: '1px solid #e0dbc8' }}>
              <div><h2 style={{ fontFamily: PP, fontSize: '17px', fontWeight: 700 }}>Add Recipe</h2><p style={{ fontFamily: PP, fontSize: '12px', color: '#8a8070', marginTop: '2px' }}>Simpan resepmu ke koleksi pribadi.</p></div>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-full hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-5 space-y-4">
              {/* Photo */}
              <div>
                <label className="block mb-1.5" style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#5a5040', letterSpacing: '0.06em' }}>PHOTO</label>
                <label className="flex items-center gap-3 cursor-pointer rounded-xl overflow-hidden" style={{ borderWidth: '1.5px', borderStyle: 'dashed', borderColor: '#e0dbc8', background: 'var(--color-cream)', minHeight: '72px' }}>
                  {addForm.imagePreview ? (
                    <div className="relative w-full"><img src={addForm.imagePreview} alt="preview" className="w-full object-cover rounded-xl" style={{ height: '100px' }} />
                      <button type="button" onClick={e => { e.preventDefault(); setAddForm(f => ({ ...f, imagePreview: '' })) }} className="absolute top-2 right-2 p-1 rounded-full" style={{ background: 'rgba(0,0,0,0.5)' }}><X size={14} style={{ color: 'white' }} /></button></div>
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full py-4 gap-1">
                      <img src="https://img.icons8.com/ios/28/9a9585/add-image.png" alt="" width={24} height={24} />
                      <p style={{ fontFamily: PP, fontSize: '12px', color: '#9a9585' }}>Klik untuk upload foto</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => setAddForm(prev => ({ ...prev, imagePreview: ev.target?.result as string })); r.readAsDataURL(f) }} />
                </label>
              </div>
              {[{ key: 'title', label: 'RECIPE TITLE', ph: 'cth: Nasi Goreng Spesial' }, { key: 'description', label: 'DESCRIPTION', ph: 'Deskripsi singkat resep kamu' }].map(({ key, label, ph }) => (
                <div key={key}>
                  <label className="block mb-1.5" style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#5a5040', letterSpacing: '0.06em' }}>{label}</label>
                  <input value={(addForm as any)[key]} onChange={e => setAddForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph} onFocus={() => setFocusedField(key)} onBlur={() => setFocusedField(null)} style={inputStyle(key)} />
                </div>
              ))}
              <div>
                <label className="block mb-1.5" style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#5a5040', letterSpacing: '0.06em' }}>CATEGORY</label>
                <div className="flex gap-2 flex-wrap">
                  {RECIPE_CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setAddForm(f => ({ ...f, category: cat }))} className="rounded-full transition-all"
                      style={{ fontFamily: PP, fontSize: '12px', fontWeight: addForm.category === cat ? 600 : 400, background: addForm.category === cat ? '#3d5429' : 'var(--color-cream)', color: addForm.category === cat ? 'white' : '#6b6356', borderWidth: '1.5px', borderStyle: 'solid', borderColor: addForm.category === cat ? '#3d5429' : '#e0dbc8', padding: '6px 12px' }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5" style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#5a5040', letterSpacing: '0.06em' }}>COOK TIME (minutes)</label>
                  <div className="relative">
                    <input type="number" value={addForm.time} onChange={e => setAddForm(f => ({ ...f, time: e.target.value }))} placeholder="30"
                      onFocus={() => setFocusedField('time')} onBlur={() => setFocusedField(null)} style={{ ...inputStyle('time'), paddingRight: '40px' }} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2" style={{ fontFamily: PP, fontSize: '12px', color: '#9a9585', pointerEvents: 'none' }}>min</span>
                  </div>
                </div>
                <div>
                  <label className="block mb-1.5" style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#5a5040', letterSpacing: '0.06em' }}>DIFFICULTY</label>
                  <select value={addForm.difficulty} onChange={e => setAddForm(f => ({ ...f, difficulty: e.target.value }))} style={{ ...inputStyle('dif'), cursor: 'pointer' }}><option>Easy</option><option>Medium</option><option>Hard</option></select>
                </div>
              </div>
              {[{ key: 'ingredients', label: 'INGREDIENTS', hint: '(satu per baris)', ph: 'Nasi putih\nTelur\nKecap manis', rows: 4 }, { key: 'steps', label: 'STEPS', hint: '(satu per baris)', ph: 'Panaskan minyak.\nTumis bumbu.\nAduk rata.', rows: 5 }].map(({ key, label, hint, ph, rows }) => (
                <div key={key}>
                  <label className="block mb-1.5" style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#5a5040', letterSpacing: '0.06em' }}>{label} <span style={{ color: '#9a9585', fontWeight: 400 }}>{hint}</span></label>
                  <textarea value={(addForm as any)[key]} onChange={e => setAddForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph} rows={rows} onFocus={() => setFocusedField(key)} onBlur={() => setFocusedField(null)} style={{ ...inputStyle(key), resize: 'vertical' }} />
                </div>
              ))}
            </div>
            <div className="flex gap-3 px-5 py-4 flex-shrink-0" style={{ borderTop: '1px solid #e0dbc8' }}>
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-xl" style={{ background: '#f0ece0', color: '#6b6356', fontFamily: PP, fontSize: '14px', fontWeight: 600 }}>Cancel</button>
              <button onClick={handleAddManual} disabled={saving || !addForm.title || !addForm.ingredients || !addForm.steps} className="flex-1 py-3 rounded-xl text-white disabled:opacity-50" style={{ background: '#3d5429', fontFamily: PP, fontSize: '14px', fontWeight: 600 }}>{saving ? 'Saving...' : 'Save Recipe'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Detail */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white w-full sm:max-w-xl shadow-xl flex flex-col overflow-hidden" style={{ maxHeight: '92vh', border: '1px solid #e0dbc8', borderRadius: '20px 20px 0 0' }} className="sm:rounded-2xl">
            {selected.image ? (
              <div className="relative flex-shrink-0" style={{ height: '180px' }}>
                <img src={selected.image} alt={selected.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = FALLBACK }} />
                <button onClick={() => setSelected(null)} className="absolute top-3 right-3 p-2 rounded-full" style={{ background: 'rgba(0,0,0,0.5)' }}><X size={16} style={{ color: 'white' }} /></button>
              </div>
            ) : (
              <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0" style={{ borderBottom: '1px solid #e0dbc8' }}><span /><button onClick={() => setSelected(null)} className="p-2 rounded-full hover:bg-gray-100"><X size={18} /></button></div>
            )}
            <div className="overflow-y-auto flex-1 px-5 py-5">
              <h2 style={{ fontFamily: PP, fontSize: '20px', fontWeight: 700, color: '#1a1a14', marginBottom: '6px' }}>{selected.title}</h2>
              <p style={{ fontFamily: PP, fontSize: '13px', color: '#8a8070', marginBottom: '14px', lineHeight: 1.6 }}>{selected.description}</p>
              <div className="flex items-center gap-3 mb-5">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: '#f4f7f0', fontFamily: PP, fontSize: '12px', color: '#3d5429' }}><Clock size={12} /> {selected.time}</span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: '#f4f7f0', fontFamily: PP, fontSize: '12px', color: '#3d5429' }}><ChefHat size={12} /> {selected.difficulty}</span>
              </div>
              <h4 style={{ fontFamily: PP, fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>Ingredients</h4>
              <ul className="space-y-1.5 mb-5">{selected.ingredients.map((ing, i) => <li key={i} className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#3d5429' }} /><span style={{ fontFamily: PP, fontSize: '13px', color: '#4a4030' }}>{ing}</span></li>)}</ul>
              <h4 style={{ fontFamily: PP, fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>Steps</h4>
              <ol className="space-y-3">{selected.steps.map((step, i) => <li key={i} className="flex gap-3"><span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#3d5429', color: 'white', fontFamily: PP, fontSize: '11px', fontWeight: 700 }}>{i + 1}</span><span style={{ fontFamily: PP, fontSize: '13px', color: '#4a4030', lineHeight: 1.6 }}>{step}</span></li>)}</ol>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
