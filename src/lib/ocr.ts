export async function extractAndTranslate(imageData: string): Promise<{
  original: string
  translated: string
}> {
  const base64 = imageData.replace(/^data:image\/\w+;base64,/, '')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: base64 }
          },
          {
            type: 'text',
            text: 'This image contains Japanese text. Extract ALL Japanese text exactly as written, then translate it to English. Respond in this exact format:\nORIGINAL: [japanese text]\nTRANSLATION: [english translation]'
          }
        ]
      }]
    })
  })

  const data = await response.json()
  const text = data.content[0].text
  const original = text.match(/ORIGINAL: (.+)/)?.[1] ?? ''
  const translated = text.match(/TRANSLATION: (.+)/)?.[1] ?? ''

  return { original, translated }
}