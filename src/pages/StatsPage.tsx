import { useEffect, useState } from 'react'
import { getStreakStats, type StreakStats } from '../lib/streak'
import { getProgressStats, getDueForReview } from '../lib/quiz'
import { supabase } from '../lib/supabase'

interface StatsPageProps {
  onBack: () => void
  onStartQuiz: () => void
}

interface QuizAccuracy {
  total: number
  correct: number
  pct: number
}

interface HardWord {
  ocr_text: string
  translated_text: string
  total: number
  wrong: number
  pct: number
}

interface DayActivity {
  date: string
  label: string 
  count: number
}

interface WeekMastered {
  label: string 
  count: number
}

const JST = 9 * 60 * 60 * 1000
const toJST = (d: string) => new Date(new Date(d).getTime() + JST).toISOString().slice(0, 10)

export function StatsPage({ onBack, onStartQuiz }: StatsPageProps) {
  const [streak, setStreak] = useState<StreakStats | null>(null)
  const [progress, setProgress] = useState<{ total: number; mastered: number; learning: number } | null>(null)
  const [accuracy, setAccuracy] = useState<QuizAccuracy | null>(null)
  const [hardWords, setHardWords] = useState<HardWord[]>([])
  const [activityGrid, setActivityGrid] = useState<Map<string, number>>(new Map())
  const [dueCount, setDueCount] = useState<number>(0)
  const [weekActivity, setWeekActivity] = useState<DayActivity[]>([])
  const [weeklyMastered, setWeeklyMastered] = useState<WeekMastered[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    if (!userId) return

    const [streakData, progressData, attemptsResult, scansResult, srsResult, due] = await Promise.all([
      getStreakStats(),
      getProgressStats(),
      supabase.from('quiz_attempts').select('scan_id, was_correct, created_at').eq('user_id', userId),
      supabase.from('scans').select('id, ocr_text, translated_text, created_at').eq('user_id', userId),
      supabase.from('srs_state').select('scan_id, interval_days, last_reviewed_at').eq('user_id', userId).not('last_reviewed_at', 'is', null),
      getDueForReview()
    ])

    setStreak(streakData)
    setProgress(progressData)
    setDueCount(due)

    const attempts = attemptsResult.data ?? []
    const total = attempts.length
    const correct = attempts.filter(a => a.was_correct).length
    setAccuracy({ total, correct, pct: total > 0 ? Math.round((correct / total) * 100) : 0 })

    const scans = scansResult.data ?? []
    const scanMap = new Map(scans.map(s => [s.id, s]))
    const byWord = new Map<string, { total: number; wrong: number }>()

    for (const a of attempts) {
      const entry = byWord.get(a.scan_id) ?? { total: 0, wrong: 0 }
      entry.total++
      if (!a.was_correct) entry.wrong++
      byWord.set(a.scan_id, entry)
    }

    const hard: HardWord[] = []
    for (const [scanId, stat] of byWord.entries()) {
      if (stat.total < 3) continue
      const scan = scanMap.get(scanId)
      if (!scan) continue
      hard.push({
        ocr_text: scan.ocr_text,
        translated_text: scan.translated_text,
        total: stat.total,
        wrong: stat.wrong,
        pct: Math.round((stat.wrong / stat.total) * 100)
      })
    }
    setHardWords(hard.sort((a, b) => b.pct - a.pct).slice(0, 5))

    
    const grid = new Map<string, number>()
    for (const a of attempts) grid.set(toJST(a.created_at), (grid.get(toJST(a.created_at)) ?? 0) + 1)
    for (const s of scans) grid.set(toJST(s.created_at), (grid.get(toJST(s.created_at)) ?? 0) + 1)
    setActivityGrid(grid)

    const todayJST = new Date(Date.now() + JST)
    const dayOfWeek = todayJST.getUTCDay() // 0=вс, 1=пн...
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const monday = new Date(Date.now() + JST - daysFromMonday * 24 * 60 * 60 * 1000)

    const WEEK_LABELS = ['月', '火', '水', '木', '金', '土', '日']
    const last7: DayActivity[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getTime() + i * 24 * 60 * 60 * 1000)
      const dateStr = d.toISOString().slice(0, 10)
      last7.push({
        date: dateStr,
        label: WEEK_LABELS[i],
        count: grid.get(dateStr) ?? 0
      })
    }
    setWeekActivity(last7)
    


    
    const srsData = srsResult.data ?? []
    const masteredByWeek = new Map<string, number>()

    for (const row of srsData) {
      if (!row.last_reviewed_at || row.interval_days < 21) continue
      const d = new Date(new Date(row.last_reviewed_at).getTime() + JST)
      const weekStart = new Date(d)
      weekStart.setDate(d.getDate() - d.getDay())
      const weekKey = weekStart.toISOString().slice(0, 10)
      masteredByWeek.set(weekKey, (masteredByWeek.get(weekKey) ?? 0) + 1)
    }

    const weekly: WeekMastered[] = []
    for (let i = 7; i >= 0; i--) {
      const d = new Date(Date.now() + JST - i * 7 * 24 * 60 * 60 * 1000)
      const weekStart = new Date(d)
      weekStart.setDate(d.getDate() - d.getDay())
      const weekKey = weekStart.toISOString().slice(0, 10)
      const month = weekStart.getMonth() + 1
      const day = weekStart.getDate()
      weekly.push({
        label: `${month}/${day}`,
        count: masteredByWeek.get(weekKey) ?? 0
      })
    }
    setWeeklyMastered(weekly)

    setLoading(false)
  }

  function getLast70Days(): string[] {
    const days: string[] = []
    for (let i = 69; i >= 0; i--) {
      const d = new Date(Date.now() + JST - i * 24 * 60 * 60 * 1000)
      days.push(d.toISOString().slice(0, 10))
    }
    return days
  }

  function getActivityColor(count: number): string {
    if (count === 0) return 'bg-gray-700'
    if (count <= 2) return 'bg-blue-900'
    if (count <= 5) return 'bg-blue-600'
    return 'bg-blue-400'
  }

 
  function BarChart({
  data,
  color,
  today,
}: {
  data: { label: string; count: number; date?: string }[]
  color: string
  today?: string
}) {
  const maxVal = Math.max(...data.map(d => d.count), 1)
  const chartH = 80
  const barW = 28
  const gap = 8
  const totalW = data.length * (barW + gap) - gap

  return (
    <svg width="100%" viewBox={`0 0 ${totalW} ${chartH + 24}`} preserveAspectRatio="xMidYMid meet">
      {data.map((d, i) => {
        const barH = Math.max(2, (d.count / maxVal) * chartH)
        const x = i * (barW + gap)
        const y = chartH - barH
        const isToday = today && d.date === today
        return (
          <g key={i}>
            <rect
              x={x} y={y}
              width={barW} height={barH}
              rx={4}
              fill={d.count > 0 ? color : '#374151'}
              opacity={isToday ? 1 : 0.7}
            />
            {isToday && (
              <rect
                x={x} y={chartH + 4}
                width={barW} height={3}
                rx={1.5}
                fill={color}
              />
            )}
            {d.count > 0 && (
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="9" fill="#9ca3af">
                {d.count}
              </text>
            )}
            <text
              x={x + barW / 2} y={chartH + 16}
              textAnchor="middle"
              fontSize="10"
              fill={isToday ? '#ffffff' : '#6b7280'}
              fontWeight={isToday ? 'bold' : 'normal'}
            >
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <p>読み込み中...</p>
    </div>
  )

  const days = getLast70Days()

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <div className="flex items-center gap-4 p-4 border-b border-gray-700">
        <button onClick={onBack} className="text-blue-400 cursor-pointer hover:scale-105 transition-transform">
          ← 戻る
        </button>
        <h2 className="text-lg font-bold">統計</h2>
      </div>

      <div className="flex flex-col gap-4 p-4 pb-8">

       
        {dueCount > 0 ? (
          <div onClick={onStartQuiz} className="bg-orange-600 rounded-xl p-4 cursor-pointer active:scale-95 transition-all">
            <p className="text-orange-200 text-xs mb-1">今日の復習</p>
            <div className="flex items-center justify-between">
              <p className="text-white font-bold text-lg">🔁 {dueCount} 個の単語が待っています</p>
              <span className="text-white text-sm">クイズへ →</span>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-green-400 text-sm"> 今日の復習は完了しています</p>
          </div>
        )}

      
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-3">ストリーク</p>
          <div className="flex gap-4">
            <div className="flex-1 text-center">
              <p className="text-4xl font-bold">{streak?.todayDone ? '🔥' : '⬜'} {streak?.current ?? 0}</p>
              <p className="text-gray-400 text-xs mt-1">現在</p>
            </div>
            <div className="w-px bg-gray-700" />
            <div className="flex-1 text-center">
              <p className="text-4xl font-bold text-yellow-400">🏆 {streak?.record ?? 0}</p>
              <p className="text-gray-400 text-xs mt-1">最高記録</p>
            </div>
          </div>
          {!streak?.todayDone && (
            <p className="text-center text-yellow-400 text-xs mt-3">今日まだ学習していません — ストリークを守ろう！</p>
          )}
          {streak?.todayDone && (
            <p className="text-center text-green-400 text-xs mt-3"> 今日の学習完了！</p>
          )}
        </div>

       
        {progress && (
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-3">学習進捗</p>
            <div className="flex gap-4">
              <div className="flex-1 text-center">
                <p className="text-2xl font-bold text-green-400">{progress.mastered}</p>
                <p className="text-gray-400 text-xs mt-1">習得済み</p>
              </div>
              <div className="w-px bg-gray-700" />
              <div className="flex-1 text-center">
                <p className="text-2xl font-bold text-yellow-400">{progress.learning}</p>
                <p className="text-gray-400 text-xs mt-1">学習中</p>
              </div>
              <div className="w-px bg-gray-700" />
              <div className="flex-1 text-center">
                <p className="text-2xl font-bold text-gray-400">{progress.total}</p>
                <p className="text-gray-400 text-xs mt-1">合計</p>
              </div>
            </div>
          </div>
        )}

        
        {accuracy && accuracy.total > 0 && (
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-3">クイズ正答率</p>
            <div className="flex items-center gap-4">
              <p className="text-4xl font-bold text-blue-400">{accuracy.pct}%</p>
              <div className="flex-1">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: `${accuracy.pct}%` }} />
                </div>
                <p className="text-gray-500 text-xs mt-1">{accuracy.correct} / {accuracy.total} 回正解</p>
              </div>
            </div>
          </div>
        )}

       
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-4">今週のアクティビティ</p>
          <BarChart 
            data={weekActivity} 
            color="#3b82f6" 
            today={new Date(Date.now() + JST).toISOString().slice(0, 10)} 
          />
        </div>

       
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-4">習得単語の推移 (週別)</p>
          {weeklyMastered.every(w => w.count === 0) ? (
            <p className="text-gray-500 text-sm text-center py-4">まだデータがありません</p>
          ) : (
            <BarChart data={weeklyMastered} color="#22c55e" />
          )}
        </div>

       
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-3">アクティビティ (直近70日)</p>
          <div className="flex flex-wrap gap-1">
            {days.map(day => (
              <div
                key={day}
                className={`w-3 h-3 rounded-sm ${getActivityColor(activityGrid.get(day) ?? 0)}`}
                title={day}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2 justify-end">
            <span className="text-gray-500 text-xs">少ない</span>
            <div className="w-3 h-3 rounded-sm bg-gray-700" />
            <div className="w-3 h-3 rounded-sm bg-blue-900" />
            <div className="w-3 h-3 rounded-sm bg-blue-600" />
            <div className="w-3 h-3 rounded-sm bg-blue-400" />
            <span className="text-gray-500 text-xs">多い</span>
          </div>
        </div>

        
        {hardWords.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-3">苦手な単語 TOP5</p>
            <div className="flex flex-col gap-3">
              {hardWords.map((w, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-gray-500 text-xs w-4">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-white text-sm">{w.ocr_text}</p>
                    <p className="text-gray-400 text-xs">{w.translated_text}</p>
                  </div>
                  <span className="text-red-400 text-sm font-bold">{w.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}