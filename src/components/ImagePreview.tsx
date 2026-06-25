interface ImagePreviewProps {
  imageData: string
  onConfirm: () => void
  onRetake: () => void
  onGoHome: () => void
}

export function ImagePreview({ imageData, onConfirm, onRetake, onGoHome }: ImagePreviewProps) {
  return (
    <div className="flex flex-col bg-gray-900" style={{ height: '100dvh' }}>
      <div className="flex items-center px-4 pt-4 pb-2">
        <button
          onClick={onGoHome}
          className="text-blue-400 text-sm"
        >
          ← メニュー
        </button>
      </div>
      <img src={imageData} className="flex-1 object-contain" alt="preview" />
      <div className="flex gap-4 p-6">
        <button
          onClick={onRetake}
          className="flex-1 py-4 rounded-xl bg-gray-700 text-white text-lg"
        >
          撮り直す
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-4 rounded-xl bg-blue-600 text-white text-lg font-bold"
        >
          認識する
        </button>
      </div>
    </div>
  )
}