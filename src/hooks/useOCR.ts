import { useState, useCallback } from 'react'
import { extractAndTranslate } from '../lib/ocr'
import type { ScanCategory } from '../lib/ocr'

type OCRState = 'idle' | 'processing' | 'done' | 'error'

export function useOCR() {
  const [state, setState] = useState<OCRState>('idle')
  const [original, setOriginal] = useState<string | null>(null)
  const [translated, setTranslated] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runOCR = useCallback(async (
    imageData: string,
    onDone?: (original: string, translated: string, distractors: string[],relatedWords: { japanese: string; english: string }[], category: ScanCategory) => void
  ) => {
    try {
      setState('processing')
      const result = await extractAndTranslate(imageData)
      setOriginal(result.original)
      setTranslated(result.translated)
      setState('done')
      onDone?.(result.original, result.translated, result.distractors, result.relatedWords, result.category)
    } catch (err) {
      console.error(err)
      setError('認識に失敗しました')
      setState('error')
    }
  }, [])

  return { state, original, translated, error, runOCR }
}