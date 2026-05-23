export async function extractAndTranslate(imageData: string) {
  const response = await fetch('/api/ocr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageData })
  })

  const data = await response.json()
  console.log('API response:', JSON.stringify(data))
  const text = data.content[0].text
  const original = text.match(/ORIGINAL: (.+)/)?.[1] ?? ''
  const translated = text.match(/TRANSLATION: (.+)/)?.[1] ?? ''
  return { original, translated }
}