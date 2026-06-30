import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import HomePage from './pages/HomePage'
import { ScanPage } from './pages/ScanPage'
import { SavedScansPage } from './pages/SavedScansPage'
import { QuizPage } from './pages/QuizPage'
import { SettingsPage } from './pages/SettingsPage'
import { StatsPage } from './pages/StatsPage'

type AppScreen = 'home' | 'scan' | 'saved' | 'quiz' | 'settings' | 'stats'

function App() {
  useAuth()
  const initialScreen = (): AppScreen => {
  const params = new URLSearchParams(window.location.search)
  const s = params.get('screen')
  if (s === 'quiz' || s === 'stats' || s === 'saved') return s
  return 'home'
}

  const [screen, setScreen] = useState<AppScreen>(initialScreen)
  if (screen === 'home') return (
    <HomePage
      onStartCamera={() => setScreen('scan')}
      onViewSaved={() => setScreen('saved')}
      onStartQuiz={() => setScreen('quiz')}
      onOpenSettings={() => setScreen('settings')}
      onOpenStats={() => setScreen('stats')}
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

  if (screen === 'stats') return (
  <StatsPage onBack={() => setScreen('home')} onStartQuiz={() => setScreen('quiz')} />
  )
}

export default App