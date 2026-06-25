/// <reference types="node" />
export const config = { runtime: 'edge' }

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
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
          {
            type: 'text',
            text: `Extract ALL Japanese text from this image and translate to English. Also generate 2 plausible but INCORRECT English translations for the quiz. Then provide 3 related Japanese words or short phrases that a learner might encounter in the same context, with their English translations. Finally, classify the sign into exactly one category from this fixed list: food, transport, shopping, warning, public, nature, medical, entertainment, work, housing, seasonal, beauty, technology, religion, education, other. Plain text only, no markdown:
ORIGINAL: [japanese text]
TRANSLATION: [correct english translation]
WRONG1: [plausible incorrect translation]
WRONG2: [plausible incorrect translation]
RELATED1: [japanese word or phrase] = [english translation]
RELATED2: [japanese word or phrase] = [english translation]
RELATED3: [japanese word or phrase] = [english translation]
CATEGORY: [one word from the fixed list above]`
          }
        ]
      }]
    })
  })

  const data = await response.json()
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  })
}