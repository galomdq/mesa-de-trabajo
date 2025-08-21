import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Edit, User, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useClients } from '@/hooks/useClients';
import { useToast } from '@/hooks/use-toast';

interface ClientManagerProps {
  onBack: () => void;
}

const ClientManager: React.FC<ClientManagerProps> = ({ onBack }) => {
  const { clients, saveClient, updateClient, deleteClient } = useClients();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    numeroCliente: '',
    nombre: '',
    documento: '',
    email: '',
    memo: ''
  });

  const filteredClients = clients.filter(client => 
    client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.documento.includes(searchTerm)
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.numeroCliente.trim() || !formData.nombre.trim() || !formData.documento.trim()) {
      toast({
        title: "Error",
        description: "El número de cliente, nombre y documento son obligatorios",
        variant: "destructive"
      });
      return;
    }

    // Verificar documento duplicado
    const documentExists = clients.some(client => 
      client.documento === formData.documento && client.id !== editingClient?.id
    );

    if (documentExists) {
      toast({
        title: "Error",
        description: "Ya existe un cliente con ese documento",
        variant: "destructive"
      });
      return;
    }

    let success = false;
    if (editingClient) {
      success = updateClient(editingClient.id, formData);
    } else {
      success = saveClient(formData);
    }

    if (success) {
      toast({
        title: "Éxito",
        description: editingClient ? "Cliente actualizado correctamente" : "Cliente guardado correctamente"
      });
      handleCloseDialog();
    } else {
      toast({
        title: "Error",
        description: "No se pudo guardar el cliente",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (client: any) => {
    setEditingClient(client);
    setFormData({
      numeroCliente: client.numeroCliente || '',
      nombre: client.nombre,
      documento: client.documento,
      email: client.email || '',
      memo: client.memo || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      const success = deleteClient(id);
      if (success) {
        toast({
          title: "Éxito",
          description: "Cliente eliminado correctamente"
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el cliente",
          variant: "destructive"
        });
      }
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingClient(null);
    setFormData({
      numeroCliente: '',
      nombre: '',
      documento: '',
      email: '',
      memo: ''
    });
  };

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
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h1>
            <p className="text-gray-600">Administra los clientes del gimnasio</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600">
              <Plus className="h-4 w-4" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="numeroCliente">Número de Cliente</Label>
                <Input
                  id="numeroCliente"
                  name="numeroCliente"
                  value={formData.numeroCliente}
                  onChange={handleInputChange}
                  placeholder="001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre Completo</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Apellido, Nombre"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="documento">Documento</Label>
                <Input
                  id="documento"
                  name="documento"
                  value={formData.documento}
                  onChange={handleInputChange}
                  placeholder="12345678"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (opcional)</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="cliente@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="memo">Notas médicas/lesiones (opcional)</Label>
                <Textarea
                  id="memo"
                  name="memo"
                  value={formData.memo}
                  onChange={handleInputChange}
                  placeholder="Lesión en rodilla derecha, evitar sentadillas..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600">
                  {editingClient ? 'Actualizar' : 'Guardar'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por nombre o documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>


      {/* Clients List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => (
          <Card key={client.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{client.nombre}</h3>
                    <p className="text-sm text-gray-600">DNI: {client.documento}</p>
                  </div>
                </div>
                <Badge 
                  variant={client.hasActiveRoutine ? "default" : "secondary"}
                  className={client.hasActiveRoutine ? "bg-green-100 text-green-700" : ""}
                >
                  {client.hasActiveRoutine ? "Activo" : "Sin rutina"}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(client)}
                className="w-full"
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-8">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">
            {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ClientManager;