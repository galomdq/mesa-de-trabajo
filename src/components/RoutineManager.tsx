
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  User, 
  Save, 
  Mail, 
  Copy, 
  History, 
  ArrowLeft,
  Plus,
  Trash2,
  FileText
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import DayRoutine from './DayRoutine';
import { useRoutines } from '@/hooks/useClients';
import { useProfessors } from '@/hooks/useProfessors';
import type { Client, Exercise, DayRoutineData, Routine } from '@/hooks/useClients';

interface RoutineManagerProps {
  client: Client;
  onBack: () => void;
}

const RoutineManager: React.FC<RoutineManagerProps> = ({ client, onBack }) => {
  const [currentRoutine, setCurrentRoutine] = useState<Routine | null>(null);
  const [routineHistory, setRoutineHistory] = useState<Routine[]>([]);
  const { professors } = useProfessors();
  const [selectedProfessor, setSelectedProfessor] = useState('');
  const [activeDay, setActiveDay] = useState('dia1');
  const [showHistory, setShowHistory] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [clientEmail, setClientEmail] = useState(client.email);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState<Routine[]>([]);

  const { saveRoutine, getRoutinesByClient, getLastRoutineByClient, saveTemplate, getTemplates } = useRoutines();

  // Inicializar rutina vacía
  const initializeEmptyRoutine = (): Routine => ({
    id: '',
    clienteId: client.id,
    profesorId: '',
    profesorNombre: '',
    fechaCreacion: new Date().toISOString().split('T')[0],
    dias: {
      dia1: { entradaCalor: [], entrenamiento: [] },
      dia2: { entradaCalor: [], entrenamiento: [] },
      dia3: { entradaCalor: [], entrenamiento: [] },
      dia4: { entradaCalor: [], entrenamiento: [] },
      dia5: { entradaCalor: [], entrenamiento: [] }
    }
  });

  useEffect(() => {
    loadCurrentRoutine();
    loadRoutineHistory();
    loadTemplates();
  }, [client.id]);

  const loadTemplates = () => {
    const allTemplates = getTemplates();
    setTemplates(allTemplates);
  };

  const loadCurrentRoutine = () => {
    // Intentar cargar la última rutina del cliente
    const lastRoutine = getLastRoutineByClient(client.id);
    
    if (lastRoutine) {
      setCurrentRoutine(lastRoutine);
      setSelectedProfessor(lastRoutine.profesorId);
      console.log('Rutina cargada para el cliente:', lastRoutine);
    } else {
      // Si no hay rutina previa, inicializar una vacía
      const newRoutine = initializeEmptyRoutine();
      setCurrentRoutine(newRoutine);
      console.log('Nueva rutina inicializada para el cliente');
    }
  };

  const loadRoutineHistory = () => {
    const history = getRoutinesByClient(client.id);
    setRoutineHistory(history);
    console.log('Historial de rutinas cargado:', history);
  };

  const handleSaveRoutine = () => {
    if (!currentRoutine || !selectedProfessor) {
      alert('Por favor selecciona un profesor antes de guardar');
      return;
    }

    const professorData = professors.find(p => p.id === selectedProfessor);
    const professorFullName = professorData ? `${professorData.apellido}, ${professorData.nombre}` : 'Profesor no encontrado';

    const routineToSave = {
      ...currentRoutine,
      id: Date.now().toString(),
      profesorId: selectedProfessor,
      profesorNombre: professorFullName,
      fechaCreacion: new Date().toISOString().split('T')[0]
    };

    console.log('Guardando rutina:', routineToSave);
    const success = saveRoutine(routineToSave);
    if (success) {
      alert('Rutina guardada exitosamente');
      setCurrentRoutine(routineToSave);
      loadRoutineHistory(); // Recargar historial
    } else {
      alert('Error al guardar la rutina');
    }
  };

  const handleSaveAsTemplate = () => {
    if (!currentRoutine || !templateName.trim()) {
      alert('Por favor ingresa un nombre para la plantilla');
      return;
    }

    const success = saveTemplate(currentRoutine, templateName);
    if (success) {
      alert('Plantilla guardada exitosamente');
      setTemplateName('');
    } else {
      alert('Error al guardar la plantilla');
    }
  };

  const handleSendEmail = () => {
    if (!currentRoutine) {
      alert('No hay rutina para enviar');
      return;
    }

    console.log('Enviando rutina por email a:', clientEmail);
    alert(`Rutina enviada a ${clientEmail}`);
  };

  const updateDayRoutine = (day: string, section: 'entradaCalor' | 'entrenamiento', exercises: Exercise[]) => {
    if (!currentRoutine) return;

    setCurrentRoutine(prev => ({
      ...prev!,
      dias: {
        ...prev!.dias,
        [day]: {
          ...(prev!.dias as any)[day],
          [section]: exercises
        }
      }
    }));
  };

  const loadHistoryRoutine = (routine: Routine) => {
    setCurrentRoutine(routine);
    setSelectedProfessor(routine.profesorId);
    setShowHistory(false);
    alert('Rutina cargada desde el historial');
  };

  const loadTemplate = (template: Routine) => {
    // Crear nueva rutina basada en la plantilla
    const newRoutine = {
      ...template,
      id: '',
      clienteId: client.id,
      profesorId: selectedProfessor,
      profesorNombre: professors.find(p => p.id === selectedProfessor)?.apellido + ', ' + professors.find(p => p.id === selectedProfessor)?.nombre || '',
      fechaCreacion: new Date().toISOString().split('T')[0]
    };
    
    setCurrentRoutine(newRoutine);
    setShowTemplates(false);
    alert('Plantilla cargada exitosamente');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="outline" 
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div>
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Rutina de {client.nombre}
                  </h1>
                  <p className="text-gray-600">DNI: {client.documento}</p>
                  {currentRoutine?.id && (
                    <p className="text-sm text-green-600">
                      Última rutina: {currentRoutine.fechaCreacion} - {currentRoutine.profesorNombre}
                    </p>
                  )}
                </div>
                {client.memo && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 max-w-md">
                    <p className="text-sm font-medium text-amber-800 mb-1">Notas médicas:</p>
                    <p className="text-sm text-amber-700">{client.memo}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-orange-500" />
                <Select value={selectedProfessor} onValueChange={setSelectedProfessor}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Seleccionar profesor" />
                  </SelectTrigger>
                  <SelectContent>
                    {professors.map(prof => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.apellido}, {prof.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-500" />
                <Badge variant="outline">
                  {new Date().toLocaleDateString()}
                </Badge>
              </div>
            </div>

            <div className="flex gap-2">
              <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Usar Plantilla ({templates.length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Seleccionar Plantilla de Rutina</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {templates.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        No hay plantillas disponibles
                      </p>
                    ) : (
                      templates
                        .sort((a, b) => (a.templateName || '').localeCompare(b.templateName || ''))
                        .map((template) => (
                          <div key={template.id} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold">{template.templateName || 'Plantilla sin nombre'}</p>
                                <p className="text-sm text-gray-600">Creada: {template.fechaCreacion}</p>
                                <p className="text-sm text-gray-600">
                                  Ejercicios: {Object.values(template.dias).reduce((total, day) => 
                                    total + day.entradaCalor.length + day.entrenamiento.length, 0
                                  )}
                                </p>
                              </div>
                              <Button
                                onClick={() => loadTemplate(template)}
                                className="bg-orange-500 hover:bg-orange-600 text-white"
                              >
                                Usar Plantilla
                              </Button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showHistory} onOpenChange={setShowHistory}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Historial ({routineHistory.length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Historial de Rutinas - {client.nombre}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {routineHistory.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        No hay rutinas guardadas para este cliente
                      </p>
                    ) : (
                      routineHistory
                        .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime())
                        .map((routine) => (
                          <div key={routine.id} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold">Fecha: {routine.fechaCreacion}</p>
                                <p className="text-sm text-gray-600">Profesor: {routine.profesorNombre}</p>
                                <p className="text-sm text-gray-600">ID: {routine.id}</p>
                              </div>
                              <Button
                                onClick={() => loadHistoryRoutine(routine)}
                                className="bg-orange-500 hover:bg-orange-600 text-white"
                              >
                                Cargar Rutina
                              </Button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    Guardar como Plantilla
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Guardar como Plantilla</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Nombre de la plantilla (ej: Rutina rehabilitación rodilla)"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                    />
                    <Button onClick={handleSaveAsTemplate} className="w-full">
                      Guardar Plantilla
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Enviar por Email
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Enviar Rutina por Email</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      type="email"
                      placeholder="Email del cliente"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                    />
                    <Button onClick={handleSendEmail} className="w-full">
                      Enviar Rutina
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button 
                onClick={handleSaveRoutine}
                className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Guardar Rutina
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs for Days */}
        <Card>
          <CardHeader>
            <CardTitle>Rutina de Entrenamiento</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeDay} onValueChange={setActiveDay}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="dia1">Día 1</TabsTrigger>
                <TabsTrigger value="dia2">Día 2</TabsTrigger>
                <TabsTrigger value="dia3">Día 3</TabsTrigger>
                <TabsTrigger value="dia4">Día 4</TabsTrigger>
                <TabsTrigger value="dia5">Día 5</TabsTrigger>
              </TabsList>

              {['dia1', 'dia2', 'dia3', 'dia4', 'dia5'].map((day) => (
                <TabsContent key={day} value={day} className="mt-6">
                  {currentRoutine && (
                    <DayRoutine
                      day={day}
                      dayData={currentRoutine.dias[day as keyof typeof currentRoutine.dias]}
                      onUpdateDay={(section, exercises) => updateDayRoutine(day, section, exercises)}
                    />
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RoutineManager;
