import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

export interface UserInfo {
  email: string
  nickname: string
  age: number
  menstrualStatus: string
  height?: number
  weight?: number
  fertilityHistory?: string   // 生育史（可选）
  pastMedicalHistory?: string // 既往病史（可选）
}

interface UserContextType {
  user: UserInfo | null
  isLoggedIn: boolean
  login: (email: string, nickname?: string, extraInfo?: Partial<UserInfo>) => void
  logout: () => void
  updateUser: (info: Partial<UserInfo>) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

const STORAGE_KEY = 'user-info'

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  const login = (email: string, nickname?: string, extraInfo?: Partial<UserInfo>) => {
    const newUser: UserInfo = {
      email,
      nickname: nickname || email.split('@')[0],
      age: extraInfo?.age || 0,
      menstrualStatus: extraInfo?.menstrualStatus || '',
      height: extraInfo?.height,
      weight: extraInfo?.weight,
      fertilityHistory: extraInfo?.fertilityHistory || '',
      pastMedicalHistory: extraInfo?.pastMedicalHistory || '',
    }
    setUser(newUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  const updateUser = (info: Partial<UserInfo>) => {
    if (!user) return
    const updated = { ...user, ...info }
    setUser(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  return (
    <UserContext.Provider value={{ user, isLoggedIn: !!user, login, logout, updateUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within UserProvider')
  }
  return context
}
