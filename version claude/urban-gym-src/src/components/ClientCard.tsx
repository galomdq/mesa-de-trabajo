
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Client {
  id: string;
  nombre: string;
  documento: string;
  email: string;
  fechaIngreso: string;
  hasActiveRoutine: boolean;
}

interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, onEdit }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 border-orange-100 hover:border-orange-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{client.nombre}</h3>
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
          onClick={() => onEdit(client)}
          variant="outline"
          className="w-full"
        >
          <Eye className="h-4 w-4 mr-2" />
          Ver Rutinas
        </Button>
      </CardContent>
    </Card>
  );
};

export default ClientCard;
