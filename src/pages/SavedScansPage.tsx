import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { deleteScan } from '../lib/storage'

const CATEGORY_LABELS: Record<string, { emoji: string; label: string }> = {
  food:          { emoji: '🍜', label: '食べ物・飲み物' },
  transport:     { emoji: '🚃', label: '交通・道路' },
  shopping:      { emoji: '🛍️', label: '買い物' },
  warning:       { emoji: '⚠️', label: '注意・警告' },
  public:        { emoji: '🏛️', label: '公共施設' },
  nature:        { emoji: '🌿', label: '自然・公園' },
  medical:       { emoji: '💊', label: '医療・薬局' },
  entertainment: { emoji: '🎮', label: '娯楽・観光' },
  work:          { emoji: '💼', label: 'ビジネス・会社' },
  housing:       { emoji: '🏠', label: '住宅・不動産' },
  seasonal:      { emoji: '🎌', label: '季節・イベント' },
  beauty:        { emoji: '💇', label: '美容・ファッション' },
  technology:    { emoji: '📱', label: '電気・技術' },
  religion:      { emoji: '⛩️', label: '宗教・神社仏閣' },
  education:     { emoji: '📚', label: '教育・学校' },
  other:         { emoji: '📦', label: 'その他' },
}

interface Scan {
  id: string
  image_url: string
  ocr_text: string
  translated_text: string
  created_at: string
  category: string | null
}

interface SavedScansPageProps {
  onBack: () => void
}

export function SavedScansPage({ onBack }: SavedScansPageProps) {
  const [scans, setScans] = useState<Scan[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showCategoryFilter, setShowCategoryFilter] = useState(false)

  useEffect(() => {
    async function loadScans() {
      const { data } = await supabase
        .from('scans')
        .select('id, image_url, ocr_text, translated_text, created_at, category')
        .order('created_at', { ascending: false })
      setScans(data ?? [])
      setLoading(false)
    }
    loadScans()
  }, [])


  const filtered = useMemo(() => {
    let result = scans

    if (selectedCategory) {
      result = result.filter(s => s.category === selectedCategory)
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase()
      result = result.filter(s =>
        s.ocr_text?.toLowerCase().includes(q) ||
        s.translated_text?.toLowerCase().includes(q)
      )
    }

    return result
  }, [scans, query, selectedCategory])

 
  const availableCategories = useMemo(() => {
    const cats = new Set(scans.map(s => s.category).filter(Boolean) as string[])
    return Array.from(cats).sort()
  }, [scans])

  async function handleDelete(scan: Scan) {
    const confirmed = window.confirm('この写真を削除しますか？')
    if (!confirmed) return

    setDeletingId(scan.id)
    const success = await deleteScan(scan.id, scan.image_url)
    setDeletingId(null)

    if (success) {
      setScans(prev => prev.filter(s => s.id !== scan.id))
    } else {
      alert('削除に失敗しました')
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">

      {/* Шапка */}
      <div className="flex items-center gap-4 p-4 border-b border-gray-700">
        <button onClick={onBack} className="text-blue-400 cursor-pointer hover:scale-105 transition-transform">← 戻る</button>
        <h2 className="text-lg font-bold">保存された写真</h2>
        {scans.length > 0 && (
          <span className="text-gray-500 text-sm ml-auto">{filtered.length} / {scans.length}</span>
        )}
      </div>

   
      {!loading && scans.length > 0 && (
        <div className="flex flex-col gap-2 px-4 pt-3 pb-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="検索..."
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-2.5 pr-8 text-sm outline-none focus:ring-1 focus:ring-blue-500"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={() => setShowCategoryFilter(!showCategoryFilter)}
              className={`px-3 py-2.5 rounded-xl text-sm transition-colors ${
                selectedCategory
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {selectedCategory
                ? CATEGORY_LABELS[selectedCategory]?.emoji
                : '🔽'}
            </button>
          </div>

         
          {showCategoryFilter && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setSelectedCategory(null); setShowCategoryFilter(false) }}
                className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                  !selectedCategory ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
                }`}
              >
                すべて
              </button>
              {availableCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setShowCategoryFilter(false) }}
                  className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                    selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {CATEGORY_LABELS[cat]?.emoji} {CATEGORY_LABELS[cat]?.label ?? cat}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <p>読み込み中...</p>
        </div>
      ) : scans.length === 0 ? (
        <div className="flex items-center justify-center flex-1">
          <p className="text-gray-400">まだスキャンがありません</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-2">
          <p className="text-gray-400">見つかりませんでした</p>
          <button
            onClick={() => { setQuery(''); setSelectedCategory(null) }}
            className="text-blue-400 text-sm"
          >
            検索をリセット
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 p-4">
          {filtered.map(scan => (
            <div key={scan.id} className="bg-gray-800 rounded-xl p-4 flex gap-4 items-start">
              <img src={scan.image_url} className="w-20 h-20 object-cover rounded-lg" />
              <div className="flex flex-col gap-1 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-400">{new Date(scan.created_at).toLocaleDateString('ja-JP')}</p>
                  {scan.category && CATEGORY_LABELS[scan.category] && (
                    <span className="text-xs text-gray-400">
                      {CATEGORY_LABELS[scan.category].emoji} {CATEGORY_LABELS[scan.category].label}
                    </span>
                  )}
                </div>
                <p className="text-white font-medium">{scan.ocr_text}</p>
                <p className="text-blue-300 text-sm">{scan.translated_text}</p>
              </div>
              <button
                onClick={() => handleDelete(scan)}
                disabled={deletingId === scan.id}
                className="text-red-400 text-sm cursor-pointer hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingId === scan.id ? '削除中...' : '削除'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}