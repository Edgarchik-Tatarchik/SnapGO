import { supabase } from './supabase'

export interface QuizScan {
  id: string
  image_url: string
  ocr_text: string
  translated_text: string
  quiz_distractors: string[]
  category: string | null
}

export type QuizStatus = 'new' | 'learning' | 'review' | 'mastered'



function calcSM2(
  repetitions: number,
  intervalDays: number,
  easeFactor: number,
  wasCorrect: boolean
): { repetitions: number; intervalDays: number; easeFactor: number } {
  const quality = wasCorrect ? 3 : 0

  
  const newEase = Math.max(1.3, easeFactor + 0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02))

  if (!wasCorrect) {
    
    return { repetitions: 0, intervalDays: 1, easeFactor: newEase }
  }

  
  let newInterval: number
  if (repetitions === 0) {
    newInterval = 1
  } else if (repetitions === 1) {
    newInterval = 3
  } else {
    newInterval = Math.round(intervalDays * newEase)
  }

  return {
    repetitions: repetitions + 1,
    intervalDays: newInterval,
    easeFactor: newEase
  }
}


async function getOrCreateSrsState(userId: string, scanId: string) {
  const { data } = await supabase
    .from('srs_state')
    .select('*')
    .eq('user_id', userId)
    .eq('scan_id', scanId)
    .single()

  if (data) return data

  
  const { data: created } = await supabase
    .from('srs_state')
    .insert({
      user_id: userId,
      scan_id: scanId,
      interval_days: 1,
      ease_factor: 2.5,
      next_review_at: new Date().toISOString(),
      repetitions: 0
    })
    .select('*')
    .single()

  return created
}

export async function getScanStatus(scanId: string): Promise<QuizStatus> {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) return 'new'

  const { data } = await supabase
    .from('srs_state')
    .select('repetitions, interval_days, next_review_at')
    .eq('user_id', userId)
    .eq('scan_id', scanId)
    .single()

  if (!data) return 'new'

  const now = new Date()
  const nextReview = new Date(data.next_review_at)

  if (data.repetitions === 0) return 'new'
  if (data.interval_days >= 21) return 'mastered'
  if (nextReview <= now) return 'review'
  return 'learning'
}

export async function getScanStatuses(scanIds: string[]): Promise<Map<string, QuizStatus>> {
  if (scanIds.length === 0) return new Map()

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) return new Map()

  const { data } = await supabase
    .from('srs_state')
    .select('scan_id, repetitions, interval_days, next_review_at')
    .eq('user_id', userId)
    .in('scan_id', scanIds)

  const result = new Map<string, QuizStatus>()
  const now = new Date()

  for (const scanId of scanIds) {
    const row = (data ?? []).find(d => d.scan_id === scanId)

    if (!row) {
      result.set(scanId, 'new')
      continue
    }

    const nextReview = new Date(row.next_review_at)

    if (row.repetitions === 0) {
      result.set(scanId, 'new')
    } else if (row.interval_days >= 21) {
      result.set(scanId, 'mastered')
    } else if (nextReview <= now) {
      result.set(scanId, 'review')
    } else {
      result.set(scanId, 'learning')
    }
  }

  return result
}

export async function getRandomQuizScan(
  excludeIds: string[],
  category?: string | null
): Promise<QuizScan | null> {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) return null

  let query: any = supabase
    .from('scans')
    .select('id, image_url, ocr_text, translated_text, quiz_distractors, category')
    .eq('user_id', userId)
    .not('quiz_distractors', 'is', null)

  if (category) query = query.eq('category', category)
  if (excludeIds.length > 0) query = query.not('id', 'in', `(${excludeIds.join(',')})`)

  const { data, error } = await query
  if (error || !data || data.length === 0) return null

  const ids = data.map((s: QuizScan) => s.id)
  const statuses = await getScanStatuses(ids)

  
  const review = data.filter((s: QuizScan) => statuses.get(s.id) === 'review')
  const newWords = data.filter((s: QuizScan) => statuses.get(s.id) === 'new')
  const learning = data.filter((s: QuizScan) => statuses.get(s.id) === 'learning')

  const pool = review.length > 0 ? review : newWords.length > 0 ? newWords : learning
  if (pool.length === 0) return null

  return pool[Math.floor(Math.random() * pool.length)] as QuizScan
}

export async function recordQuizAttempt(scanId: string, wasCorrect: boolean) {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) return

  
  await supabase.from('quiz_attempts').insert({
    user_id: userId,
    scan_id: scanId,
    was_correct: wasCorrect
  })

  
  const srs = await getOrCreateSrsState(userId, scanId)
  if (!srs) return

  const { repetitions, intervalDays, easeFactor } = calcSM2(
    srs.repetitions,
    srs.interval_days,
    srs.ease_factor,
    wasCorrect
  )

  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + intervalDays)

  await supabase
    .from('srs_state')
    .upsert({
      user_id: userId,
      scan_id: scanId,
      repetitions,
      interval_days: intervalDays,
      ease_factor: easeFactor,
      next_review_at: nextReview.toISOString(),
      last_reviewed_at: new Date().toISOString()
    }, { onConflict: 'user_id,scan_id' })
}


export async function getDueForReview(): Promise<number> {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) return 0

  const { count } = await supabase
    .from('srs_state')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .lte('next_review_at', new Date().toISOString())
    .gt('repetitions', 0)

  return count ?? 0
}

export async function getProgressStats(): Promise<{
  total: number
  mastered: number
  learning: number
  byCategory: Record<string, { mastered: number; learning: number; new: number }>
}> {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) return { total: 0, mastered: 0, learning: 0, byCategory: {} }

  const { data: scans } = await supabase
    .from('scans')
    .select('id, category')
    .eq('user_id', userId)
    .not('quiz_distractors', 'is', null)

  if (!scans || scans.length === 0) return { total: 0, mastered: 0, learning: 0, byCategory: {} }

  const ids = scans.map(s => s.id)
  const statuses = await getScanStatuses(ids)

  let mastered = 0
  let learning = 0
  const byCategory: Record<string, { mastered: number; learning: number; new: number }> = {}

  for (const scan of scans) {
    const status = statuses.get(scan.id) ?? 'new'
    const cat = scan.category ?? 'other'

    if (!byCategory[cat]) byCategory[cat] = { mastered: 0, learning: 0, new: 0 }

    if (status === 'mastered') { mastered++; byCategory[cat].mastered++ }
    else if (status === 'learning' || status === 'review') { learning++; byCategory[cat].learning++ }
    else { byCategory[cat].new++ }
  }

  return { total: scans.length, mastered, learning, byCategory }
}