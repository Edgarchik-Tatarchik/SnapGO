import { useState } from 'react'
import { Camera } from '../components/Camera'
import { ImagePreview } from '../components/ImagePreview'

type Step = 'camera' | 'preview' | 'processing'

export function ScanPage() {
  const [step, setStep] = useState<Step>('camera')
  const [imageData, setImageData] = useState<string | null>(null)

  const handleCapture = (data: string) => {
    setImageData(data)
    setStep('preview')
  }

  const handleConfirm = () => {
    setStep('processing')
    // День 3: здесь будет OCR
    console.log('Ready for OCR:', imageData?.slice(0, 50))
  }

  const handleRetake = () => {
    setImageData(null)
    setStep('camera')
  }

  if (step === 'camera') return <Camera onCapture={handleCapture} />
  if (step === 'preview' && imageData) return (
    <ImagePreview imageData={imageData} onConfirm={handleConfirm} onRetake={handleRetake} />
  )
  if (step === 'processing') return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <p className="text-xl">処理中...</p>
    </div>
  )
}