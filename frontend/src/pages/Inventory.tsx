import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, Plus, AlertTriangle, XCircle, Banknote, Filter, X, Sparkles, TrendingUp, History, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock Data
const inventoryData = [
  {
    id: 1,
    name: 'Premium Basmati Rice - 5kg',
    brand: 'Himalayan Pride',
    sku: 'RICE-HIM-005',
    category: 'Grains & Rice',
    stock: 124,
    unit: 'bags',
    reorderLevel: 20,
    cost: 850.00,
    price: 1120.00,
    status: 'In Stock',
  },
  {
    id: 2,
    name: 'Organic Full Cream Milk - 1L',
    brand: 'Dairy Fresh',
    sku: 'DAI-MILK-100',
    category: 'Dairy',
    stock: 12,
    unit: 'units',
    reorderLevel: 15,
    cost: 55.00,
    price: 78.00,
    status: 'Low Stock',
  },
  {
    id: 3,
    name: 'Himalayan Coffee Beans - 500g',
    brand: 'Hill Top Brews',
    sku: 'BEV-COFF-500',
    category: 'Beverages',
    stock: 0,
    unit: 'units',
    reorderLevel: 10,
    cost: 1200.00,
    price: 1650.00,
    status: 'Out of Stock',
  }
];

export default function Inventory() {
  const [selectedProduct, setSelectedProduct] = useState<any>(inventoryData[0]);
  const [activeTab, setActiveTab] = useState('All Products');

  return (
    <div className="flex h-full w-full overflow-hidden">
      
      {/* Main Content Area */}
      <div className={cn("flex-1 flex flex-col p-6 overflow-y-auto transition-all duration-300", selectedProduct ? "pr-6" : "")}>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Inventory</h1>
            <p className="text-slate-500">Manage your stock, track performance, and anticipate demand.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2 bg-white"><Upload className="w-4 h-4" /> Import CSV</Button>
            <Button variant="outline" className="gap-2 bg-white"><Download className="w-4 h-4" /> Export</Button>
            <Button className="gap-2 bg-[#E3182D] hover:bg-red-700 text-white"><Plus className="w-4 h-4" /> Add Product</Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-slate-200 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10"><Package className="w-12 h-12" /></div>
             <CardContent className="p-4 flex flex-col gap-1">
               <div className="flex justify-between items-center text-slate-500 mb-2">
                 <span className="text-xs font-bold uppercase tracking-wider">Total Products</span>
                 <Package className="w-4 h-4 text-slate-400" />
               </div>
               <span className="text-3xl font-bold text-slate-800">1,248</span>
               <span className="text-xs font-medium text-emerald-600 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> +12% vs last month</span>
             </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-500"><AlertTriangle className="w-12 h-12" /></div>
             <CardContent className="p-4 flex flex-col gap-1">
               <div className="flex justify-between items-center text-slate-500 mb-2">
                 <span className="text-xs font-bold uppercase tracking-wider">Low Stock</span>
                 <AlertTriangle className="w-4 h-4 text-amber-500" />
               </div>
               <span className="text-3xl font-bold text-slate-800">42</span>
               <span className="text-xs font-medium text-amber-600">Requires attention</span>
             </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 text-red-500"><XCircle className="w-12 h-12" /></div>
             <CardContent className="p-4 flex flex-col gap-1">
               <div className="flex justify-between items-center text-slate-500 mb-2">
                 <span className="text-xs font-bold uppercase tracking-wider">Out of Stock</span>
                 <XCircle className="w-4 h-4 text-red-500" />
               </div>
               <span className="text-3xl font-bold text-slate-800">07</span>
               <span className="text-xs font-medium text-red-600">Loss of ₹12,400 potential</span>
             </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-500"><Banknote className="w-12 h-12" /></div>
             <CardContent className="p-4 flex flex-col gap-1">
               <div className="flex justify-between items-center text-slate-500 mb-2">
                 <span className="text-xs font-bold uppercase tracking-wider">Inventory Value</span>
                 <Banknote className="w-4 h-4 text-emerald-600" />
               </div>
               <span className="text-3xl font-bold text-slate-800">₹4,82,500</span>
               <span className="text-xs font-medium text-slate-500">Cost basis analysis</span>
             </CardContent>
          </Card>
        </div>

        {/* Table Controls */}
        <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-4">
          <div className="flex gap-6">
            {['All Products', 'Low Stock', 'Out of Stock', 'Inactive'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "text-sm font-semibold pb-4 -mb-4 border-b-2 transition-colors",
                  activeTab === tab ? "border-red-600 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="bg-white gap-2 h-8">
            <Filter className="w-3.5 h-3.5" /> Filters
          </Button>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 w-10"><input type="checkbox" className="rounded border-slate-300" /></th>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">SKU</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold text-right">Current Stock</th>
                  <th className="px-4 py-3 font-semibold text-right">Reorder Lvl</th>
                  <th className="px-4 py-3 font-semibold text-right">Cost</th>
                  <th className="px-4 py-3 font-semibold text-right">Price</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {inventoryData.map((item) => (
                  <tr 
                    key={item.id} 
                    onClick={() => setSelectedProduct(item)}
                    className={cn(
                      "border-b border-slate-100 transition-colors cursor-pointer",
                      selectedProduct?.id === item.id ? "bg-red-50/50" : "hover:bg-slate-50"
                    )}
                  >
                    <td className="px-4 py-4"><input type="checkbox" className="rounded border-slate-300" /></td>
                    <td className="px-4 py-4 flex items-center gap-3 min-w-[250px]">
                      <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.brand}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-500 font-mono text-xs">{item.sku}</td>
                    <td className="px-4 py-4">
                       <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">{item.category}</span>
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-slate-800">{item.stock} {item.unit}</td>
                    <td className="px-4 py-4 text-right text-slate-500">{item.reorderLevel}</td>
                    <td className="px-4 py-4 text-right text-slate-500">₹{item.cost.toFixed(2)}</td>
                    <td className="px-4 py-4 text-right font-medium text-slate-900">₹{item.price.toFixed(2)}</td>
                    <td className="px-4 py-4">
                      {item.status === 'In Stock' && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 shadow-none font-semibold">In Stock</Badge>}
                      {item.status === 'Low Stock' && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0 shadow-none font-semibold">Low Stock</Badge>}
                      {item.status === 'Out of Stock' && <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0 shadow-none font-semibold">Out of Stock</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50 mt-auto">
            <span className="text-sm text-slate-500">Showing 1 to 3 of 1,248 products</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="w-8 h-8 p-0">&lt;</Button>
              <Button variant="default" size="sm" className="w-8 h-8 p-0 bg-red-600 hover:bg-red-700 text-white">1</Button>
              <Button variant="outline" size="sm" className="w-8 h-8 p-0">2</Button>
              <Button variant="outline" size="sm" className="w-8 h-8 p-0">3</Button>
              <span className="px-2 py-1 text-slate-400">...</span>
              <Button variant="outline" size="sm" className="w-8 h-8 p-0">250</Button>
              <Button variant="outline" size="sm" className="w-8 h-8 p-0">&gt;</Button>
            </div>
          </div>
        </div>

      </div>

      {/* Right Sidebar (Product Details) */}
      {selectedProduct && (
        <div className="w-96 bg-white border-l border-slate-200 flex flex-col flex-shrink-0 animate-in slide-in-from-right">
          
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h2 className="font-bold text-lg text-slate-800">Product Details</h2>
            <Button variant="ghost" size="icon" onClick={() => setSelectedProduct(null)} className="text-slate-400 hover:text-slate-800">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
            
            {/* Header Info */}
            <div className="flex gap-4 items-start">
               <div className="w-16 h-16 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                  <Package className="w-8 h-8 text-slate-300" />
               </div>
               <div>
                 <h3 className="font-bold text-slate-900 leading-tight mb-1">{selectedProduct.name}</h3>
                 <p className="text-xs text-slate-500 font-mono mb-2">SKU: {selectedProduct.sku}</p>
                 <div className="flex gap-2">
                   {selectedProduct.status === 'In Stock' && <Badge className="bg-emerald-100 text-emerald-700 border-0 shadow-none text-xs rounded-sm">In Stock</Badge>}
                   {selectedProduct.status === 'Low Stock' && <Badge className="bg-amber-100 text-amber-700 border-0 shadow-none text-xs rounded-sm">Low Stock</Badge>}
                   {selectedProduct.status === 'Out of Stock' && <Badge className="bg-red-100 text-red-700 border-0 shadow-none text-xs rounded-sm">Out of Stock</Badge>}
                   <Badge variant="outline" className="text-xs rounded-sm bg-white">Edit</Badge>
                 </div>
               </div>
            </div>

            {/* AI Prediction Card */}
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 relative overflow-hidden">
              <div className="flex items-center gap-2 text-red-600 font-bold mb-3">
                <Sparkles className="w-4 h-4" />
                AI Demand Prediction
              </div>
              <p className="text-xs text-red-900 leading-relaxed mb-4">
                Based on local festival trends and past sales, demand is expected to surge by <strong className="font-bold">28%</strong> next week.
              </p>
              <div className="mb-3">
                <div className="flex justify-between text-[10px] font-bold text-red-800 uppercase tracking-wider mb-1">
                  <span>Current Stock Path</span>
                  <span>Expires in 12 days</span>
                </div>
                <div className="w-full bg-red-200 h-1.5 rounded-full overflow-hidden">
                   <div className="bg-red-600 h-full w-[45%] rounded-full"></div>
                </div>
              </div>
              <p className="text-[11px] font-medium text-red-700 bg-red-100/50 p-2 rounded-md">
                Recommendation: Reorder 50 units by Tuesday to avoid stockout.
              </p>
            </div>

            {/* Stock History */}
            <div>
              <h4 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
                 <History className="w-4 h-4 text-slate-500" /> Stock History
              </h4>
              <div className="flex flex-col gap-4 relative">
                 <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200 z-0"></div>
                 
                 <div className="flex gap-3 relative z-10">
                    <div className="w-4 h-4 rounded-full bg-white border-2 border-slate-300 mt-1 shrink-0"></div>
                    <div className="flex-1 pb-4 border-b border-slate-100">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-semibold text-slate-800">Stock In (+50)</span>
                        <span className="text-xs text-slate-500">Today, 10:30 AM</span>
                      </div>
                      <div className="flex justify-between items-end">
                         <span className="text-xs text-slate-500">Vendor: Himalayan Exports</span>
                         <span className="text-xs font-semibold text-emerald-600">New Balance: 124</span>
                      </div>
                    </div>
                 </div>

                 <div className="flex gap-3 relative z-10">
                    <div className="w-4 h-4 rounded-full bg-white border-2 border-slate-300 mt-1 shrink-0"></div>
                    <div className="flex-1 pb-4 border-b border-slate-100">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-semibold text-slate-800">Sold (-2)</span>
                        <span className="text-xs text-slate-500">Yesterday, 4:15 PM</span>
                      </div>
                      <div className="flex justify-between items-end">
                         <span className="text-xs text-slate-500">POS Transaction #8291</span>
                         <span className="text-xs font-semibold text-slate-600">New Balance: 74</span>
                      </div>
                    </div>
                 </div>
                 
                 <Button variant="link" className="text-red-600 text-xs font-medium self-center mt-2">View full history</Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                 <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Category</p>
                 <p className="text-sm font-semibold text-slate-800">{selectedProduct.category}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                 <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Location</p>
                 <p className="text-sm font-semibold text-slate-800">Aisle 4, Shelf B</p>
              </div>
            </div>

          </div>
          
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-2">
             <Button className="flex-1 bg-[#E3182D] hover:bg-red-700 text-white font-medium">
               Create Purchase Order
             </Button>
             <Button variant="outline" className="w-10 px-0 bg-white border-slate-200 text-slate-600 hover:text-red-600">
                <XCircle className="w-5 h-5" />
             </Button>
          </div>

        </div>
      )}

    </div>
  );
}
