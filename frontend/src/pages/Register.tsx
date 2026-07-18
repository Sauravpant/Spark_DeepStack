import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { Loader2, Eye, EyeOff, Mic, TrendingUp, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { register as registerApi } from '@/services/auth.service';

const registerSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits" }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    try {
      await registerApi({
        full_name: data.fullName,
        email: data.email,
        password: data.password,
        phone: data.phone,
      });
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Registration failed. Email might be already in use.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    'AI-powered demand forecasting',
    'Real-time inventory tracking',
    'Nepali voice data entry',
    'Smart credit risk scoring',
  ];

  return (
    <div className="w-full h-screen flex flex-col md:flex-row bg-[#F4F6F9] overflow-hidden">
      {/* ===== LEFT BRANDING PANEL ===== */}
      <div className="hidden md:flex md:w-[52%] bg-gradient-to-br from-[#C0111F] via-[#E3182D] to-[#ff4d2e] text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 -left-16 w-64 h-64 bg-black/15 rounded-full blur-3xl pointer-events-none" />

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
              Join 500+ Kirana Stores
            </span>
            <h1 className="text-4xl lg:text-[46px] font-bold leading-[1.15] tracking-tight">
              Grow your store with intelligent insights.
            </h1>
            <p className="mt-4 text-white/70 text-[15px] leading-relaxed">
              Join Nepal's fastest growing digital retail platform and take your kirana to the next level.
            </p>
          </div>
        </div>

        {/* Benefits list */}
        <div className="z-10 flex-1 flex items-center my-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="space-y-4 w-full max-w-sm">
            {benefits.map((b, i) => (
              <div
                key={b}
                className="flex items-center gap-3 p-3 bg-white/8 backdrop-blur-sm rounded-xl border border-white/10 animate-slide-left"
                style={{ animationDelay: `${0.1 + i * 0.06}s` }}
              >
                <div className="w-6 h-6 bg-green-400/20 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-300" />
                </div>
                <span className="text-[14px] font-medium">{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Cards */}
        <div className="z-10 grid grid-cols-3 gap-3 animate-fade-in" style={{ animationDelay: '0.3s' }}>
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
      <div className="w-full md:w-[48%] flex items-center justify-center p-8 lg:px-16 bg-white overflow-y-auto h-screen">
        <div className="w-full max-w-[400px] flex flex-col gap-6 py-8 animate-slide-right">

          {/* Mobile Logo */}
          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#ff6b35] to-[#E3182D] rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">Vyapar</span>
          </div>

          {/* Heading */}
          <div className="flex flex-col gap-1.5">
            <h2 className="text-[28px] font-bold tracking-tight text-slate-900">Create your account</h2>
            <p className="text-slate-500 text-[14px]">Start managing your digital kirana in minutes.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-[13px] font-semibold text-slate-700">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Saurav Pant"
                {...register("fullName")}
                className={`h-11 text-[14px] rounded-xl border-slate-200 bg-slate-50 transition-all ${
                  errors.fullName
                    ? 'border-red-400 bg-red-50/30 focus-visible:ring-red-100'
                    : 'focus-visible:ring-red-100 focus-visible:border-red-300 hover:border-slate-300'
                }`}
              />
              {errors.fullName && (
                <span className="text-[12px] text-red-500 flex items-center gap-1">
                  <span>⚠</span> {errors.fullName.message}
                </span>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[13px] font-semibold text-slate-700">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="saurav@example.com"
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

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-[13px] font-semibold text-slate-700">Phone Number</Label>
              <Input
                id="phone"
                type="text"
                placeholder="+9779876543210"
                {...register("phone")}
                className={`h-11 text-[14px] rounded-xl border-slate-200 bg-slate-50 transition-all ${
                  errors.phone
                    ? 'border-red-400 bg-red-50/30 focus-visible:ring-red-100'
                    : 'focus-visible:ring-red-100 focus-visible:border-red-300 hover:border-slate-300'
                }`}
              />
              {errors.phone && (
                <span className="text-[12px] text-red-500 flex items-center gap-1">
                  <span>⚠</span> {errors.phone.message}
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
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-[13px] text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-[#E3182D] font-semibold hover:underline underline-offset-2 cursor-pointer">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
