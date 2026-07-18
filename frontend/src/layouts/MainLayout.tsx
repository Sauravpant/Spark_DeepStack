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
  Mic,
  ChevronRight,
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
  { title: 'Vyapar Voice', icon: Mic, href: ROUTES.VYAPAR_VOICE },
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

  const userInitials = user?.full_name
    ? user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'SO';

  const currentPage = sidebarNav.find(n => location.pathname.startsWith(n.href))?.title ?? 'Dashboard';

  return (
    <div className="flex h-screen bg-[#F4F6F9] overflow-hidden font-sans">
      {/* ===== SIDEBAR ===== */}
      <aside className="w-64 bg-white flex flex-col flex-shrink-0 z-20 shadow-[1px_0_0_0_oklch(0.91_0.008_264)]">
        {/* Logo */}
        <div className="h-[65px] flex items-center px-5 shrink-0 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-[#ff6b35] to-[#E3182D] rounded-lg flex items-center justify-center shadow-sm shadow-red-200">
              <Store className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-[15px] text-slate-900 tracking-tight">{APP_NAME}</span>
              <span className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-0.5">{APP_TAGLINE}</span>
            </div>
          </div>
        </div>

        {/* Nav Label */}
        <div className="px-5 pt-5 pb-1">
          <span className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">Navigation</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-1 px-3 flex flex-col gap-0.5 scrollbar-hide">
          {sidebarNav.map((item) => (
            <NavLink
              key={item.title}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-red-50 to-red-50/60 text-[#E3182D] shadow-none nav-active-indicator'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      'w-[18px] h-[18px] shrink-0 transition-colors duration-200',
                      isActive ? 'text-[#E3182D]' : 'text-slate-400 group-hover:text-slate-600'
                    )}
                  />
                  <span className="flex-1 truncate">{item.title}</span>
                  {isActive && (
                    <ChevronRight className="w-3.5 h-3.5 text-red-400 opacity-60" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Divider label */}
        <div className="px-5 pb-1 pt-2">
          <span className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">Account</span>
        </div>

        {/* Bottom Actions */}
        <div className="px-3 pb-4 flex flex-col gap-0.5">
          <NavLink
            to={ROUTES.SETTINGS}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-red-50 to-red-50/60 text-[#E3182D] nav-active-indicator'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Settings className={cn('w-[18px] h-[18px] shrink-0 transition-colors', isActive ? 'text-[#E3182D]' : 'text-slate-400 group-hover:text-slate-600')} />
                Settings
              </>
            )}
          </NavLink>
          <button
            onClick={handleLogout}
            className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 text-left w-full cursor-pointer"
          >
            <LogOut className="w-[18px] h-[18px] shrink-0 text-slate-400 group-hover:text-red-500 transition-colors" />
            Logout
          </button>
        </div>

        {/* User pill at bottom */}
        <div className="mx-3 mb-4 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-[#ff6b35] to-[#E3182D] text-white text-xs font-bold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-semibold text-slate-800 truncate leading-tight">
              {user?.full_name || 'Store Owner'}
            </span>
            <span className="text-[11px] text-slate-400 leading-tight">Owner</span>
          </div>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-[65px] bg-white flex items-center justify-between px-6 shrink-0 z-10 shadow-[0_1px_0_0_oklch(0.91_0.008_264)]">
          {/* Left: breadcrumb + shop switcher */}
          <div className="flex items-center gap-4 flex-1">
            {/* Breadcrumb */}
            <div className="hidden md:flex items-center gap-1.5 text-slate-400 text-sm">
              <span className="font-medium text-slate-700">{currentPage}</span>
            </div>

            {/* Search */}
            <div className="flex items-center w-full max-w-xs relative ml-2">
              <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search..."
                className="pl-8 pr-3 h-9 bg-slate-50 border-slate-200 text-[13px] placeholder:text-slate-400 focus-visible:ring-red-100 focus-visible:border-red-300 rounded-lg w-full transition-all"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2.5">
            {/* Shop Switcher */}
            {activeShop && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-3 py-1.5 h-9 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-700 text-[13px] font-medium transition-all cursor-pointer"
                  >
                    <div className="w-5 h-5 bg-gradient-to-br from-[#ff6b35] to-[#E3182D] rounded flex items-center justify-center">
                      <Store className="w-3 h-3 text-white" />
                    </div>
                    <span className="max-w-[130px] truncate">{activeShop.shop_name}</span>
                    <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-white border border-slate-200 shadow-xl shadow-slate-200/50 rounded-xl p-1.5 animate-scale-in"
                >
                  <div className="px-3 py-2 mb-1">
                    <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">Your Shops</p>
                  </div>
                  {shops && shops.map((s) => (
                    <DropdownMenuItem
                      key={s.id}
                      onClick={() => setActiveShop(s)}
                      className={cn(
                        'flex items-center justify-between font-medium px-3 py-2 rounded-lg text-[13px] text-slate-700 hover:bg-slate-50 focus:bg-slate-50 outline-none transition-colors cursor-pointer',
                        activeShop.id === s.id && 'text-red-600 bg-red-50 hover:bg-red-50 focus:bg-red-50'
                      )}
                    >
                      <span className="truncate">{s.shop_name}</span>
                      {activeShop.id === s.id && (
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator className="h-px bg-slate-100 my-1.5" />
                  <DropdownMenuItem asChild className="px-3 py-2 rounded-lg text-[13px] outline-none">
                    <Link
                      to="/shop-setup"
                      className="flex items-center gap-2 text-red-600 font-semibold hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <div className="w-5 h-5 bg-red-100 rounded flex items-center justify-center">
                        <Plus className="w-3 h-3 text-red-600" />
                      </div>
                      Add New Shop
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Divider */}
            <div className="h-6 w-px bg-slate-200 mx-1" />

            {/* Notifications */}
            <Link to="/notifications">
              <Button
                variant="ghost"
                size="icon"
                className="relative w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all cursor-pointer"
              >
                <Bell className="w-[18px] h-[18px]" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white pulse-dot" />
              </Button>
            </Link>

            {/* Settings shortcut */}
            <Link to={ROUTES.SETTINGS}>
              <Button
                variant="ghost"
                size="icon"
                className="w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all cursor-pointer"
              >
                <Settings className="w-[18px] h-[18px]" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-[#F4F6F9] animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
