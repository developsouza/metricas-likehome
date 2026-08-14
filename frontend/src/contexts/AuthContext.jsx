import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import { sortearFraseMotivacional } from '../utils/motivationalPhrases'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const s = localStorage.getItem('usuario')
    if (!s) return null
    try { return JSON.parse(s) } catch { localStorage.removeItem('usuario'); return null }
  })
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('token')))

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
    }
  }, [])

  async function login(email, senha) {
    const r = await api.post('/auth/login', { email, senha })
    localStorage.setItem('token', r.data.token)
    localStorage.setItem('usuario', JSON.stringify(r.data.usuario))
    sortearFraseMotivacional()
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
