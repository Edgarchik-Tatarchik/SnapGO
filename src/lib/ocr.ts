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
  const relatedWords = [1,2,3].map(i=>{
    const match = text.match(new RegExp(`RELATED${i}:\\s*(.+?)\\s*=\\s*(.+?)(?:\\n|$)`))
    if (!match) return null
    return {japanese: match[1].trim(), english: match[2].trim()}
  }).filter((w): w is { japanese: string; english: string } => w !== null)

  return { original, translated, distractors: [wrong1,wrong2].filter(Boolean), relatedWords }
}