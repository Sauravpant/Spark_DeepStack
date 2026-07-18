import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { Loader2, Eye, EyeOff, Mic, TrendingUp, ShieldAlert, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { login as loginApi } from '@/services/auth.service';
import { getShops } from '@/services/shop.service';

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { login, setActiveShop } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const response = await loginApi(data);
      login(response.token.access_token, response.user);
      toast.success('Welcome back! Redirecting...');

      try {
        const shops = await getShops();
        if (shops && shops.length > 0) {
          setActiveShop(shops[0]);
          navigate('/dashboard');
        } else {
          navigate('/shop-setup');
        }
      } catch {
        navigate('/shop-setup');
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Invalid email or password';
      toast.error(errMsg);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col md:flex-row bg-[#F4F6F9] overflow-hidden">
      {/* ===== LEFT BRANDING PANEL ===== */}
      <div className="hidden md:flex md:w-[52%] bg-gradient-to-br from-[#C0111F] via-[#E3182D] to-[#ff4d2e] text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 -left-16 w-64 h-64 bg-black/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        {/* Logo + Headline */}
        <div className="z-10 flex flex-col items-start gap-6 max-w-lg animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-2xl tracking-tight">Vyapar</span>
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full text-[11px] font-semibold mb-5 tracking-widest uppercase backdrop-blur-sm border border-white/20">
              <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
              Digital Kirana Solution
            </span>
            <h1 className="text-4xl lg:text-[46px] font-bold leading-[1.15] tracking-tight">
              The intelligent platform for Nepal's retail future.
            </h1>
            <p className="mt-4 text-white/70 text-[15px] leading-relaxed">
              Manage your kirana with AI-powered insights, voice entry, and real-time analytics.
            </p>
          </div>
        </div>

        {/* Mock dashboard card */}
        <div className="z-10 flex-1 flex items-center justify-center my-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="relative w-full max-w-[380px]">
            <div className="absolute inset-0 bg-black/20 rounded-3xl blur-xl translate-y-4 scale-95" />
            <div className="relative bg-white/12 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl">
              <div className="space-y-3 mb-5">
                <div className="flex items-center justify-between">
                  <div className="h-2.5 w-20 bg-white/30 rounded-full" />
                  <div className="h-6 w-20 bg-white/20 rounded-lg" />
                </div>
                <div className="h-8 w-36 bg-white/40 rounded-lg" />
                <div className="h-2 w-28 bg-white/20 rounded-full" />
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[0.2, 0.3, 0.15].map((op, i) => (
                  <div key={i} className="h-16 rounded-xl flex flex-col gap-1.5 items-center justify-center" style={{ background: `rgba(255,255,255,${op})` }}>
                    <div className="h-2 w-8 bg-white/60 rounded-full" />
                    <div className="h-3 w-12 bg-white/80 rounded-full" />
                  </div>
                ))}
              </div>
              <div className="h-20 bg-white/8 rounded-xl border border-white/10 flex items-end justify-around px-4 pb-3 gap-2">
                {[40, 60, 45, 75, 55, 80, 65].map((h, i) => (
                  <div
                    key={i}
                    className="w-3 bg-white/40 rounded-full transition-all"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="z-10 grid grid-cols-3 gap-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {[
            { icon: Mic, title: 'Nepali Voice', desc: 'Instant entry in your native tongue.' },
            { icon: ShieldAlert, title: 'Credit Risk', desc: 'AI-driven customer scoring.' },
            { icon: TrendingUp, title: 'Forecast', desc: 'Predict seasonal stock trends.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-black/10 backdrop-blur-sm border border-white/10 p-4 rounded-2xl flex flex-col gap-2 hover:bg-black/15 transition-colors"
            >
              <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-[13px] font-semibold">{title}</div>
              <div className="text-[11px] text-white/65 leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== RIGHT FORM PANEL ===== */}
      <div className="w-full md:w-[48%] flex items-center justify-center p-8 lg:px-16 bg-white overflow-y-auto">
        <div className="w-full max-w-[400px] flex flex-col gap-7 animate-slide-right">

          {/* Mobile Logo */}
          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#ff6b35] to-[#E3182D] rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">Vyapar</span>
          </div>

          {/* Heading */}
          <div className="flex flex-col gap-1.5">
            <h2 className="text-[28px] font-bold tracking-tight text-slate-900">Welcome back 👋</h2>
            <p className="text-slate-500 text-[14px]">Sign in to manage your digital kirana store.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[13px] font-semibold text-slate-700">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="shopkeeper@example.com"
                {...register("email")}
                className={`h-11 text-[14px] rounded-xl border-slate-200 bg-slate-50 transition-all ${
                  errors.email
                    ? 'border-red-400 bg-red-50/30 focus-visible:ring-red-100'
                    : 'focus-visible:ring-red-100 focus-visible:border-red-300 hover:border-slate-300'
                }`}
              />
              {errors.email && (
                <span className="text-[12px] text-red-500 flex items-center gap-1">
                  <span>⚠</span> {errors.email.message}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[13px] font-semibold text-slate-700">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className={`h-11 text-[14px] rounded-xl pr-11 border-slate-200 bg-slate-50 transition-all ${
                    errors.password
                      ? 'border-red-400 bg-red-50/30 focus-visible:ring-red-100'
                      : 'focus-visible:ring-red-100 focus-visible:border-red-300 hover:border-slate-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-0.5 rounded"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <span className="text-[12px] text-red-500 flex items-center gap-1">
                  <span>⚠</span> {errors.password.message}
                </span>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-11 rounded-xl bg-gradient-to-r from-[#E3182D] to-[#c41020] hover:from-[#c41020] hover:to-[#b00e1c] text-white font-semibold text-[14px] shadow-md shadow-red-200 transition-all duration-200 hover:shadow-lg hover:shadow-red-200 hover:-translate-y-0.5 mt-1 cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            {/* Divider */}
            <div className="relative flex items-center">
              <div className="flex-grow border-t border-slate-200" />
              <span className="flex-shrink-0 mx-4 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">or continue with</span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            {/* Google */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 rounded-xl text-slate-700 font-medium text-[14px] border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 mr-2 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-[13px] text-slate-500">
            New to the platform?{' '}
            <Link to="/register" className="text-[#E3182D] font-semibold hover:underline underline-offset-2 cursor-pointer">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
