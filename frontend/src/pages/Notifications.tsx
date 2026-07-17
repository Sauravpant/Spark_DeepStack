import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Package, ShieldAlert, CreditCard, Sparkles, Check, Trash2, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'inventory' | 'credit' | 'payment' | 'ai';
  time: string;
  read: boolean;
};

const initialNotifications: Notification[] = [
  { id: '1', title: 'Low Stock Alert', message: 'Dhara Mustard Oil is below reorder level (8 units left, reorder at 12).', type: 'inventory', time: '10 min ago', read: false },
  { id: '2', title: 'Payment Overdue', message: 'Anil Kapali has an overdue payment of NPR 42,500 for 12 days.', type: 'credit', time: '1 hour ago', read: false },
  { id: '3', title: 'AI Insight', message: 'Cold drinks demand will increase by 45% in the next 2 weeks. Consider restocking.', type: 'ai', time: '3 hours ago', read: false },
  { id: '4', title: 'Payment Received', message: 'Sita Devi has cleared her outstanding balance of NPR 5,200.', type: 'payment', time: '5 hours ago', read: true },
  { id: '5', title: 'Out of Stock', message: 'Himalayan Coffee Beans (500g) is now out of stock.', type: 'inventory', time: '1 day ago', read: true },
  { id: '6', title: 'Festival Alert', message: 'Dashain is 45 days away. AI recommends restocking Grains & Cooking Oil.', type: 'ai', time: '1 day ago', read: true },
  { id: '7', title: 'Credit Approved', message: 'Priya Shrestha credit limit increased to NPR 1,50,000 by AI recommendation.', type: 'credit', time: '2 days ago', read: true },
];

const typeConfig = {
  inventory: { icon: Package, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', label: 'Inventory' },
  credit: { icon: ShieldAlert, iconBg: 'bg-red-50', iconColor: 'text-red-600', label: 'Credit' },
  payment: { icon: CreditCard, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', label: 'Payment' },
  ai: { icon: Sparkles, iconBg: 'bg-purple-50', iconColor: 'text-purple-600', label: 'AI Insight' },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeFilter, setActiveFilter] = useState<'all' | Notification['type']>('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = notifications.filter(n => activeFilter === 'all' || n.type === activeFilter);

  const markAllRead = () => setNotifications(n => n.map(x => ({ ...x, read: true })));
  const markRead = (id: string) => setNotifications(n => n.map(x => x.id === id ? { ...x, read: true } : x));
  const deleteNotification = (id: string) => setNotifications(n => n.filter(x => x.id !== id));

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          {unreadCount > 0 && (
            <Badge className="bg-red-100 text-red-700 border-0 font-bold">{unreadCount} new</Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
          <CheckCheck className="w-4 h-4 mr-2" />Mark All Read
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'inventory', 'credit', 'payment', 'ai'] as const).map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors',
              activeFilter === f ? 'bg-red-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            )}
          >
            {f === 'all' ? 'All' : typeConfig[f].label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : filtered.map(n => {
          const config = typeConfig[n.type];
          const IconComponent = config.icon;
          return (
            <div
              key={n.id}
              className={cn(
                'bg-white rounded-xl border p-4 flex gap-4 items-start transition-colors group',
                n.read ? 'border-slate-200' : 'border-red-200/60 shadow-sm bg-red-50/30'
              )}
            >
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', config.iconBg)}>
                <IconComponent className={cn('w-4 h-4', config.iconColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={cn('text-sm font-semibold', n.read ? 'text-slate-700' : 'text-slate-900')}>
                      {!n.read && <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2 mb-0.5" />}
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1.5">{n.time}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {!n.read && (
                      <button onClick={() => markRead(n.id)} className="p-1 rounded hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => deleteNotification(n.id)} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
