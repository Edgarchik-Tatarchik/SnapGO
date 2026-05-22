import { useEffect, useRef } from 'react'
import { useCamera } from '../hooks/useCamera'
import { useTranslation } from 'react-i18next'

interface CameraProps {
  onCapture: (imageData: string) => void
}

export function Camera({ onCapture }: CameraProps) {
  const { t } = useTranslation()
  const { videoRef, stream, capturedImage, error, startCamera, capturePhoto, stopCamera } = useCamera()

  useEffect(() => {
    startCamera()
    return () => { stopCamera() }
    
  }, [])

const onCaptureRef = useRef(onCapture)
useEffect(() => { onCaptureRef.current = onCapture }, [onCapture])

useEffect(() => {
  if (capturedImage) onCaptureRef.current(capturedImage)
}, [capturedImage])

  if (error) return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-6">
      <p className="text-red-400 text-center mb-4">{error}</p>
      <button onClick={startCamera} className="bg-blue-600 px-6 py-3 rounded-xl">
        {t('camera_retry')}
      </button>
    </div>
  )

  return (
    <div className="relative h-screen bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline    
        muted
        className="w-full h-full object-cover"
      />
      {stream && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <button
            onClick={capturePhoto}
            className="w-20 h-20 rounded-full bg-white border-4 border-gray-300 shadow-lg active:scale-95 transition-transform"
          />
        </div>
      )}
      <label className="absolute bottom-8 right-8 bg-gray-800 p-3 rounded-full cursor-pointer">
  <input
    type="file"
    accept="image/*"
    className="hidden"
    onChange={(e) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => onCapture(ev.target?.result as string)
      reader.onerror = () => console.error('ファイルの読み込みに失敗しました')
        reader.readAsDataURL(file)
    }}
  />
  📁
</label>
    </div>
  )
}