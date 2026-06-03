import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Edit, Plus, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// This will be defined in the hook later
export interface Equipment {
  id: string;
  name: string;
}

interface EquipmentManagerProps {
  isOpen: boolean;
  onClose: () => void;
  equipments: Equipment[];
  onAddEquipment: (name: string) => boolean | Promise<boolean>;
  onUpdateEquipment: (id: string, name: string) => boolean | Promise<boolean>;
  onDeleteEquipment: (id: string) => boolean | Promise<boolean>;
}

const EquipmentManager: React.FC<EquipmentManagerProps> = ({
  isOpen,
  onClose,
  equipments,
  onAddEquipment,
  onUpdateEquipment,
  onDeleteEquipment,
}) => {
  const [newEquipmentName, setNewEquipmentName] = useState('');
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const { toast } = useToast();

  const handleAdd = async () => {
    if (!newEquipmentName.trim()) {
      toast({ title: "Error", description: "El nombre no puede estar vacío", variant: "destructive" });
      return;
    }
    const success = await onAddEquipment(newEquipmentName.trim());
    if (success) {
      setNewEquipmentName('');
      toast({ title: "Éxito", description: "Equipamiento añadido" });
    } else {
      toast({ title: "Error", description: "El equipamiento ya existe", variant: "destructive" });
    }
  };

  const handleUpdate = async () => {
    if (editingEquipment && editingEquipment.name.trim()) {
      const success = await onUpdateEquipment(editingEquipment.id, editingEquipment.name.trim());
      if (success) {
        setEditingEquipment(null);
        toast({ title: "Éxito", description: "Equipamiento actualizado" });
      } else {
        toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" });
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Seguro que quieres eliminar este equipamiento?')) {
      const success = await onDeleteEquipment(id);
      if (success) {
        toast({ title: "Éxito", description: "Equipamiento eliminado" });
      } else {
        toast({ title: "Error", description: "No se pudo eliminar", variant: "destructive" });
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gestionar Equipamiento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Add new equipment form */}
          <div className="flex gap-2">
            <Input
              value={newEquipmentName}
              onChange={(e) => setNewEquipmentName(e.target.value)}
              placeholder="Nuevo equipamiento"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Equipments list */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {equipments.map((eq) => (
              <div key={eq.id} className="flex items-center justify-between p-2 rounded-md bg-gray-50 hover:bg-gray-100">
                {editingEquipment?.id === eq.id ? (
                  <Input
                    value={editingEquipment.name}
                    onChange={(e) => setEditingEquipment({ ...editingEquipment, name: e.target.value })}
                    className="h-8"
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                  />
                ) : (
                  <span className="flex-1">{eq.name}</span>
                )}

                <div className="flex gap-1">
                  {editingEquipment?.id === eq.id ? (
                    <>
                      <Button onClick={handleUpdate} size="icon" variant="ghost">
                        <Save className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button onClick={() => setEditingEquipment(null)} size="icon" variant="ghost">
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setEditingEquipment(eq)} size="icon" variant="ghost">
                      <Edit className="h-4 w-4 text-blue-600" />
                    </Button>
                  )}
                  <Button onClick={() => handleDelete(eq.id)} size="icon" variant="ghost">
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

export default EquipmentManager;
