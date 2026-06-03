import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, User, Search, X } from 'lucide-react';
import { useHybridClients, SupabaseClient } from '@/hooks/useHybridClients';
import ClientEditForm from './ClientEditForm';

interface ClientManagerProps {
  onBack: () => void;
}

const RESULTS_LIMIT = 50;

const ClientManager: React.FC<ClientManagerProps> = ({ onBack }) => {
  const { clients, isLoading, searchClients, localClientCount } = useHybridClients();
  const [searchTerm, setSearchTerm]         = useState('');
  const [displayedTerm, setDisplayedTerm]   = useState('');
  const [results, setResults]               = useState<SupabaseClient[]>([]);
  const [isSearching, setIsSearching]       = useState(false);
  const [selectedClient, setSelectedClient] = useState<SupabaseClient | null>(null);
  const [showEditForm, setShowEditForm]     = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Búsqueda con debounce de 300ms ──────────────────────────────────────────
  const runSearch = useCallback(async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) {
      setResults([]);
      setDisplayedTerm('');
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const found = await searchClients(trimmed);
      // Ordenar alfabéticamente por nombre
      const sorted = found
        .slice()
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
      setResults(sorted.slice(0, RESULTS_LIMIT));
      setDisplayedTerm(trimmed);
    } catch (err) {
      console.error('Error buscando clientes:', err);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchClients]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchTerm.trim()) {
      setResults([]);
      setDisplayedTerm('');
      setIsSearching(false);
      return;
    }
    setIsSearching(true); // muestra "buscando..." inmediatamente
    debounceRef.current = setTimeout(() => runSearch(searchTerm), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchTerm, runSearch]);

  const clearSearch = () => {
    setSearchTerm('');
    setResults([]);
    setDisplayedTerm('');
  };

  // ── Edición ──────────────────────────────────────────────────────────────────
  const handleEdit = (client: SupabaseClient) => {
    setSelectedClient(client);
    setShowEditForm(true);
  };

  if (showEditForm && selectedClient) {
    return (
      <ClientEditForm
        client={selectedClient}
        onBack={() => { setShowEditForm(false); setSelectedClient(null); }}
        onSave={() => { setShowEditForm(false); setSelectedClient(null); }}
      />
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  const hasSearch  = searchTerm.trim().length > 0;
  const hasResults = results.length > 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h1>
            <p className="text-gray-600">Administra los clientes del gimnasio</p>
          </div>
        </div>
        <div className="text-sm text-gray-600 space-y-1 text-right">
          <div>Total: <strong>{localClientCount.toLocaleString()}</strong> clientes</div>
          <div className="flex items-center gap-2 justify-end">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Almacenamiento local activo</span>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              autoFocus
              placeholder="Buscar por nombre, apellido o DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 h-11 text-base"
            />
            {hasSearch && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Estado de búsqueda */}
          <div className="mt-2 h-5 text-sm text-gray-500">
            {isLoading && !hasSearch && 'Cargando base de datos...'}
            {isSearching && 'Buscando...'}
            {!isSearching && hasResults && (
              <>
                <span className="font-medium text-gray-700">{results.length}</span>
                {results.length === RESULTS_LIMIT ? ` primeros resultados de muchos` : ` resultado${results.length !== 1 ? 's' : ''}`}
                {' '}para <span className="font-medium text-orange-600">"{displayedTerm}"</span>
                {results.length === RESULTS_LIMIT && ' — refiná la búsqueda para ver menos'}
              </>
            )}
            {!isSearching && hasSearch && !hasResults && !isLoading && (
              <span className="text-red-500">No se encontraron clientes para "{displayedTerm}"</span>
            )}
            {!hasSearch && !isLoading && (
              <span>Ingresá un nombre, apellido o DNI para buscar</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {isLoading && !hasSearch ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-3" />
          <p className="text-gray-500">Cargando clientes...</p>
        </div>
      ) : !hasSearch ? (
        // Estado vacío — instrucción
        <div className="text-center py-16">
          <Search className="h-14 w-14 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Usá el buscador para encontrar un socio</p>
          <p className="text-gray-300 text-sm mt-1">Podés buscar por nombre, apellido o número de DNI</p>
        </div>
      ) : isSearching ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-3" />
          <p className="text-gray-500">Buscando...</p>
        </div>
      ) : hasResults ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{client.nombre}</h3>
                      <p className="text-sm text-gray-500">DNI: {client.documento}</p>
                      {client.numero_cliente && (
                        <p className="text-xs text-gray-400">Socio #{client.numero_cliente}</p>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={client.has_active_routine ? 'default' : 'secondary'}
                    className={`flex-shrink-0 ${client.has_active_routine ? 'bg-green-100 text-green-700' : ''}`}
                  >
                    {client.has_active_routine ? 'Con rutina' : 'Sin rutina'}
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
      ) : (
        <div className="text-center py-16">
          <User className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No se encontraron clientes para "{displayedTerm}"</p>
          <p className="text-gray-400 text-sm mt-1">Probá con otro nombre o número de documento</p>
        </div>
      )}
    </div>
  );
};

export default ClientManager;
