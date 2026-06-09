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
  tagType?: 'urgent' | 'ai'
  category?: string
  image?: string
  ingredients: string[]
  steps: string[]
  source?: 'manual' | 'curated'
}

type DietFilter = 'All' | 'Breakfast' | 'Lunch' | 'Dinner' | 'Vegetarian' | 'Under 30 mins'

const RECIPE_CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Vegetarian', 'Snack'] as const
const FALLBACK = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80'

const CURATED: Recipe[] = [
  // Indonesian
  { id: 'c1', title: 'Nasi Goreng Spesial', description: 'Nasi goreng khas Indonesia dengan telur, kecap manis, dan topping kerupuk renyah.', time: '20 min', difficulty: 'Easy', tag: 'Lunch', category: 'Lunch', image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80', ingredients: ['Nasi putih', 'Telur', 'Kecap manis', 'Bawang merah', 'Bawang putih', 'Cabai', 'Kerupuk', 'Minyak goreng'], steps: ['Tumis bawang merah, bawang putih, dan cabai hingga harum.', 'Masukkan nasi, tambahkan kecap manis dan garam.', 'Aduk rata di atas api besar.', 'Dadar telur di sisi wajan, campur dengan nasi.', 'Sajikan dengan kerupuk dan irisan mentimun.'], source: 'curated' },
  { id: 'c2', title: 'Ayam Geprek Crispy', description: 'Ayam goreng crispy yang digeprek dengan sambal pedas — favorit semua orang.', time: '35 min', difficulty: 'Medium', tag: 'Dinner', category: 'Dinner', image: 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=400&q=80', ingredients: ['Ayam potong', 'Tepung terigu', 'Telur', 'Bawang putih', 'Cabai rawit', 'Garam', 'Minyak goreng'], steps: ['Marinasi ayam dengan garam dan bawang putih selama 20 menit.', 'Celupkan ke telur, gulingkan di tepung.', 'Goreng di minyak panas hingga keemasan.', 'Geprek ayam lalu siram sambal cabai di atasnya.'], source: 'curated' },
  { id: 'c3', title: 'Soto Ayam Bening', description: 'Sup ayam bening dengan kuah bening kunyit yang segar, disajikan dengan lontong atau nasi.', time: '45 min', difficulty: 'Medium', tag: 'Lunch', category: 'Lunch', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80', ingredients: ['Ayam', 'Kunyit', 'Jahe', 'Serai', 'Daun salam', 'Tauge', 'Telur rebus', 'Bawang goreng', 'Jeruk nipis'], steps: ['Rebus ayam dengan bumbu rempah hingga matang.', 'Suwir ayam, buang tulang.', 'Masak kembali kaldu dengan kunyit hingga kekuningan.', 'Sajikan dengan tauge, telur, dan bawang goreng.'], source: 'curated' },
  { id: 'c4', title: 'Tempe Orek Kering', description: 'Tempe goreng renyah dengan saus kecap manis — lauk sederhana yang nikmat dengan nasi.', time: '20 min', difficulty: 'Easy', tag: 'Vegetarian', category: 'Vegetarian', image: 'https://images.unsplash.com/photo-1625944526165-a3e8dda2a9ed?w=400&q=80', ingredients: ['Tempe', 'Kecap manis', 'Bawang merah', 'Bawang putih', 'Cabai merah', 'Gula merah', 'Garam', 'Minyak goreng'], steps: ['Potong tempe tipis, goreng hingga crispy.', 'Tumis bawang, cabai hingga layu.', 'Masukkan tempe, kecap manis, dan gula merah.', 'Aduk rata hingga bumbu meresap dan kering.'], source: 'curated' },
  { id: 'c5', title: 'Mie Goreng Jawa', description: 'Mie goreng gaya Jawa dengan bumbu khas petis dan taburan bawang goreng.', time: '20 min', difficulty: 'Easy', tag: 'Dinner', category: 'Dinner', image: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=80', ingredients: ['Mie telur', 'Telur', 'Kol', 'Tauge', 'Kecap manis', 'Petis', 'Bawang merah', 'Bawang putih', 'Cabai'], steps: ['Rebus mie hingga matang, tiriskan.', 'Tumis bumbu hingga harum, masukkan telur orak-arik.', 'Masukkan mie, kecap manis, petis, dan sayuran.', 'Aduk rata, sajikan dengan bawang goreng.'], source: 'curated' },
  { id: 'c6', title: 'Gado-Gado Jakarta', description: 'Salad sayuran rebus dengan saus kacang kental yang gurih — makanan sehat khas Betawi.', time: '30 min', difficulty: 'Easy', tag: 'Vegetarian', category: 'Vegetarian', image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80', ingredients: ['Kangkung', 'Tauge', 'Kentang rebus', 'Telur rebus', 'Tahu', 'Kacang tanah', 'Kecap manis', 'Jeruk nipis', 'Cabai', 'Bawang putih'], steps: ['Rebus sayuran masing-masing hingga matang.', 'Goreng kacang tanah, haluskan dengan cabai dan bawang putih.', 'Tambahkan kecap, gula, garam, dan perasan jeruk nipis ke saus.', 'Tata sayuran, siram saus kacang, taburi bawang goreng.'], source: 'curated' },
  { id: 'c7', title: 'Rendang Daging Sapi', description: 'Daging sapi empuk dengan bumbu rendang yang kaya rempah — masakan Padang yang legendaris.', time: '180 min', difficulty: 'Hard', tag: 'Dinner', category: 'Dinner', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80', ingredients: ['Daging sapi', 'Santan', 'Serai', 'Daun jeruk', 'Lengkuas', 'Cabai merah', 'Bawang merah', 'Bawang putih', 'Kunyit', 'Jahe'], steps: ['Haluskan bumbu: cabai, bawang, kunyit, jahe.', 'Tumis bumbu halus dengan serai, lengkuas, daun jeruk.', 'Masukkan daging, aduk rata dengan bumbu.', 'Tuang santan, masak dengan api kecil 2–3 jam hingga kering.'], source: 'curated' },
  { id: 'c8', title: 'Sayur Asem Segar', description: 'Sayur berkuah asam segar yang menyegarkan dengan aneka sayuran kampung.', time: '30 min', difficulty: 'Easy', tag: 'Vegetarian', category: 'Vegetarian', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80', ingredients: ['Kacang panjang', 'Jagung', 'Labu siam', 'Asam jawa', 'Lengkuas', 'Daun salam', 'Gula merah', 'Garam'], steps: ['Rebus air dengan lengkuas, daun salam, dan asam jawa.', 'Masukkan jagung dan labu siam terlebih dahulu.', 'Tambahkan kacang panjang, gula merah, dan garam.', 'Masak hingga sayuran matang dan kuah terasa asam-manis.'], source: 'curated' },
  // Asian
  { id: 'c9', title: 'Tom Yum Kung', description: 'Sup udang asam pedas Thailand dengan serai, daun jeruk, dan jamur enoki.', time: '25 min', difficulty: 'Medium', tag: 'Dinner', category: 'Dinner', image: 'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=400&q=80', ingredients: ['Udang', 'Serai', 'Daun jeruk', 'Lengkuas', 'Jamur', 'Cabai', 'Saus ikan', 'Jeruk nipis', 'Koriander'], steps: ['Rebus kaldu dengan serai, daun jeruk, lengkuas.', 'Masukkan jamur dan cabai, masak 5 menit.', 'Tambahkan udang, saus ikan, dan perasan jeruk nipis.', 'Sajikan dengan taburan koriander segar.'], source: 'curated' },
  { id: 'c10', title: 'Bibimbap Korea', description: 'Nasi campur Korea dengan sayuran berwarna-warni, telur ceplok, dan saus gochujang pedas.', time: '40 min', difficulty: 'Medium', tag: 'Lunch', category: 'Lunch', image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&q=80', ingredients: ['Nasi putih', 'Wortel', 'Bayam', 'Jamur shiitake', 'Tauge', 'Telur', 'Gochujang', 'Minyak wijen', 'Kecap asin'], steps: ['Tumis masing-masing sayuran terpisah dengan kecap dan minyak wijen.', 'Goreng telur dengan kuning setengah matang.', 'Tata semua topping di atas nasi panas.', 'Sajikan dengan saus gochujang, aduk sebelum makan.'], source: 'curated' },
  { id: 'c11', title: 'Ramen Shoyu Homemade', description: 'Ramen Jepang dengan kaldu shoyu gurih, telur rebus marinate, dan chashu babi atau ayam.', time: '90 min', difficulty: 'Hard', tag: 'Dinner', category: 'Dinner', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80', ingredients: ['Mie ramen', 'Ayam', 'Kecap asin', 'Mirin', 'Sake', 'Bawang bombay', 'Jahe', 'Telur', 'Nori', 'Daun bawang'], steps: ['Rebus ayam dengan bumbu 1 jam untuk kaldu.', 'Marinate telur dalam campuran kecap, mirin, sake.', 'Saring kaldu, tambahkan kecap shoyu dan garam.', 'Masak mie, tata dalam mangkuk dengan kaldu, topping, dan telur.'], source: 'curated' },
  { id: 'c12', title: 'Pad Thai Klasik', description: 'Mie beras goreng ala Thailand dengan tauge, telur, dan saus asam manis pedas.', time: '25 min', difficulty: 'Medium', tag: 'Dinner', category: 'Dinner', image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&q=80', ingredients: ['Mie beras', 'Udang atau tofu', 'Telur', 'Tauge', 'Daun bawang', 'Saus tamarind', 'Saus ikan', 'Gula merah', 'Kacang tanah', 'Jeruk nipis'], steps: ['Rendam mie hingga lunak, tiriskan.', 'Tumis udang/tofu hingga matang, sisihkan.', 'Masukkan mie, saus tamarind, saus ikan, gula.', 'Tambahkan telur, aduk cepat. Masukkan tauge dan daun bawang.', 'Sajikan dengan kacang tanah dan irisan jeruk nipis.'], source: 'curated' },
  { id: 'c13', title: 'Dim Sum Siomay Udang', description: 'Siomay kukus isi udang dan babi cincang dalam kulit wonton tipis.', time: '50 min', difficulty: 'Hard', tag: 'Breakfast', category: 'Breakfast', image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=80', ingredients: ['Kulit wonton', 'Udang cincang', 'Babi cincang (opsional)', 'Jahe parut', 'Kecap asin', 'Minyak wijen', 'Tepung kanji', 'Daun bawang'], steps: ['Campur udang, babi, jahe, kecap, minyak wijen, kanji.', 'Bungkus satu sendok isian di kulit wonton, bentuk cup.', 'Kukus di atas air mendidih selama 12–15 menit.', 'Sajikan dengan saus cabai dan kecap asin.'], source: 'curated' },
  { id: 'c14', title: 'Mapo Tofu Sichuan', description: 'Tahu lembut dalam saus kaya minyak cabai Sichuan yang pedas dan gurih.', time: '20 min', difficulty: 'Medium', tag: 'Dinner', category: 'Dinner', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80', ingredients: ['Tahu lembut', 'Daging babi cincang', 'Saus kacang hitam', 'Minyak cabai Sichuan', 'Bawang putih', 'Jahe', 'Daun bawang', 'Kaldu ayam', 'Tepung kanji'], steps: ['Tumis bawang putih dan jahe hingga harum.', 'Masukkan daging, masak hingga berubah warna.', 'Tambahkan saus kacang hitam dan minyak cabai.', 'Masukkan tahu dan kaldu, masak perlahan.', 'Kentalkan dengan larutan kanji, taburi daun bawang.'], source: 'curated' },
  { id: 'c15', title: 'Gyoza Panggang', description: 'Pangsit Jepang dengan isian daging ayam dan kubis yang renyah di bawah, lembut di atas.', time: '40 min', difficulty: 'Medium', tag: 'Breakfast', category: 'Breakfast', image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&q=80', ingredients: ['Kulit gyoza', 'Ayam cincang', 'Kubis', 'Daun bawang', 'Jahe', 'Kecap asin', 'Minyak wijen'], steps: ['Campur ayam, kubis cincang, daun bawang, jahe, kecap, minyak wijen.', 'Bungkus isian dalam kulit gyoza, lipat tepian membentuk gelombang.', 'Panaskan wajan, tambahkan sedikit minyak.', 'Goreng gyoza 2 menit, tuang air 50ml, tutup, kukus 5 menit.', 'Sajikan dengan saus celup kecap-cuka.'], source: 'curated' },
  { id: 'c16', title: 'Bulgogi Sapi Korea', description: 'Irisan daging sapi marinate khas Korea yang manis gurih, dimasak cepat di atas wajan panas.', time: '30 min', difficulty: 'Easy', tag: 'Dinner', category: 'Dinner', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80', ingredients: ['Daging sapi iris tipis', 'Kecap asin', 'Gula merah', 'Minyak wijen', 'Bawang putih', 'Jahe', 'Bawang bombay', 'Wijen', 'Daun bawang'], steps: ['Marinate daging dengan kecap, gula, minyak wijen, bawang putih, jahe minimal 30 menit.', 'Panaskan wajan dengan api besar.', 'Masak daging beserta bawang bombay hingga matang dan sedikit karamelisasi.', 'Taburi wijen dan daun bawang, sajikan dengan nasi.'], source: 'curated' },
  { id: 'c17', title: 'Laksa Lemak', description: 'Sup mie santan khas Malaysia/Singapura dengan kaldu rempah pedas dan udang.', time: '45 min', difficulty: 'Medium', tag: 'Lunch', category: 'Lunch', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80', ingredients: ['Mie kuning atau bihun', 'Udang', 'Tahu goreng', 'Tahu goreng', 'Tauge', 'Santan', 'Serai', 'Daun jeruk', 'Cabai', 'Pasta laksa', 'Bawang merah', 'Bawang putih'], steps: ['Tumis pasta laksa dengan serai dan bawang hingga harum.', 'Tambahkan kaldu ayam dan masak 10 menit.', 'Tuang santan, masak dengan api sedang.', 'Masukkan udang dan tahu, masak hingga matang.', 'Sajikan di atas mie dengan tauge dan daun bawang.'], source: 'curated' },
  { id: 'c18', title: 'Banh Mi Vietnam', description: 'Sandwich baguette ala Vietnam dengan daging, acar sayuran, dan saus sambal.', time: '20 min', difficulty: 'Easy', tag: 'Lunch', category: 'Lunch', image: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&q=80', ingredients: ['Baguette', 'Daging ayam atau babi', 'Wortel', 'Lobak', 'Mentimun', 'Koriander', 'Cabai', 'Mayones', 'Saus hoisin', 'Cuka'], steps: ['Marinate dan panggang daging dengan saus hoisin.', 'Acar wortel dan lobak dalam cuka dan gula selama 15 menit.', 'Belah baguette, oles mayones dan saus sambal.', 'Tata daging, acar sayuran, mentimun, dan koriander.'], source: 'curated' },
  { id: 'c19', title: 'Omurice Jepang', description: 'Nasi goreng saus tomat yang dibungkus telur dadar lembut — comfort food favorit Jepang.', time: '25 min', difficulty: 'Medium', tag: 'Breakfast', category: 'Breakfast', image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&q=80', ingredients: ['Nasi putih', 'Telur', 'Dada ayam', 'Paprika', 'Saus tomat', 'Bawang bombay', 'Butter', 'Garam & merica'], steps: ['Tumis ayam dan paprika dengan butter.', 'Masukkan nasi, tambahkan saus tomat, aduk rata.', 'Kocok 2 telur, dadar tipis di wajan terpisah dengan butter.', 'Letakkan nasi di tengah telur, lipat membentuk oval.', 'Balik ke piring, beri saus tomat di atas.'], source: 'curated' },
  { id: 'c20', title: 'Pho Bo Vietnam', description: 'Sup mie bening Vietnam dengan kaldu sapi yang kaya rempah, irisan daging sapi, dan herba segar.', time: '120 min', difficulty: 'Hard', tag: 'Dinner', category: 'Dinner', image: 'https://images.unsplash.com/photo-1576577445504-6af96477db52?w=400&q=80', ingredients: ['Tulang sapi', 'Daging sapi iris tipis', 'Mie beras', 'Jahe', 'Bawang bombay', 'Kayu manis', 'Bunga lawang', 'Saus ikan', 'Tauge', 'Kemangi Thai', 'Jeruk nipis'], steps: ['Panggang tulang, jahe, dan bawang hingga gosong ringan.', 'Rebus dengan rempah 2 jam untuk kaldu jernih.', 'Saring kaldu, bumbui dengan saus ikan dan garam.', 'Siram kaldu mendidih di atas mie dan daging iris tipis.', 'Sajikan dengan tauge, kemangi, dan jeruk nipis.'], source: 'curated' },
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
    fetch('/api/recipes')
      .then(r => r.json())
      .then(data => setUserRecipes((data.recipes || []).map((r: any) => ({ ...r, _id: String(r._id) }))))
      .catch(() => setUserRecipes([]))
      .finally(() => setLoading(false))
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
      const body = { title: addForm.title, description: addForm.description, time: addForm.time || '30 min', difficulty: addForm.difficulty, category: addForm.category, tag: addForm.category, ingredients: addForm.ingredients.split('\n').map(s => s.trim()).filter(Boolean), steps: addForm.steps.split('\n').map(s => s.trim()).filter(Boolean), image: addForm.imagePreview || null, source: 'manual' }
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
      {/* Header Row - Responsive flex direction */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 animate-slide-up">
        <div>
          <h1 style={{ fontFamily: PP, fontSize: '1.75rem', fontWeight: 700, color: '#1a1a14', marginBottom: '4px' }}>Recipes</h1>
          <p style={{ fontFamily: PP, fontSize: '13px', color: '#8a8070' }}>Temukan inspirasi masakan Asia dan Indonesia untuk dapur kamu.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white transition-all hover:opacity-90 w-full sm:w-auto justify-center" style={{ background: '#3d5429', fontFamily: PP, fontSize: '13px', fontWeight: 600 }}>
          <Plus size={15} /> Add Recipe
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 mb-6">
        {[{ key: 'all', label: 'All Recipes' }, { key: 'mine', label: 'My Recipes' }].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as 'all' | 'mine')} className="flex items-center gap-2 px-4 py-2 rounded-full transition-all"
            style={{ fontFamily: PP, fontSize: '13px', fontWeight: activeTab === tab.key ? 600 : 400, background: activeTab === tab.key ? '#3d5429' : 'white', color: activeTab === tab.key ? 'white' : '#6b6356', borderWidth: '1.5px', borderStyle: 'solid', borderColor: activeTab === tab.key ? '#3d5429' : '#e0dbc8' }}>
            {tab.label}
            {tab.key === 'mine' && <span style={{ fontSize: '10px', fontWeight: 700, background: activeTab === 'mine' ? 'rgba(255,255,255,0.25)' : '#f0ece0', color: activeTab === 'mine' ? 'white' : '#8a8070', borderRadius: '9999px', padding: '1px 6px' }}>{userRecipes.length}</span>}
          </button>
        ))}
      </div>

      {/* Search + Filters - Responsive wrap and full width on mobile */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-8 animate-slide-up stagger-1">
        <div className="relative w-full lg:w-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9a9585' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari resep atau bahan..."
            className="w-full lg:w-[260px]"
            style={{ fontFamily: PP, fontSize: '13px', paddingLeft: '32px', paddingRight: '16px', paddingTop: '10px', paddingBottom: '10px', borderRadius: '12px', borderWidth: '1.5px', borderStyle: 'solid', borderColor: '#e0dbc8', background: 'white', outline: 'none' }} />
        </div>
  
        {/* PERBAIKAN DI SINI: Menghapus -mx-4 px-4 agar posisinya sejajar dan menambahkan inline style untuk sembunyikan scrollbar bawaan */}
        <div className="flex gap-2 overflow-x-auto pb-2 max-w-full lg:overflow-x-visible" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {(['All', 'Breakfast', 'Lunch', 'Dinner', 'Vegetarian', 'Under 30 mins'] as DietFilter[]).map(tab => (
            <button key={tab} onClick={() => setDietFilter(tab)} className="px-4 py-2 rounded-full transition-all flex-shrink-0"
              style={{ fontFamily: PP, fontSize: '13px', fontWeight: dietFilter === tab ? 600 : 400, background: dietFilter === tab ? '#3d5429' : 'white', color: dietFilter === tab ? 'white' : '#6b6356', borderWidth: '1.5px', borderStyle: 'solid', borderColor: dietFilter === tab ? '#3d5429' : '#e0dbc8' }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state my recipes */}
      {!loading && activeTab === 'mine' && userRecipes.length === 0 && (
        <div className="rounded-2xl flex flex-col items-center justify-center py-20 px-4 gap-5" style={{ background: 'white', border: '1px solid #e0dbc8' }}>
          <BookOpen size={48} style={{ color: '#c8c0b0' }} />
          <div className="text-center">
            <h3 style={{ fontFamily: PP, fontSize: '16px', fontWeight: 600, color: '#1a1a14', marginBottom: '6px' }}>No saved recipes yet</h3>
            <p style={{ fontFamily: PP, fontSize: '13px', color: '#8a8070', maxWidth: '300px', lineHeight: 1.6 }}>Tambahkan resepmu sendiri ke koleksi pribadi.</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white transition-all hover:opacity-90" style={{ background: '#3d5429', fontFamily: PP, fontSize: '13px', fontWeight: 600 }}>
            <Plus size={15} /> Add Recipe
          </button>
        </div>
      )}

      {/* Loading Grid - Responsive columns setup */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: '#f0ece0' }}>
              <div style={{ height: '180px', background: '#e0dbc8' }} />
              <div className="p-4 space-y-2"><div className="h-4 rounded" style={{ background: '#e0dbc8', width: '70%' }} /></div>
            </div>
          ))}
        </div>
      )}

      {/* Main Recipe Grid - Responsive columns (1 for Mobile, 2 for iPad, 3 for Desktop) */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((recipe, i) => {
            const rid = String(recipe._id || recipe.id || i)
            const isUserRecipe = !!recipe._id
            return (
              <div key={rid} className={`rounded-2xl overflow-hidden cursor-pointer hover:shadow-md transition-all animate-slide-up stagger-${(i % 3) + 1}`} style={{ background: 'white', border: '1px solid #e0dbc8' }} onClick={() => setSelected(recipe)}>
                <div className="relative overflow-hidden" style={{ height: '180px' }}>
                  <img src={recipe.image || FALLBACK} alt={recipe.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = FALLBACK }} />
                  {(recipe.tag || recipe.category) && <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-white" style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, background: recipe.tagType === 'urgent' ? '#dc2626' : '#3d5429' }}>{recipe.tag || recipe.category}</span>}
                </div>
                <div className="p-4">
                  <h3 style={{ fontFamily: PP, fontSize: '14px', fontWeight: 600, color: '#1a1a14', marginBottom: '4px' }}>{recipe.title}</h3>
                  <p style={{ fontFamily: PP, fontSize: '12px', color: '#8a8070', marginBottom: '12px', lineHeight: 1.5 }} className="line-clamp-2">{recipe.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1" style={{ fontFamily: PP, fontSize: '12px', color: '#6b6356' }}><Clock size={12} /> {recipe.time}</span>
                      <span className="flex items-center gap-1" style={{ fontFamily: PP, fontSize: '12px', color: '#6b6356' }}><ChefHat size={12} /> {recipe.difficulty}</span>
                    </div>
                    {isUserRecipe && <button onClick={e => { e.stopPropagation(); setDeleteConfirmId(rid) }} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={13} style={{ color: '#dc2626', opacity: 0.6 }} /></button>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (activeTab === 'all' || userRecipes.length > 0) && (
        <div className="rounded-2xl flex flex-col items-center justify-center py-12 px-4 gap-3" style={{ background: 'white', border: '1px solid #e0dbc8' }}>
          <img src="https://img.icons8.com/ios/40/adc491/search--v1.png" alt="" width={40} height={40} />
          <p style={{ fontFamily: PP, fontSize: '14px', fontWeight: 600, color: '#1a1a14' }}>No recipes match</p>
          <p style={{ fontFamily: PP, fontSize: '13px', color: '#8a8070' }}>Coba kata kunci atau filter yang berbeda.</p>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)' }}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl m-4" style={{ border: '1px solid #e0dbc8' }}>
            <h3 style={{ fontFamily: PP, fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Delete Recipe?</h3>
            <p style={{ fontFamily: PP, fontSize: '13px', color: '#8a8070', marginBottom: '20px' }}>Resep ini akan dihapus permanen dari koleksimu.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2.5 rounded-xl" style={{ background: '#f0ece0', color: '#6b6356', fontFamily: PP, fontSize: '14px', fontWeight: 600 }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirmId)} className="flex-1 py-2.5 rounded-xl text-white" style={{ background: '#dc2626', fontFamily: PP, fontSize: '14px', fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Recipe Modal - Added responsive margin and padding handling */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" style={{ background: 'rgba(0,0,0,0.35)' }}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col m-2" style={{ border: '1px solid #e0dbc8', maxHeight: 'calc(100vh - 2rem)' }}>
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid #e0dbc8' }}>
              <div><h2 style={{ fontFamily: PP, fontSize: '17px', fontWeight: 700 }}>Add Recipe</h2><p style={{ fontFamily: PP, fontSize: '12px', color: '#8a8070', marginTop: '2px' }}>Simpan resepmu ke koleksi pribadi.</p></div>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-full hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              {/* Photo */}
              <div>
                <label className="block mb-1.5" style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#5a5040', letterSpacing: '0.06em' }}>PHOTO</label>
                <label className="flex items-center gap-3 cursor-pointer rounded-xl overflow-hidden" style={{ borderWidth: '1.5px', borderStyle: 'dashed', borderColor: '#e0dbc8', background: 'var(--color-cream)', minHeight: '80px' }}>
                  {addForm.imagePreview ? (
                    <div className="relative w-full">
                      <img src={addForm.imagePreview} alt="preview" className="w-full object-cover rounded-xl" style={{ height: '120px' }} />
                      <button type="button" onClick={e => { e.preventDefault(); setAddForm(f => ({ ...f, imagePreview: '' })) }} className="absolute top-2 right-2 p-1 rounded-full" style={{ background: 'rgba(0,0,0,0.5)' }}><X size={14} style={{ color: 'white' }} /></button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full py-5 gap-2">
                      <img src="https://img.icons8.com/ios/32/9a9585/add-image.png" alt="" width={28} height={28} />
                      <p style={{ fontFamily: PP, fontSize: '12px', color: '#9a9585' }}>Klik untuk upload foto</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => setAddForm(prev => ({ ...prev, imagePreview: ev.target?.result as string })); r.readAsDataURL(f) }} />
                </label>
              </div>

              {/* Title + Description */}
              {[{ key: 'title', label: 'RECIPE TITLE', ph: 'cth: Nasi Goreng Spesial' }, { key: 'description', label: 'DESCRIPTION', ph: 'Deskripsi singkat resep kamu' }].map(({ key, label, ph }) => (
                <div key={key}>
                  <label className="block mb-1.5" style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#5a5040', letterSpacing: '0.06em' }}>{label}</label>
                  <input value={(addForm as any)[key]} onChange={e => setAddForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph} onFocus={() => setFocusedField(key)} onBlur={() => setFocusedField(null)} style={inputStyle(key)} />
                </div>
              ))}

              {/* Category */}
              <div>
                <label className="block mb-1.5" style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#5a5040', letterSpacing: '0.06em' }}>CATEGORY</label>
                <div className="flex gap-2 flex-wrap">
                  {RECIPE_CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setAddForm(f => ({ ...f, category: cat }))} className="px-3.5 py-1.5 rounded-full transition-all"
                      style={{ fontFamily: PP, fontSize: '12px', fontWeight: addForm.category === cat ? 600 : 400, background: addForm.category === cat ? '#3d5429' : 'var(--color-cream)', color: addForm.category === cat ? 'white' : '#6b6356', borderWidth: '1.5px', borderStyle: 'solid', borderColor: addForm.category === cat ? '#3d5429' : '#e0dbc8' }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time + Difficulty */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5" style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#5a5040', letterSpacing: '0.06em' }}>COOK TIME</label>
                  <input value={addForm.time} onChange={e => setAddForm(f => ({ ...f, time: e.target.value }))} placeholder="cth: 20 min" onFocus={() => setFocusedField('time')} onBlur={() => setFocusedField(null)} style={inputStyle('time')} />
                </div>
                <div>
                  <label className="block mb-1.5" style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#5a5040', letterSpacing: '0.06em' }}>DIFFICULTY</label>
                  <select value={addForm.difficulty} onChange={e => setAddForm(f => ({ ...f, difficulty: e.target.value }))} style={{ ...inputStyle('dif'), cursor: 'pointer' }}>
                    <option>Easy</option><option>Medium</option><option>Hard</option>
                  </select>
                </div>
              </div>

              {/* Ingredients + Steps */}
              {[{ key: 'ingredients', label: 'INGREDIENTS', hint: '(satu per baris)', ph: 'Nasi putih\nTelur\nKecap manis', rows: 4 }, { key: 'steps', label: 'STEPS', hint: '(satu per baris)', ph: 'Panaskan minyak di wajan.\nMasukkan bumbu, tumis hingga harum.\nTambahkan nasi, aduk rata.', rows: 5 }].map(({ key, label, hint, ph, rows }) => (
                <div key={key}>
                  <label className="block mb-1.5" style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#5a5040', letterSpacing: '0.06em' }}>{label} <span style={{ color: '#9a9585', fontWeight: 400 }}>{hint}</span></label>
                  <textarea value={(addForm as any)[key]} onChange={e => setAddForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph} rows={rows} onFocus={() => setFocusedField(key)} onBlur={() => setFocusedField(null)} style={{ ...inputStyle(key), resize: 'vertical' }} />
                </div>
              ))}
            </div>
            <div className="flex gap-3 px-6 py-4 flex-shrink-0" style={{ borderTop: '1px solid #e0dbc8' }}>
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-xl" style={{ background: '#f0ece0', color: '#6b6356', fontFamily: PP, fontSize: '14px', fontWeight: 600 }}>Cancel</button>
              <button onClick={handleAddManual} disabled={saving || !addForm.title || !addForm.ingredients || !addForm.steps} className="flex-1 py-2.5 rounded-xl text-white disabled:opacity-50" style={{ background: '#3d5429', fontFamily: PP, fontSize: '14px', fontWeight: 600 }}>{saving ? 'Saving...' : 'Save Recipe'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Detail Modal - Adaptive padding and image display */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl flex flex-col overflow-hidden m-2" style={{ maxHeight: 'calc(100vh - 2rem)', border: '1px solid #e0dbc8' }}>
            {selected.image ? (
              <div className="relative flex-shrink-0" style={{ height: '200px' }}>
                <img src={selected.image} alt={selected.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = FALLBACK }} />
                <button onClick={() => setSelected(null)} className="absolute top-3 right-3 p-2 rounded-full shadow-md" style={{ background: 'rgba(0,0,0,0.5)' }}><X size={16} style={{ color: 'white' }} /></button>
              </div>
            ) : (
              <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0" style={{ borderBottom: '1px solid #e0dbc8' }}>
                <span /><button onClick={() => setSelected(null)} className="p-2 rounded-full hover:bg-gray-100"><X size={18} /></button>
              </div>
            )}
            <div className="overflow-y-auto flex-1 px-5 py-5">
              <h2 style={{ fontFamily: PP, fontSize: '20px', fontWeight: 700, color: '#1a1a14', marginBottom: '6px' }}>{selected.title}</h2>
              <p style={{ fontFamily: PP, fontSize: '13px', color: '#8a8070', marginBottom: '16px', lineHeight: 1.6 }}>{selected.description}</p>
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: '#f4f7f0', fontFamily: PP, fontSize: '12px', color: '#3d5429' }}><Clock size={12} /> {selected.time}</span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: '#f4f7f0', fontFamily: PP, fontSize: '12px', color: '#3d5429' }}><ChefHat size={12} /> {selected.difficulty}</span>
              </div>
              <h4 style={{ fontFamily: PP, fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>Ingredients</h4>
              <ul className="space-y-1.5 mb-6">{selected.ingredients.map((ing, i) => <li key={i} className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#3d5429' }} /><span style={{ fontFamily: PP, fontSize: '13px', color: '#4a4030' }}>{ing}</span></li>)}</ul>
              <h4 style={{ fontFamily: PP, fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>Steps</h4>
              <ol className="space-y-3">{selected.steps.map((step, i) => <li key={i} className="flex gap-3"><span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#3d5429', color: 'white', fontFamily: PP, fontSize: '11px', fontWeight: 700 }}>{i + 1}</span><span style={{ fontFamily: PP, fontSize: '13px', color: '#4a4030', lineHeight: 1.6 }}>{step}</span></li>)}</ol>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}