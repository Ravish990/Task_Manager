import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from "./components/Login"
import Register from "./components/Register"
import Dashboard from "./components/Dashboard" 
import ProjectDetail from "./components/ProjectDetail"

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
       
        <Route path='/' element={<Navigate to="/login" replace />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/projects/:projectId' element={<ProjectDetail />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App