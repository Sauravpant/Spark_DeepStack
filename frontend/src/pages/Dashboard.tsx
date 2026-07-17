import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Download, TrendingUp, TrendingDown, PackageOpen, Package, Wallet, UserCircle, Activity, AlertTriangle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Subcomponents ---

function StatCard({ title, value, trend, trendValue, icon: Icon, data }: any) {
  const isPositive = trend === 'up';
  return (
    <Card className="flex flex-col border-slate-200 shadow-sm">
      <CardContent className="p-6 flex-1 flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
            <Icon className="w-5 h-5 text-red-500" />
          </div>
          <div className={cn("text-xs font-semibold flex items-center gap-1", isPositive ? "text-emerald-600" : (trend === 'neutral' ? "text-slate-500" : "text-red-600"))}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : (trend !== 'neutral' && <TrendingDown className="w-3 h-3" />)}
            {trendValue}
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">{title}</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
            {/* Fake Sparkline */}
            <div className="w-16 h-8 flex items-end gap-[2px] opacity-70">
                {data.map((h: number, i: number) => (
                    <div key={i} className={cn("w-full rounded-t-sm", isPositive ? "bg-emerald-500/20" : "bg-red-500/20")} style={{ height: `${h}%` }}></div>
                ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Main Page Component ---

export default function Dashboard() {
  const [timeFilter, setTimeFilter] = useState('Today');

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Good morning, Saurav</h1>
          <p className="text-slate-500">Here's today's overview for your store.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-md p-1 flex">
            {['Today', 'Weekly', 'Monthly'].map(f => (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium rounded-sm transition-colors",
                  timeFilter === f ? "bg-red-50 text-red-600" : "text-slate-600 hover:text-slate-900"
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <Button variant="outline" className="gap-2 bg-white">
            <Download className="w-4 h-4" /> Export
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Revenue" 
          value="1,42,500" 
          trend="up" 
          trendValue="+12.5%" 
          icon={Wallet} 
          data={[30, 40, 20, 60, 80, 50, 90]} 
        />
        <StatCard 
          title="Gross Profit" 
          value="42,300" 
          trend="up" 
          trendValue="+8.2%" 
          icon={Activity} 
          data={[20, 30, 40, 30, 50, 45, 60]} 
        />
        <StatCard 
          title="Credit Outstanding" 
          value="84,200" 
          trend="up" 
          trendValue="+4.1%" 
          icon={UserCircle} 
          data={[60, 55, 65, 70, 68, 75, 80]} 
        />
        <StatCard 
          title="Inventory Value" 
          value="6,12,000" 
          trend="neutral" 
          trendValue="— 0%" 
          icon={Package} 
          data={[50, 50, 50, 50, 50, 50, 50]} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Best Selling Products */}
          <Card className="border-slate-200 shadow-sm flex-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold text-slate-800">Best Selling Products</CardTitle>
              <Button variant="link" className="text-red-600 font-medium">View all</Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-y border-slate-100">
                    <tr>
                      <th className="px-4 py-3 font-semibold rounded-tl-md">Product</th>
                      <th className="px-4 py-3 font-semibold">Units Sold</th>
                      <th className="px-4 py-3 font-semibold">Revenue</th>
                      <th className="px-4 py-3 font-semibold rounded-tr-md text-right">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                          <PackageOpen className="w-5 h-5" />
                        </div>
                        <span className="font-semibold text-slate-800">Real Fruit Juice (1L)</span>
                      </td>
                      <td className="px-4 py-4 text-slate-600">452</td>
                      <td className="px-4 py-4 font-medium text-slate-900">₹ 1,13,000</td>
                      <td className="px-4 py-4 text-right">
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-xs bg-emerald-50 px-2 py-1 rounded-full">
                          <TrendingUp className="w-3 h-3" /> 8%
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                          <Package className="w-5 h-5" />
                        </div>
                        <span className="font-semibold text-slate-800">Basmati Rice (5kg)</span>
                      </td>
                      <td className="px-4 py-4 text-slate-600">215</td>
                      <td className="px-4 py-4 font-medium text-slate-900">₹ 1,72,000</td>
                      <td className="px-4 py-4 text-right">
                        <span className="inline-flex items-center gap-1 text-red-600 font-medium text-xs bg-red-50 px-2 py-1 rounded-full">
                          <TrendingDown className="w-3 h-3" /> 2%
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                          <Package className="w-5 h-5" />
                        </div>
                        <span className="font-semibold text-slate-800">Wai Wai Noodles (12pk)</span>
                      </td>
                      <td className="px-4 py-4 text-slate-600">1,120</td>
                      <td className="px-4 py-4 font-medium text-slate-900">₹ 22,400</td>
                      <td className="px-4 py-4 text-right">
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-xs bg-emerald-50 px-2 py-1 rounded-full">
                          <TrendingUp className="w-3 h-3" /> 15%
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Inventory Alerts */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold text-slate-800">Inventory Alerts</CardTitle>
                <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-0">4 Urgent</Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded bg-red-50 text-red-600 flex items-center justify-center">
                        <Package className="w-5 h-5" />
                     </div>
                     <div>
                       <p className="font-semibold text-sm text-slate-800">Aashirvaad Atta (5kg)</p>
                       <p className="text-xs text-slate-500">Out of Stock</p>
                     </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600"><AlertTriangle className="w-4 h-4" /></Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Package className="w-5 h-5" />
                     </div>
                     <div>
                       <p className="font-semibold text-sm text-slate-800">Dhara Mustard Oil</p>
                       <p className="text-xs text-slate-500">Expiring in 5 days (12 units)</p>
                     </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-amber-600"><AlertTriangle className="w-4 h-4" /></Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded bg-slate-100 text-slate-500 flex items-center justify-center">
                        <Package className="w-5 h-5" />
                     </div>
                     <div>
                       <p className="font-semibold text-sm text-slate-800">Dairy Milk Chocolate</p>
                       <p className="text-xs text-slate-500">Low Stock (2 units left)</p>
                     </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600"><AlertTriangle className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>

            {/* Credit Exposure */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-slate-800">Credit Exposure</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-500">Recovery Rate</span>
                    <span className="text-emerald-600">78%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[78%] rounded-full"></div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <div className="bg-red-50 rounded-lg p-3 flex-1 flex flex-col justify-center border border-red-100">
                     <span className="text-xs font-medium text-red-800 mb-1">High Risk</span>
                     <span className="text-2xl font-bold text-red-600">12</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 flex-1 flex flex-col justify-center border border-slate-200">
                     <span className="text-xs font-medium text-slate-600 mb-1">Active Loans</span>
                     <span className="text-2xl font-bold text-slate-800">48</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 border border-slate-100 p-2.5 rounded-lg shadow-sm mt-2">
                  <Avatar className="w-8 h-8 border border-slate-200">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-slate-100 text-slate-600 text-xs">RJ</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Top Debtor: Ramesh Jha</p>
                    <p className="text-sm font-semibold text-red-600">₹ 12,400 overdue</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="secondary" className="w-full text-slate-700">Manage Credits</Button>
              </CardFooter>
            </Card>
          </div>

        </div>

        {/* Right Column (1/3 width) */}
        <div className="flex flex-col gap-6">
          
          {/* AI Market Pulse */}
          <Card className="bg-[#E3182D] text-white border-0 shadow-lg relative overflow-hidden">
             {/* Decorative Background */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
             
             <CardHeader className="relative z-10 pb-4">
                <div className="flex items-center gap-2 mb-2 opacity-80">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-bold tracking-widest uppercase">AI Market Pulse</span>
                </div>
             </CardHeader>
             <CardContent className="relative z-10 flex flex-col gap-4">
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
                  <p className="text-sm leading-relaxed">
                    "Festival demand for soft drinks is increasing in your local area. Consider restocking Real Juice and Coke."
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
                  <p className="text-sm leading-relaxed">
                    Margin Opportunity:<br/>
                    Increasing price of Basmati Rice by 2% matches local competitor levels.
                  </p>
                </div>
             </CardContent>
             <CardFooter className="relative z-10">
               <Button className="w-full bg-white text-red-600 hover:bg-slate-100 font-bold shadow-sm">
                 Apply Recommendations
               </Button>
             </CardFooter>
          </Card>

          {/* Recent Operations */}
          <Card className="border-slate-200 shadow-sm flex-1">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-slate-800">Recent Operations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                
                <div className="flex gap-4 relative">
                  <div className="absolute left-1.5 top-5 bottom-[-1.5rem] w-px bg-slate-200"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1.5 relative z-10 ring-4 ring-white"></div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Stock Restocked</p>
                    <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">50 units of Coca-Cola (250ml) added to inventory.</p>
                    <p className="text-xs text-slate-400 mt-1">10:24 AM</p>
                  </div>
                </div>

                <div className="flex gap-4 relative">
                  <div className="absolute left-1.5 top-5 bottom-[-1.5rem] w-px bg-slate-200"></div>
                  <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5 relative z-10 ring-4 ring-white"></div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Credit Payment</p>
                    <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">Sita Devi paid ₹ 500 towards her balance.</p>
                    <p className="text-xs text-slate-400 mt-1">09:15 AM</p>
                  </div>
                </div>

                <div className="flex gap-4 relative">
                  <div className="w-3 h-3 rounded-full bg-amber-500 mt-1.5 relative z-10 ring-4 ring-white"></div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Report Generated</p>
                    <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">Weekly Tax compliance report is ready for download.</p>
                    <p className="text-xs text-slate-400 mt-1">08:00 AM</p>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
