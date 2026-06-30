import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { subscribeToPush, unsubscribeFromPush, isPushSubscribed } from '../lib/push'

interface SettingsPageProps {
  onBack: () => void
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const [pushEnabled, setPushEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      setUserId(userData.user?.id ?? null)
      const subscribed = await isPushSubscribed()
      setPushEnabled(subscribed)
      setLoading(false)
    }
    init()
  }, [])

  async function handleToggle() {
    setToggling(true)
    if (pushEnabled) {
      const success = await unsubscribeFromPush()
      if (success) setPushEnabled(false)
    } else {
      const success = await subscribeToPush()
      if (success) setPushEnabled(true)
    }
    setToggling(false)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <div className="flex items-center gap-4 p-4 border-b border-gray-700">
        <button onClick={onBack} className="text-blue-400 cursor-pointer hover:scale-105 transition-transform">
          ← 戻る
        </button>
        <h2 className="text-lg font-bold">設定</h2>
      </div>

      <div className="flex flex-col gap-2 p-4">
        <p className="text-gray-400 text-xs uppercase tracking-wider px-2 mb-1">通知</p>
        <div className="bg-gray-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-white font-medium">プッシュ通知</p>
            <p className="text-gray-400 text-sm">毎日12時に学習まとめをお届けします</p>
            </div>
            {loading ? (
              <div className="w-12 h-6 bg-gray-600 rounded-full flex-shrink-0" />
            ) : (
            <button
            onClick={handleToggle}
            disabled={toggling}
            className={`w-12 h-6 rounded-full transition-colors duration-200 relative cursor-pointer disabled:opacity-50 flex-shrink-0 ${
              pushEnabled ? 'bg-blue-600' : 'bg-gray-600'
              }`}>
                <span
                className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200"
                style={{ left: pushEnabled ? '26px' : '4px' }}
                />
                </button>
              )}
              </div>
              </div>
              <div className="flex flex-col gap-2 p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider px-2 mb-1">アカウント</p>
                <div className="bg-gray-800 rounded-xl p-4">
                  <p className="text-gray-400 text-sm">ユーザーID</p>
                  <p className="text-white text-sm font-mono mt-1">
                    {userId ? `${userId.slice(0, 8)}...` : '—'}
                    </p>
                    </div>
                    </div>
                    <div className="flex flex-col gap-2 p-4">
                      <p className="text-gray-400 text-xs uppercase tracking-wider px-2 mb-1">アプリについて</p>
                      <div className="bg-gray-800 rounded-xl p-4 flex flex-col gap-2">
                        <div className="flex justify-between">
                          <p className="text-gray-400 text-sm">バージョン</p>
                          <p className="text-white text-sm">1.3.1</p>
                          </div>
                          <div className="flex justify-between">
                            <p className="text-gray-400 text-sm">© 2026</p>
                            <p className="text-white text-sm">スナップ語™</p>
                </div>
        </div>
      </div>
    </div>
  )
}