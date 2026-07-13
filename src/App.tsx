import { Route, Routes } from 'react-router-dom'
import { LaunchFormPage } from './pages/LaunchFormPage'
import { KitResultsPage } from './pages/KitResultsPage'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LaunchFormPage />} />
      <Route path="/kit" element={<KitResultsPage />} />
    </Routes>
  )
}

export default App
