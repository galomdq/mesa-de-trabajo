import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, ArrowLeft, Search, Mail, Phone, User } from 'lucide-react';
import { useProfessors, Professor } from '@/hooks/useProfessors';
import { useToast } from '@/hooks/use-toast';

interface ProfessorManagerProps {
  onBack: () => void;
}

const ProfessorManager: React.FC<ProfessorManagerProps> = ({ onBack }) => {
  const { professors, saveProfessor, updateProfessor, deleteProfessor } = useProfessors();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: ''
  });

  const specialties = [
    'Entrenamiento Personal', 'Rehabilitación', 'Crossfit', 'Funcional', 
    'Powerlifting', 'Fuerza', 'Cardio', 'Yoga', 'Pilates', 'Natación'
  ];

  const filteredProfessors = professors.filter(professor =>
    professor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    professor.apellido.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      nombre: '',
      apellido: ''
    });
    setEditingProfessor(null);
  };

  const handleSubmit = () => {
    if (!formData.nombre.trim() || !formData.apellido.trim()) {
      toast({
        title: "Error",
        description: "Nombre y apellido son obligatorios",
        variant: "destructive"
      });
      return;
    }

    const professorData = {
      ...formData,
      email: '',
      telefono: '',
      especialidad: [],
      certificaciones: [],
      activo: true
    };

    let success = false;
    if (editingProfessor) {
      success = updateProfessor(editingProfessor.id, professorData);
    } else {
      success = saveProfessor(professorData);
    }

    if (success) {
      toast({
        title: "Éxito",
        description: editingProfessor ? "Profesor actualizado" : "Profesor creado"
      });
      setShowForm(false);
      resetForm();
    } else {
      toast({
        title: "Error",
        description: "No se pudo guardar el profesor",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (professor: Professor) => {
    setEditingProfessor(professor);
    setFormData({
      nombre: professor.nombre,
      apellido: professor.apellido
    });
    setShowForm(true);
  };

  const handleDelete = (professor: Professor) => {
    if (window.confirm(`¿Estás seguro de eliminar a "${professor.nombre} ${professor.apellido}"?`)) {
      const success = deleteProfessor(professor.id);
      if (success) {
        toast({
          title: "Éxito",
          description: "Profesor eliminado"
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el profesor",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Profesores</h1>
          </div>

          {/* Controls */}
          <div className="flex gap-4 items-center justify-between">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar profesores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo Profesor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingProfessor ? 'Editar Profesor' : 'Nuevo Profesor'}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Nombre *</label>
                      <Input
                        value={formData.nombre}
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                        placeholder="Nombre del profesor"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Apellido *</label>
                      <Input
                        value={formData.apellido}
                        onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                        placeholder="Apellido del profesor"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSubmit} className="flex-1">
                      {editingProfessor ? 'Actualizar' : 'Crear'} Profesor
                    </Button>
                    <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Professor List */}
        <div className="grid gap-4">
          {filteredProfessors.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No se encontraron profesores</p>
              </CardContent>
            </Card>
          ) : (
            filteredProfessors.map((professor) => (
              <Card key={professor.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="h-5 w-5 text-orange-500" />
                        <h3 className="font-semibold text-lg">
                          {professor.nombre} {professor.apellido}
                        </h3>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-xs text-gray-400">
                          Ingresó: {new Date(professor.fechaIngreso).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(professor)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(professor)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessorManager;