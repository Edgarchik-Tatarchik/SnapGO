import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { deleteScan } from '../lib/storage'

interface Scan {
  id: string
  image_url: string
  ocr_text: string
  translated_text: string
  created_at: string
}

interface SavedScansPageProps {
  onBack: () => void
}

export function SavedScansPage({ onBack }: SavedScansPageProps) {
  const [scans, setScans] = useState<Scan[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    async function loadScans() {
      const { data } = await supabase
        .from('scans')
        .select('*')
        .order('created_at', { ascending: false })
      setScans(data ?? [])
      setLoading(false)
    }
    loadScans()
  }, [])

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
      <div className="flex items-center gap-4 p-4 border-b border-gray-700">
        <button onClick={onBack} className="text-blue-400 cursor-pointer hover:scale-105 transition-transform">← 戻る</button>
        <h2 className="text-lg font-bold">保存された写真</h2>
      </div>
      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <p>読み込み中...</p>
        </div>
      ) : scans.length === 0 ? (
        <div className="flex items-center justify-center flex-1">
          <p className="text-gray-400">まだスキャンがありません</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 p-4">
          {scans.map(scan => (
            <div key={scan.id} className="bg-gray-800 rounded-xl p-4 flex gap-4 items-start">
              <img src={scan.image_url} className="w-20 h-20 object-cover rounded-lg" />
              <div className="flex flex-col gap-1 flex-1">
                <p className="text-sm text-gray-400">{new Date(scan.created_at).toLocaleDateString('ja-JP')}</p>
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