
interface HomePageProps {
  onStartCamera: () => void
  onViewSaved: () => void
}

export function HomePage({ onStartCamera, onViewSaved }: HomePageProps) {
    return  (
             <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-8 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">サインレンズ</h1>
        <p className="text-gray-400">日本語サインを翻訳する</p>
      </div>
      <div className="flex flex-col w-full max-w-sm gap-4">
        <button
          onClick={onStartCamera}
          className="py-4 rounded-xl bg-blue-600 text-white text-lg font-bold"
        >
            📷 写真を撮る
        </button>
        <button
          onClick={onViewSaved}
          className="py-4 rounded-xl bg-gray-700 text-white text-lg"
        >
            📂 保存された写真を見る
        </button>
        </div>
    </div>
    )
}