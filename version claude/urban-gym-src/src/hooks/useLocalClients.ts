import { useState, useEffect, useMemo } from 'react';

export interface LocalClient {
  id: string;
  numero_cliente: string;
  nombre: string;
  documento: string;
  email: string | null;
  telefono: string | null;
  fecha_ingreso: string;
  has_active_routine: boolean;
  comentarios: string | null;
  last_routine_access: string | null;
  created_at: string;
  updated_at: string;
}

const CLIENTS_STORAGE_KEY = 'gym_local_clients';
const DB_NAME = 'GymLocalDB';
const DB_VERSION = 1;
const CLIENTS_STORE = 'clients';

class LocalClientsDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(CLIENTS_STORE)) {
          const store = db.createObjectStore(CLIENTS_STORE, { keyPath: 'id' });
          store.createIndex('numero_cliente', 'numero_cliente', { unique: true });
          store.createIndex('documento', 'documento', { unique: false });
          store.createIndex('nombre', 'nombre', { unique: false });
          store.createIndex('has_active_routine', 'has_active_routine', { unique: false });
          store.createIndex('last_routine_access', 'last_routine_access', { unique: false });
        }
      };
    });
  }

  async saveClient(client: LocalClient): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CLIENTS_STORE], 'readwrite');
      const store = transaction.objectStore(CLIENTS_STORE);
      const request = store.put(client);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllClients(): Promise<LocalClient[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CLIENTS_STORE], 'readonly');
      const store = transaction.objectStore(CLIENTS_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getClientById(id: string): Promise<LocalClient | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CLIENTS_STORE], 'readonly');
      const store = transaction.objectStore(CLIENTS_STORE);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async updateClient(id: string, updates: Partial<LocalClient>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const client = await this.getClientById(id);
    if (!client) throw new Error('Client not found');

    const updatedClient = {
      ...client,
      ...updates,
      updated_at: new Date().toISOString()
    };

    await this.saveClient(updatedClient);
  }

  async deleteClient(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CLIENTS_STORE], 'readwrite');
      const store = transaction.objectStore(CLIENTS_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async searchClients(searchTerm: string): Promise<LocalClient[]> {
    const allClients = await this.getAllClients();
    const term = searchTerm.toLowerCase().trim();
    
    if (!term) return allClients;

    return allClients.filter(client =>
      client.nombre.toLowerCase().includes(term) ||
      client.documento.includes(term) ||
      client.numero_cliente.includes(term) ||
      (client.email && client.email.toLowerCase().includes(term))
    );
  }

  async getRecentClients(limit: number = 10): Promise<LocalClient[]> {
    const allClients = await this.getAllClients();
    
    return allClients
      .filter(client => client.last_routine_access)
      .sort((a, b) => {
        const dateA = new Date(a.last_routine_access!).getTime();
        const dateB = new Date(b.last_routine_access!).getTime();
        return dateB - dateA;
      })
      .slice(0, limit);
  }
}

const dbInstance = new LocalClientsDB();

export const useLocalClients = () => {
  const [clients, setClients] = useState<LocalClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeDB();
  }, []);

  const initializeDB = async () => {
    try {
      setIsLoading(true);
      await dbInstance.init();
      await loadClients();
    } catch (err) {
      console.error('Error initializing database:', err);
      setError('Error al inicializar la base de datos local');
    } finally {
      setIsLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const allClients = await dbInstance.getAllClients();
      setClients(allClients);
    } catch (err) {
      console.error('Error loading clients:', err);
      setError('Error al cargar clientes');
    }
  };

  const saveClient = async (clientData: Omit<LocalClient, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newClient: LocalClient = {
        ...clientData,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await dbInstance.saveClient(newClient);
      await loadClients();
      return { success: true, client: newClient };
    } catch (err) {
      console.error('Error saving client:', err);
      return { success: false, error: 'Error al guardar cliente' };
    }
  };

  const updateClient = async (id: string, updates: Partial<LocalClient>) => {
    try {
      await dbInstance.updateClient(id, updates);
      await loadClients();
      return { success: true };
    } catch (err) {
      console.error('Error updating client:', err);
      return { success: false, error: 'Error al actualizar cliente' };
    }
  };

  const deleteClient = async (id: string) => {
    try {
      await dbInstance.deleteClient(id);
      await loadClients();
      return { success: true };
    } catch (err) {
      console.error('Error deleting client:', err);
      return { success: false, error: 'Error al eliminar cliente' };
    }
  };

  const searchClients = async (searchTerm: string) => {
    try {
      return await dbInstance.searchClients(searchTerm);
    } catch (err) {
      console.error('Error searching clients:', err);
      return [];
    }
  };

  const getRecentClients = async (limit: number = 10) => {
    try {
      return await dbInstance.getRecentClients(limit);
    } catch (err) {
      console.error('Error getting recent clients:', err);
      return [];
    }
  };

  const importClients = async (clientsData: any[]) => {
    try {
      let imported = 0;
      let skipped = 0;

      for (const clientData of clientsData) {
        // Validate required fields
        if (!clientData.documento || !clientData.nombre) {
          skipped++;
          continue;
        }

        const client: LocalClient = {
          id: crypto.randomUUID(),
          numero_cliente: clientData.numero_cliente || String(imported + 1).padStart(4, '0'),
          nombre: clientData.nombre,
          documento: clientData.documento,
          email: clientData.email || null,
          telefono: clientData.telefono || null,
          fecha_ingreso: clientData.fecha_ingreso || new Date().toISOString().split('T')[0],
          has_active_routine: false,
          comentarios: clientData.comentarios || null,
          last_routine_access: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        await dbInstance.saveClient(client);
        imported++;
      }

      await loadClients();
      return { success: true, imported, skipped };
    } catch (err) {
      console.error('Error importing clients:', err);
      return { success: false, error: 'Error al importar clientes' };
    }
  };

  return {
    clients,
    isLoading,
    error,
    saveClient,
    updateClient,
    deleteClient,
    searchClients,
    getRecentClients,
    importClients,
    refreshClients: loadClients
  };
};
