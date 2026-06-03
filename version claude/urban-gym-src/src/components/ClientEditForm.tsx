import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIndexedDBClients, SupabaseClient } from '@/hooks/useIndexedDBClients';

interface ClientEditFormProps {
  client: SupabaseClient & { telefono?: string; comentarios?: string };
  onBack: () => void;
  onSave: () => void;
}

const ClientEditForm: React.FC<ClientEditFormProps> = ({ client, onBack, onSave }) => {
  const { toast } = useToast();
  const { updateClient } = useIndexedDBClients();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: client.email || '',
    telefono: client.telefono || '',
    comentarios: client.comentarios || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateClient(client.id, {
        email: formData.email || null,
        telefono: formData.telefono || null,
        comentarios: formData.comentarios || null
      });

      toast({
        title: "Cliente actualizado",
        description: "Los datos del cliente se han guardado correctamente",
        variant: "default"
      });

      onSave();
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el cliente",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Cliente</h1>
          <p className="text-gray-600">Modifica la información del cliente</p>
        </div>
      </div>

      {/* Client Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-orange-600" />
            </div>
            Información del Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Read-only fields */}
            <div>
              <Label>Nombre Completo</Label>
              <Input 
                value={client.nombre} 
                disabled 
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <Label>Documento</Label>
              <Input 
                value={client.documento} 
                disabled 
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <Label>Número de Cliente</Label>
              <Input 
                value={client.numero_cliente} 
                disabled 
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <Label>Fecha de Ingreso</Label>
              <Input 
                value={new Date(client.fecha_ingreso).toLocaleDateString()} 
                disabled 
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editable Form */}
      <Card>
        <CardHeader>
          <CardTitle>Información Editable</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="cliente@email.com"
                />
              </div>
              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => handleChange('telefono', e.target.value)}
                  placeholder="Número de teléfono"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="comentarios">Comentarios</Label>
              <Textarea
                id="comentarios"
                value={formData.comentarios}
                onChange={(e) => handleChange('comentarios', e.target.value)}
                placeholder="Comentarios adicionales sobre el cliente..."
                rows={4}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientEditForm;