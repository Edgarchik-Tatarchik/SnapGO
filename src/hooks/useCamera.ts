import { useState, useRef, useCallback } from 'react'

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(videoRef.current, 0, 0)
    const imageData = canvas.toDataURL('image/jpeg', 0.8)
    setCapturedImage(imageData)
    stopCamera()
  }, [])

 const streamRef = useRef<MediaStream | null>(null)

const stopCamera = useCallback(() => {
  streamRef.current?.getTracks().forEach(track => track.stop())
  streamRef.current = null
  setStream(null)
}, []) 

  return { videoRef, stream, capturedImage, error, startCamera, capturePhoto, stopCamera }
}