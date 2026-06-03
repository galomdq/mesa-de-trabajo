
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Users, Dumbbell, User, Eye, Clock, X } from 'lucide-react';
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
  const restoredView = sessionStorage.getItem('gym_restore_view');
  if (restoredView) sessionStorage.removeItem('gym_restore_view');
  const [selectedView, setSelectedView] = useState(restoredView || 'dashboard');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedProfessor, setSelectedProfessor] = useState<string>('all');
  const [supervisorSearchTerm, setSupervisorSearchTerm] = useState('');
  const [supervisorTab, setSupervisorTab] = useState('dashboard');
  const { clients, isLoading, searchClients, updateClient } = useHybridClients();
  const { professors } = useIndexedDBProfessors();
  const { routines, refreshRoutines, deleteRoutine } = useLocalRoutines();
  const [searchResults, setSearchResults]   = useState<any[]>([]);
  const [isSearching, setIsSearching]       = useState(false);
  const [recentClients, setRecentClients]   = useState<any[]>([]);
  const [newClientsThisWeek, setNewClientsThisWeek] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Recientes y stats — solo se recalcula cuando cambia clients, NO con searchTerm ──
  useEffect(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const todayEnd   = todayStart + 86400000; // +24hs
    const sortedByAccess = [...clients]
      .filter(c => {
        if (!c.last_routine_access) return false;
        const t = new Date(c.last_routine_access).getTime();
        return t >= todayStart && t < todayEnd;
      })
      .sort((a, b) => new Date(b.last_routine_access!).getTime() - new Date(a.last_routine_access!).getTime());
    setRecentClients(sortedByAccess);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    setNewClientsThisWeek(
      clients.filter(c => new Date(c.fecha_ingreso) >= oneWeekAgo).length
    );
  }, [clients]);

  // ── Búsqueda con debounce 300ms usando IndexedDB ──────────────────────────
  const runSearch = useCallback(async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) { setSearchResults([]); setIsSearching(false); return; }
    setIsSearching(true);
    try {
      const found = await searchClients(trimmed);
      const sorted = found
        .slice()
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
      setSearchResults(sorted.slice(0, 50));
    } catch { setSearchResults([]); }
    finally { setIsSearching(false); }
  }, [searchClients]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchTerm.trim()) { setSearchResults([]); setIsSearching(false); return; }
    setIsSearching(true);
    debounceRef.current = setTimeout(() => runSearch(searchTerm), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchTerm, runSearch]);

  // Elimina rutinas duplicadas — conserva la más reciente por cliente
  const removeDuplicateRoutines = async () => {
    const seen = new Map<string, { id: string; date: string }>();
    const toDelete: string[] = [];
    for (const r of routines) {
      const existing = seen.get(r.client_id);
      if (!existing) {
        seen.set(r.client_id, { id: r.id, date: r.updated_at || r.created_at });
      } else {
        // Conservar la más reciente, eliminar la más vieja
        if ((r.updated_at || r.created_at) > existing.date) {
          toDelete.push(existing.id);
          seen.set(r.client_id, { id: r.id, date: r.updated_at || r.created_at });
        } else {
          toDelete.push(r.id);
        }
      }
    }
    for (const id of toDelete) await deleteRoutine(id);
    await refreshRoutines();
    return toDelete.length;
  };

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
            onRoutineSaved={async (clientId) => {
              await updateClient(clientId, { has_active_routine: true });
              await refreshRoutines();
            }}
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
      
      // Ordenar por fecha descendente — las más nuevas primero
      filtered.sort((a, b) =>
        new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
      );
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
                  {routines.length !== new Set(routines.map(r => r.client_id)).size && (
                    <button
                      onClick={async () => {
                        const removed = await removeDuplicateRoutines();
                        alert(`Se eliminaron ${removed} rutina${removed !== 1 ? 's' : ''} duplicada${removed !== 1 ? 's' : ''}.`);
                      }}
                      className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded px-2 py-1"
                    >
                      Limpiar duplicados ({routines.length - new Set(routines.map(r => r.client_id)).size})
                    </button>
                  )}
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

          {/* Layout de dos columnas: 60% búsqueda / 40% recientes */}
          <div className="flex gap-6 items-start">

            {/* ── Columna izquierda: Búsqueda (60%) ── */}
            <div className="w-[60%] flex-shrink-0">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-orange-700">
                    <Search className="h-5 w-5" />
                    Búsqueda de Clientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Campo de búsqueda */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      autoFocus
                      placeholder="Buscar por nombre, apellido o DNI..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-10 h-12 text-lg border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => { setSearchTerm(''); setSearchResults([]); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Estado */}
                  <div className="mt-2 h-5 text-sm text-gray-400">
                    {!searchTerm.trim() && 'Ingresá nombre, apellido o DNI para buscar'}
                    {searchTerm && isSearching && 'Buscando...'}
                    {searchTerm && !isSearching && searchResults.length > 0 &&
                      `${searchResults.length}${searchResults.length === 50 ? '+' : ''} resultado${searchResults.length !== 1 ? 's' : ''} — orden alfabético`}
                    {searchTerm && !isSearching && searchResults.length === 0 && 'Sin resultados'}
                  </div>

                  {/* Resultados con scroll interno */}
                  {searchTerm && (
                    <div className="mt-3 overflow-y-auto max-h-[calc(100vh-320px)]">
                      {isSearching ? (
                        <div className="text-center py-10">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto" />
                          <p className="mt-2 text-gray-400 text-sm">Buscando...</p>
                        </div>
                      ) : searchResults.length > 0 ? (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-gray-500 text-xs uppercase">
                              <th className="text-left py-2 font-medium">Cliente</th>
                              <th className="text-left py-2 font-medium">Documento</th>
                              <th className="text-left py-2 font-medium">Estado</th>
                              <th className="text-center py-2 font-medium">Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {searchResults.map((client) => (
                              <tr key={client.id} className="border-b last:border-0 hover:bg-orange-50 transition-colors">
                                <td className="py-2.5 font-medium text-gray-900">{client.nombre}</td>
                                <td className="py-2.5 text-gray-500">{client.documento}</td>
                                <td className="py-2.5">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    client.has_active_routine
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-500'
                                  }`}>
                                    {client.has_active_routine ? 'Con rutina' : 'Sin rutina'}
                                  </span>
                                </td>
                                <td className="py-2.5 text-center">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleClientSelect(client.id)}
                                    className="h-7 text-xs"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    Ver Rutinas
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="text-center py-10">
                          <Users className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                          <p className="text-gray-400 text-sm">No se encontraron clientes</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Estado vacío */}
                  {!searchTerm && (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                      <Search className="h-12 w-12 mb-3" />
                      <p className="text-sm">Usá el buscador para encontrar un socio</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── Columna derecha: Últimas consultas (40%) ── */}
            <div className="flex-1">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-orange-700">
                    <Clock className="h-5 w-5" />
                    Últimas Consultas
                    {recentClients.length > 0 && (
                      <span className="ml-auto text-xs font-normal text-gray-400">
                        hoy — {recentClients.length} consulta{recentClients.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {recentClients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                      <Clock className="h-10 w-10 mb-3" />
                      <p className="text-sm">Sin consultas hoy</p>
                    </div>
                  ) : (
                    <ul className="divide-y">
                      {recentClients.slice(0, 10).map((client, idx) => (
                        <li
                          key={client.id}
                          className="flex items-center justify-between px-4 py-3 hover:bg-orange-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs text-gray-300 font-mono w-4 flex-shrink-0">{idx + 1}</span>
                            <span className="font-medium text-gray-800 text-sm truncate">{client.nombre}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleClientSelect(client.id)}
                            className="h-7 text-xs flex-shrink-0 ml-2"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver Rutinas
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
