import { supabase } from './supabase'

const JST_OFFSET = 9 * 60 

function toJSTDateString(date: Date): string {
  const jst = new Date(date.getTime() + JST_OFFSET * 60 * 1000)
  return jst.toISOString().slice(0, 10) 
}

function getTodayJST(): string {
  return toJSTDateString(new Date())
}

export interface StreakStats {
  current: number      
  record: number       
  todayDone: boolean   
}

export async function getStreakStats(): Promise<StreakStats> {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) return { current: 0, record: 0, todayDone: false }


  const [scansResult, attemptsResult] = await Promise.all([
    supabase
      .from('scans')
      .select('created_at')
      .eq('user_id', userId),
    supabase
      .from('quiz_attempts')
      .select('created_at')
      .eq('user_id', userId)
  ])

  
  const activeDates = new Set<string>()

  for (const row of scansResult.data ?? []) {
    activeDates.add(toJSTDateString(new Date(row.created_at)))
  }
  for (const row of attemptsResult.data ?? []) {
    activeDates.add(toJSTDateString(new Date(row.created_at)))
  }

  if (activeDates.size === 0) return { current: 0, record: 0, todayDone: false }

  
  const sorted = Array.from(activeDates).sort((a, b) => b.localeCompare(a))
  const today = getTodayJST()
  const todayDone = activeDates.has(today)

  
  let current = 0
  const startDate = todayDone ? today : sorted[0]
  let cursor = new Date(startDate + 'T00:00:00+09:00')

  while (true) {
    const dateStr = toJSTDateString(cursor)
    if (!activeDates.has(dateStr)) break
    current++
    cursor.setDate(cursor.getDate() - 1)
  }

  
  let record = 0
  let tempStreak = 1

  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = new Date(sorted[i] + 'T00:00:00+09:00')
    const next = new Date(sorted[i + 1] + 'T00:00:00+09:00')
    const diffDays = Math.round((curr.getTime() - next.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      tempStreak++
    } else {
      record = Math.max(record, tempStreak)
      tempStreak = 1
    }
  }
  record = Math.max(record, tempStreak)

  return { current, record, todayDone }
}