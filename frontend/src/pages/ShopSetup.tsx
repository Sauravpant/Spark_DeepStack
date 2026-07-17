import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import toast from 'react-hot-toast';
import { Loader2, Store, MapPin, Navigation } from 'lucide-react';
import { useState } from 'react';
import { createShop } from '@/services/shop.service';

const shopSchema = z.object({
  shopName: z.string().min(3, { message: "Shop name must be at least 3 characters" }),
  address: z.string().min(5, { message: "Address must be at least 5 characters" }),
  locationType: z.enum(['urban', 'semi_urban', 'rural'], {
    errorMap: () => ({ message: "Please select a valid location type" }),
  }),
});

type ShopFormValues = z.infer<typeof shopSchema>;

export default function ShopSetup() {
  const navigate = useNavigate();
  const { setActiveShop } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ShopFormValues>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      locationType: 'urban',
    },
  });

  const selectedLocation = watch('locationType');

  const onSubmit = async (data: ShopFormValues) => {
    setLoading(true);
    try {
      const shop = await createShop({
        shop_name: data.shopName,
        address: data.address,
        location_type: data.locationType,
      });
      setActiveShop(shop);
      toast.success('Shop registered successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Failed to create shop. Please try again.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 flex flex-col items-center gap-2">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-2">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Set up your Store</h1>
          <p className="text-slate-500 max-w-sm">
            Give us some basic details to personalize your digital retail experience and enable AI forecasting.
          </p>
        </div>

        <Card className="border-slate-200 shadow-lg bg-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold">Store Profile</CardTitle>
            <CardDescription>Enter details about your physical kirana store.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="shopName" className="text-slate-700 flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-slate-400" /> Store Name
                </Label>
                <Input
                  id="shopName"
                  type="text"
                  placeholder="Pant Kirana Store"
                  {...register("shopName")}
                  className={errors.shopName ? "border-destructive focus-visible:ring-destructive" : "focus-visible:ring-primary"}
                />
                {errors.shopName && (
                  <span className="text-xs text-destructive">{errors.shopName.message}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" /> Address
                </Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="Kathmandu, Nepal"
                  {...register("address")}
                  className={errors.address ? "border-destructive focus-visible:ring-destructive" : "focus-visible:ring-primary"}
                />
                {errors.address && (
                  <span className="text-xs text-destructive">{errors.address.message}</span>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-slate-400" /> Location Type
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['urban', 'semi_urban', 'rural'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setValue('locationType', type)}
                      className={`py-2.5 px-3 text-sm font-medium border rounded-md transition-all ${
                        selectedLocation === type
                          ? 'border-red-500 bg-red-50 text-red-600 shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {type === 'urban' && 'Urban'}
                      {type === 'semi_urban' && 'Semi Urban'}
                      {type === 'rural' && 'Rural'}
                    </button>
                  ))}
                </div>
                {errors.locationType && (
                  <span className="text-xs text-destructive">{errors.locationType.message}</span>
                )}
              </div>

              <Button type="submit" className="w-full bg-[#E3182D] hover:bg-red-700 text-white font-medium h-11 rounded-md mt-4" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating store profile...
                  </>
                ) : (
                  "Create Shop"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
