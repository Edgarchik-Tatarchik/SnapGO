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
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
          {
            type: 'text',
            text: 'Extract ALL Japanese text from this image and translate to English. Also generate 2 plausible but INCORRECT English translations for the quiz. Then provide 3 related Japanese words or short phrases that a learner might encounter in the same context, with their English translations. Plain text only, no markdown:\nORIGINAL: [japanese text]\nTRANSLATION: [correct english translation]\nWRONG1: [plausible incorrect translation]\nWRONG2: [plausible incorrect translation]\nRELATED1: [japanese word or phrase] = [english translation]\nRELATED2: [japanese word or phrase] = [english translation]\nRELATED3: [japanese word or phrase] = [english translation]'
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