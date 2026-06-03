import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Edit, Plus, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// This will be defined in the hook later
export interface Category {
  id: string;
  name: string;
}

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddCategory: (name: string) => boolean | Promise<boolean>;
  onUpdateCategory: (id: string, name: string) => boolean | Promise<boolean>;
  onDeleteCategory: (id: string) => boolean | Promise<boolean>;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { toast } = useToast();

  const handleAdd = async () => {
    if (!newCategoryName.trim()) {
      toast({ title: "Error", description: "El nombre no puede estar vacío", variant: "destructive" });
      return;
    }
    const success = await onAddCategory(newCategoryName.trim());
    if (success) {
      setNewCategoryName('');
      toast({ title: "Éxito", description: "Categoría añadida" });
    } else {
      toast({ title: "Error", description: "La categoría ya existe", variant: "destructive" });
    }
  };

  const handleUpdate = async () => {
    if (editingCategory && editingCategory.name.trim()) {
      const success = await onUpdateCategory(editingCategory.id, editingCategory.name.trim());
      if (success) {
        setEditingCategory(null);
        toast({ title: "Éxito", description: "Categoría actualizada" });
      } else {
        toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" });
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Seguro que quieres eliminar esta categoría?')) {
      const success = await onDeleteCategory(id);
      if (success) {
        toast({ title: "Éxito", description: "Categoría eliminada" });
      } else {
        toast({ title: "Error", description: "No se pudo eliminar", variant: "destructive" });
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gestionar Categorías</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Add new category form */}
          <div className="flex gap-2">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nueva categoría"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Categories list */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-2 rounded-md bg-gray-50 hover:bg-gray-100">
                {editingCategory?.id === cat.id ? (
                  <Input
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    className="h-8"
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                  />
                ) : (
                  <span className="flex-1">{cat.name}</span>
                )}

                <div className="flex gap-1">
                  {editingCategory?.id === cat.id ? (
                    <>
                      <Button onClick={handleUpdate} size="icon" variant="ghost">
                        <Save className="h-4 w-4 text-green-600" />
                      </Button>
                       <Button onClick={() => setEditingCategory(null)} size="icon" variant="ghost">
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setEditingCategory(cat)} size="icon" variant="ghost">
                      <Edit className="h-4 w-4 text-blue-600" />
                    </Button>
                  )}
                  <Button onClick={() => handleDelete(cat.id)} size="icon" variant="ghost">
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryManager;
