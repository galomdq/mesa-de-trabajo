
import React, { useState, useEffect } from 'react';
import { Search, Users, Dumbbell, User, Eye, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Sidebar from '@/components/Sidebar';
import ClientCard from '@/components/ClientCard';
import RoutineManager from '@/components/RoutineManager';
import ExerciseManager from '@/components/ExerciseManager';
import ProfessorManager from '@/components/ProfessorManager';
import ClientManager from '@/components/ClientManager';
import TemplateManager from '@/components/TemplateManager';
import ConfigurationManager from '@/components/ConfigurationManager';
import UserManager from '@/components/UserManager';
import { useHybridClients } from '@/hooks/useHybridClients';
import { useIndexedDBProfessors } from '@/hooks/useIndexedDBProfessors';
import { useLocalRoutines } from '@/hooks/useLocalRoutines';

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedView, setSelectedView] = useState('dashboard');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedProfessor, setSelectedProfessor] = useState<string>('all');
  const [supervisorSearchTerm, setSupervisorSearchTerm] = useState('');
  const [supervisorTab, setSupervisorTab] = useState('dashboard');
  const { clients, isLoading, updateClient } = useHybridClients();
  const { professors } = useIndexedDBProfessors();
  const { routines } = useLocalRoutines();
  const [filteredClients, setFilteredClients] = useState(clients);
  const [recentClients, setRecentClients] = useState<any[]>([]);
  const [newClientsThisWeek, setNewClientsThisWeek] = useState(0);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = clients.filter(client => 
        client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.documento.includes(searchTerm)
      );
      setFilteredClients(filtered);
    } else {
      setFilteredClients(clients);
    }
    
    // Load recent clients from local data
    const sortedByAccess = [...clients]
      .filter(c => c.last_routine_access)
      .sort((a, b) => {
        const aAccess = a.last_routine_access ? new Date(a.last_routine_access).getTime() : 0;
        const bAccess = b.last_routine_access ? new Date(b.last_routine_access).getTime() : 0;
        return bAccess - aAccess;
      })
      .slice(0, 10);
    setRecentClients(sortedByAccess);
    
    // Calculate new clients this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newClients = clients.filter(c => {
      const clientDate = new Date(c.fecha_ingreso);
      return clientDate >= oneWeekAgo;
    });
    setNewClientsThisWeek(newClients.length);
  }, [searchTerm, clients]);

  const handleClientSelect = async (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      // Update last_routine_access
      await updateClient(clientId, { last_routine_access: new Date().toISOString() });
      setSelectedClient(client);
      setSelectedView('rutinas');
    }
  };

  const handleBackFromRoutines = () => {
    setSelectedClient(null);
    setSelectedView('dashboard');
  };

  const handleBackToMain = () => {
    setSelectedView('dashboard');
  };

  // Si estamos en la vista de rutinas de un cliente específico
  if (selectedView === 'rutinas' && selectedClient) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar selectedView={selectedView} onViewChange={setSelectedView} />
        <div className="flex-1 ml-64">
          <RoutineManager 
            client={selectedClient} 
            onBack={handleBackFromRoutines}
          />
        </div>
      </div>
    );
  }

  // Vista de gestión de ejercicios
  if (selectedView === 'ejercicios') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar selectedView={selectedView} onViewChange={setSelectedView} />
        <div className="flex-1 ml-64">
          <ExerciseManager onBack={handleBackToMain} />
        </div>
      </div>
    );
  }


  // Vista de gestión de clientes
  if (selectedView === 'clientes') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar selectedView={selectedView} onViewChange={setSelectedView} />
        <div className="flex-1 ml-64">
          <ClientManager onBack={handleBackToMain} />
        </div>
      </div>
    );
  }

  // Vista de Supervisor
  if (selectedView === 'supervisor') {
    // Build routines with client names
    const allRoutines = routines.map(routine => {
      const client = clients.find(c => c.id === routine.client_id);
      return {
        ...routine,
        clienteId: routine.client_id,
        clienteNombre: client?.nombre || 'Cliente desconocido',
        profesorNombre: routine.profesor_nombre,
        fechaCreacion: routine.fecha_asignacion
      };
    });

    // Aplicar ambos filtros: búsqueda y profesor seleccionado
    const getFilteredRoutines = () => {
      let filtered = allRoutines;
      
      // Filtrar por profesor seleccionado
      if (selectedProfessor !== 'all') {
        filtered = filtered.filter(routine => routine.profesorNombre === selectedProfessor);
      }
      
      // Filtrar por término de búsqueda
      if (supervisorSearchTerm.trim()) {
        filtered = filtered.filter(routine =>
          routine.clienteNombre.toLowerCase().includes(supervisorSearchTerm.toLowerCase()) ||
          routine.profesorNombre.toLowerCase().includes(supervisorSearchTerm.toLowerCase())
        );
      }
      
      return filtered;
    };

    const filteredRoutines = getFilteredRoutines();

    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar selectedView={selectedView} onViewChange={setSelectedView} />
        <div className="flex-1 ml-64 p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Panel de Supervisor
            </h1>
            <p className="text-gray-600">
              Métricas, estadísticas y gestión del sistema.
            </p>
          </div>

          {/* Tabs Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setSupervisorTab('dashboard')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    supervisorTab === 'dashboard'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setSupervisorTab('profesores')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    supervisorTab === 'profesores'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Gestión de Profesores
                </button>
              </nav>
            </div>
          </div>

          {/* Dashboard Tab Content */}
          {supervisorTab === 'dashboard' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="border-l-4 border-l-orange-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
                    <Users className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{clients.length}</div>
                    <p className="text-xs text-gray-500">Clientes registrados</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Con Rutinas</CardTitle>
                    <Dumbbell className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {clients.filter(c => c.has_active_routine).length}
                    </div>
                    <p className="text-xs text-gray-500">Rutinas activas</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-gray-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sin Rutinas</CardTitle>
                    <User className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-600">
                      {clients.filter(c => !c.has_active_routine).length}
                    </div>
                    <p className="text-xs text-gray-500">Sin rutinas asignadas</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Nuevos esta semana</CardTitle>
                    <User className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{newClientsThisWeek}</div>
                    <p className="text-xs text-gray-500">Clientes nuevos</p>
                  </CardContent>
                </Card>
              </div>

              {/* Tabla de rutinas */}
              <Card>
                <CardHeader className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold">Control de Rutinas</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar por cliente o profesor..."
                      className="pl-10"
                      value={supervisorSearchTerm}
                      onChange={(e) => setSupervisorSearchTerm(e.target.value)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Filtro por profesor */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2">
                      <label htmlFor="professor-filter" className="text-sm font-medium text-gray-700">
                        Filtrar por Profesor:
                      </label>
                      <div className="w-64">
                        <Select value={selectedProfessor} onValueChange={setSelectedProfessor}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar profesor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos los profesores</SelectItem>
                            {professors.map((professor) => (
                              <SelectItem key={professor.id} value={`${professor.nombre} ${professor.apellido}`}>
                                {professor.nombre} {professor.apellido}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Profesor</TableHead>
                          <TableHead className="text-center">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRoutines.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                              {selectedProfessor === 'all' ? 'No hay rutinas registradas' : 'No hay rutinas para el profesor seleccionado'}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredRoutines.map((routine) => (
                            <TableRow key={routine.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium">
                                {new Date(routine.fechaCreacion).toLocaleDateString('es-ES')}
                              </TableCell>
                              <TableCell>{routine.clienteNombre}</TableCell>
                              <TableCell>{routine.profesorNombre}</TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const client = clients.find(c => c.id === routine.clienteId);
                                    if (client) {
                                      setSelectedClient(client);
                                      setSelectedView('rutinas');
                                    }
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver Rutina
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Profesores Tab Content */}
          {supervisorTab === 'profesores' && (
            <div className="bg-white rounded-lg">
              <ProfessorManager onBack={() => {}} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vista de gestión de plantillas de rutinas
  if (selectedView === 'plantillas') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar selectedView={selectedView} onViewChange={setSelectedView} />
        <div className="flex-1 ml-64">
          <TemplateManager onBack={handleBackToMain} />
        </div>
      </div>
    );
  }

  // Vista de configuración
  if (selectedView === 'configuracion') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar selectedView={selectedView} onViewChange={setSelectedView} />
        <div className="flex-1 ml-64 p-6">
          <ConfigurationManager />
        </div>
      </div>
    );
  }

  // Vista de usuarios
  if (selectedView === 'usuarios') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar selectedView={selectedView} onViewChange={setSelectedView} />
        <div className="flex-1 ml-64">
          <UserManager />
        </div>
      </div>
    );
  }

  // Vista Dashboard (por defecto)
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar selectedView={selectedView} onViewChange={setSelectedView} />
      
      <div className="flex-1 ml-64">
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Sistema de Rutinas - Gimnasio
            </h1>
            <p className="text-gray-600">
              Gestiona las rutinas de entrenamiento de tus clientes
            </p>
          </div>

          {/* Recent Clients Section */}
          {recentClients.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <Clock className="h-5 w-5" />
                  Últimas Consultas de Rutinas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Documento</TableHead>
                        <TableHead>Última Consulta</TableHead>
                        <TableHead className="text-center">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentClients.map((client) => (
                        <TableRow key={client.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{client.nombre}</TableCell>
                          <TableCell>{client.documento}</TableCell>
                          <TableCell>
                            {new Date(client.last_routine_access).toLocaleString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleClientSelect(client.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver Rutinas
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <Search className="h-5 w-5" />
                Búsqueda de Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre o documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 text-lg border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
              
              {/* Results Table */}
              {searchTerm && (
                <div className="mt-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Documento</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-center">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
                              <p className="mt-2 text-gray-600">Buscando...</p>
                            </TableCell>
                          </TableRow>
                        ) : filteredClients.length > 0 ? (
                          filteredClients.map((client) => (
                            <TableRow key={client.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium">{client.nombre}</TableCell>
                              <TableCell>{client.documento}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={client.has_active_routine ? "default" : "secondary"}
                                  className={client.has_active_routine ? "bg-green-100 text-green-700" : ""}
                                >
                                  {client.has_active_routine ? "Con rutina" : "Sin rutina"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleClientSelect(client.id)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver Rutinas
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8">
                              <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-600">No se encontraron clientes</p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
