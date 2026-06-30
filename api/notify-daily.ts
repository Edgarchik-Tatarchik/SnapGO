/// <reference types="node" />
export const config = { runtime: 'nodejs' }

import webpush from 'web-push'

webpush.setVapidDetails(
  (process as any).env.VAPID_SUBJECT,
  (process as any).env.VITE_VAPID_PUBLIC_KEY,
  (process as any).env.VAPID_PRIVATE_KEY
)

const supabaseUrl = (process as any).env.SUPABASE_URL
const supabaseKey = (process as any).env.SUPABASE_SERVICE_ROLE_KEY

async function supabaseFetch(path: string) {
  return fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    }
  })
}

async function sendPush(subscription: any, data: { title: string; body: string; url: string }) {
  await webpush.sendNotification(subscription, JSON.stringify(data))
}

function toJSTDateString(date: Date): string {
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  return jst.toISOString().slice(0, 10)
}

export default async function handler(req: Request) {
  const authHeader = (req as any).headers['authorization']
  if (authHeader !== `Bearer ${(process as any).env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const subsResponse = await supabaseFetch('push_subscriptions?select=*')
  const subscriptions = await subsResponse.json()

  if (!subscriptions || subscriptions.length === 0) {
    return new Response('No subscriptions', { status: 200 })
  }

  const today = toJSTDateString(new Date())
  const todayStart = `${today}T00:00:00+09:00`
  const todayEnd = `${today}T23:59:59+09:00`

  for (const sub of subscriptions) {
    try {
      const [scansRes, attemptsRes] = await Promise.all([
        supabaseFetch(`scans?user_id=eq.${sub.user_id}&created_at=gte.${todayStart}&created_at=lte.${todayEnd}&select=id`),
        supabaseFetch(`quiz_attempts?user_id=eq.${sub.user_id}&created_at=gte.${todayStart}&created_at=lte.${todayEnd}&select=id`)
      ])

      const todayScans = await scansRes.json()
      const todayAttempts = await attemptsRes.json()
      const todayDone = (todayScans?.length ?? 0) > 0 || (todayAttempts?.length ?? 0) > 0
      if (todayDone) continue
      const allScansRes = await supabaseFetch(`scans?user_id=eq.${sub.user_id}&select=created_at&order=created_at.desc`)
      const allAttemptsRes = await supabaseFetch(`quiz_attempts?user_id=eq.${sub.user_id}&select=created_at&order=created_at.desc`)
      const allScans = await allScansRes.json() ?? []
      const allAttempts = await allAttemptsRes.json() ?? []

      const activeDates = new Set<string>()
      for (const s of allScans) activeDates.add(toJSTDateString(new Date(s.created_at)))
      for (const a of allAttempts) activeDates.add(toJSTDateString(new Date(a.created_at)))

      let streak = 0
      const yesterday = toJSTDateString(new Date(Date.now() - 24 * 60 * 60 * 1000))
      let cursor = new Date(yesterday + 'T00:00:00+09:00')
      while (activeDates.has(toJSTDateString(cursor))) {
        streak++
        cursor.setDate(cursor.getDate() - 1)
      }

      const dueRes = await supabaseFetch(
        `srs_state?user_id=eq.${sub.user_id}&next_review_at=lte.${new Date().toISOString()}&repetitions=gt.0&select=id`
      )
      const due = await dueRes.json()
      const dueCount = due?.length ?? 0

      let title: string
      let body: string

      if (streak > 0) {
        title = `🔥 ${streak}日連続が危ない！`
        body = `今日まだ学習していません。ストリークを守ろう！`
      } else {
        title = `今日も日本語を学ぼう`
        body = `SnapGOで新しい単語を覚えましょう！`
      }

      if (dueCount > 0) {
        body += `\n🔁 ${dueCount}個の単語が復習待ちです`
      }

      await sendPush(sub.subscription, {
        title,
        body,
        url: '/?screen=quiz'
      })

    } catch (err) {
      console.error(`Failed to notify ${sub.user_id}:`, err)
    }
  }

  return new Response('Done', { status: 200 })
}