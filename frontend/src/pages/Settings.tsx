import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Store,
  Lock,
  Bell,
  Mic,
  Cpu,
  AlertTriangle,
  Save,
  LogOut,
  Loader2,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useAuth } from '@/providers/AuthProvider';
import { useUpdateShop, useDeleteShop, useShops } from '@/hooks/useShops';
import { logout as logoutApi } from '@/services/auth.service';
import { useNavigate } from 'react-router-dom';
import { queryClient } from '@/lib/queryClient';
import { ROUTES } from '@/constants/routes';
import type { LocationType } from '@/types';

const shopSchema = z.object({
  shop_name: z.string().min(2),
  address: z.string().min(5),
  location_type: z.enum(['urban', 'semi_urban', 'rural']),
});

type ShopForm = z.infer<typeof shopSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start py-4 border-b border-slate-100 last:border-0">
      <Label className="text-sm font-medium text-slate-700 pt-2">{label}</Label>
      <div className="md:col-span-2">{children}</div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-red-600" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  defaultChecked = false,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <div className="flex items-start justify-between py-3 border-b border-slate-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => setOn(!on)}
        className={cn(
          'relative w-10 h-5 rounded-full transition-colors mt-0.5 shrink-0',
          on ? 'bg-red-600' : 'bg-slate-200'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform',
            on ? 'translate-x-5' : ''
          )}
        />
      </button>
    </div>
  );
}

export default function Settings() {
  const { user, activeShop, logout, setActiveShop } = useAuth();
  const navigate = useNavigate();
  const updateShop = useUpdateShop(activeShop?.id ?? '');
  const deleteShop = useDeleteShop();
  const { data: shops } = useShops();

  const shopForm = useForm<ShopForm>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      shop_name: activeShop?.shop_name ?? '',
      address: activeShop?.address ?? '',
      location_type: (activeShop?.location_type as LocationType) ?? 'urban',
    },
  });

  useEffect(() => {
    if (activeShop) {
      shopForm.reset({
        shop_name: activeShop.shop_name,
        address: activeShop.address,
        location_type: activeShop.location_type,
      });
    }
  }, [activeShop, shopForm]);

  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const onShopSave = async (data: ShopForm) => {
    if (!activeShop) return;
    await updateShop.mutateAsync(data);
  };

  const onPasswordSave = () => {
    toast.error('Password change is not available from the API yet.');
    passwordForm.reset();
  };

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage your account, store, and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="h-9">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="ai">AI & Voice</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <SectionCard
            title="Business Profile"
            description="Update your store information"
            icon={Store}
          >
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
              <Avatar className="w-16 h-16 border-2 border-red-200">
                <AvatarFallback className="bg-red-50 text-red-600 text-2xl font-black">
                  {activeShop?.shop_name?.[0] ?? user?.full_name?.[0] ?? 'V'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-slate-800">
                  {activeShop?.shop_name ?? 'Your Shop'}
                </p>
                <p className="text-sm text-slate-400">{user?.full_name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
              </div>
            </div>
            <form onSubmit={shopForm.handleSubmit(onShopSave)}>
              <FormField label="Owner Name">
                <Input value={user?.full_name ?? ''} disabled />
              </FormField>
              <FormField label="Email">
                <Input value={user?.email ?? ''} disabled />
              </FormField>
              <FormField label="Phone">
                <Input value={user?.phone ?? ''} disabled />
              </FormField>
              <FormField label="Store Name">
                <Input {...shopForm.register('shop_name')} />
                {shopForm.formState.errors.shop_name && (
                  <p className="text-xs text-red-500 mt-1">
                    {shopForm.formState.errors.shop_name.message}
                  </p>
                )}
              </FormField>
              <FormField label="Address">
                <Input {...shopForm.register('address')} />
              </FormField>
              <FormField label="Location Type">
                <select
                  className="w-full border border-slate-200 rounded-md h-9 px-3 text-sm"
                  {...shopForm.register('location_type')}
                >
                  <option value="urban">Urban</option>
                  <option value="semi_urban">Semi Urban</option>
                  <option value="rural">Rural</option>
                </select>
              </FormField>
              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={updateShop.isPending || !activeShop}
                >
                  {updateShop.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          </SectionCard>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SectionCard
            title="Change Password"
            description="Password endpoints are not available yet"
            icon={Lock}
          >
            <form onSubmit={passwordForm.handleSubmit(onPasswordSave)} className="space-y-0">
              <FormField label="Current Password">
                <Input
                  type="password"
                  {...passwordForm.register('currentPassword')}
                  placeholder="Enter current password"
                />
              </FormField>
              <FormField label="New Password">
                <Input
                  type="password"
                  {...passwordForm.register('newPassword')}
                  placeholder="At least 8 characters"
                />
              </FormField>
              <FormField label="Confirm Password">
                <Input
                  type="password"
                  {...passwordForm.register('confirmPassword')}
                  placeholder="Repeat new password"
                />
              </FormField>
              <div className="flex justify-end pt-4">
                <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">
                  <Lock className="w-4 h-4 mr-2" />
                  Update Password
                </Button>
              </div>
            </form>
          </SectionCard>
        </TabsContent>

        <TabsContent value="notifications">
          <SectionCard
            title="Notification Preferences"
            description="Local preferences only — no backend yet"
            icon={Bell}
          >
            <ToggleSetting
              label="Low Stock Alerts"
              description="Get notified when products fall below reorder level"
              defaultChecked
            />
            <ToggleSetting
              label="Credit Payment Reminders"
              description="Daily reminders for overdue customer payments"
              defaultChecked
            />
            <ToggleSetting
              label="AI Insights"
              description="Weekly AI-powered insights about your business"
              defaultChecked
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <SectionCard title="AI Settings" description="Feature toggles (local)" icon={Cpu}>
            <ToggleSetting
              label="Demand Forecasting"
              description="Enable AI-powered demand prediction"
              defaultChecked
            />
            <ToggleSetting
              label="Credit Risk Scoring"
              description="AI credit analysis for customers"
              defaultChecked
            />
          </SectionCard>
          <SectionCard
            title="Voice Settings"
            description="Voice API not connected yet"
            icon={Mic}
          >
            <ToggleSetting
              label="Enable Voice Commands"
              description="Coming soon — no backend voice endpoints yet"
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="danger">
          <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-red-100 flex items-center gap-3 bg-red-50">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <h2 className="text-sm font-bold text-red-700">Danger Zone</h2>
                <p className="text-xs text-red-500">Session and account actions</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Sign Out</p>
                  <p className="text-xs text-slate-400">Calls logout API and clears session</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-amber-600 border-amber-200"
                  onClick={async () => {
                    try {
                      await logoutApi();
                    } catch {
                      /* ignore */
                    }
                    logout();
                    queryClient.clear();
                    navigate(ROUTES.LOGIN);
                  }}
                >
                  <LogOut className="w-4 h-4 mr-1.5" />
                  Logout
                </Button>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-red-600">Delete Current Shop</p>
                  <p className="text-xs text-slate-400">
                    Permanently delete {activeShop?.shop_name ?? 'this shop'} via API
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={!activeShop || deleteShop.isPending}
                  onClick={async () => {
                    if (!activeShop) return;
                    if (!confirm(`Delete shop "${activeShop.shop_name}"?`)) return;
                    await deleteShop.mutateAsync(activeShop.id);
                    const remaining = (shops ?? []).filter((s) => s.id !== activeShop.id);
                    if (remaining[0]) {
                      setActiveShop(remaining[0]);
                      navigate(ROUTES.DASHBOARD);
                    } else {
                      setActiveShop(null);
                      navigate(ROUTES.SHOP_SETUP);
                    }
                  }}
                >
                  {deleteShop.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-1.5" />
                      Delete Shop
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
