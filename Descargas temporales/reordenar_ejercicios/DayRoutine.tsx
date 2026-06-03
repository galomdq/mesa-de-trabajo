
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Search, Filter, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { useHybridExercises } from '@/hooks/useHybridExercises';
import { useToast } from '@/hooks/use-toast';
import type { LocalExercise, LocalDayRoutineData } from '@/hooks/useLocalRoutines';

interface DayRoutineProps {
  day: string;
  dayData: LocalDayRoutineData;
  onUpdateDay: (section: 'entradaCalor' | 'entrenamiento', exercises: LocalExercise[]) => void;
}

const DayRoutine: React.FC<DayRoutineProps> = ({ day, dayData, onUpdateDay }) => {
  const { allExercises: exercisesRaw, saveExercise, categories: categoriesRaw, equipments: equipmentsRaw } = useHybridExercises();
  const exercises = exercisesRaw ?? [];
  const categories = categoriesRaw ?? [];
  const equipments = equipmentsRaw ?? [];
  const { toast } = useToast();
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [currentSection, setCurrentSection] = useState<'entradaCalor' | 'entrenamiento'>('entrenamiento');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [newExerciseForm, setNewExerciseForm] = useState({
    nombre: '',
    categoria: '',
    descripcion: '',
    musculosObjetivo: '',
    equipamiento: '',
    nivelDificultad: 'Principiante' as const
  });
  const [showNewExerciseForm, setShowNewExerciseForm] = useState(false);

  // Drag & drop state
  const dragIndexRef = useRef<{ section: string; index: number } | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<{ section: string; index: number } | null>(null);

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || categoryFilter === 'all' || exercise.categoria === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const createEmptyExercise = (): LocalExercise => ({
    id: Date.now().toString() + Math.random(),
    exercise_id: '',
    ejercicio: '',
    series: '',
    repeticiones: '',
    observaciones: '',
    orden: 0
  });

  const addExercise = (section: 'entradaCalor' | 'entrenamiento') => {
    setCurrentSection(section);
    setShowExerciseSelector(true);
  };

  const addEmptyExercise = (section: 'entradaCalor' | 'entrenamiento') => {
    const newExercise = createEmptyExercise();
    const updatedExercises = [...dayData[section], newExercise];
    onUpdateDay(section, updatedExercises);
  };

  const addExerciseFromDB = (exerciseName: string) => {
    const newExercise = createEmptyExercise();
    newExercise.ejercicio = exerciseName;
    const updatedExercises = [...dayData[currentSection], newExercise];
    onUpdateDay(currentSection, updatedExercises);
    setShowExerciseSelector(false);
    setSearchTerm('');
    setCategoryFilter('');
  };

  const handleNewExerciseSubmit = async () => {
    if (!newExerciseForm.nombre.trim() || !newExerciseForm.categoria.trim()) {
      toast({
        title: "Error",
        description: "Nombre y categoría son obligatorios",
        variant: "destructive"
      });
      return;
    }

    const existingExercise = exercises.find(ex =>
      ex.nombre.toLowerCase() === newExerciseForm.nombre.trim().toLowerCase()
    );

    if (existingExercise) {
      toast({
        title: "Error",
        description: "Ya existe un ejercicio con ese nombre",
        variant: "destructive"
      });
      return;
    }

    const success = await saveExercise({
      id: crypto.randomUUID(),
      nombre: newExerciseForm.nombre,
      categoria: newExerciseForm.categoria,
      descripcion: newExerciseForm.descripcion,
      musculosObjetivo: newExerciseForm.musculosObjetivo.split(',').map(m => m.trim()).filter(m => m),
      equipamiento: newExerciseForm.equipamiento,
      nivelDificultad: newExerciseForm.nivelDificultad,
      fechaCreacion: new Date().toISOString().split('T')[0],
      activo: true
    });

    if (success) {
      addExerciseFromDB(newExerciseForm.nombre);
      setNewExerciseForm({
        nombre: '',
        categoria: '',
        descripcion: '',
        musculosObjetivo: '',
        equipamiento: '',
        nivelDificultad: 'Principiante'
      });
      setShowNewExerciseForm(false);
      toast({ title: "Éxito", description: "Ejercicio creado y agregado a la rutina" });
    } else {
      toast({ title: "Error", description: "No se pudo crear el ejercicio", variant: "destructive" });
    }
  };

  const removeExercise = (section: 'entradaCalor' | 'entrenamiento', exerciseId: string) => {
    const updatedExercises = dayData[section].filter(ex => ex.id !== exerciseId);
    onUpdateDay(section, updatedExercises);
  };

  const updateExercise = (
    section: 'entradaCalor' | 'entrenamiento',
    exerciseId: string,
    field: keyof LocalExercise,
    value: string
  ) => {
    const updatedExercises = dayData[section].map(ex =>
      ex.id === exerciseId ? { ...ex, [field]: value } : ex
    );
    onUpdateDay(section, updatedExercises);
  };

  // ── Reordenamiento con flechas ────────────────────────────────────────────
  const moveExercise = (section: 'entradaCalor' | 'entrenamiento', index: number, direction: 'up' | 'down') => {
    const list = [...dayData[section]];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    [list[index], list[targetIndex]] = [list[targetIndex], list[index]];
    onUpdateDay(section, list);
  };

  // ── Drag & drop handlers ──────────────────────────────────────────────────
  const handleDragStart = (section: string, index: number) => {
    dragIndexRef.current = { section, index };
  };

  const handleDragOver = (e: React.DragEvent, section: string, index: number) => {
    e.preventDefault();
    setDragOverIndex({ section, index });
  };

  const handleDrop = (e: React.DragEvent, section: 'entradaCalor' | 'entrenamiento', dropIndex: number) => {
    e.preventDefault();
    if (!dragIndexRef.current || dragIndexRef.current.section !== section) return;
    const dragIndex = dragIndexRef.current.index;
    if (dragIndex === dropIndex) return;
    const list = [...dayData[section]];
    const [moved] = list.splice(dragIndex, 1);
    list.splice(dropIndex, 0, moved);
    onUpdateDay(section, list);
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const renderExerciseSection = (
    title: string,
    section: 'entradaCalor' | 'entrenamiento',
    exerciseList: LocalExercise[]
  ) => (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-orange-700">{title}</CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={() => addExercise(section)}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              size="sm"
            >
              <Search className="h-4 w-4 mr-2" />
              Seleccionar Ejercicio
            </Button>
            <Button onClick={() => addEmptyExercise(section)} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ejercicio Manual
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {exerciseList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No hay ejercicios agregados para {title.toLowerCase()}</p>
            <p className="text-sm">Haz clic en "Agregar Ejercicio" para comenzar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {exerciseList.map((exercise, index) => {
              const isDraggingOver = dragOverIndex?.section === section && dragOverIndex?.index === index;
              return (
                <div
                  key={exercise.id}
                  draggable
                  onDragStart={() => handleDragStart(section, index)}
                  onDragOver={(e) => handleDragOver(e, section, index)}
                  onDrop={(e) => handleDrop(e, section, index)}
                  onDragEnd={handleDragEnd}
                  className={`border rounded-lg p-4 bg-gray-50 transition-all ${
                    isDraggingOver ? 'border-orange-400 bg-orange-50 shadow-md scale-[1.01]' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {/* Grip handle */}
                    <div
                      className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 flex-shrink-0 touch-none"
                      title="Arrastrar para reordenar"
                    >
                      <GripVertical className="h-5 w-5" />
                    </div>

                    <span className="font-medium text-gray-700 flex-1">Ejercicio {index + 1}</span>

                    {/* Flechas de reorden */}
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveExercise(section, index, 'up')}
                        disabled={index === 0}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-orange-600 hover:bg-orange-50 disabled:opacity-20"
                        title="Subir"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveExercise(section, index, 'down')}
                        disabled={index === exerciseList.length - 1}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-orange-600 hover:bg-orange-50 disabled:opacity-20"
                        title="Bajar"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Botón eliminar */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeExercise(section, exercise.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0 flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ejercicio</label>
                      <Input
                        placeholder="Nombre del ejercicio"
                        value={exercise.ejercicio}
                        onChange={(e) => updateExercise(section, exercise.id, 'ejercicio', e.target.value)}
                        maxLength={50}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Series</label>
                      <Input
                        placeholder="15-12-10-10-8"
                        value={exercise.series}
                        onChange={(e) => updateExercise(section, exercise.id, 'series', e.target.value)}
                        maxLength={20}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Repeticiones</label>
                      <Input
                        placeholder="15-12-10-10-8"
                        value={exercise.repeticiones}
                        onChange={(e) => updateExercise(section, exercise.id, 'repeticiones', e.target.value)}
                        maxLength={20}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                      <Input
                        placeholder="Notas adicionales"
                        value={exercise.observaciones}
                        onChange={(e) => updateExercise(section, exercise.id, 'observaciones', e.target.value)}
                        maxLength={50}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {renderExerciseSection('Entrada en Calor', 'entradaCalor', dayData.entradaCalor)}
      {renderExerciseSection('Entrenamiento', 'entrenamiento', dayData.entrenamiento)}

      {/* Exercise Selector Dialog */}
      <Dialog open={showExerciseSelector} onOpenChange={setShowExerciseSelector}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Seleccionar Ejercicio para {currentSection === 'entradaCalor' ? 'Entrada en Calor' : 'Entrenamiento'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar ejercicio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {(categories || []).map(cat => (
                    <SelectItem key={String(cat.id)} value={String(cat.name)}>{String(cat.name)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 max-h-60 overflow-y-auto">
              {filteredExercises.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No se encontraron ejercicios</p>
                  <Button onClick={() => setShowNewExerciseForm(true)} className="mt-2 bg-orange-500 hover:bg-orange-600 text-white">
                    Crear Nuevo Ejercicio
                  </Button>
                </div>
              ) : (
                filteredExercises.map(exercise => (
                  <div key={exercise.id} className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer" onClick={() => addExerciseFromDB(exercise.nombre)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{exercise.nombre}</h4>
                        <p className="text-sm text-gray-600">{exercise.categoria}</p>
                        {exercise.descripcion && <p className="text-xs text-gray-500 mt-1">{exercise.descripcion}</p>}
                      </div>
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">Agregar</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-center pt-4 border-t">
              <Button onClick={() => setShowNewExerciseForm(true)} variant="outline" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Crear Nuevo Ejercicio
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Exercise Form Dialog */}
      <Dialog open={showNewExerciseForm} onOpenChange={setShowNewExerciseForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Ejercicio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Nombre del Ejercicio *</label>
                <Input
                  value={newExerciseForm.nombre}
                  onChange={(e) => setNewExerciseForm({...newExerciseForm, nombre: e.target.value})}
                  placeholder="Ej: Press de banca"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Categoría *</label>
                <Select value={newExerciseForm.categoria} onValueChange={(v) => setNewExerciseForm({...newExerciseForm, categoria: v})}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                  <SelectContent>
                    {(categories || []).map(cat => (
                      <SelectItem key={String(cat.id)} value={String(cat.name)}>{String(cat.name)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Descripción</label>
              <Input
                value={newExerciseForm.descripcion}
                onChange={(e) => setNewExerciseForm({...newExerciseForm, descripcion: e.target.value})}
                placeholder="Descripción del ejercicio"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Músculos Involucrados</label>
                <Input
                  value={newExerciseForm.musculosObjetivo}
                  onChange={(e) => setNewExerciseForm({...newExerciseForm, musculosObjetivo: e.target.value})}
                  placeholder="Ej: Pectorales, Tríceps (separados por coma)"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Equipamiento</label>
                <Select value={newExerciseForm.equipamiento} onValueChange={(v) => setNewExerciseForm({...newExerciseForm, equipamiento: v})}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar equipamiento" /></SelectTrigger>
                  <SelectContent>
                    {(equipments || []).map(eq => (
                      <SelectItem key={String(eq.id)} value={String(eq.name)}>{String(eq.name)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Nivel de Dificultad</label>
              <Select value={newExerciseForm.nivelDificultad} onValueChange={(value) => setNewExerciseForm({...newExerciseForm, nivelDificultad: value as any})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Principiante">Principiante</SelectItem>
                  <SelectItem value="Intermedio">Intermedio</SelectItem>
                  <SelectItem value="Avanzado">Avanzado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleNewExerciseSubmit} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
                Crear y Agregar a Rutina
              </Button>
              <Button variant="outline" onClick={() => setShowNewExerciseForm(false)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DayRoutine;
