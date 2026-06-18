import { useState, useRef, useCallback } from 'react'

export const GUIDE_WIDTH_PCT = 0.8
export const GUIDE_HEIGHT_PCT = 0.5

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
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
    } catch (err) {
      setError('カメラへのアクセスが拒否されました')
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    setStream(null)
  }, [])

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const vw = video.videoWidth
    const vh = video.videoHeight
    const cw = video.clientWidth
    const ch = video.clientHeight
    
    const scale = Math.max(cw / vw, ch / vh)
    const visibleW = cw / scale
    const visibleH = ch / scale
    const offsetX = (vw - visibleW) / 2
    const offsetY = (vh - visibleH) / 2

    const marginXPct = (1 - GUIDE_WIDTH_PCT) / 2
    const marginYPct = (1 - GUIDE_HEIGHT_PCT) / 2
    const sx = offsetX + visibleW * marginXPct
    const sy = offsetY + visibleH * marginYPct
    const sw = visibleW * GUIDE_WIDTH_PCT
    const sh = visibleH * GUIDE_HEIGHT_PCT

    const canvas = document.createElement('canvas')
    canvas.width = sw
    canvas.height = sh
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh)

    const imageData = canvas.toDataURL('image/jpeg', 0.85)
    setCapturedImage(imageData)
    stopCamera()
  }, [stopCamera])

  return { videoRef, stream, capturedImage, error, startCamera, capturePhoto, stopCamera }
}