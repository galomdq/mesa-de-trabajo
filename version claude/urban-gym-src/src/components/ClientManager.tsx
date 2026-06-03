import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Edit, User, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useHybridClients, SupabaseClient } from '@/hooks/useHybridClients';
import ClientEditForm from './ClientEditForm';
import { useToast } from '@/hooks/use-toast';

interface ClientManagerProps {
  onBack: () => void;
}

const ClientManager: React.FC<ClientManagerProps> = ({ onBack }) => {
  const { 
    clients, 
    isLoading, 
    searchClients,
    localClientCount 
  } = useHybridClients();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClients, setFilteredClients] = useState<SupabaseClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<SupabaseClient | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  // Enhanced search using IndexedDB
  React.useEffect(() => {
    const performSearch = async () => {
      if (!searchTerm.trim()) {
        setFilteredClients(clients);
      } else {
        const results = await searchClients(searchTerm);
        setFilteredClients(results);
      }
    };

    performSearch();
  }, [clients, searchTerm, searchClients]);

  const handleEdit = (client: SupabaseClient) => {
    setSelectedClient(client);
    setShowEditForm(true);
  };

  const handleBackFromEdit = () => {
    setShowEditForm(false);
    setSelectedClient(null);
  };

  const handleSaveClient = () => {
    setShowEditForm(false);
    setSelectedClient(null);
    // Refresh clients list if needed
  };

  if (showEditForm && selectedClient) {
    return (
      <ClientEditForm 
        client={selectedClient} 
        onBack={handleBackFromEdit}
        onSave={handleSaveClient}
      />
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
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h1>
            <p className="text-gray-600">Administra los clientes del gimnasio</p>
          </div>
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          <div>Total: <strong>{clients.length}</strong> clientes</div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Almacenamiento local activo</span>
          </div>
        </div>
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
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Cargando clientes...</p>
        </div>
      ) : (
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
                    variant={client.has_active_routine ? "default" : "secondary"}
                    className={client.has_active_routine ? "bg-green-100 text-green-700" : ""}
                  >
                    {client.has_active_routine ? "Con rutina" : "Sin rutina"}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-2">
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
      )}

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