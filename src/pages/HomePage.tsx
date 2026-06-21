interface HomePageProps {
  onStartCamera: () => void
  onViewSaved: () => void
  onStartQuiz: () => void
  onOpenSettings: () => void
}

export default function HomePage({ onStartCamera, onViewSaved, onStartQuiz, onOpenSettings }: HomePageProps) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-8 p-8 relative">
      <button
        onClick={onOpenSettings}
        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer text-2xl"
      >
        ⚙️
      </button>

      <div className="text-center">
        <img src="/icon-228.png" className="w-40 h-40 mb-6 rounded-2xl" />
        <h1 className="text-3xl font-bold mb-2">サインレンズ</h1>
        <p className="text-gray-400">日本語サインを翻訳する</p>
      </div>

      <div className="flex flex-col w-full max-w-sm gap-4">
        <button onClick={onStartCamera} className="py-4 rounded-xl bg-blue-600 text-white text-lg font-bold cursor-pointer hover:bg-blue-500 active:scale-95 transition-all">
          📷 写真を撮影する
        </button>
        <button onClick={onViewSaved} className="py-4 rounded-xl bg-gray-700 text-white text-lg cursor-pointer hover:bg-gray-600 active:scale-95 transition-all">
          📂 保存された写真を見る
        </button>
        <button onClick={onStartQuiz} className="py-4 rounded-xl bg-purple-600 text-white text-lg cursor-pointer hover:bg-purple-500 active:scale-95 transition-all">
          🎯 クイズに挑戦する
        </button>
      </div>
    </div>
  )
}