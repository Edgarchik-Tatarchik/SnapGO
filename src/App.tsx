import { useAuth } from './hooks/useAuth'
import { ScanPage } from './pages/ScanPage'

function App() {
  useAuth()
  return <ScanPage />
}

export default App