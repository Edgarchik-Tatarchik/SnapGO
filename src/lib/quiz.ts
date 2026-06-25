import { supabase } from './supabase'

const MASTERED_THRESHOLD = 3 

export interface QuizScan {
  id: string
  image_url: string
  ocr_text: string
  translated_text: string
  quiz_distractors: string[]
  category: string | null
}

export type QuizStatus = 'new' | 'learning' | 'mastered'




export async function getScanStatus(scanId: string): Promise<QuizStatus> {
  const { data } = await supabase
    .from('quiz_attempts')
    .select('was_correct')
    .eq('scan_id', scanId)
    .order('created_at', { ascending: false })
    .limit(MASTERED_THRESHOLD)

  if (!data || data.length === 0) return 'new'



  if (
    data.length === MASTERED_THRESHOLD &&
    data.every(a => a.was_correct === true)
  ) return 'mastered'

  return 'learning'
}



export async function getScanStatuses(scanIds: string[]): Promise<Map<string, QuizStatus>> {
  if (scanIds.length === 0) return new Map()

  const { data } = await supabase
    .from('quiz_attempts')
    .select('scan_id, was_correct, created_at')
    .in('scan_id', scanIds)
    .order('created_at', { ascending: false })

  const result = new Map<string, QuizStatus>()

  for (const scanId of scanIds) {
    const attempts = (data ?? []).filter(a => a.scan_id === scanId)
    if (attempts.length === 0) {
      result.set(scanId, 'new')
      continue
    }

    const lastN = attempts.slice(0, MASTERED_THRESHOLD)
    if (
      lastN.length === MASTERED_THRESHOLD &&
      lastN.every(a => a.was_correct === true)
    ) {
      result.set(scanId, 'mastered')
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

  if (category) {
    query = query.eq('category', category)
  }

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`)
  }

  const { data, error } = await query
  if (error || !data || data.length === 0) return null

 
  const ids = data.map((s: QuizScan) => s.id)
  const statuses = await getScanStatuses(ids)
  const active = data.filter((s: QuizScan) => statuses.get(s.id) !== 'mastered')

  if (active.length === 0) return null

  const randomIndex = Math.floor(Math.random() * active.length)
  return active[randomIndex] as QuizScan
}



export async function recordQuizAttempt(scanId: string, wasCorrect: boolean) {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) return null

  await supabase.from('quiz_attempts').insert({
    user_id: userId,
    scan_id: scanId,
    was_correct: wasCorrect
  })
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
    else if (status === 'learning') { learning++; byCategory[cat].learning++ }
    else { byCategory[cat].new++ }
  }

  return { total: scans.length, mastered, learning, byCategory }
}