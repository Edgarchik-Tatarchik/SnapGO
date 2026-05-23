import { useState } from 'react'
import { Camera } from '../components/Camera'
import { ImagePreview } from '../components/ImagePreview'
import { useOCR } from '../hooks/useOCR'

type Step = 'camera' | 'preview' | 'processing'

export function ScanPage() {
  const [step, setStep] = useState<Step>('camera')
  const [imageData, setImageData] = useState<string | null>(null)
  const { state, progress, result, error, runOCR } = useOCR()

  const handleCapture = (data: string) => {
    setImageData(data)
    setStep('preview')
  }

  const handleConfirm = async () => {
    if (!imageData) return
    setStep('processing')
    await runOCR(imageData)
  }

  const handleRetake = () => {
    setImageData(null)
    setStep('camera')
  }

  if (step === 'camera') return <Camera onCapture={handleCapture} />

  if (step === 'preview' && imageData) return (
    <ImagePreview imageData={imageData} onConfirm={handleConfirm} onRetake={handleRetake} />
  )

  if (step === 'processing') {
    if (state === 'processing') return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-6 p-8">
        <p className="text-xl">認識中...</p>
        <div className="w-full max-w-sm bg-gray-700 rounded-full h-3">
          <div
            className="bg-blue-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-gray-400">{progress}%</p>
      </div>
    )

    if (state === 'done') return (
      <div className="flex flex-col h-screen bg-gray-900 text-white p-6 gap-4">
        <img src={imageData!} className="w-full max-h-48 object-contain rounded-xl" />
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-2">認識結果</p>
          <p className="text-white text-lg">{result}</p>
        </div>
        <button
          onClick={handleRetake}
          className="mt-auto py-4 rounded-xl bg-blue-600 text-white text-lg"
        >
          もう一度スキャン
        </button>
      </div>
    )

    if (state === 'error') return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-4">
        <p className="text-red-400">{error}</p>
        <button onClick={handleRetake} className="bg-gray-700 px-6 py-3 rounded-xl">
          戻る
        </button>
      </div>
    )
  }
}