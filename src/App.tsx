import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { HomePage } from './pages/HomePage'
import { SavedScansPage } from './pages/SavedScansPage'
import { ScanPage } from './pages/ScanPage'
import { QuizPage } from './pages/QuizPage'

type AppScreen = 'home' | 'scan' | 'saved' | 'quiz'

function App() {
  useAuth()
  const [screen, setScreen] = useState<AppScreen>('home')

  if (screen === 'home') return (
    <HomePage
      onStartCamera={() => setScreen('scan')}
      onViewSaved={() => setScreen('saved')}
      onStartQuiz={() => setScreen('quiz')}
    />
  )

  if (screen === 'scan') return (
    <ScanPage onGoHome={() => setScreen('home')} />
  )

  if (screen === 'saved') return (
    <SavedScansPage onBack={() => setScreen('home')} />
  )

  if (screen === 'quiz') return (
    <QuizPage onExit={() => setScreen('home')} />
  )
}

export default App