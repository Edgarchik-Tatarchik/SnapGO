import Tesseract from 'tesseract.js'

export async function extractText(
  imageData: string,
  onProgress: (p: number) => void
): Promise<string> {
  const result = await Tesseract.recognize(imageData, 'jpn', {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onProgress(Math.round(m.progress * 100))
      }
    }
  })
  return result.data.text
}