import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

import { queryClient } from '@/lib/queryClient'
import App from '@/App'

import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-center"
        gutter={12}
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '12px',
            background: '#fff',
            color: '#18181b',
            fontSize: '14px',
            fontWeight: '500',
            padding: '12px 18px',
            boxShadow: '0 8px 32px 0 rgba(0,0,0,0.12), 0 2px 8px 0 rgba(0,0,0,0.06)',
            border: '1px solid rgba(0,0,0,0.06)',
            maxWidth: '380px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          },
          success: {
            iconTheme: {
              primary: '#16a34a',
              secondary: '#fff',
            },
            style: {
              borderLeft: '4px solid #16a34a',
            },
          },
          error: {
            iconTheme: {
              primary: '#E3182D',
              secondary: '#fff',
            },
            style: {
              borderLeft: '4px solid #E3182D',
            },
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode>,
)
