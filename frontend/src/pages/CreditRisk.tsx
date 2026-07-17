import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Bell, HelpCircle, CheckCircle2, ShieldAlert, Clock, TrendingUp, AlertTriangle, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock Data
const customers = [
  {
    id: 'CUST-9841',
    name: 'Anil Kapali',
    outstanding: 42500,
    status: 'High Risk',
    overdue: '12d overdue',
    score: 35,
  },
  {
    id: 'CUST-1022',
    name: 'Priya Shrestha',
    outstanding: 5200,
    status: 'Low Risk',
    overdue: 'On time',
    score: 88,
    memberSince: 'Jan 2022',
    probability: 98.2,
    suggestedLimit: 150000,
    limitIncrease: 25,
    dueIn: 18,
    positiveDrivers: [
      { name: 'Purchase Consistency', pts: 42 },
      { name: 'Early Payment Ratio', pts: 28 },
      { name: 'Local Community Reputation', pts: 18 },
    ],
    negativeDrivers: [
      { name: 'Category Concentration', pts: -12, desc: 'High spending on luxury items vs essentials.' },
      { name: 'Market Volatility Index', pts: -8 },
    ]
  },
  {
    id: 'CUST-2231',
    name: 'Manoj Bajracharya',
    outstanding: 18900,
    status: 'Medium Risk',
    overdue: '2d overdue',
    score: 65,
  },
  {
    id: 'CUST-5612',
    name: 'Sita Devi',
    outstanding: 0,
    status: 'Low Risk',
    overdue: 'Clean',
    score: 95,
  }
];

export default function CreditRisk() {
  const [selectedCustomer, setSelectedCustomer] = useState(customers[1]);

  return (
    <div className="flex h-full w-full bg-slate-50 overflow-hidden">
      
      {/* Left Sidebar - Customer Registry */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
        
        {/* Search Header */}
        <div className="p-4 border-b border-slate-200">
           <div className="relative">
             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <Input 
               placeholder="Search customers for credit analysis..." 
               className="pl-9 bg-slate-50/50 border-slate-200"
             />
           </div>
        </div>

        {/* List Header */}
        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <span className="font-bold text-sm text-slate-800">Customer Registry</span>
          <span className="text-xs font-bold text-red-600">128 Active</span>
        </div>

        {/* Customer List */}
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {customers.map((c) => (
            <div 
              key={c.id}
              onClick={() => setSelectedCustomer(c as any)}
              className={cn(
                "p-3 rounded-lg border cursor-pointer transition-all duration-200 relative",
                selectedCustomer.id === c.id 
                  ? "bg-white border-red-200 shadow-sm ring-1 ring-red-500/20" 
                  : "bg-white border-transparent hover:border-slate-200 hover:bg-slate-50"
              )}
            >
              {selectedCustomer.id === c.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-red-600 rounded-r-full"></div>
              )}
              
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-3">
                  <Avatar className={cn("w-10 h-10 border", selectedCustomer.id === c.id ? "border-red-200 bg-red-50 text-red-600" : "border-slate-200 bg-slate-100 text-slate-500")}>
                    <AvatarFallback className="font-semibold">{c.name.substring(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 leading-tight">{c.name}</h4>
                    <span className="text-[11px] text-slate-500 font-mono">#{c.id}</span>
                  </div>
                </div>
                <Badge variant="outline" className={cn(
                  "border-0 shadow-none text-[10px] font-bold px-2 py-0.5 h-auto rounded-sm",
                  c.status === 'High Risk' ? "bg-red-100 text-red-700" : "",
                  c.status === 'Medium Risk' ? "bg-amber-100 text-amber-700" : "",
                  c.status === 'Low Risk' ? "bg-emerald-100 text-emerald-700" : ""
                )}>
                  {c.status}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-slate-600">Outstanding: NPR {c.outstanding.toLocaleString()}</span>
                <span className={cn(
                  "text-xs font-medium flex items-center gap-1",
                  c.overdue.includes('overdue') ? "text-slate-500" : "text-emerald-600"
                )}>
                  {c.overdue.includes('overdue') ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {c.overdue}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Content - Analysis Detail */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        
        {/* Top Header Actions */}
        <div className="h-16 px-6 border-b border-slate-200 flex justify-end items-center gap-4 bg-white sticky top-0 z-10">
           <Button variant="ghost" size="icon" className="text-slate-500"><Bell className="w-5 h-5" /></Button>
           <Button variant="ghost" size="icon" className="text-slate-500"><HelpCircle className="w-5 h-5" /></Button>
           <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
             <div className="flex flex-col items-end">
               <span className="text-sm font-semibold text-slate-800 leading-tight">Rajesh Hamal</span>
               <span className="text-[10px] text-slate-500 font-medium">Hamal Kirana Store</span>
             </div>
             <Avatar className="w-8 h-8 bg-red-100 text-red-600">
               <AvatarFallback className="text-xs">RH</AvatarFallback>
             </Avatar>
           </div>
        </div>

        {selectedCustomer && (
          <div className="p-8 max-w-5xl mx-auto w-full flex flex-col gap-6">
            
            {/* Top Row: AI Score Profile & Actions */}
            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* Main AI Profile Card */}
              <Card className="flex-1 border-slate-200 shadow-sm p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden bg-white">
                {/* Score Circle */}
                <div className="flex flex-col items-center justify-center shrink-0">
                   <div className="relative w-32 h-32 flex items-center justify-center">
                     <svg className="absolute w-full h-full transform -rotate-90">
                       <circle cx="64" cy="64" r="56" className="stroke-slate-100" strokeWidth="8" fill="none" />
                       <circle cx="64" cy="64" r="56" className="stroke-emerald-500 drop-shadow-md" strokeWidth="8" fill="none" strokeDasharray="351.8" strokeDashoffset={351.8 - (351.8 * selectedCustomer.score) / 100} strokeLinecap="round" />
                     </svg>
                     <div className="flex flex-col items-center justify-center text-center">
                       <span className="text-4xl font-black text-slate-800 tracking-tighter leading-none">{selectedCustomer.score}</span>
                       <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1">AI Score</span>
                     </div>
                   </div>
                </div>
                
                {/* Details */}
                <div className="flex-1 flex flex-col justify-center">
                   <h2 className="text-3xl font-bold text-[#E3182D] mb-4">{selectedCustomer.name}</h2>
                   <div className="flex items-center gap-3 mb-6">
                     <div className="bg-emerald-200/50 text-emerald-800 px-3 py-1.5 rounded-sm font-bold text-xs uppercase tracking-wider text-center leading-tight">
                       Excellent<br/>Credit<br/>Standing
                     </div>
                     <p className="text-xs font-medium text-slate-500 leading-tight">
                       Member<br/>since<br/>{selectedCustomer.memberSince}
                     </p>
                   </div>
                   
                   <p className="text-sm text-slate-600 leading-relaxed font-medium">
                     AI Analysis confirms a <strong className="font-bold text-emerald-600 underline decoration-emerald-200 underline-offset-4">98.2% probability</strong> of repayment within terms.<br/>
                     The customer demonstrates high purchasing consistency and a zero-default history over 24 months.
                   </p>
                </div>
              </Card>

              {/* Recommended Actions */}
              <div className="w-full lg:w-64 bg-slate-100/50 rounded-xl border border-slate-200 p-5 flex flex-col gap-4">
                 <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Recommended Actions</h3>
                 <Button className="w-full justify-start h-14 bg-[#E3182D] hover:bg-red-700 shadow-md shadow-red-500/20 text-white rounded-lg">
                   <CheckSquare className="w-5 h-5 mr-3 opacity-90" />
                   <div className="flex flex-col items-start">
                     <span className="font-bold">Approve</span>
                     <span className="text-[10px] opacity-80">Credit</span>
                   </div>
                 </Button>
                 <Button variant="outline" className="w-full justify-start h-14 bg-white border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg">
                   <TrendingUp className="w-5 h-5 mr-3 text-slate-400 rotate-180" />
                   <div className="flex flex-col items-start">
                     <span className="font-bold">Reduce Limit</span>
                   </div>
                 </Button>
                 <Button variant="outline" className="w-full justify-start h-14 bg-white border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg">
                   <ShieldAlert className="w-5 h-5 mr-3 text-slate-400" />
                   <div className="flex flex-col items-start">
                     <span className="font-bold">Request</span>
                     <span className="text-[10px] text-slate-500">Payment</span>
                   </div>
                 </Button>
              </div>

            </div>

            {/* Middle Row: Limit & Probability Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Suggested Limit</p>
                  <div className="text-3xl font-black text-[#E3182D] mb-4 tracking-tight">
                    NPR<br/>{selectedCustomer.suggestedLimit?.toLocaleString()}
                  </div>
                  <p className="text-xs font-semibold text-emerald-600 flex items-start gap-1.5 leading-tight">
                    <TrendingUp className="w-4 h-4 shrink-0" /> 
                    25% increase<br/>recommended
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm flex flex-col">
                <CardContent className="p-6 flex-1 flex flex-col">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Repayment Probability</p>
                  <div className="text-4xl font-black text-slate-800 tracking-tight mb-4">
                    {selectedCustomer.probability}%
                  </div>
                  <div className="mt-auto">
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                       <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${selectedCustomer.probability}%` }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm flex flex-col">
                <CardContent className="p-6 flex-1 flex flex-col">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Outstanding Amount</p>
                  <div className="text-2xl font-black text-slate-800 tracking-tight mb-4">
                    NPR {selectedCustomer.outstanding.toLocaleString()}
                  </div>
                  <div className="mt-auto flex items-center gap-2 text-slate-500 text-xs font-medium">
                     <Clock className="w-4 h-4" /> Next due in {selectedCustomer.dueIn} days
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Bottom Row: Risk Drivers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Positive Drivers */}
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6 text-lg">
                    <TrendingUp className="w-5 h-5 text-emerald-500" /> Risk Drivers (Positive)
                  </h3>
                  
                  <div className="flex flex-col gap-5">
                    {selectedCustomer.positiveDrivers?.map((driver, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs font-bold mb-2">
                           <span className="text-slate-700">{driver.name}</span>
                           <span className="text-emerald-600">+{driver.pts} pts</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                           <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(driver.pts / 50) * 100}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Negative Drivers */}
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6 text-lg">
                    <AlertTriangle className="w-5 h-5 text-red-500" /> Risk Drivers (Negative)
                  </h3>
                  
                  <div className="flex flex-col gap-6">
                    {selectedCustomer.negativeDrivers?.map((driver, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs font-bold mb-2">
                           <span className="text-slate-700">{driver.name}</span>
                           <span className="text-red-600">{driver.pts} pts</span>
                        </div>
                        {driver.desc && <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">{driver.desc}</p>}
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                           <div className="bg-red-600 h-full rounded-full" style={{ width: `${(Math.abs(driver.pts) / 30) * 100}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Bottom Floating Action button placeholder */}
            <div className="fixed bottom-8 right-8 z-50">
               <Button size="icon" className="w-14 h-14 rounded-xl bg-[#E3182D] hover:bg-red-700 shadow-lg shadow-red-500/30">
                 <span className="text-2xl leading-none text-white font-light">+</span>
               </Button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
