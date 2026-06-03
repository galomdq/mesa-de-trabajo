
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ArrowLeft,
  Search,
  Plus,
  Edit,
  Copy,
  Trash2,
  Calendar,
  User,
  Dumbbell
} from 'lucide-react';
import { useLocalRoutines } from '@/hooks/useLocalRoutines';
import type { LocalRoutine } from '@/hooks/useLocalRoutines';

interface TemplateManagerProps {
  onBack: () => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTemplates, setFilteredTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const { templates, deleteTemplate } = useLocalRoutines();

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = templates.filter(template =>
        template.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTemplates(filtered);
    } else {
      setFilteredTemplates(templates);
    }
  }, [searchTerm, templates]);

  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta plantilla?')) {
      const result = await deleteTemplate(templateId);
      if (result.success) {
        alert('Plantilla eliminada exitosamente');
      } else {
        alert(result.error || 'Error al eliminar la plantilla');
      }
    }
  };

  const countExercises = (template: any) => {
    let total = 0;
    Object.values(template.routine.dias).forEach((day: any) => {
      total + day.entradaCalor.length + day.entrenamiento.length;
    });
    return total;
  };

  const countDaysWithExercises = (template: any) => {
    let count = 0;
    Object.values(template.routine.dias).forEach((day: any) => {
      if (day.entradaCalor.length > 0 || day.entrenamiento.length > 0) {
        count++;
      }
    });
    return count;
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
              <h1 className="text-2xl font-bold text-gray-900">
                Plantillas de Rutinas
              </h1>
              <p className="text-gray-600">
                Gestiona y edita las plantillas de rutinas del gimnasio
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Plantillas</CardTitle>
                <Dumbbell className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{templates.length}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Plantillas Encontradas</CardTitle>
                <Search className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{filteredTemplates.length}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Promedio Ejercicios</CardTitle>
                <Calendar className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {templates.length > 0 ? Math.round(templates.reduce((acc, t) => acc + countExercises(t), 0) / templates.length) : 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <Search className="h-5 w-5" />
                Buscar Plantillas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Buscar por nombre de plantilla o profesor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 text-lg border-orange-200 focus:border-orange-500"
              />
            </CardContent>
          </Card>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-orange-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                  <div className="flex-1">
                      <CardTitle className="text-lg text-orange-700 mb-2">
                        {template.nombre || 'Sin nombre'}
                      </CardTitle>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Creada: {new Date(template.created_at).toLocaleDateString()}</span>
                        </div>
                        {template.comentarios && (
                          <p className="text-sm text-gray-500 italic mt-1 line-clamp-2">
                            {template.comentarios}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Stats */}
                    <div className="flex gap-4">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Dumbbell className="h-3 w-3" />
                        {countExercises(template)} ejercicios
                      </Badge>
                      <Badge variant="outline">
                        {countDaysWithExercises(template)} días
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Dialog open={showDetails && selectedTemplate?.id === template.id} onOpenChange={(open) => {
                        setShowDetails(open);
                        if (open) setSelectedTemplate(template);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1">
                            Ver Detalles
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{selectedTemplate?.nombre}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <strong>Fecha:</strong> {selectedTemplate ? new Date(selectedTemplate.created_at).toLocaleDateString() : ''}
                              </div>
                            </div>
                            {selectedTemplate?.comentarios && (
                              <div className="bg-orange-50 border border-orange-100 rounded-md p-3 text-sm text-gray-700">
                                <p className="font-medium text-orange-700 mb-1">Comentarios</p>
                                <p className="whitespace-pre-wrap">{selectedTemplate.comentarios}</p>
                              </div>
                            )}
                            
                            {selectedTemplate && Object.entries(selectedTemplate.routine.dias).map(([dayKey, dayData]: [string, any], index) => {
                              const totalExercises = dayData.entradaCalor.length + dayData.entrenamiento.length;
                              if (totalExercises === 0) return null;
                              
                              return (
                                <div key={dayKey} className="border rounded p-4">
                                  <h4 className="font-semibold mb-2">Día {index + 1}</h4>
                                  
                                  {dayData.entradaCalor.length > 0 && (
                                    <div className="mb-3">
                                      <h5 className="text-sm font-medium text-orange-600 mb-1">Entrada en Calor</h5>
                                      <div className="space-y-1">
                                        {dayData.entradaCalor.map((exercise, idx) => (
                                          <div key={idx} className="text-sm text-gray-600">
                                            {exercise.ejercicio} - {exercise.series} series x {exercise.repeticiones}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {dayData.entrenamiento.length > 0 && (
                                    <div>
                                      <h5 className="text-sm font-medium text-orange-600 mb-1">Entrenamiento</h5>
                                      <div className="space-y-1">
                                        {dayData.entrenamiento.map((exercise, idx) => (
                                          <div key={idx} className="text-sm text-gray-600">
                                            {exercise.ejercicio} - {exercise.series} series x {exercise.repeticiones}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">
                {searchTerm ? 'No se encontraron plantillas' : 'No hay plantillas creadas'}
              </p>
              {!searchTerm && (
                <p className="text-sm text-gray-500 mt-2">
                  Las plantillas se crean desde las rutinas de los clientes
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateManager;
