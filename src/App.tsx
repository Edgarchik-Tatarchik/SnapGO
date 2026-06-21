import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import HomePage from './pages/HomePage'
import { ScanPage } from './pages/ScanPage'
import { SavedScansPage } from './pages/SavedScansPage'
import { QuizPage } from './pages/QuizPage'
import { SettingsPage } from './pages/SettingsPage'

type AppScreen = 'home' | 'scan' | 'saved' | 'quiz' | 'settings'

function App() {
  useAuth()
  const [screen, setScreen] = useState<AppScreen>('home')

  if (screen === 'home') return (
    <HomePage
      onStartCamera={() => setScreen('scan')}
      onViewSaved={() => setScreen('saved')}
      onStartQuiz={() => setScreen('quiz')}
      onOpenSettings={() => setScreen('settings')}
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

  if (screen === 'settings') return (
    <SettingsPage onBack={() => setScreen('home')} />
  )
}

export default App