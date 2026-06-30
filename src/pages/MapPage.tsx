import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../lib/supabase'

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

interface MapScan {
  id: string
  image_url: string
  ocr_text: string
  translated_text: string
  category: string | null
  latitude: number
  longitude: number
}

interface MapPageProps {
  onBack: () => void
}

function createCategoryIcon(category: string | null) {
  const emoji = category && CATEGORY_LABELS[category] ? CATEGORY_LABELS[category].emoji : '📦'
  return L.divIcon({
    html: `<div style="
      background: #1f2937;
      border: 2px solid #3b82f6;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    ">${emoji}</div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  })
}

function FitBounds({ scans }: { scans: MapScan[] }) {
  const map = useMap()

  useEffect(() => {
    if (scans.length === 0) return

    if (scans.length === 1) {
      map.setView([scans[0].latitude, scans[0].longitude], 15)
      return
    }

    const bounds = L.latLngBounds(scans.map(s => [s.latitude, s.longitude]))
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [scans, map])

  return null
}

export function MapPage({ onBack }: MapPageProps) {
  const [scans, setScans] = useState<MapScan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    async function loadScans() {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id
      if (!userId) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('scans')
        .select('id, image_url, ocr_text, translated_text, category, latitude, longitude')
        .eq('user_id', userId)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)

      setScans(data ?? [])
      setLoading(false)
    }
    loadScans()
  }, [])

  const filtered = selectedCategory
    ? scans.filter(s => s.category === selectedCategory)
    : scans

  const availableCategories = Array.from(
    new Set(scans.map(s => s.category).filter(Boolean) as string[])
  ).sort()

  const defaultCenter: [number, number] = [35.6762, 139.6503]

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <p>読み込み中...</p>
    </div>
  )

  return (
    <div className="flex flex-col" style={{ height: '100dvh' }}>

      <div className="flex items-center gap-4 p-4 bg-gray-900 text-white border-b border-gray-700 z-10">
        <button onClick={onBack} className="text-blue-400 cursor-pointer hover:scale-105 transition-transform">
          ← 戻る
        </button>
        <h2 className="text-lg font-bold">地図</h2>
        {scans.length > 0 && (
          <span className="text-gray-500 text-sm ml-auto">{filtered.length} / {scans.length}</span>
        )}
      </div>

      {availableCategories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto p-3 bg-gray-900 border-b border-gray-700">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
              !selectedCategory ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            すべて
          </button>
          {availableCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
              }`}
            >
              {CATEGORY_LABELS[cat]?.emoji} {CATEGORY_LABELS[cat]?.label ?? cat}
            </button>
          ))}
        </div>
      )}

      {scans.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 text-white gap-3 p-8">
          <p className="text-3xl">📍</p>
          <p className="text-gray-400 text-center text-sm">
            位置情報付きのスキャンがまだありません
          </p>
          <p className="text-gray-500 text-center text-xs">
            撮影時に位置情報を許可すると、ここに表示されます
          </p>
        </div>
      ) : (
        <div className="flex-1">
          <MapContainer
            center={defaultCenter}
            zoom={12}
            style={{ width: '100%', height: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            <FitBounds scans={filtered} />

            {filtered.map(scan => (
              <Marker
                key={scan.id}
                position={[scan.latitude, scan.longitude]}
                icon={createCategoryIcon(scan.category)}
              >
                <Popup>
                  <div style={{ minWidth: '160px' }}>
                    <img
                      src={scan.image_url}
                      style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', marginBottom: '6px' }}
                    />
                    <p style={{ fontWeight: 'bold', fontSize: '13px', margin: '0 0 2px' }}>{scan.ocr_text}</p>
                    <p style={{ color: '#2563eb', fontSize: '12px', margin: 0 }}>{scan.translated_text}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  )
}