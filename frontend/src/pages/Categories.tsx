import { useState } from 'react';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/hooks/useCategories';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState, EmptyState } from '@/components/ui/StateComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2, Tags } from 'lucide-react';
import type { Category, CreateCategoryPayload } from '@/types';

export default function Categories() {
  const { data: categories, isLoading, isError, refetch } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CreateCategoryPayload>({ name: '', description: '' });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '' });
    setDialogOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description ?? '' });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await updateCategory.mutateAsync({
        categoryId: editing.id,
        payload: {
          name: form.name,
          description: form.description || undefined,
        },
      });
    } else {
      await createCategory.mutateAsync(form);
    }
    setDialogOpen(false);
  };

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-600">
              <Tags className="w-4 h-4" />
            </span>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Categories</h1>
          </div>
          <p className="text-sm text-slate-500">
            Manage product categories used across your inventory.
          </p>
        </div>
        <Button size="sm" className="bg-[#E3182D] hover:bg-red-700 text-white shadow-sm transition-all duration-200" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {!categories?.length ? (
        <EmptyState
          title="No categories yet"
          description="Create categories before adding products."
          action={
            <Button className="bg-[#E3182D] hover:bg-red-700 text-white shadow-sm transition-all duration-200" onClick={openCreate}>
              Add Category
            </Button>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:shadow-slate-100/50">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/60">
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors duration-150 group">
                  <td className="px-6 py-4.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-colors duration-200">
                        <Tags className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-semibold text-slate-800 tracking-tight">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4.5 text-sm text-slate-500 max-w-md truncate">
                    {c.description || <span className="text-slate-300">No description provided</span>}
                  </td>
                  <td className="px-6 py-4.5 text-right space-x-1.5">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 hover:text-slate-800 text-slate-400" onClick={() => openEdit(c)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                      disabled={deleteCategory.isPending}
                      onClick={() => deleteCategory.mutate(c.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              {editing ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Name</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="focus-visible:ring-red-500/20 focus-visible:border-[#E3182D]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Description</Label>
              <Input
                value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="focus-visible:ring-red-500/20 focus-visible:border-[#E3182D]"
              />
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" className="border-slate-200" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#E3182D] hover:bg-red-700 text-white min-w-[80px]"
                disabled={createCategory.isPending || updateCategory.isPending}
              >
                {createCategory.isPending || updateCategory.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : editing ? (
                  'Save'
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

