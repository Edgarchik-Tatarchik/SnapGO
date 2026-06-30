import { useState } from 'react'
import { Camera } from '../components/Camera'
import { ImagePreview } from '../components/ImagePreview'
import { useOCR } from '../hooks/useOCR'
import { saveScan, saveCorrection } from '../lib/storage'
import type { ScanCategory } from '../lib/ocr'
import type { Coords } from '../hooks/useGeolocation'

type Step = 'camera' | 'preview' | 'processing' | 'result' | 'unsafe'

interface ScanPageProps {
  onGoHome: () => void
}

export function ScanPage({ onGoHome }: ScanPageProps) {
  const [step, setStep] = useState<Step>('camera')
  const [imageData, setImageData] = useState<string | null>(null)
  const [coords, setCoords] = useState<Coords | null>(null)
  const [scanId, setScanId] = useState<string | null>(null)
  const [scannedCategory, setScannedCategory] = useState<ScanCategory>('other')
  const [correction, setCorrection] = useState('')
  const [correctionSaved, setCorrectionSaved] = useState(false)
  const { original, translated, state: ocrState, runOCR } = useOCR()

  const handleCapture = (data: string, capturedCoords: Coords | null) => {
    setImageData(data)
    setCoords(capturedCoords)
    setStep('preview')
  }

  const handleConfirm = async () => {
    if (!imageData) return
    setStep('processing')
    await runOCR(imageData, handleOCRDone)
  }

  const handleOCRDone = async (
    orig: string,
    trans: string,
    distractors: string[],
    relatedWords: { japanese: string; english: string }[],
    category: ScanCategory
  ) => {
    setScannedCategory(category)
    const id = await saveScan(imageData!, orig, trans, distractors, relatedWords, category, coords)
    setScanId(id)
    setStep('result')
  }

  const handleCorrection = async () => {
    if (!scanId || !correction.trim()) return
    await saveCorrection(scanId, correction)
    setCorrectionSaved(true)
  }

  const handleRetake = () => {
    setImageData(null)
    setCoords(null)
    setScanId(null)
    setCorrection('')
    setCorrectionSaved(false)
    setScannedCategory('other')
    setStep('camera')
  }

  if (step === 'camera') return <Camera onCapture={handleCapture} onGoHome={onGoHome} />

  if (step === 'preview' && imageData) return (
    <ImagePreview imageData={imageData} onConfirm={handleConfirm} onRetake={handleRetake} onGoHome={onGoHome} />
  )

  if (step === 'processing') {
    if (ocrState === 'unsafe') {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-4 p-8">
          <p className="text-4xl">🚫</p>
          <p className="text-center font-bold">この写真は処理できません</p>
          <p className="text-gray-400 text-sm text-center">
            不適切なコンテンツが検出されました。別の写真を撮影してください。
          </p>
          <button
            onClick={handleRetake}
            className="bg-blue-600 px-6 py-3 rounded-xl mt-2 cursor-pointer hover:bg-blue-500"
          >
            もう一度撮影する
          </button>
          <button onClick={onGoHome} className="text-gray-400 text-sm cursor-pointer">
            メニューに戻る
          </button>
        </div>
      )
    }

    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <p className="text-xl">認識中...</p>
      </div>
    )
  }

  if (step === 'result') return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white p-6 gap-4 pb-8">
      <img src={imageData!} className="w-full max-h-48 object-contain rounded-xl" />

      <div className="bg-gray-800 rounded-xl p-4">
        <p className="text-gray-400 text-sm mb-1">認識結果</p>
        <p className="text-white text-lg">{original}</p>
      </div>

      <div className="bg-gray-800 rounded-xl p-4">
        <p className="text-gray-400 text-sm mb-1">Translation</p>
        <p className="text-white text-lg">{translated}</p>
      </div>

      <div className="bg-gray-800 rounded-xl p-3 flex items-center justify-between">
        <p className="text-gray-500 text-xs">
          カテゴリー: {scannedCategory}
        </p>
        {coords && (
          <p className="text-gray-500 text-xs">📍 位置情報あり</p>
        )}
      </div>

      {!correctionSaved ? (
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-2">翻訳を修正する</p>
          <textarea
            value={correction}
            onChange={e => setCorrection(e.target.value)}
            placeholder="正しい翻訳を入力..."
            className="w-full bg-gray-700 text-white rounded-lg p-3 text-sm resize-none"
            rows={3}
          />
          <button
            onClick={handleCorrection}
            className="mt-2 w-full py-2 rounded-lg bg-green-600 text-white cursor-pointer hover:scale-105 transition-transform"
          >
            修正を保存
          </button>
        </div>
      ) : (
        <p className="text-green-400 text-center">修正が保存されました</p>
      )}

      <button onClick={handleRetake} className="mt-auto py-4 rounded-xl bg-blue-600 text-white text-lg cursor-pointer hover:bg-gray-600 active:scale-95 transition-all">
        もう一度スキャン
      </button>
      <button onClick={onGoHome} className="py-4 rounded-xl bg-gray-700 text-white text-lg cursor-pointer hover:bg-gray-600 active:scale-95 transition-all">
        メニューに戻る
      </button>
    </div>
  )
}