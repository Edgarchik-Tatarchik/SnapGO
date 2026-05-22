interface ImagePreviewProps {
  imageData: string
  onConfirm: () => void
  onRetake: () => void
}

export function ImagePreview({ imageData, onConfirm, onRetake }: ImagePreviewProps) {
  return (
    <div className="flex flex-col h-screen bg-gray-900">
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