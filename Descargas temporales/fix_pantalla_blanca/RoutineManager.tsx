
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
  FileText,
  Printer
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import DayRoutine from './DayRoutine';
import RoutinePrintView from './RoutinePrintView';
import { useLocalRoutines } from '@/hooks/useLocalRoutines';
import { useHybridClients } from '@/hooks/useHybridClients';
import { useIndexedDBProfessors } from '@/hooks/useIndexedDBProfessors';
import type { LocalRoutine, LocalExercise, LocalDayRoutineData } from '@/hooks/useLocalRoutines';

interface Client {
  id: string;
  nombre: string;
  documento: string;
  email?: string;
  comentarios?: string;
}

interface RoutineManagerProps {
  client: Client;
  onBack: () => void;
  onRoutineSaved?: (clientId: string) => void;
}

const RoutineManager: React.FC<RoutineManagerProps> = ({ client, onBack, onRoutineSaved }) => {
  const [currentRoutine, setCurrentRoutine] = useState<LocalRoutine | null>(null);
  const [routineHistory, setRoutineHistory] = useState<LocalRoutine[]>([]);
  const { professors } = useIndexedDBProfessors();
  const { updateClient } = useHybridClients();
  const [selectedProfessor, setSelectedProfessor] = useState('');
  const [activeDay, setActiveDay] = useState('dia1');
  const [showHistory, setShowHistory] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateComment, setTemplateComment] = useState('');
  const [clientEmail, setClientEmail] = useState(client.email || '');
  const [showTemplates, setShowTemplates] = useState(false);
  const [clientComments, setClientComments] = useState(client.comentarios || '');
  const [isDirty, setIsDirty] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const savedSnapshotRef = React.useRef<string>('');

  const { 
    routines, 
    templates, 
    saveRoutine, 
    getRoutinesByClient, 
    saveTemplate, 
    deleteTemplate 
  } = useLocalRoutines();

  // Inicializar rutina vacía
  const initializeEmptyRoutine = (): Omit<LocalRoutine, 'id' | 'created_at' | 'updated_at'> => ({
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
  });

  useEffect(() => {
    loadCurrentRoutine();
    loadRoutineHistory();
  }, [client.id]);

  const loadCurrentRoutine = async () => {
    const clientRoutines = await getRoutinesByClient(client.id);
    
    if (clientRoutines.length > 0) {
      const lastRoutine = clientRoutines[0];
      setCurrentRoutine(lastRoutine);
      setSelectedProfessor(lastRoutine.profesor_nombre);
      savedSnapshotRef.current = JSON.stringify({ dias: lastRoutine.dias, profesor: lastRoutine.profesor_nombre });
      setIsDirty(false);
      console.log('Rutina cargada para el cliente:', lastRoutine);
    } else {
      const newRoutine = initializeEmptyRoutine() as any;
      setCurrentRoutine(newRoutine);
      savedSnapshotRef.current = JSON.stringify({ dias: newRoutine.dias, profesor: '' });
      setIsDirty(false);
      console.log('Nueva rutina inicializada para el cliente');
    }
  };

  const loadRoutineHistory = async () => {
    const history = await getRoutinesByClient(client.id);
    setRoutineHistory(history);
    console.log('Historial de rutinas cargado:', history);
  };

  const handleSaveRoutine = async () => {
    if (!currentRoutine || !selectedProfessor) {
      alert('Por favor selecciona un profesor antes de guardar');
      return;
    }

    const professorFullName = selectedProfessor;

    const routineToSave = {
      client_id: client.id,
      template_id: null,
      profesor_nombre: professorFullName,
      fecha_asignacion: new Date().toISOString().split('T')[0],
      fecha_vencimiento: null,
      activa: true,
      notas: null,
      dias: currentRoutine.dias
    };

    const result = await saveRoutine(routineToSave);
    if (result.success) {
      if (onRoutineSaved) onRoutineSaved(client.id);
      alert('Rutina guardada exitosamente');
      setCurrentRoutine(result.routine!);
      savedSnapshotRef.current = JSON.stringify({ dias: result.routine!.dias, profesor: professorFullName });
      setIsDirty(false);
      loadRoutineHistory();
    } else {
      alert(result.error || 'Error al guardar la rutina');
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!currentRoutine || !templateName.trim()) {
      alert('Por favor ingresa un nombre para la plantilla');
      return;
    }

    const templateData = {
      nombre: templateName,
      descripcion: null,
      comentarios: templateComment.trim() || null,
      routine: currentRoutine as LocalRoutine
    };

    const result = await saveTemplate(templateData);
    if (result.success) {
      alert('Plantilla guardada exitosamente');
      setTemplateName('');
      setTemplateComment('');
    } else {
      alert(result.error || 'Error al guardar la plantilla');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = () => {
    if (!currentRoutine) {
      alert('No hay rutina para enviar');
      return;
    }

    console.log('Enviando rutina por email a:', clientEmail);
    alert(`Rutina enviada a ${clientEmail}`);
  };

  const updateDayRoutine = (day: string, section: 'entradaCalor' | 'entrenamiento', exercises: LocalExercise[]) => {
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
    setIsDirty(true);
  };

  const loadHistoryRoutine = (routine: LocalRoutine) => {
    setCurrentRoutine(routine);
    setSelectedProfessor(routine.profesor_nombre);
    setShowHistory(false);
    alert('Rutina cargada desde el historial');
  };

  const loadTemplate = (template: any) => {
    // Crear nueva rutina basada en la plantilla
    const newRoutine = {
      ...template.routine,
      client_id: client.id,
      profesor_nombre: selectedProfessor,
      fecha_asignacion: new Date().toISOString().split('T')[0]
    };
    
    setCurrentRoutine(newRoutine);
    setShowTemplates(false);
    alert('Plantilla cargada exitosamente');
  };

  const handleBack = () => {
    if (isDirty) {
      setShowExitDialog(true);
    } else {
      onBack();
    }
  };

  return (
    <>
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          {/* Una sola fila: Volver | nombre+DNI | foto | comentarios */}
          <div className="flex items-center gap-4 mb-4">

            {/* Botón volver */}
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>

            {/* Nombre y DNI */}
            <div className="flex-shrink-0" style={{width: "220px"}}>
              <h1 className="text-lg font-bold text-gray-900 leading-tight truncate">
                {client.nombre}
              </h1>
              <p className="text-gray-500 text-xs">DNI: {client.documento}</p>
              {currentRoutine?.id && (
                <p className="text-xs text-green-600 truncate">
                  {currentRoutine.fecha_asignacion} · {currentRoutine.profesor_nombre}
                </p>
              )}
            </div>

            {/* Foto */}
            <div className="flex-shrink-0 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center" style={{width: "120px", height: "120px"}}>
              {client.numero_cliente ? (
                <img
                  src={`/bmp/${client.numero_cliente}.jpg`}
                  alt={client.nombre}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`${client.numero_cliente ? 'hidden' : ''} flex items-center justify-center w-full h-full text-gray-300`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>

            {/* Comentarios */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 flex-shrink-0" style={{width: "380px", height: "120px"}}>
              <p className="text-xs font-medium text-amber-800 mb-1">Comentarios / Lesiones:</p>
              <Textarea
                placeholder="Ej: Lesión de rodilla..."
                value={clientComments}
                onChange={(e) => setClientComments(e.target.value)}
                onBlur={async () => {
                  await updateClient(client.id, { comentarios: clientComments });
                }}
                className="text-xs resize-none border-0 bg-transparent p-0 focus-visible:ring-0"
                style={{height: "80px", minHeight: "80px"}}
              />
            </div>

          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-orange-500" />
                <Select value={selectedProfessor} onValueChange={(v) => { setSelectedProfessor(v); setIsDirty(true); }}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Seleccionar profesor" />
                  </SelectTrigger>
                  <SelectContent>
                    {professors.map(prof => (
                      <SelectItem key={prof.id} value={`${prof.apellido}, ${prof.nombre}`}>
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
                        .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''))
                        .map((template) => (
                          <div key={template.id} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold">{template.nombre || 'Plantilla sin nombre'}</p>
                                <p className="text-sm text-gray-600">Creada: {template.created_at}</p>
                                {template.comentarios && (
                                  <p className="text-sm text-gray-500 italic mt-1">{template.comentarios}</p>
                                )}
                                <p className="text-sm text-gray-600">
                                  Ejercicios: {Object.values(template.routine.dias).reduce((total, day) => 
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
                        .sort((a, b) => new Date(b.fecha_asignacion).getTime() - new Date(a.fecha_asignacion).getTime())
                        .map((routine) => (
                          <div key={routine.id} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold">Fecha: {routine.fecha_asignacion}</p>
                                <p className="text-sm text-gray-600">Profesor: {routine.profesor_nombre}</p>
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
                    <Textarea
                      placeholder="Comentarios / características de la plantilla (opcional)"
                      value={templateComment}
                      onChange={(e) => setTemplateComment(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                    <Button onClick={handleSaveAsTemplate} className="w-full">
                      Guardar Plantilla
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4" />
                Imprimir Rutina
              </Button>

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

    {/* Vista de impresión — invisible en pantalla, visible solo al imprimir */}
    {currentRoutine && (
      <RoutinePrintView
        client={{
          nombre: client.nombre,
          documento: client.documento,
          numero_cliente: client.numero_cliente,
          comentarios: clientComments
        }}
        routine={currentRoutine}
      />
    )}
    {/* Diálogo de confirmación al salir con cambios sin guardar */}
    <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Salir sin guardar?</AlertDialogTitle>
          <AlertDialogDescription>
            Tenés cambios sin guardar en la rutina de <strong>{client.nombre}</strong>.
            Si salís ahora, se perderán todos los cambios realizados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Seguir editando</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={onBack}
          >
            Salir sin guardar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default RoutineManager;