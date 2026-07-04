import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ScreenTV from './components/ScreenTV'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ScreenTV />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
