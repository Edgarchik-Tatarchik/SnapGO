import { useEffect, useState } from 'react'
import { getProgressStats } from '../lib/quiz'
import { getStreakStats, type StreakStats } from '../lib/streak'

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

interface HomePageProps {
  onStartCamera: () => void
  onViewSaved: () => void
  onStartQuiz: () => void
  onOpenSettings: () => void
  onOpenStats: () => void
  onOpenMap: () => void
}

interface ProgressStats {
  total: number
  mastered: number
  learning: number
  byCategory: Record<string, { mastered: number; learning: number; new: number }>
}

export default function HomePage({ onStartCamera, onViewSaved, onStartQuiz, onOpenSettings, onOpenStats, onOpenMap }: HomePageProps) {
  const [stats, setStats] = useState<ProgressStats | null>(null)
  const [streak, setStreak] = useState<StreakStats | null>(null)

  useEffect(() => {
    getProgressStats().then(setStats)
    getStreakStats().then(setStreak)
  }, [])

  const activeCats = stats
    ? Object.entries(stats.byCategory).filter(([, v]) => v.mastered + v.learning + v.new > 0)
    : []

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white relative">

      <div className="absolute top-4 right-4 flex gap-3">
        <button
          onClick={onOpenStats}
          className="text-gray-400 hover:text-white transition-colors cursor-pointer text-sm"
        >
          統計
        </button>
        <button
          onClick={onOpenSettings}
          className="text-gray-400 hover:text-white transition-colors cursor-pointer text-sm"
        >
          設定
        </button>
      </div>

      <div className="flex flex-col items-center pt-12 pb-6 px-8">
        <div className="mb-2">
          <h1 className="text-5xl font-bold tracking-tight text-center">
            <span className="text-white">Snap</span><span className="text-blue-400">GO</span>
          </h1>
        </div>
        <h2 className="text-lg font-medium text-white mb-1">スナップ語</h2>
        <p className="text-gray-400 text-sm">見て、撮って、覚える</p>
      </div>

      {streak !== null && (
        <div
          onClick={onOpenStats}
          className="mx-8 mb-3 bg-gray-800 rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer active:scale-95 transition-all"
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">{streak.todayDone ? '🔥' : '⬜'}</span>
            <div>
              <p className="text-white font-bold">{streak.current} 日連続</p>
              <p className="text-gray-400 text-xs">
                {streak.todayDone ? '今日完了！' : '今日まだです'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-yellow-400 text-xs">🏆 最高 {streak.record} 日</p>
            <p className="text-gray-500 text-xs mt-0.5">統計を見る →</p>
          </div>
        </div>
      )}

      <div className="flex flex-col px-8 gap-3">
        <button onClick={onStartCamera} className="py-4 rounded-xl bg-blue-600 text-white text-lg font-bold cursor-pointer hover:bg-blue-500 active:scale-95 transition-all">
          撮影する
        </button>
        <div className="flex gap-3">
          <button onClick={onViewSaved} className="flex-1 py-4 rounded-xl bg-gray-700 text-white text-base cursor-pointer hover:bg-gray-600 active:scale-95 transition-all">
            保存した写真
          </button>
          <button onClick={onStartQuiz} className="flex-1 py-4 rounded-xl bg-purple-600 text-white text-base cursor-pointer hover:bg-purple-500 active:scale-95 transition-all">
            クイズ
          </button>
        </div>
        <button onClick={onOpenMap} className="py-4 rounded-xl bg-teal-600 text-white text-base cursor-pointer hover:bg-teal-500 active:scale-95 transition-all">
          🗺️ 地図で見る
        </button>
      </div>

      <div className="flex flex-col px-8 mt-4 gap-3 pb-8">

        {stats && stats.total > 0 && (
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-3">習得状況</p>
            <div className="flex gap-4">
              <div className="flex-1 text-center">
                <p className="text-2xl font-bold text-green-400">{stats.mastered}</p>
                <p className="text-gray-400 text-xs mt-1">習得済み</p>
              </div>
              <div className="w-px bg-gray-700" />
              <div className="flex-1 text-center">
                <p className="text-2xl font-bold text-yellow-400">{stats.learning}</p>
                <p className="text-gray-400 text-xs mt-1">学習中</p>
              </div>
              <div className="w-px bg-gray-700" />
              <div className="flex-1 text-center">
                <p className="text-2xl font-bold text-gray-400">{stats.total - stats.mastered - stats.learning}</p>
                <p className="text-gray-400 text-xs mt-1">未学習</p>
              </div>
            </div>

            <div className="mt-3 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-400 rounded-full transition-all"
                style={{ width: `${(stats.mastered / stats.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {activeCats.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-3">カテゴリー別</p>
            <div className="flex flex-col gap-2">
              {activeCats.map(([cat, v]) => {
                const total = v.mastered + v.learning + v.new
                const pct = total > 0 ? (v.mastered / total) * 100 : 0
                const info = CATEGORY_LABELS[cat]
                return (
                  <div key={cat}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">
                        {info?.emoji} {info?.label ?? cat}
                      </span>
                      <span className="text-xs text-gray-400">
                        {v.mastered}/{total}
                      </span>
                    </div>
                    <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {stats && stats.total === 0 && (
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <p className="text-gray-400 text-sm">写真を撮影してから学習を始めましょう</p>
          </div>
        )}

      </div>
    </div>
  )
}