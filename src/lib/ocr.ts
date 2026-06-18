export async function extractAndTranslate(imageData: string) {
  const response = await fetch('/api/ocr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageData })
  })

  const data = await response.json()
  const text = data.content[0].text
  const original = text.match(/ORIGINAL:\s*(.+?)(?:\n|$)/s)?.[1]?.trim() ?? ''
  const translated = text.match(/TRANSLATION:\s*(.+?)(?:\n|$)/s)?.[1]?.trim() ?? ''
  const wrong1 = text.match(/WRONG1:\s*(.+?)(?:\n|$)/)?.[1]?.trim() ?? ''
  const wrong2 = text.match(/WRONG2:\s*(.+?)(?:\n|$)/)?.[1]?.trim() ?? ''
  return { original, translated, distractors: [wrong1,wrong2].filter(Boolean) }
}