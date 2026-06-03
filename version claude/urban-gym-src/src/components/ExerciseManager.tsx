import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, ArrowLeft, Search, RefreshCw, Database } from 'lucide-react';
import { useHybridExercises } from '@/hooks/useHybridExercises';
import { ExerciseTemplate } from '@/hooks/useIndexedDBExercises';
import { useToast } from '@/hooks/use-toast';
import CategoryManager from './CategoryManager';
import EquipmentManager from './EquipmentManager';

interface ExerciseManagerProps {
  onBack: () => void;
}

const ExerciseManager: React.FC<ExerciseManagerProps> = ({ onBack }) => {
  const {
    exercises,
    saveExercise,
    updateExercise,
    deleteExercise,
    categories,
    onAddCategory,
    onUpdateCategory,
    onDeleteCategory,
    equipments,
    onAddEquipment,
    onUpdateEquipment,
    onDeleteEquipment,
    isLoading,
    searchExercises
  } = useHybridExercises();

  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseTemplate | null>(null);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isEquipmentManagerOpen, setIsEquipmentManagerOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    descripcion: '',
    musculosObjetivo: '',
    equipamiento: '',
    nivelDificultad: 'Principiante' as 'Principiante' | 'Intermedio' | 'Avanzado'
  });

  const filteredExercises = searchTerm.trim() 
    ? searchExercises(searchTerm) 
    : exercises;

  const resetForm = () => {
    setFormData({
      nombre: '',
      categoria: '',
      descripcion: '',
      musculosObjetivo: '',
      equipamiento: '',
      nivelDificultad: 'Principiante'
    });
    setEditingExercise(null);
  };

  const handleSubmit = async () => {
    if (!formData.nombre.trim() || !formData.categoria) {
      toast({
        title: "Error",
        description: "El nombre y categoría son obligatorios",
        variant: "destructive"
      });
      return;
    }

    const exerciseData = {
      ...formData,
      musculosObjetivo: formData.musculosObjetivo.split(',').map(m => m.trim()).filter(m => m),
      activo: true
    };

    let success = false;
    if (editingExercise) {
      success = await updateExercise(editingExercise.id, exerciseData);
    } else {
      success = await saveExercise(exerciseData);
    }

    if (success) {
      toast({
        title: "Éxito",
        description: editingExercise ? "Ejercicio actualizado" : "Ejercicio creado"
      });
      setShowForm(false);
      resetForm();
    } else {
      toast({
        title: "Error",
        description: "No se pudo guardar el ejercicio",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (exercise: ExerciseTemplate) => {
    setEditingExercise(exercise);
    setFormData({
      nombre: exercise.nombre,
      categoria: exercise.categoria,
      descripcion: exercise.descripcion,
      musculosObjetivo: exercise.musculosObjetivo.join(', '),
      equipamiento: exercise.equipamiento,
      nivelDificultad: exercise.nivelDificultad
    });
    setShowForm(true);
  };

  const handleDelete = async (exercise: ExerciseTemplate) => {
    if (window.confirm(`¿Estás seguro de eliminar "${exercise.nombre}"?`)) {
      const success = await deleteExercise(exercise.id);
      if (success) {
        toast({
          title: "Éxito",
          description: "Ejercicio eliminado"
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el ejercicio",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Ejercicios</h1>
          </div>

          <div className="flex gap-4 items-center justify-between">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar ejercicios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Actualizar
              </Button>
              <Button variant="outline" onClick={() => setIsCategoryManagerOpen(true)}>
                Gestionar Categorías
              </Button>
              <Button variant="outline" onClick={() => setIsEquipmentManagerOpen(true)}>
                Gestionar Equipamiento
              </Button>
              <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm} className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Nuevo Ejercicio
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingExercise ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Nombre *</label>
                        <Input
                          value={formData.nombre}
                          onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                          placeholder="Ej: Press de banca"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Categoría *</label>
                        <Select value={formData.categoria} onValueChange={(value) => setFormData({...formData, categoria: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Descripción</label>
                      <Textarea
                        value={formData.descripcion}
                        onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                        placeholder="Descripción del ejercicio..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Músculos Objetivo</label>
                        <Input
                          value={formData.musculosObjetivo}
                          onChange={(e) => setFormData({...formData, musculosObjetivo: e.target.value})}
                          placeholder="Ej: Pectorales, Tríceps (separados por coma)"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Equipamiento</label>
                        <Select value={formData.equipamiento} onValueChange={(value) => setFormData({...formData, equipamiento: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar equipamiento" />
                          </SelectTrigger>
                          <SelectContent>
                            {equipments.map(eq => (
                              <SelectItem key={eq.id} value={eq.name}>{eq.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Nivel de Dificultad</label>
                      <Select value={formData.nivelDificultad} onValueChange={(value: any) => setFormData({...formData, nivelDificultad: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Principiante">Principiante</SelectItem>
                          <SelectItem value="Intermedio">Intermedio</SelectItem>
                          <SelectItem value="Avanzado">Avanzado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleSubmit} className="flex-1">
                        {editingExercise ? 'Actualizar' : 'Crear'} Ejercicio
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
        </div>

        <div className="grid gap-4">
          {filteredExercises.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No se encontraron ejercicios</p>
              </CardContent>
            </Card>
          ) : (
            filteredExercises.map((exercise) => (
              <Card key={exercise.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{exercise.nombre}</h3>
                        <Badge variant="outline">{exercise.categoria}</Badge>
                        <Badge variant={exercise.nivelDificultad === 'Principiante' ? 'default' : 
                                     exercise.nivelDificultad === 'Intermedio' ? 'secondary' : 'destructive'}>
                          {exercise.nivelDificultad}
                        </Badge>
                      </div>
                      
                      {exercise.descripcion && (
                        <p className="text-gray-600 mb-2">{exercise.descripcion}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                        {exercise.equipamiento && (
                          <span>🏋️ {exercise.equipamiento}</span>
                        )}
                        {exercise.musculosObjetivo.length > 0 && (
                          <span>💪 {exercise.musculosObjetivo.join(', ')}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(exercise)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(exercise)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <CategoryManager
          isOpen={isCategoryManagerOpen}
          onClose={() => setIsCategoryManagerOpen(false)}
          categories={categories}
          onAddCategory={onAddCategory}
          onUpdateCategory={onUpdateCategory}
          onDeleteCategory={onDeleteCategory}
        />

        <EquipmentManager
          isOpen={isEquipmentManagerOpen}
          onClose={() => setIsEquipmentManagerOpen(false)}
          equipments={equipments}
          onAddEquipment={onAddEquipment}
          onUpdateEquipment={onUpdateEquipment}
          onDeleteEquipment={onDeleteEquipment}
        />
      </div>
    </div>
  );
};

export default ExerciseManager;