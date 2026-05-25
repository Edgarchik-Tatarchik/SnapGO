import { useState } from 'react'
import { Camera } from '../components/Camera'
import { ImagePreview } from '../components/ImagePreview'
import { useOCR } from '../hooks/useOCR'
import { saveScan, saveCorrection } from '../lib/storage'

type Step = 'camera' | 'preview' | 'processing' | 'result'

interface ScanPageProps {
  onGoHome: () => void
}

export function ScanPage({ onGoHome }: ScanPageProps) {
  const [step, setStep] = useState<Step>('camera')
  const [imageData, setImageData] = useState<string | null>(null)
  const [scanId, setScanId] = useState<string | null>(null)
  const [correction, setCorrection] = useState('')
  const [correctionSaved, setCorrectionSaved] = useState(false)
  const { original, translated, runOCR } = useOCR()

  const handleCapture = (data: string) => {
    setImageData(data)
    setStep('preview')
  }

  const handleConfirm = async () => {
  if (!imageData) return
  setStep('processing')
  await runOCR(imageData, handleOCRDone)
}

  const handleOCRDone = async (orig: string, trans: string) => {
    const id = await saveScan(imageData!, orig, trans)
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
    setScanId(null)
    setCorrection('')
    setCorrectionSaved(false)
    setStep('camera')
  }

  if (step === 'camera') return <Camera onCapture={handleCapture} />

  if (step === 'preview' && imageData) return (
    <ImagePreview imageData={imageData} onConfirm={handleConfirm} onRetake={handleRetake} />
  )

  if (step === 'processing') return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <p className="text-xl">認識中...</p>
    </div>
  )

  if (step === 'result') return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white p-6 gap-4">
      <img src={imageData!} className="w-full max-h-48 object-contain rounded-xl" />

      <div className="bg-gray-800 rounded-xl p-4">
        <p className="text-gray-400 text-sm mb-1">認識結果</p>
        <p className="text-white text-lg">{original}</p>
      </div>

      <div className="bg-gray-800 rounded-xl p-4">
        <p className="text-gray-400 text-sm mb-1">Translation</p>
        <p className="text-white text-lg">{translated}</p>
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
        <p className="text-green-400 text-center">✓ 修正が保存されました</p>
      )}

      <button onClick={handleRetake} className="mt-auto py-4 rounded-xl bg-blue-600 text-white text-lg cursor-pointer hover:bg-gray-600 active:scale-95 transition-all">
        もう一度スキャン
      </button>
      <button onClick={onGoHome} className="py-4 rounded-xl bg-gray-700 text-white text-lg 
             cursor-pointer hover:bg-gray-600 active:scale-95 transition-all">メニューに戻る</button>
    </div>
  )
}