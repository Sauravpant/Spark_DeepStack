import { useEffect } from 'react';
import { Outlet, Navigate, NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { ROUTES, APP_NAME, APP_TAGLINE } from '@/constants/routes';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  Receipt,
  Package,
  Users,
  ShieldAlert,
  TrendingUp,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Search,
  Store,
  ChevronsUpDown,
  Plus,
  Tags,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { getShops } from '@/services/shop.service';
import { logout as logoutApi } from '@/services/auth.service';
import { useMe } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { queryClient } from '@/lib/queryClient';

const sidebarNav = [
  { title: 'Dashboard', icon: LayoutDashboard, href: ROUTES.DASHBOARD },
  { title: 'Transactions', icon: Receipt, href: ROUTES.TRANSACTIONS },
  { title: 'Inventory', icon: Package, href: ROUTES.INVENTORY },
  { title: 'Categories', icon: Tags, href: ROUTES.CATEGORIES },
  { title: 'Customers', icon: Users, href: ROUTES.CUSTOMERS },
  { title: 'Credit Risk', icon: ShieldAlert, href: ROUTES.CREDIT_RISK },
  { title: 'Demand Forecasting', icon: TrendingUp, href: ROUTES.DEMAND_FORECASTING },
  { title: 'Reports', icon: BarChart3, href: ROUTES.REPORTS },
];

export default function MainLayout() {
  const { isAuthenticated, activeShop, user, logout, setActiveShop, setUserProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: me } = useMe();

  useEffect(() => {
    if (me) setUserProfile(me);
  }, [me, setUserProfile]);

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch {
      // still clear local session
    }
    logout();
    queryClient.clear();
    navigate(ROUTES.LOGIN);
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!activeShop && location.pathname !== '/shop-setup') {
    return <Navigate to="/shop-setup" replace />;
  }

  const { data: shops } = useQuery({
    queryKey: ['shops'],
    queryFn: getShops,
    enabled: isAuthenticated,
  });

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
            onClick={handleLogout}
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
          <div className="flex items-center gap-4 flex-1">
            {activeShop && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-3 py-1.5 h-10 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-md text-slate-700">
                    <Store className="w-4 h-4 text-[#E3182D]" />
                    <span className="font-semibold text-sm max-w-[150px] truncate">{activeShop.shop_name}</span>
                    <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 bg-white border border-slate-200 shadow-lg rounded-md p-1">
                  {shops && shops.map((s) => (
                    <DropdownMenuItem
                      key={s.id}
                      onClick={() => setActiveShop(s)}
                      className={cn(
                        "flex items-center justify-between font-medium cursor-pointer px-3 py-2 rounded text-sm text-slate-700 hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900 outline-none",
                        activeShop.id === s.id && "text-red-600 bg-red-50 hover:bg-red-50 focus:bg-red-50"
                      )}
                    >
                      <span className="truncate">{s.shop_name}</span>
                      {activeShop.id === s.id && <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator className="h-px bg-slate-100 my-1" />
                  <DropdownMenuItem asChild className="px-3 py-2 rounded text-sm outline-none">
                    <Link to="/shop-setup" className="flex items-center gap-2 text-red-600 font-semibold cursor-pointer hover:bg-red-50 hover:text-red-700">
                      <Plus className="w-4 h-4" /> Add New Shop
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <div className="flex items-center w-full max-w-xs relative">
              <Search className="w-4 h-4 absolute left-3 text-slate-400" />
              <Input 
                type="text" 
                placeholder="Search products..." 
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-red-100 w-full h-9"
              />
            </div>
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
                <span className="text-sm font-semibold text-slate-800 leading-tight">
                  {user?.full_name || 'Store Owner'}
                </span>
                <span className="text-xs text-slate-500 leading-tight">Owner</span>
              </div>
              <Avatar className="w-9 h-9 border border-slate-200">
                <AvatarFallback>
                  {user?.full_name 
                    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase() 
                    : 'SO'}
                </AvatarFallback>
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
