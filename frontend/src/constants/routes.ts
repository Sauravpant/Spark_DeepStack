export const APP_NAME = 'Vyapar'
export const APP_TAGLINE = 'Kirana Digitization'

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
  TRANSACTIONS: '/transactions',
  INVENTORY: '/inventory',
  CUSTOMERS: '/customers',
  CREDIT_RISK: '/credit-risk',
  DEMAND_FORECASTING: '/demand-forecasting',
  BAZAR_VOICE: '/bazar-voice',
  REPORTS: '/reports',
  NOTIFICATIONS: '/notifications',
  SETTINGS: '/settings',
  PROFILE: '/profile',
} as const

export const TOKEN_KEY = 'vyapar_access_token'
export const REFRESH_TOKEN_KEY = 'vyapar_refresh_token'
