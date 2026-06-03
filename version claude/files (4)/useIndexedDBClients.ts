import { useState, useEffect, useCallback } from 'react';

export interface SupabaseClient {
  id: string;
  numero_cliente: string;
  nombre: string;
  documento: string;
  email: string | null;
  telefono?: string | null;
  fecha_ingreso: string;
  has_active_routine: boolean;
  last_routine_access?: string | null;
  comentarios?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface IndexedDBConfig {
  dbName: string;
  version: number;
  storeName: string;
}

const DB_CONFIG: IndexedDBConfig = {
  dbName: 'GymApp',
  version: 3, // v3: agrega store "professors" (ver useIndexedDBProfessors)
  storeName: 'clients'
};

export const useIndexedDBClients = () => {
  const [clients, setClients] = useState<SupabaseClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Initialize IndexedDB
  const initDB = useCallback((): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_CONFIG.dbName, DB_CONFIG.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = (event.target as IDBOpenDBRequest).transaction!;
        
        // Create clients store if it doesn't exist
        if (!db.objectStoreNames.contains(DB_CONFIG.storeName)) {
          const store = db.createObjectStore(DB_CONFIG.storeName, { keyPath: 'id' });
          
          // Create indexes for faster searching
          store.createIndex('numero_cliente', 'numero_cliente', { unique: false });
          store.createIndex('nombre', 'nombre', { unique: false });
          store.createIndex('documento', 'documento', { unique: false });
          store.createIndex('search_text', 'search_text', { unique: false });
        } else if (event.oldVersion < 2) {
          // Migración v1 -> v2: Actualizar search_text para remover comas
          const store = transaction.objectStore(DB_CONFIG.storeName);
          const getAllRequest = store.getAll();
          
          getAllRequest.onsuccess = () => {
            const allClients = getAllRequest.result;
            allClients.forEach((client: any) => {
              const normalizedName = client.nombre.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
              client.search_text = `${normalizedName} ${client.documento} ${client.numero_cliente}`.toLowerCase();
              store.put(client);
            });
            console.log(`🔄 Actualizados ${allClients.length} clientes - búsqueda sin comas habilitada`);
          };
        }

        // v3: crear store de profesores (compartido con useIndexedDBProfessors)
        if (event.oldVersion < 3) {
          if (!db.objectStoreNames.contains('professors')) {
            const profStore = db.createObjectStore('professors', { keyPath: 'id' });
            profStore.createIndex('nombre', 'nombre', { unique: false });
            profStore.createIndex('apellido', 'apellido', { unique: false });
            profStore.createIndex('activo', 'activo', { unique: false });
            profStore.createIndex('search_text', 'search_text', { unique: false });
          }
        }
      };
    });
  }, []);

  // Add search text field to client for better indexing
  // Normalize the name by removing commas to make search easier
  const processClientForStorage = (client: SupabaseClient) => {
    const normalizedName = (client.nombre || '').replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
    const documento = client.documento || '';
    const numeroCliente = client.numero_cliente || '';
    return {
      ...client,
      search_text: `${normalizedName} ${documento} ${numeroCliente}`.toLowerCase()
    };
  };

  // Save clients to IndexedDB
  const saveClientsToIndexedDB = useCallback(async (clientsData: SupabaseClient[]) => {
    try {
      const db = await initDB();
      const transaction = db.transaction([DB_CONFIG.storeName], 'readwrite');
      const store = transaction.objectStore(DB_CONFIG.storeName);
      
      // Clear existing data
      await new Promise((resolve, reject) => {
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => resolve(clearRequest.result);
        clearRequest.onerror = () => reject(clearRequest.error);
      });

      // Add all clients in batch
      const processedClients = clientsData.map(processClientForStorage);
      
      for (const client of processedClients) {
        await new Promise((resolve, reject) => {
          const addRequest = store.add(client);
          addRequest.onsuccess = () => resolve(addRequest.result);
          addRequest.onerror = () => reject(addRequest.error);
        });
      }

      console.log(`💾 Guardados ${clientsData.length} clientes en IndexedDB`);
      setLastSync(new Date());
      localStorage.setItem('clients_last_sync', new Date().toISOString());
    } catch (err) {
      console.error('Error saving to IndexedDB:', err);
      throw err;
    }
  }, [initDB]);

  // Load clients from IndexedDB
  const loadClientsFromIndexedDB = useCallback(async (): Promise<SupabaseClient[]> => {
    try {
      const db = await initDB();
      const transaction = db.transaction([DB_CONFIG.storeName], 'readonly');
      const store = transaction.objectStore(DB_CONFIG.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          const clients = request.result.map((client: any) => {
            // Remove search_text field before returning
            const { search_text, ...cleanClient } = client;
            return cleanClient;
          });
          resolve(clients);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error('Error loading from IndexedDB:', err);
      return [];
    }
  }, [initDB]);

  // Search clients in IndexedDB (super fast!)
  const searchClients = useCallback(async (searchTerm: string): Promise<SupabaseClient[]> => {
    const trimmed = searchTerm.trim().toLowerCase();
    if (!trimmed) return [];

    try {
      const db = await initDB();
      const transaction = db.transaction([DB_CONFIG.storeName], 'readonly');
      const store = transaction.objectStore(DB_CONFIG.storeName);

      // Use IDBKeyRange on search_text index for fast prefix/contains search
      return new Promise((resolve, reject) => {
        const index = store.index('search_text');
        const results: SupabaseClient[] = [];

        // Cursor over all records — faster than getAll() + filter because
        // we can break early and avoid allocating the full array
        const request = index.openCursor();
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            const client = cursor.value as any;
            if (client.search_text && client.search_text.includes(trimmed)) {
              const { search_text, ...cleanClient } = client;
              results.push(cleanClient);
            }
            cursor.continue();
          } else {
            resolve(results);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error('Error searching in IndexedDB:', err);
      return [];
    }
  }, [initDB]);

  // Initialize: Load from IndexedDB first, then sync if needed
  const initializeClients = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Load from IndexedDB first (instant)
      const localClients = await loadClientsFromIndexedDB();
      
      if (localClients.length > 0) {
        setClients(localClients);
        console.log(`⚡ Cargados ${localClients.length} clientes desde IndexedDB (instantáneo)`);
        
        // Get last sync time
        const lastSyncStr = localStorage.getItem('clients_last_sync');
        if (lastSyncStr) {
          setLastSync(new Date(lastSyncStr));
        }
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando clientes');
      console.error('Error initializing clients:', err);
    } finally {
      setIsLoading(false);
    }
  }, [loadClientsFromIndexedDB]);

  // Sync from Supabase to IndexedDB
  const importFromExternal = useCallback(async (clientsToImport: SupabaseClient[]) => {
    try {
      await saveClientsToIndexedDB(clientsToImport);
      setClients(clientsToImport);
      console.log(`✅ Importados ${clientsToImport.length} clientes`);
    } catch (err) {
      console.error('Error syncing from Supabase:', err);
      throw err;
    }
  }, [saveClientsToIndexedDB]);

  // Refresh clients from IndexedDB
  const forceRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await loadClientsFromIndexedDB();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error during refresh');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check if sync is needed (every 30 minutes)
  const shouldSync = useCallback(() => {
    if (!lastSync) return true;
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSync.getTime()) / (1000 * 60);
    return diffMinutes > 30; // Sync every 30 minutes
  }, [lastSync]);

  // Update a client
  const updateClient = useCallback(async (id: string, updates: Partial<SupabaseClient>) => {
    try {
      const db = await initDB();
      const transaction = db.transaction([DB_CONFIG.storeName], 'readwrite');
      const store = transaction.objectStore(DB_CONFIG.storeName);
      
      // Get the existing client
      const getRequest = store.get(id);
      
      return new Promise((resolve, reject) => {
        getRequest.onsuccess = () => {
          const existingClient = getRequest.result;
          if (!existingClient) {
            reject(new Error('Cliente no encontrado'));
            return;
          }
          
          // Merge updates
          const updatedClient = { ...existingClient, ...updates };
          const processedClient = processClientForStorage(updatedClient);
          
          const putRequest = store.put(processedClient);
          putRequest.onsuccess = () => {
            // Update local state
            setClients(prev => prev.map(c => c.id === id ? updatedClient : c));
            resolve(true);
          };
          putRequest.onerror = () => reject(putRequest.error);
        };
        getRequest.onerror = () => reject(getRequest.error);
      });
    } catch (err) {
      console.error('Error updating client:', err);
      throw err;
    }
  }, [initDB, processClientForStorage]);

  // Import clients (batch add/update)
  const importClients = useCallback(async (clientsData: SupabaseClient[]) => {
    try {
      await saveClientsToIndexedDB(clientsData);
      setClients(clientsData);
      return { success: true, count: clientsData.length, message: `${clientsData.length} clientes importados` };
    } catch (err) {
      console.error('Error importing clients:', err);
      return { success: false, count: 0, message: err instanceof Error ? err.message : 'Error al importar' };
    }
  }, [saveClientsToIndexedDB]);

  // Refresh clients (reload from IndexedDB)
  const refreshClients = useCallback(async () => {
    await initializeClients();
  }, [initializeClients]);

  useEffect(() => {
    initializeClients();
  }, [initializeClients]);

  return {
    clients,
    isLoading,
    error,
    lastSync,
    searchClients,
    importFromExternal,
    shouldSync,
    forceRefresh,
    updateClient,
    importClients,
    refreshClients
  };
};