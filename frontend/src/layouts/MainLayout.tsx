import { Outlet, Navigate, NavLink } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { ROUTES, APP_NAME, APP_TAGLINE } from '@/constants/routes';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  Receipt,
  Package,
  Users,
  ShieldAlert,
  TrendingUp,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Search,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const sidebarNav = [
  { title: 'Dashboard', icon: LayoutDashboard, href: ROUTES.HOME },
  { title: 'Transactions', icon: Receipt, href: ROUTES.TRANSACTIONS },
  { title: 'Inventory', icon: Package, href: ROUTES.INVENTORY },
  { title: 'Customers', icon: Users, href: ROUTES.CUSTOMERS },
  { title: 'Credit Risk', icon: ShieldAlert, href: ROUTES.CREDIT_RISK },
  { title: 'Demand Forecasting', icon: TrendingUp, href: ROUTES.DEMAND_FORECASTING },
  { title: 'Bazar Voice', icon: MessageSquare, href: ROUTES.BAZAR_VOICE },
  { title: 'Reports', icon: BarChart3, href: ROUTES.REPORTS },
];

export default function MainLayout() {
  const { isAuthenticated, logout } = useAuth();

  // Auth guard temporarily disabled for testing
  // if (!isAuthenticated) {
  //   return <Navigate to="/login" replace />;
  // }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 z-10">
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200 shrink-0">
          <div className="flex flex-col">
             <div className="flex items-center gap-2">
               <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-red-600 rounded-sm clip-path-polygon"></div>
               <span className="font-bold text-xl text-slate-800 tracking-tight">{APP_NAME}</span>
             </div>
             <span className="text-xs text-slate-500 font-medium">{APP_TAGLINE}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 scrollbar-hide">
          {sidebarNav.map((item) => (
            <NavLink
              key={item.title}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-red-50 text-red-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.title}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-200 flex flex-col gap-1">
          <NavLink
            to={ROUTES.SETTINGS}
            className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-red-50 text-red-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )
              }
          >
            <Settings className="w-5 h-5" />
            Settings
          </NavLink>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors text-left w-full"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center w-full max-w-md relative">
            <Search className="w-4 h-4 absolute left-3 text-slate-400" />
            <Input 
              type="text" 
              placeholder="Search products, SKUs, or categories..." 
              className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-red-100 w-full"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/notifications">
            <Button variant="ghost" size="icon" className="text-slate-500 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </Button>
          </Link>
            <Button variant="ghost" size="icon" className="text-slate-500">
               <Settings className="w-5 h-5" />
            </Button>
            
            <div className="h-8 w-px bg-slate-200 mx-1"></div>
            
            <div className="flex items-center gap-3 pl-2">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-800 leading-tight">Saurav K.</span>
                <span className="text-xs text-slate-500 leading-tight">Admin</span>
              </div>
              <Avatar className="w-9 h-9 border border-slate-200">
                <AvatarImage src="https://github.com/shadcn.png" alt="@sauravk" />
                <AvatarFallback>SK</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-[#F8FAFC]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
