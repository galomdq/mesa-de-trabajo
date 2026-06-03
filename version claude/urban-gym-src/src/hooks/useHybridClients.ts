// useHybridClients — wrapper 100% local sobre useIndexedDBClients.
// Mantiene la misma interfaz pública para no alterar los consumidores.
import { useIndexedDBClients, SupabaseClient } from './useIndexedDBClients';

export type { SupabaseClient } from './useIndexedDBClients';

export const useHybridClients = () => {
  const {
    clients,
    isLoading,
    searchClients,
    importClients: importClientsLocal,
    refreshClients,
    updateClient: updateLocalClient
  } = useIndexedDBClients();

  const importClients = async (clientsData: SupabaseClient[]) => {
    return await importClientsLocal(clientsData);
  };

  const refreshData = async () => {
    await refreshClients();
    return { success: true, message: 'Datos actualizados' };
  };

  const updateClient = async (id: string, updates: Partial<SupabaseClient>) => {
    return await updateLocalClient(id, updates);
  };

  return {
    clients,
    isLoading,
    searchClients,
    refreshData,
    importClients,
    updateClient,
    localClientCount: clients.length,
  };
};
