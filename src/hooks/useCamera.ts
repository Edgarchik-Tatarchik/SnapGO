import { useState, useRef, useCallback } from 'react'

export const GUIDE_WIDTH_PCT = 0.8
export const GUIDE_HEIGHT_PCT = 0.5
export const MIN_GUIDE_HEIGHT_PCT = 0.2
export const MAX_GUIDE_HEIGHT_PCT = 0.75
export const MIN_ZOOM = 1
export const MAX_ZOOM = 4

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [guideHeightPct, setGuideHeightPct] = useState(GUIDE_HEIGHT_PCT)
  const [zoom, setZoom] = useState(1)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        }
      })
      streamRef.current = mediaStream
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch {
      setError('カメラへのアクセスが拒否されました')
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    setStream(null)
  }, [])

  const capturePhoto = useCallback((currentGuideHeightPct: number, currentZoom: number) => {
    const video = videoRef.current
    if (!video) return

    const vw = video.videoWidth
    const vh = video.videoHeight
    const cw = video.clientWidth
    const ch = video.clientHeight

    const scale = Math.max(cw / vw, ch / vh)
    const visibleW = cw / scale
    const visibleH = ch / scale

    const zoomedVisibleW = visibleW / currentZoom
    const zoomedVisibleH = visibleH / currentZoom
    const offsetX = (vw - zoomedVisibleW) / 2
    const offsetY = (vh - zoomedVisibleH) / 2

    const marginXPct = (1 - GUIDE_WIDTH_PCT) / 2
    const marginYPct = (1 - currentGuideHeightPct) / 2
    const sx = offsetX + zoomedVisibleW * marginXPct
    const sy = offsetY + zoomedVisibleH * marginYPct
    const sw = zoomedVisibleW * GUIDE_WIDTH_PCT
    const sh = zoomedVisibleH * currentGuideHeightPct

    const canvas = document.createElement('canvas')
    canvas.width = sw
    canvas.height = sh
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh)

    const imageData = canvas.toDataURL('image/jpeg', 0.85)
    setCapturedImage(imageData)
    stopCamera()
  }, [stopCamera])

  const resizeGuide = useCallback((delta: number) => {
    setGuideHeightPct(prev =>
      Math.min(MAX_GUIDE_HEIGHT_PCT, Math.max(MIN_GUIDE_HEIGHT_PCT, prev + delta))
    )
  }, [])

  const applyZoom = useCallback((newZoom: number) => {
    setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom)))
  }, [])

  return {
    videoRef, stream, capturedImage, error,
    startCamera, capturePhoto, stopCamera,
    guideHeightPct, resizeGuide,
    zoom, applyZoom
  }
}