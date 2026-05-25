import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { ScanPage } from './pages/ScanPage'
import { HomePage } from './pages/HomePage'
import { SavedScansPage } from './pages/SavedScansPage'

type AppScreen = 'home' | 'scan' | 'saved'

function App() {
  useAuth()
  const [screen, setScreen] = useState<AppScreen>('home')
  if (screen === 'home') 
  return (<HomePage
  onStartCamera={() => setScreen('scan')}
  onViewSaved={() => setScreen('saved')}
  />
  )
  if (screen === 'scan') 
    return (<ScanPage 
  onGoHome={() => setScreen('home')}
  />
    )
    if (screen === 'saved')
    return (<SavedScansPage 
  onBack={() => setScreen('home')}
   />
    )
}

export default App