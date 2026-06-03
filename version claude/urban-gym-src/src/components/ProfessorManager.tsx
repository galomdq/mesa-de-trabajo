import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, ArrowLeft, Search, Mail, Phone, User } from 'lucide-react';
import { useIndexedDBProfessors, Professor } from '@/hooks/useIndexedDBProfessors';
import { useToast } from '@/hooks/use-toast';

interface ProfessorManagerProps {
  onBack: () => void;
}

const ProfessorManager: React.FC<ProfessorManagerProps> = ({ onBack }) => {
  const { professors, saveProfessor, updateProfessor, deleteProfessor, isLoading } = useIndexedDBProfessors();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    especialidad: [] as string[],
    certificaciones: [] as string[]
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
      apellido: '',
      email: '',
      telefono: '',
      especialidad: [],
      certificaciones: []
    });
    setEditingProfessor(null);
  };

  const handleSubmit = async () => {
    if (!formData.nombre.trim() || !formData.apellido.trim()) {
      toast({
        title: "Error",
        description: "Nombre y apellido son obligatorios",
        variant: "destructive"
      });
      return;
    }

    // Validar email si se proporciona
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        title: "Error",
        description: "Email inválido",
        variant: "destructive"
      });
      return;
    }

    const professorData = {
      ...formData,
      activo: true
    };

    let success = false;
    if (editingProfessor) {
      success = await updateProfessor(editingProfessor.id, professorData);
    } else {
      success = await saveProfessor(professorData);
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
      apellido: professor.apellido,
      email: professor.email || '',
      telefono: professor.telefono || '',
      especialidad: professor.especialidad || [],
      certificaciones: professor.certificaciones || []
    });
    setShowForm(true);
  };

  const toggleEspecialidad = (esp: string) => {
    setFormData(prev => ({
      ...prev,
      especialidad: prev.especialidad.includes(esp)
        ? prev.especialidad.filter(e => e !== esp)
        : [...prev.especialidad, esp]
    }));
  };

  const addCertificacion = () => {
    const cert = prompt('Ingrese el nombre de la certificación:');
    if (cert && cert.trim()) {
      setFormData(prev => ({
        ...prev,
        certificaciones: [...prev.certificaciones, cert.trim()]
      }));
    }
  };

  const removeCertificacion = (cert: string) => {
    setFormData(prev => ({
      ...prev,
      certificaciones: prev.certificaciones.filter(c => c !== cert)
    }));
  };

  const handleDelete = async (professor: Professor) => {
    if (window.confirm(`¿Estás seguro de eliminar a "${professor.nombre} ${professor.apellido}"?`)) {
      const success = await deleteProfessor(professor.id);
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
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProfessor ? 'Editar Profesor' : 'Nuevo Profesor'}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Datos Personales */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-gray-700">Datos Personales</h3>
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
                  </div>

                  {/* Contacto */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-gray-700">Información de Contacto</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Email</label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="email@ejemplo.com"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Teléfono</label>
                        <Input
                          value={formData.telefono}
                          onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                          placeholder="123-456-7890"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Especialidades */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-gray-700">Especialidades</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {specialties.map((esp) => (
                        <div
                          key={esp}
                          onClick={() => toggleEspecialidad(esp)}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            formData.especialidad.includes(esp)
                              ? 'bg-orange-100 border-orange-500 text-orange-700'
                              : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                              formData.especialidad.includes(esp)
                                ? 'bg-orange-500 border-orange-500'
                                : 'border-gray-300'
                            }`}>
                              {formData.especialidad.includes(esp) && (
                                <div className="w-2 h-2 bg-white rounded-sm" />
                              )}
                            </div>
                            <span className="text-sm">{esp}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Certificaciones */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-700">Certificaciones</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addCertificacion}
                        className="flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Agregar
                      </Button>
                    </div>
                    {formData.certificaciones.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {formData.certificaciones.map((cert, idx) => (
                          <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                            {cert}
                            <button
                              type="button"
                              onClick={() => removeCertificacion(cert)}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No hay certificaciones agregadas</p>
                    )}
                  </div>

                  {/* Botones */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button onClick={handleSubmit} className="flex-1 bg-orange-500 hover:bg-orange-600">
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
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <User className="h-5 w-5 text-orange-500" />
                        <h3 className="font-semibold text-lg">
                          {professor.nombre} {professor.apellido}
                        </h3>
                      </div>
                      
                      <div className="space-y-2">
                        {/* Contacto */}
                        {(professor.email || professor.telefono) && (
                          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                            {professor.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span>{professor.email}</span>
                              </div>
                            )}
                            {professor.telefono && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span>{professor.telefono}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Especialidades */}
                        {professor.especialidad && professor.especialidad.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {professor.especialidad.map((esp, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                {esp}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Certificaciones */}
                        {professor.certificaciones && professor.certificaciones.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {professor.certificaciones.map((cert, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {cert}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <p className="text-xs text-gray-400 mt-2">
                          Ingresó: {new Date(professor.fechaIngreso).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
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