import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2, Calendar, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { SupabaseClient } from '@/hooks/useIndexedDBClients';
import DayRoutine from './DayRoutine';
import { useLocalRoutines } from '@/hooks/useLocalRoutines';
import type { LocalRoutine, LocalExercise, LocalDayRoutineData } from '@/hooks/useLocalRoutines';

interface RoutineAssignmentProps {
  client: SupabaseClient;
  onBack: () => void;
}

interface ExerciseForm {
  exercise_id: string;
  dia: number;
  tipo: 'entrada_calor' | 'entrenamiento';
  series: string;
  repeticiones: string;
  observaciones: string;
  orden: number;
}

const RoutineAssignment: React.FC<RoutineAssignmentProps> = ({ client, onBack }) => {
  const { toast } = useToast();
  const { getRoutinesByClient, saveRoutine } = useLocalRoutines();
  
  const [currentRoutine, setCurrentRoutine] = useState<LocalRoutine | null>(null);
  const [routineHistory, setRoutineHistory] = useState<LocalRoutine[]>([]);
  const [selectedProfessor, setSelectedProfessor] = useState('');
  const [showNewRoutine, setShowNewRoutine] = useState(false);

  useEffect(() => {
    loadClientRoutines();
  }, [client.id]);

  const loadClientRoutines = async () => {
    const routines = await getRoutinesByClient(client.id);
    if (routines.length > 0) {
      setCurrentRoutine(routines[0]);
      setRoutineHistory(routines);
    } else {
      createNewRoutine();
    }
  };

  const createNewRoutine = () => {
    const newRoutine = {
      client_id: client.id,
      template_id: null,
      profesor_nombre: '',
      fecha_asignacion: new Date().toISOString().split('T')[0],
      fecha_vencimiento: null,
      activa: true,
      notas: null,
      dias: {
        dia1: { entradaCalor: [], entrenamiento: [] },
        dia2: { entradaCalor: [], entrenamiento: [] },
        dia3: { entradaCalor: [], entrenamiento: [] },
        dia4: { entradaCalor: [], entrenamiento: [] },
        dia5: { entradaCalor: [], entrenamiento: [] }
      }
    } as LocalRoutine;
    setCurrentRoutine(newRoutine);
    setShowNewRoutine(true);
  };

  const saveCurrentRoutine = async () => {
    if (!currentRoutine) return;
    
    if (!currentRoutine.profesor_nombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre del profesor es obligatorio",
        variant: "destructive"
      });
      return;
    }

    const result = await saveRoutine({
      client_id: currentRoutine.client_id,
      template_id: currentRoutine.template_id,
      profesor_nombre: currentRoutine.profesor_nombre,
      fecha_asignacion: currentRoutine.fecha_asignacion,
      fecha_vencimiento: currentRoutine.fecha_vencimiento,
      activa: currentRoutine.activa,
      notas: currentRoutine.notas,
      dias: currentRoutine.dias
    });
    
    if (result.success) {
      setRoutineHistory([result.routine!, ...routineHistory.filter(r => r.id !== currentRoutine.id)]);
      setShowNewRoutine(false);
      
      toast({
        title: "Rutina guardada",
        description: "La rutina se ha guardado exitosamente",
        variant: "default"
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "No se pudo guardar la rutina",
        variant: "destructive"
      });
    }
  };

  const updateDayRoutine = (day: string, section: 'entradaCalor' | 'entrenamiento', exercises: LocalExercise[]) => {
    if (!currentRoutine) return;

    setCurrentRoutine(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        dias: {
          ...prev.dias,
          [day]: {
            ...prev.dias[day as keyof typeof prev.dias],
            [section]: exercises
          }
        }
      };
    });
  };

  if (!currentRoutine) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Rutina</h1>
            <p className="text-gray-600">Cliente: {client.nombre}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Fecha: {new Date(currentRoutine.fecha_asignacion).toLocaleDateString('es-ES')}
          </div>
          {currentRoutine.profesor_nombre && (
            <Badge variant="outline" className="text-orange-600 border-orange-300">
              Profesor: {currentRoutine.profesor_nombre}
            </Badge>
          )}
        </div>
      </div>

      {/* Professor Selection */}
      {showNewRoutine && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Información de la Rutina</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="profesor">Profesor Asignado</Label>
              <Input
                id="profesor"
                value={currentRoutine.profesor_nombre}
                onChange={(e) => setCurrentRoutine(prev => ({
                  ...prev!,
                  profesor_nombre: e.target.value
                }))}
                placeholder="Nombre del profesor"
                required
              />
            </div>
            <Button onClick={saveCurrentRoutine} className="bg-orange-500 hover:bg-orange-600">
              Guardar Información
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Routine Days */}
      <Card>
        <CardHeader>
          <CardTitle>Rutina Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="dia1">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="dia1">Día 1</TabsTrigger>
              <TabsTrigger value="dia2">Día 2</TabsTrigger>
              <TabsTrigger value="dia3">Día 3</TabsTrigger>
              <TabsTrigger value="dia4">Día 4</TabsTrigger>
              <TabsTrigger value="dia5">Día 5</TabsTrigger>
            </TabsList>

            {['dia1', 'dia2', 'dia3', 'dia4', 'dia5'].map((day) => (
              <TabsContent key={day} value={day} className="mt-6">
                <DayRoutine
                  day={day}
                  dayData={currentRoutine.dias[day as keyof typeof currentRoutine.dias]}
                  onUpdateDay={(section, exercises) => updateDayRoutine(day, section, exercises)}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoutineAssignment;