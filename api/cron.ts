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

async function supabaseFetch(path: string, options?: RequestInit) {
    return fetch(`${supabaseUrl}/rest/v1/${path}`, {
        ...options,
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            ...(options?.headers ?? {})
        }
    })
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

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

    for (const sub of subscriptions) {
        try {
            const isInactive = sub.last_active_at < sevenDaysAgo

            if (isInactive) {
                await sendPush(sub.subscription, {
                    title: 'SignLens 👋',
                    body: 'しばらく練習していませんね。クイズで腕試ししませんか？',
                    url: '/?screen=quiz'
                })
                continue
            }

            const scansResponse = await supabaseFetch(
                `scans?user_id=eq.${sub.user_id}&created_at=gte.${sevenDaysAgo}&select=related_words,translated_text`
            )
            const scans = await scansResponse.json()

            if (!scans || scans.length === 0) continue
            const attemptsResponse = await supabaseFetch(
                `quiz_attempts?user_id=eq.${sub.user_id}&created_at=gte.${sevenDaysAgo}&select=was_correct`
            )
            const attempts = await attemptsResponse.json() ?? []

            const correct = attempts.filter((a: any) => a.was_correct).length
            const incorrect = attempts.filter((a: any) => !a.was_correct).length

            const words = scans
            .flatMap((s: any) => s.related_words ?? [])
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map((w: any) => w.japanese)
            .join('・')

            const greeting = getGreeting()

            await sendPush(sub.subscription, {
                title: `SignLens ${greeting}`,
                body: `今週のまとめ:\n📸 写真: ${scans.length}枚 ✅ 正解: ${correct}問 ❌ 不正解: ${incorrect}問${words ? ` 💡 単語: ${words}` : ''}`,
                url: '/?screen=quiz'
            })
        } catch (err) {
            console.error(`Failed to send push to ${sub.user_id}:`, err)
        }
    }

    return new Response('Done', { status: 200 })
}

async function sendPush(subscription: any, data: { title: string; body: string; url: string }) {
    await webpush.sendNotification(subscription, JSON.stringify(data))
}

function getGreeting(): string {
    const hour = new Date().getUTCHours() + 9
    if (hour < 12) return '🌸 おはようございます！'
    if (hour < 18) return '☀️ こんにちは！'
    return '🌙 こんばんは！'
}