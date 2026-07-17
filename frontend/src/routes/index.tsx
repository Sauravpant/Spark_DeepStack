import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';
import Dashboard from '@/pages/Dashboard';
import Inventory from '@/pages/Inventory';
import CreditRisk from '@/pages/CreditRisk';
import Customers from '@/pages/Customers';
import Transactions from '@/pages/Transactions';
import DemandForecast from '@/pages/DemandForecast';
import Reports from '@/pages/Reports';
import Notifications from '@/pages/Notifications';
import Settings from '@/pages/Settings';
import Login from '@/pages/Login';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'inventory', element: <Inventory /> },
      { path: 'credit-risk', element: <CreditRisk /> },
      { path: 'customers', element: <Customers /> },
      { path: 'transactions', element: <Transactions /> },
      { path: 'demand-forecasting', element: <DemandForecast /> },
      { path: 'reports', element: <Reports /> },
      { path: 'notifications', element: <Notifications /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <Login /> },
    ],
  },
  {
    path: '*',
    element: (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <p className="text-6xl font-black text-slate-200 mb-2">404</p>
        <p className="text-slate-500 font-medium">Page not found</p>
      </div>
    ),
  },
]);
