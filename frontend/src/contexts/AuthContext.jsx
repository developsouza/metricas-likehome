import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const s = localStorage.getItem('usuario')
    return s ? JSON.parse(s) : null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.get('/auth/me').then(r => {
        setUsuario(r.data)
        localStorage.setItem('usuario', JSON.stringify(r.data))
      }).catch(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('usuario')
        setUsuario(null)
      }).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  async function login(email, senha) {
    const r = await api.post('/auth/login', { email, senha })
    localStorage.setItem('token', r.data.token)
    localStorage.setItem('usuario', JSON.stringify(r.data.usuario))
    setUsuario(r.data.usuario)
    return r.data.usuario
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
