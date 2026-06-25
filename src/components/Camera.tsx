import { useEffect, useRef } from 'react'
import { useCamera, GUIDE_WIDTH_PCT, MIN_GUIDE_HEIGHT_PCT, MAX_GUIDE_HEIGHT_PCT, MIN_ZOOM, MAX_ZOOM } from '../hooks/useCamera'
import { useTranslation } from 'react-i18next'

interface CameraProps {
  onCapture: (imageData: string) => void
  onGoHome: () => void
}

export function Camera({ onCapture, onGoHome }: CameraProps) {
  const { t } = useTranslation()
  const {
    videoRef, stream, capturedImage, error,
    startCamera, capturePhoto, stopCamera,
    guideHeightPct, resizeGuide,
    zoom, applyZoom
  } = useCamera()

  const containerRef = useRef<HTMLDivElement>(null)
  const pinchStartDistRef = useRef<number | null>(null)
  const pinchStartHeightRef = useRef<number>(guideHeightPct)
  const pinchStartZoomRef = useRef<number>(1)
  const guideHeightRef = useRef<number>(guideHeightPct)
  const zoomRef = useRef<number>(zoom)
  const guideRef = useRef<HTMLDivElement>(null)

  useEffect(() => { guideHeightRef.current = guideHeightPct }, [guideHeightPct])
  useEffect(() => { zoomRef.current = zoom }, [zoom])

  useEffect(() => {
    startCamera()
    return () => { stopCamera() }
  }, [])

  const onCaptureRef = useRef(onCapture)
  useEffect(() => { onCaptureRef.current = onCapture }, [onCapture])
  useEffect(() => {
    if (capturedImage) onCaptureRef.current(capturedImage)
  }, [capturedImage])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function getPinchDistance(touches: TouchList): number {
      const dx = touches[0].clientX - touches[1].clientX
      const dy = touches[0].clientY - touches[1].clientY
      return Math.sqrt(dx * dx + dy * dy)
    }

    function isTouchOnGuide(touches: TouchList): boolean {
      const guide = guideRef.current
      if (!guide) return false
      const rect = guide.getBoundingClientRect()
      return Array.from(touches).some(t =>
        t.clientX >= rect.left && t.clientX <= rect.right &&
        t.clientY >= rect.top && t.clientY <= rect.bottom
      )
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 2) {
        e.preventDefault()
        pinchStartDistRef.current = getPinchDistance(e.touches)
        pinchStartHeightRef.current = guideHeightRef.current
        pinchStartZoomRef.current = zoomRef.current
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
        e.preventDefault()
        const currentDist = getPinchDistance(e.touches)
        const ratio = currentDist / pinchStartDistRef.current

        if (isTouchOnGuide(e.touches)) {
          const newHeight = Math.min(
            MAX_GUIDE_HEIGHT_PCT,
            Math.max(MIN_GUIDE_HEIGHT_PCT, pinchStartHeightRef.current * ratio)
          )
          resizeGuide(newHeight - guideHeightRef.current)
        } else {
          const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, pinchStartZoomRef.current * ratio))
          applyZoom(newZoom)
        }
      }
    }

    function onTouchEnd() {
      pinchStartDistRef.current = null
    }

    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [resizeGuide, applyZoom])

  if (error) return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-6">
      <p className="text-red-400 text-center mb-4">{error}</p>
      <button onClick={startCamera} className="bg-blue-600 px-6 py-3 rounded-xl">
        {t('camera_retry')}
      </button>
    </div>
  )

  return (
    <div
      ref={containerRef}
      className="relative bg-black overflow-hidden"
      style={{ touchAction: 'none', height: '100dvh' }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          transition: 'transform 0.05s ease-out',
        }}
      />

      <button
        onClick={() => { stopCamera(); onGoHome() }}
        className="absolute top-4 left-4 bg-black/50 text-white text-sm px-3 py-2 rounded-full"
      >
        ← メニュー
      </button>

      {stream && (
        <>
          <div
            ref={guideRef}
            className="absolute border-2 border-white rounded-lg pointer-events-none"
            style={{
              left: `${(1 - GUIDE_WIDTH_PCT) / 2 * 100}%`,
              top: `${(1 - guideHeightPct) / 2 * 100}%`,
              width: `${GUIDE_WIDTH_PCT * 100}%`,
              height: `${guideHeightPct * 100}%`,
              boxShadow: '0 0 0 2000px rgba(0,0,0,0.45)',
            }}
          />
          <p className="absolute top-[10%] left-0 right-0 text-center text-white text-sm pointer-events-none">
            枠内のテキストを翻訳します
          </p>
          <p className="absolute top-[14%] left-0 right-0 text-center text-gray-400 text-xs pointer-events-none">
            枠: ピンチで拡縮 / 外: ズーム
          </p>
          {zoom > 1 && (
            <div className="absolute top-[19%] left-0 right-0 flex justify-center pointer-events-none">
              <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                {zoom.toFixed(1)}x
              </span>
            </div>
          )}
        </>
      )}

      {stream && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <button
            onClick={() => capturePhoto(guideHeightPct, zoom)}
            className="w-20 h-20 rounded-full bg-white border-4 border-gray-300 shadow-lg active:scale-95 transition-transform"
          />
        </div>
      )}

      <label className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-gray-800 px-4 py-3 rounded-full cursor-pointer text-white text-sm whitespace-nowrap">
        写真ライブラリから探す
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
      </label>
    </div>
  )
}