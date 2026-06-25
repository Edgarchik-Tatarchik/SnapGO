import { useState } from 'react'
import { getRandomQuizScan, recordQuizAttempt, getScanStatus, type QuizScan, type QuizStatus } from '../lib/quiz'

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

const STATUS_LABELS: Record<QuizStatus, { label: string; color: string }> = {
  new:      { label: '初めて',     color: 'text-gray-400' },
  learning: { label: '学習中',     color: 'text-yellow-400' },
  mastered: { label: '習得済み',   color: 'text-green-400' },
}

interface QuizPageProps {
  onExit: () => void
}

type Screen = 'category-select' | 'quiz'

export function QuizPage({ onExit }: QuizPageProps) {
  const [screen, setScreen] = useState<Screen>('category-select')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [current, setCurrent] = useState<QuizScan | null>(null)
  const [currentStatus, setCurrentStatus] = useState<QuizStatus>('new')
  const [options, setOptions] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [shownIds, setShownIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [empty, setEmpty] = useState(false)

  async function startQuiz(category: string | null) {
    setSelectedCategory(category)
    setScreen('quiz')
    await loadNext([], category)
  }

  async function loadNext(excludeIds: string[], category: string | null = selectedCategory) {
    setLoading(true)
    setSelected(null)

    let scan = await getRandomQuizScan(excludeIds, category)
    let nextShownIds = excludeIds

    if (!scan && excludeIds.length > 0) {
      scan = await getRandomQuizScan([], category)
      nextShownIds = []
    }

    if (!scan) {
      setEmpty(true)
      setLoading(false)
      return
    }

    setShownIds([...nextShownIds, scan.id])

    const status = await getScanStatus(scan.id)
    setCurrentStatus(status)

    const shuffled = [scan.translated_text, ...scan.quiz_distractors]
      .sort(() => Math.random() - 0.5)

    setCurrent(scan)
    setOptions(shuffled)
    setLoading(false)
  }

  async function handleAnswer(answer: string) {
    if (!current || selected) return
    const wasCorrect = answer === current.translated_text
    setSelected(answer)
    await recordQuizAttempt(current.id, wasCorrect)

    const newStatus = await getScanStatus(current.id)
    setCurrentStatus(newStatus)
  }

  if (screen === 'category-select') return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <div className="flex items-center gap-4 p-4 border-b border-gray-700">
        <button onClick={onExit} className="text-blue-400 cursor-pointer hover:scale-105 transition-transform">← 戻る</button>
        <h2 className="text-lg font-bold">カテゴリーを選ぶ</h2>
      </div>

      <div className="flex flex-col gap-3 p-4">
        <button
          onClick={() => startQuiz(null)}
          className="py-4 px-5 rounded-xl bg-blue-600 text-white text-left cursor-pointer hover:bg-blue-500 transition-colors"
        >
          <span className="text-lg">🎯</span>
          <span className="ml-3 font-bold">すべてのカテゴリー</span>
        </button>

        <div className="mt-2 grid grid-cols-2 gap-3">
          {Object.entries(CATEGORY_LABELS).map(([key, { emoji, label }]) => (
            <button
              key={key}
              onClick={() => startQuiz(key)}
              className="py-3 px-4 rounded-xl bg-gray-800 text-white text-left cursor-pointer hover:bg-gray-700 transition-colors"
            >
              <span className="text-xl">{emoji}</span>
              <p className="text-xs text-gray-300 mt-1">{label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <p className="text-xl">読み込み中...</p>
    </div>
  )

  if (empty) return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-4 p-8">
      <p className="text-center font-bold">
        {selectedCategory
          ? `${CATEGORY_LABELS[selectedCategory]?.emoji} このカテゴリーは全部習得しました！`
          : 'すべて習得しました！'}
      </p>
      <p className="text-gray-400 text-sm text-center">新しい写真を撮ってもっと学びましょう</p>
      <button
        onClick={() => { setScreen('category-select'); setEmpty(false); setShownIds([]) }}
        className="bg-blue-600 px-6 py-3 rounded-xl mt-2 cursor-pointer hover:bg-blue-500"
      >
        カテゴリーに戻る
      </button>
      <button onClick={onExit} className="text-gray-400 text-sm cursor-pointer">
        メニューに戻る
      </button>
    </div>
  )

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white p-6 gap-4">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <p className="text-gray-400 text-sm">これは何ですか？</p>
          {current?.category && CATEGORY_LABELS[current.category] && (
            <p className="text-xs text-gray-500">
              {CATEGORY_LABELS[current.category].emoji} {CATEGORY_LABELS[current.category].label}
            </p>
          )}
        </div>
        <button
        onClick={() => { setScreen('category-select'); setEmpty(false); setShownIds([]) }}
        className="text-blue-400 text-sm cursor-pointer hover:text-blue-300"
        >
          カテゴリー一覧
          </button>
      </div>

      <img src={current?.image_url} className="w-full max-h-48 object-contain rounded-xl" />

      {current?.ocr_text && (
        <div className="bg-gray-800 rounded-xl px-4 py-2">
          <p className="text-white text-center text-lg">{current.ocr_text}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => handleAnswer(opt)}
            disabled={!!selected}
            className={`py-3 px-4 rounded-xl text-left transition-colors ${
              selected
                ? opt === current?.translated_text
                  ? 'bg-green-600'
                  : opt === selected
                    ? 'bg-red-600'
                    : 'bg-gray-700'
                : 'bg-gray-700 cursor-pointer hover:bg-gray-600'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {selected && (
        <div className="mt-auto flex flex-col gap-2">
          <p className={`text-center text-sm ${STATUS_LABELS[currentStatus].color}`}>
            {STATUS_LABELS[currentStatus].label}
          </p>
          <button
            onClick={() => loadNext(shownIds)}
            className="py-4 rounded-xl bg-blue-600 text-white text-lg cursor-pointer hover:bg-blue-500 transition-colors"
          >
            次へ
          </button>
        </div>
      )}
    </div>
  )
}