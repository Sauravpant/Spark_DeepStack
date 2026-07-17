import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { delay } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Loader2, Eye, EyeOff, Mic, TrendingUp, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import heroImage from '@/assets/hero.png';

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
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
      // Mock API call
      await delay(1500);
      
      // Simple mock authentication
      if (data.email === 'shopkeeper@example.com' && data.password === 'password') {
        login('mock-jwt-token-12345');
        toast.success('Successfully logged in!');
        navigate('/');
      } else {
        toast.error('Invalid email or password');
      }
    } catch (error) {
      toast.error('Something went wrong');
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
              The intelligent platform for Nepal's retail future.
            </h1>
          </div>
        </div>

        {/* Hero Image / App Preview */}
        <div className="z-10 mt-12 flex-1 flex items-center justify-center relative">
          <div className="relative w-full max-w-md aspect-square bg-gradient-to-tr from-white/10 to-transparent rounded-2xl p-4 border border-white/20 shadow-2xl overflow-hidden backdrop-blur-sm">
             <img src={heroImage} alt="Vyapar App Preview" className="w-full h-full object-contain drop-shadow-xl" />
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

      {/* Right Login Form Panel */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 lg:p-24 bg-white">
        <div className="w-full max-w-md flex flex-col gap-8">
          
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h2>
            <p className="text-slate-500">Sign in to manage your digital kirana.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="shopkeeper@example.com"
                {...register("email")}
                className={errors.email ? "border-destructive focus-visible:ring-destructive" : "focus-visible:ring-primary"}
              />
              {errors.email && (
                <span className="text-xs text-destructive">{errors.email.message}</span>
              )}
            </div>

            <div className="space-y-2">
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

            <Button type="submit" className="w-full bg-[#E3182D] hover:bg-red-700 text-white font-medium h-11 rounded-md" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                "Continue"
              )}
            </Button>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase">OR</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <Button type="button" variant="outline" className="w-full h-11 text-slate-700 font-medium border-slate-200 hover:bg-slate-50">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </Button>
            
          </form>
          
          <div className="text-center text-sm text-slate-500 mt-4">
            New to the platform? <a href="#" className="text-red-600 font-medium hover:underline">Create an account</a>
          </div>
        </div>
      </div>
    </div>
  );
}
