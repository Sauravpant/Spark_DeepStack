import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { Loader2, Eye, EyeOff, Mic, TrendingUp, ShieldAlert } from 'lucide-react';
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
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Registration failed. Email might be already in use.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col md:flex-row bg-background">
      {/* Left Branding Panel */}
      <div className="hidden md:flex md:w-1/2 bg-[#E3182D] text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="z-10 flex flex-col items-start gap-6 max-w-lg">
          <div className="flex items-center gap-2">
            <span className="font-bold text-2xl tracking-tight">Vyapar</span>
          </div>
          <div>
            <span className="inline-block bg-white/20 px-3 py-1 rounded-full text-xs font-semibold mb-4 tracking-wider backdrop-blur-sm">
              DIGITAL KIRANA SOLUTION
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
              Grow your store business with intelligent insights.
            </h1>
          </div>
        </div>

        <div className="z-10 mt-12 flex-1 flex items-center justify-center relative">
          <div className="relative w-full max-w-md aspect-[4/3] bg-gradient-to-tr from-white/15 to-transparent rounded-2xl p-6 border border-white/20 shadow-2xl overflow-hidden backdrop-blur-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-3 w-24 bg-white/30 rounded" />
              <div className="h-8 w-48 bg-white/40 rounded" />
              <div className="h-3 w-40 bg-white/20 rounded" />
            </div>
            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="h-16 bg-white/15 rounded-lg" />
              <div className="h-16 bg-white/20 rounded-lg" />
              <div className="h-16 bg-white/15 rounded-lg" />
            </div>
            <div className="mt-4 h-24 bg-white/10 rounded-xl border border-white/10" />
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="z-10 grid grid-cols-3 gap-4 mt-12">
          <div className="bg-black/10 backdrop-blur-sm border border-white/10 p-4 rounded-xl flex flex-col gap-2">
            <Mic className="w-5 h-5 opacity-80" />
            <div className="text-sm font-semibold">Nepali Voice</div>
            <div className="text-xs text-white/70">Instant entry in your native tongue.</div>
          </div>
          <div className="bg-black/10 backdrop-blur-sm border border-white/10 p-4 rounded-xl flex flex-col gap-2">
            <ShieldAlert className="w-5 h-5 opacity-80" />
            <div className="text-sm font-semibold">Credit Risk</div>
            <div className="text-xs text-white/70">AI-driven customer scoring.</div>
          </div>
          <div className="bg-black/10 backdrop-blur-sm border border-white/10 p-4 rounded-xl flex flex-col gap-2">
            <TrendingUp className="w-5 h-5 opacity-80" />
            <div className="text-sm font-semibold">Forecast</div>
            <div className="text-xs text-white/70">Predict seasonal stock trends.</div>
          </div>
        </div>
        
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 mix-blend-screen pointer-events-none"></div>
      </div>

      {/* Right Register Form Panel */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 lg:p-24 bg-white overflow-y-auto h-screen">
        <div className="w-full max-w-md flex flex-col gap-6 py-8">
          
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Create an account</h2>
            <p className="text-slate-500">Register to start managing your digital kirana.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-slate-700">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Saurav Pant"
                {...register("fullName")}
                className={errors.fullName ? "border-destructive focus-visible:ring-destructive" : "focus-visible:ring-primary"}
              />
              {errors.fullName && (
                <span className="text-xs text-destructive">{errors.fullName.message}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-700">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="saurav@example.com"
                {...register("email")}
                className={errors.email ? "border-destructive focus-visible:ring-destructive" : "focus-visible:ring-primary"}
              />
              {errors.email && (
                <span className="text-xs text-destructive">{errors.email.message}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-slate-700">Phone Number</Label>
              <Input
                id="phone"
                type="text"
                placeholder="+9779876543210"
                {...register("phone")}
                className={errors.phone ? "border-destructive focus-visible:ring-destructive" : "focus-visible:ring-primary"}
              />
              {errors.phone && (
                <span className="text-xs text-destructive">{errors.phone.message}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-700">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className={errors.password ? "border-destructive focus-visible:ring-destructive pr-10" : "focus-visible:ring-primary pr-10"}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <span className="text-xs text-destructive">{errors.password.message}</span>
              )}
            </div>

            <Button type="submit" className="w-full bg-[#E3182D] hover:bg-red-700 text-white font-medium h-11 rounded-md mt-2" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Register"
              )}
            </Button>
          </form>
          
          <div className="text-center text-sm text-slate-500 mt-2">
            Already have an account? <Link to="/login" className="text-red-600 font-medium hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
