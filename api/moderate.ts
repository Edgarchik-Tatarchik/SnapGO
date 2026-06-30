/// <reference types="node" />
export const config = { runtime: 'edge' }

const MODERATION_SYSTEM_PROMPT = `You are a strict content safety classifier for a public language-learning app used by general audiences including teenagers.

Analyze the image and respond with EXACTLY ONE WORD, nothing else:
- "SAFE" — if the image shows ordinary signs, menus, text, everyday objects, places, or people in normal non-sexual, non-violent contexts
- "UNSAFE" — if the image contains: nudity or sexual content of any kind, graphic violence, gore, weapons used to harm, drug paraphernalia, hate symbols, or any content inappropriate for general audiences

When uncertain, classify as UNSAFE. Respond with only the single word SAFE or UNSAFE — no explanation, no punctuation, nothing else.`

export default async function handler(req: Request) {
  const { imageData } = await req.json()
  const base64 = imageData.replace(/^data:image\/\w+;base64,/, '')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': (process as any).env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      system: MODERATION_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
          { type: 'text', text: 'Classify this image.' }
        ]
      }]
    })
  })

  const data = await response.json()
  const text = data?.content?.[0]?.text?.trim().toUpperCase() ?? 'UNSAFE'

  const isSafe = text === 'SAFE'

  return new Response(JSON.stringify({ safe: isSafe }), {
    headers: { 'Content-Type': 'application/json' }
  })
}