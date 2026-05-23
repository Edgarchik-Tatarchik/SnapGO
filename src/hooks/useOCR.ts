import { useState, useCallback } from 'react'
import { extractText } from '../lib/ocr'

type OCRState = 'idle' | 'processing' | 'done' | 'error'

export function useOCR() {
  const [state, setState] = useState<OCRState>('idle')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runOCR = useCallback(async (imageData: string) => {
    try {
      setState('processing')
      setProgress(0)
      const text = await extractText(imageData, setProgress)
      setResult(text)
      setState('done')
    } catch (err) {
      console.error(err)
      setError('認識に失敗しました')
      setState('error')
    }
  }, [])

  return { state, progress, result, error, runOCR }
}