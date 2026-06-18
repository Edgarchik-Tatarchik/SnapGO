import { useEffect, useState } from 'react'
import { getRandomQuizScan, recordQuizAttempt, type QuizScan } from '../lib/quiz'

interface QuizPageProps {
  onExit: () => void
}

export function QuizPage({ onExit }: QuizPageProps) {
    const [current, setCurrent] = useState<QuizScan | null>(null)
    const [options, setOptions] = useState<string[]>([])
    const [selected, setSelected] = useState<string | null>(null)
    const [shownIds, setShownIds] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [empty, setEmpty] = useState(false)

useEffect(() => {
    loadNext([])
}, [])

async function loadNext(excludeIds: string[]) {
    setLoading(true)
    setSelected(null)

    let scan = await getRandomQuizScan(excludeIds)
    let nextShownIds = excludeIds

    if (!scan && excludeIds.length > 0) {
      scan = await getRandomQuizScan([])
      nextShownIds = []
    }

    if (!scan) {
      setEmpty(true)
      setLoading(false)
      return
    }

    setShownIds([...nextShownIds, scan.id])

    const shuffled = [scan.translated_text, ...scan.quiz_distractors]
      .sort(() => Math.random() - 0.5)

    setCurrent(scan)
    setOptions(shuffled)
    setLoading(false)
  }

async function handleAnswer(answer: string) {
    if (!current || selected) return
    setSelected(answer)
    await recordQuizAttempt(current.id, answer === current.translated_text)
  }

    if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <p className="text-xl">読み込み中...</p>
    </div>
  )

    if (empty) return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-4 p-8">
      <p className="text-center">クイズに使える写真がまだありません</p>
      <p className="text-gray-400 text-sm text-center">写真を撮影してから、もう一度試してください</p>
      <button onClick={onExit} className="bg-blue-600 px-6 py-3 rounded-xl mt-4 cursor-pointer hover:bg-blue-500">
        メニューに戻る
      </button>
    </div>
  )

    return (
    <div className="flex flex-col h-screen bg-gray-900 text-white p-6 gap-4">
      <div className="flex justify-between items-center">
        <p className="text-gray-400 text-sm">これは何ですか？</p>
        <button onClick={onExit} className="text-red-400 text-sm cursor-pointer">終了</button>
      </div>

      <img src={current?.image_url} className="w-full max-h-56 object-contain rounded-xl" />

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
        <button
          onClick={() => loadNext(shownIds)}
          className="mt-auto py-4 rounded-xl bg-blue-600 text-white text-lg cursor-pointer hover:bg-blue-500 transition-colors"
        >
          次へ
        </button>
      )}
    </div>
  )
}