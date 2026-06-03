import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, User, Mail, Phone, Hash, Calendar, MessageSquare } from 'lucide-react';
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
  const [photoError, setPhotoError] = useState(false);
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
      toast({ title: "Cliente actualizado", description: "Los datos se guardaron correctamente" });
      onSave();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo actualizar el cliente", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2 flex-shrink-0">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Ficha del Cliente</h1>
      </div>

      {/* Layout dos columnas */}
      <div className="flex gap-6 items-start max-w-5xl">

        {/* Columna izquierda: foto 640x480 → mostrada a la mitad: 320x240 */}
        <div className="flex-shrink-0">
          <div
            className="rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center shadow-sm"
            style={{ width: '320px', height: '240px' }}
          >
            {client.numero_cliente && !photoError ? (
              <img
                src={`/bmp/${client.numero_cliente}.jpg`}
                alt={client.nombre}
                className="w-full h-full object-cover"
                onError={() => setPhotoError(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-300 gap-2">
                <User className="h-16 w-16" strokeWidth={1} />
                <span className="text-xs text-gray-400">Sin foto</span>
              </div>
            )}
          </div>
          <div className="mt-2 text-center">
            <span className="text-xs text-gray-400">Socio</span>
            <span className="ml-1 text-sm font-semibold text-orange-600">#{client.numero_cliente}</span>
          </div>
        </div>

        {/* Columna derecha: datos */}
        <div className="flex-1">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Datos fijos */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Información del Socio</h2>

              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-orange-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Nombre completo</p>
                  <p className="text-base font-semibold text-gray-900 leading-tight">{client.nombre}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Hash className="h-4 w-4 text-orange-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Documento</p>
                    <p className="text-sm font-medium text-gray-800">{client.documento}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-orange-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Fecha de ingreso</p>
                    <p className="text-sm font-medium text-gray-800">
                      {new Date(client.fecha_ingreso).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contacto editable */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Contacto</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    <Mail className="h-3 w-3" /> Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                    placeholder="cliente@email.com"
                    className="h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="telefono" className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    <Phone className="h-3 w-3" /> Teléfono
                  </Label>
                  <Input
                    id="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData(p => ({ ...p, telefono: e.target.value }))}
                    placeholder="Número de teléfono"
                    className="h-9"
                  />
                </div>
              </div>
            </div>

            {/* Comentarios */}
            <div className="bg-amber-50 rounded-xl border border-amber-200 shadow-sm p-5">
              <Label htmlFor="comentarios" className="flex items-center gap-1 text-xs text-amber-700 font-semibold mb-2">
                <MessageSquare className="h-3 w-3" /> Comentarios / Lesiones
              </Label>
              <Textarea
                id="comentarios"
                value={formData.comentarios}
                onChange={(e) => setFormData(p => ({ ...p, comentarios: e.target.value }))}
                placeholder="Lesiones, observaciones, restricciones..."
                rows={3}
                className="bg-white text-sm resize-none"
              />
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <Button type="submit" disabled={isLoading} className="bg-orange-500 hover:bg-orange-600 flex items-center gap-2">
                <Save className="h-4 w-4" />
                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
              <Button type="button" variant="outline" onClick={onBack}>
                Cancelar
              </Button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

export default ClientEditForm;
