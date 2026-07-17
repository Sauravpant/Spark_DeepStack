export type UserRole = 'admin' | 'user'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  storeName?: string
  avatarUrl?: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  storeName: string
}
