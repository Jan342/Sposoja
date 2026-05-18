import './App.css'
import Header from './components/Header'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Login from './components/Login'
import Register from './components/Register'
import { useState } from 'react'
import { UserContext } from './contexts/userContext'
import Logout from './components/Logout'
import GuestRoute from './components/GuestRoute'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './components/Dashboard'
import RacketRent from './components/RacketRent'
import Profile from './components/Profile'
import type { User } from './types/user'

function App() {
  const [user, setUser] = useState<User | null>(localStorage.user ? JSON.parse(localStorage.user) : null);
  const updateUserData = (userInfo: User | null) => {
  localStorage.setItem("user", JSON.stringify(userInfo));
  setUser(userInfo);
  }

  return (
    <>
       <BrowserRouter>
       <UserContext.Provider value={{
            user: user,
            setUserContext: updateUserData
          }}>
            <div className="App">
              <Header></Header>
              <Routes>
                <Route path="/register" element={<GuestRoute><Register /></GuestRoute>}></Route>
                <Route path="/login" element={<GuestRoute><Login /></GuestRoute>}></Route>
                <Route path="/logout" element={<ProtectedRoute><Logout /></ProtectedRoute>}></Route>
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}></Route>
                <Route path="/rent" element={<ProtectedRoute><RacketRent /></ProtectedRoute>}></Route>
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>}></Route>
              </Routes>
            </div>
          </UserContext.Provider>
      </BrowserRouter>
    </>
  )
}

export default App
