import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Analytics from './pages/Analytics'
import Batch from './pages/Batch'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Landing from './pages/Landing'
import Login from './pages/Login'
import ModelCard from './pages/ModelCard'
import NotFound from './pages/NotFound'
import Predict from './pages/Predict'
import Register from './pages/Register'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/app" element={<Dashboard />} />
        <Route path="/app/predict" element={<Predict />} />
        <Route path="/app/batch" element={<Batch />} />
        <Route path="/app/history" element={<History />} />
        <Route path="/app/analytics" element={<Analytics />} />
        <Route path="/app/model" element={<ModelCard />} />
        <Route path="/app/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
