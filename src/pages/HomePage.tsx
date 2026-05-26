
interface HomePageProps {
  onStartCamera: () => void
  onViewSaved: () => void
}

export function HomePage({ onStartCamera, onViewSaved }: HomePageProps) {
    return  (
             <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-8 p-8">
      <div className="text-center">
        <img src="/icon-228.png" className="w-100 h-70 mb-1" />
        <p className="text-gray-400">日本語サインを翻訳する</p>
      </div>
      <div className="flex flex-col w-full max-w-sm gap-4">
        <button
          onClick={onStartCamera}
          className="py-4 rounded-xl bg-blue-600 text-white text-lg font-bold 
             cursor-pointer hover:bg-blue-500 active:scale-95 transition-all"
        >
            📷 写真を撮る
        </button>
        <button
          onClick={onViewSaved}
          className="py-4 rounded-xl bg-gray-700 text-white text-lg 
             cursor-pointer hover:bg-gray-600 active:scale-95 transition-all"
        >
            📂 保存された写真を見る
        </button>
        </div>
    </div>
    )
}