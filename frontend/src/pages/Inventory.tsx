import { useMemo, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import {
  useProducts,
  useLowStockProducts,
  useCreateProduct,
  useUpdateProduct,
  useStockIn,
  useStockOut,
  useDeleteProduct,
  useProduct,
} from '@/hooks/useInventory';
import { useCategories } from '@/hooks/useCategories';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState, EmptyState } from '@/components/ui/StateComponents';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  AlertTriangle,
  XCircle,
  Banknote,
  X,
  Package,
  Loader2,
  ArrowDownToLine,
  ArrowUpFromLine,
  Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';
import type { CreateProductPayload, Product, UpdateProductPayload } from '@/types';

function stockStatus(p: Product) {
  if (p.stock_quantity <= 0) return 'Out of Stock';
  if (p.stock_quantity <= p.reorder_level) return 'Low Stock';
  return 'In Stock';
}

const emptyProduct: CreateProductPayload = {
  category_id: '',
  product_name: '',
  sku: '',
  unit: 'pcs',
  stock_quantity: 0,
  cost_price: 0,
  selling_price: 0,
  reorder_level: 10,
  is_staple: false,
  is_perishable: false,
};

export default function Inventory() {
  const { activeShop } = useAuth();
  const shopId = activeShop?.id ?? '';
  const { data: products, isLoading, isError, refetch } = useProducts(shopId);
  const { data: lowStockApi } = useLowStockProducts(shopId);
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct(shopId);
  const updateProduct = useUpdateProduct(shopId);
  const stockIn = useStockIn(shopId);
  const stockOut = useStockOut(shopId);
  const deleteProduct = useDeleteProduct(shopId);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('All Products');
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<CreateProductPayload>(emptyProduct);
  const [editForm, setEditForm] = useState<UpdateProductPayload>({});
  const [stockQty, setStockQty] = useState(10);
  const [stockReason, setStockReason] = useState('Restock');

  // Refresh selected product from GET /products/{id}
  useProduct(shopId, selectedId ?? '');

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    (categories ?? []).forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const stats = useMemo(() => {
    const list = products ?? [];
    const low = list.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= p.reorder_level)
      .length;
    const out = list.filter((p) => p.stock_quantity <= 0).length;
    const value = list.reduce((s, p) => s + p.stock_quantity * p.cost_price, 0);
    return { total: list.length, low, out, value };
  }, [products]);

  const filtered = useMemo(() => {
    // Low Stock tab uses dedicated /low-stock API when available
    const source =
      activeTab === 'Low Stock' && lowStockApi ? lowStockApi : (products ?? []);
    return source.filter((p) => {
      const status = stockStatus(p);
      const matchesTab =
        activeTab === 'All Products' ||
        (activeTab === 'Low Stock' && (status === 'Low Stock' || status === 'Out of Stock')) ||
        (activeTab === 'Out of Stock' && status === 'Out of Stock');
      const q = search.toLowerCase();
      const matchesSearch =
        p.product_name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [products, lowStockApi, activeTab, search]);

  const selected = products?.find((p) => p.id === selectedId) ?? null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProduct.mutateAsync(form);
    setAddOpen(false);
    setForm(emptyProduct);
  };

  const openEdit = (p: Product) => {
    setEditForm({
      product_name: p.product_name,
      category_id: p.category_id,
      sku: p.sku,
      unit: p.unit,
      cost_price: p.cost_price,
      selling_price: p.selling_price,
      reorder_level: p.reorder_level,
      is_staple: p.is_staple,
      is_perishable: p.is_perishable,
    });
    setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    await updateProduct.mutateAsync({ productId: selectedId, payload: editForm });
    setEditOpen(false);
  };

  if (!shopId || isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div
        className={cn(
          'flex-1 flex flex-col p-8 overflow-y-auto transition-all duration-300',
          selected ? 'pr-2' : ''
        )}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-[#E3182D]">
                <Package className="w-4 h-4" />
              </span>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Inventory</h1>
            </div>
            <p className="text-sm text-slate-500">Manage stock levels, pricing, and product catalog.</p>
          </div>
          <div className="flex items-center gap-2.5">
            <Button variant="outline" className="border-slate-200 hover:bg-slate-50 transition-colors" asChild>
              <Link to={ROUTES.CATEGORIES}>Categories</Link>
            </Button>
            <Button
              className="gap-2 bg-[#E3182D] hover:bg-red-700 text-white shadow-sm transition-all duration-200"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="w-4 h-4" /> Add Product
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-slate-100/60 hover:-translate-y-0.5">
            <div className="flex justify-between items-center text-slate-500 mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Products</span>
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                <Package className="w-4 h-4 text-slate-400" />
              </div>
            </div>
            <span className="text-3xl font-black text-slate-800 tracking-tight leading-tight">{stats.total}</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-slate-100/60 hover:-translate-y-0.5">
            <div className="flex justify-between items-center text-slate-500 mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Low Stock</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
            </div>
            <span className="text-3xl font-black text-slate-800 tracking-tight leading-tight">{stats.low}</span>
            <div className="flex items-center gap-1 mt-1.5">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                Requires attention
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-slate-100/60 hover:-translate-y-0.5">
            <div className="flex justify-between items-center text-slate-500 mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Out of Stock</span>
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                <XCircle className="w-4 h-4 text-[#E3182D]" />
              </div>
            </div>
            <span className="text-3xl font-black text-slate-800 tracking-tight leading-tight">{stats.out}</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-slate-100/60 hover:-translate-y-0.5">
            <div className="flex justify-between items-center text-slate-500 mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inventory Value</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Banknote className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <span className="text-3xl font-black text-slate-800 tracking-tight leading-tight">
              {formatCurrency(stats.value)}
            </span>
            <div className="flex items-center gap-1 mt-1.5">
              <span className="text-[11px] font-semibold text-slate-400">
                Cost basis
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-5 border-b border-slate-200/60 pb-4 gap-4 flex-wrap">
          <div className="bg-slate-100/85 p-0.5 rounded-lg flex gap-1 border border-slate-200/40">
            {['All Products', 'Low Stock', 'Out of Stock'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 cursor-pointer',
                  activeTab === tab
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/40 font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-60 bg-white border-slate-200 focus-visible:ring-red-500/20 focus-visible:border-[#E3182D]"
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm flex-1 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md hover:shadow-slate-100/50">
          {filtered.length === 0 ? (
            <EmptyState
              title="No products found"
              description="Add products to start managing inventory."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-450 uppercase bg-slate-50/70 border-b border-slate-200/60">
                  <tr>
                    <th className="px-6 py-4 font-bold text-slate-400 tracking-wider">Product</th>
                    <th className="px-6 py-4 font-bold text-slate-400 tracking-wider">SKU</th>
                    <th className="px-6 py-4 font-bold text-slate-400 tracking-wider">Category</th>
                    <th className="px-6 py-4 font-bold text-slate-400 tracking-wider text-right">Stock</th>
                    <th className="px-6 py-4 font-bold text-slate-400 tracking-wider text-right">Reorder</th>
                    <th className="px-6 py-4 font-bold text-slate-400 tracking-wider text-right">Cost</th>
                    <th className="px-6 py-4 font-bold text-slate-400 tracking-wider text-right">Price</th>
                    <th className="px-6 py-4 font-bold text-slate-400 tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((item) => {
                    const status = stockStatus(item);
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className={cn(
                          'transition-colors duration-150 cursor-pointer group',
                          selectedId === item.id 
                            ? 'bg-red-50/40 hover:bg-red-50/50' 
                            : 'hover:bg-slate-50/50'
                        )}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-red-50 group-hover:text-red-500 group-hover:border-red-100/50 transition-colors">
                              <Package className="w-4.5 h-4.5 text-slate-400" />
                            </div>
                            <p className="font-semibold text-slate-800 tracking-tight">{item.product_name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">{item.sku}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-slate-100/80 text-slate-650 rounded-md text-xs font-semibold border border-slate-200/20">
                            {categoryMap.get(item.category_id) ?? '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-slate-850">
                          {item.stock_quantity} {item.unit}
                        </td>
                        <td className="px-6 py-4 text-right text-slate-500 font-medium">{item.reorder_level}</td>
                        <td className="px-6 py-4 text-right text-slate-500 font-semibold">
                          {formatCurrency(item.cost_price)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                          {formatCurrency(item.selling_price)}
                        </td>
                        <td className="px-6 py-4">
                          {status === 'In Stock' && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-0 font-semibold shadow-none rounded-md px-2.5 py-0.5 text-xs">
                              In Stock
                            </Badge>
                          )}
                          {status === 'Low Stock' && (
                            <Badge className="bg-amber-100 text-amber-700 border-0 font-semibold shadow-none rounded-md px-2.5 py-0.5 text-xs">
                              Low Stock
                            </Badge>
                          )}
                          {status === 'Out of Stock' && (
                            <Badge className="bg-red-100 text-red-700 border-0 font-semibold shadow-none rounded-md px-2.5 py-0.5 text-xs">
                              Out of Stock
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30 mt-auto">
            <span className="text-xs font-bold text-slate-400">
              Showing {filtered.length} of {products?.length ?? 0} products
            </span>
          </div>
        </div>
      </div>

      {selected && (
        <div className="w-[400px] bg-white border-l border-slate-200/80 flex flex-col flex-shrink-0 shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-150">
            <h2 className="font-bold text-lg text-slate-900 tracking-tight">Product Details</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedId(null)}
              className="text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
            <div className="flex gap-4 items-start pb-5 border-b border-slate-100">
              <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                <Package className="w-8 h-8 text-slate-350" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 leading-tight">
                  {selected.product_name}
                </h3>
                <p className="text-xs text-slate-500 font-mono mb-2">SKU: {selected.sku}</p>
                <Badge
                  className={cn('border-0 text-xs', {
                    'bg-emerald-100 text-emerald-700': stockStatus(selected) === 'In Stock',
                    'bg-amber-100 text-amber-700': stockStatus(selected) === 'Low Stock',
                    'bg-red-100 text-red-700': stockStatus(selected) === 'Out of Stock',
                  })}
                >
                  {stockStatus(selected)}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                  Category
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  {categoryMap.get(selected.category_id) ?? '—'}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                  Stock
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  {selected.stock_quantity} {selected.unit}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                  Cost
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  {formatCurrency(selected.cost_price)}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                  Price
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  {formatCurrency(selected.selling_price)}
                </p>
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4">
              <h4 className="font-bold text-sm text-slate-800">Adjust Stock</h4>
              <Input
                type="number"
                min={1}
                value={stockQty}
                onChange={(e) => setStockQty(Number(e.target.value) || 1)}
              />
              <Input
                placeholder="Reason"
                value={stockReason}
                onChange={(e) => setStockReason(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={stockIn.isPending}
                  onClick={() =>
                    stockIn.mutate({
                      productId: selected.id,
                      payload: { quantity: stockQty, reason: stockReason || 'Stock in' },
                    })
                  }
                >
                  {stockIn.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ArrowDownToLine className="w-4 h-4 mr-1" /> Stock In
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={stockOut.isPending}
                  onClick={() =>
                    stockOut.mutate({
                      productId: selected.id,
                      payload: { quantity: stockQty, reason: stockReason || 'Stock out' },
                    })
                  }
                >
                  {stockOut.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ArrowUpFromLine className="w-4 h-4 mr-1" /> Stock Out
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => selected && openEdit(selected)}
            >
              <Pencil className="w-4 h-4 mr-2" /> Edit
            </Button>
            <Button
              variant="outline"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              disabled={deleteProduct.isPending}
              onClick={() => {
                deleteProduct.mutate(selected.id);
                setSelectedId(null);
              }}
            >
              Deactivate
            </Button>
          </div>
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-3">
            <div className="space-y-2">
              <Label>Product name</Label>
              <Input
                required
                value={editForm.product_name ?? ''}
                onChange={(e) => setEditForm({ ...editForm, product_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                className="w-full h-10 rounded-md border border-slate-200 px-3 text-sm"
                value={editForm.category_id ?? ''}
                onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
              >
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input
                  value={editForm.sku ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input
                  value={editForm.unit ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Cost</Label>
                <Input
                  type="number"
                  value={editForm.cost_price ?? 0}
                  onChange={(e) =>
                    setEditForm({ ...editForm, cost_price: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Price</Label>
                <Input
                  type="number"
                  value={editForm.selling_price ?? 0}
                  onChange={(e) =>
                    setEditForm({ ...editForm, selling_price: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reorder level</Label>
              <Input
                type="number"
                value={editForm.reorder_level ?? 0}
                onChange={(e) =>
                  setEditForm({ ...editForm, reorder_level: Number(e.target.value) })
                }
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={updateProduct.isPending}
              >
                {updateProduct.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Save'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="space-y-2">
              <Label>Product name</Label>
              <Input
                required
                value={form.product_name}
                onChange={(e) => setForm({ ...form, product_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                required
                className="w-full h-10 rounded-md border border-slate-200 px-3 text-sm"
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              >
                <option value="">Select category...</option>
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input
                  required
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input
                  required
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Cost price</Label>
                <Input
                  type="number"
                  min={0}
                  required
                  value={form.cost_price}
                  onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Selling price</Label>
                <Input
                  type="number"
                  min={0}
                  required
                  value={form.selling_price}
                  onChange={(e) => setForm({ ...form, selling_price: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Initial stock</Label>
                <Input
                  type="number"
                  min={0}
                  required
                  value={form.stock_quantity}
                  onChange={(e) => setForm({ ...form, stock_quantity: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Reorder level</Label>
                <Input
                  type="number"
                  min={0}
                  required
                  value={form.reorder_level}
                  onChange={(e) => setForm({ ...form, reorder_level: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_staple}
                  onChange={(e) => setForm({ ...form, is_staple: e.target.checked })}
                />
                Staple
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_perishable}
                  onChange={(e) => setForm({ ...form, is_perishable: e.target.checked })}
                />
                Perishable
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={createProduct.isPending}
              >
                {createProduct.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Create'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
