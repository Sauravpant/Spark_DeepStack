import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';
import Dashboard from '@/pages/Dashboard';
import Inventory from '@/pages/Inventory';
import Categories from '@/pages/Categories';
import CreditRisk from '@/pages/CreditRisk';
import Customers from '@/pages/Customers';
import Transactions from '@/pages/Transactions';
import DemandForecast from '@/pages/DemandForecast';
import Reports from '@/pages/Reports';
import Notifications from '@/pages/Notifications';
import Settings from '@/pages/Settings';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ShopSetup from '@/pages/ShopSetup';
import VyaparVoice from '@/pages/VyaparVoice';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'inventory', element: <Inventory /> },
      { path: 'categories', element: <Categories /> },
      { path: 'credit-risk', element: <CreditRisk /> },
      { path: 'customers', element: <Customers /> },
      { path: 'transactions', element: <Transactions /> },
      { path: 'demand-forecasting', element: <DemandForecast /> },
      { path: 'vyapar-voice', element: <VyaparVoice /> },
      { path: 'reports', element: <Reports /> },
      { path: 'notifications', element: <Notifications /> },
      { path: 'settings', element: <Settings /> },
      { path: 'shop-setup', element: <ShopSetup /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
    ],
  },
  {
    path: '*',
    element: (
      <div className="flex flex-col items-center justify-center min-h-screen text-center bg-slate-50">
        <p className="text-8xl font-black text-slate-200 mb-4">404</p>
        <p className="text-slate-500 font-medium text-lg">Page not found</p>
        <a href="/" className="mt-6 text-red-600 font-medium hover:underline">
          Return Home
        </a>
      </div>
    ),
  },
]);
