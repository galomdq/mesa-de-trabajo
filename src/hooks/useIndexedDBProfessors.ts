import { useState, useEffect } from 'react';

export interface Professor {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  especialidad: string[];
  certificaciones: string[];
  fechaIngreso: string;
  activo: boolean;
  search_text?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Misma DB "GymApp" que useIndexedDBClients, versión 3.
// Upgrade path acumulativo:
//   v1 → crea store "clients"
//   v2 → migra search_text de clients (sin comas)
//   v3 → crea store "professors"
// ─────────────────────────────────────────────────────────────────────────────
const DB_NAME = 'GymApp';
const DB_VERSION = 3;
const PROFESSORS_STORE = 'professors';
const CLIENTS_STORE = 'clients';

const defaultProfessors: Professor[] = [
  {
    id: '1',
    nombre: 'Carlos',
    apellido: 'García',
    email: 'carlos.garcia@gym.com',
    telefono: '123-456-7890',
    especialidad: ['Entrenamiento Personal', 'Rehabilitación'],
    certificaciones: ['ACSM', 'NASM'],
    fechaIngreso: '2023-01-15',
    activo: true,
  },
  {
    id: '2',
    nombre: 'María',
    apellido: 'Martínez',
    email: 'maria.martinez@gym.com',
    telefono: '123-456-7891',
    especialidad: ['Crossfit', 'Funcional'],
    certificaciones: ['CrossFit Level 2'],
    fechaIngreso: '2023-03-20',
    activo: true,
  },
  {
    id: '3',
    nombre: 'Juan',
    apellido: 'López',
    email: 'juan.lopez@gym.com',
    telefono: '123-456-7892',
    especialidad: ['Powerlifting', 'Fuerza'],
    certificaciones: ['NSCA', 'IPF'],
    fechaIngreso: '2023-02-10',
    activo: true,
  },
];

class ProfessorsDB {
  private dbPromise: Promise<IDBDatabase> | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = (event.target as IDBOpenDBRequest).transaction!;
        const oldVersion = event.oldVersion;

        // v1: crear store de clientes
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains(CLIENTS_STORE)) {
            const store = db.createObjectStore(CLIENTS_STORE, { keyPath: 'id' });
            store.createIndex('numero_cliente', 'numero_cliente', { unique: false });
            store.createIndex('nombre', 'nombre', { unique: false });
            store.createIndex('documento', 'documento', { unique: false });
            store.createIndex('search_text', 'search_text', { unique: false });
          }
        }

        // v2: migrar search_text de clientes (sin comas)
        if (oldVersion < 2 && db.objectStoreNames.contains(CLIENTS_STORE)) {
          const clientStore = transaction.objectStore(CLIENTS_STORE);
          const getAllRequest = clientStore.getAll();
          getAllRequest.onsuccess = () => {
            const allClients = getAllRequest.result as any[];
            allClients.forEach((client) => {
              const normalizedName = (client.nombre || '')
                .replace(/,/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
              client.search_text =
                `${normalizedName} ${client.documento} ${client.numero_cliente}`.toLowerCase();
              clientStore.put(client);
            });
          };
        }

        // v3: crear store de profesores
        if (oldVersion < 3) {
          if (!db.objectStoreNames.contains(PROFESSORS_STORE)) {
            const profStore = db.createObjectStore(PROFESSORS_STORE, { keyPath: 'id' });
            profStore.createIndex('nombre', 'nombre', { unique: false });
            profStore.createIndex('apellido', 'apellido', { unique: false });
            profStore.createIndex('activo', 'activo', { unique: false });
            profStore.createIndex('search_text', 'search_text', { unique: false });
          }
        }
      };
    });

    return this.dbPromise;
  }

  async saveProfessor(professor: Professor): Promise<void> {
    const db = await this.init();
    const transaction = db.transaction([PROFESSORS_STORE], 'readwrite');
    const store = transaction.objectStore(PROFESSORS_STORE);
    const professorWithSearch: Professor = {
      ...professor,
      search_text: `${professor.nombre} ${professor.apellido} ${professor.email}`.toLowerCase(),
    };
    await new Promise<void>((resolve, reject) => {
      const req = store.put(professorWithSearch);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getAllProfessors(): Promise<Professor[]> {
    const db = await this.init();
    const transaction = db.transaction([PROFESSORS_STORE], 'readonly');
    const store = transaction.objectStore(PROFESSORS_STORE);
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteProfessor(id: string): Promise<void> {
    const db = await this.init();
    const transaction = db.transaction([PROFESSORS_STORE], 'readwrite');
    const store = transaction.objectStore(PROFESSORS_STORE);
    await new Promise<void>((resolve, reject) => {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const professor = getReq.result;
        if (professor) {
          professor.activo = false;
          const putReq = store.put(professor);
          putReq.onsuccess = () => resolve();
          putReq.onerror = () => reject(putReq.error);
        } else {
          resolve();
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  async updateProfessor(id: string, updates: Partial<Professor>): Promise<void> {
    const db = await this.init();
    const transaction = db.transaction([PROFESSORS_STORE], 'readwrite');
    const store = transaction.objectStore(PROFESSORS_STORE);
    return new Promise((resolve, reject) => {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const professor = getReq.result;
        if (professor) {
          const updated: Professor = { ...professor, ...updates };
          updated.search_text =
            `${updated.nombre} ${updated.apellido} ${updated.email}`.toLowerCase();
          const putReq = store.put(updated);
          putReq.onsuccess = () => resolve();
          putReq.onerror = () => reject(putReq.error);
        } else {
          reject(new Error('Professor not found'));
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }
}

const professorsDB = new ProfessorsDB();

// ─────────────────────────────────────────────────────────────────────────────
// Hook público — interfaz idéntica a useProfessors para que los consumidores
// (Index.tsx, RoutineManager.tsx) no requieran ningún cambio adicional.
// ─────────────────────────────────────────────────────────────────────────────
export const useIndexedDBProfessors = () => {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeDB();
  }, []);

  const initializeDB = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await professorsDB.init();

      // Migración automática desde localStorage (ejecución única)
      const legacyKey = 'gym_professors';
      const legacyData = localStorage.getItem(legacyKey);
      if (legacyData) {
        try {
          const legacyProfessors: Professor[] = JSON.parse(legacyData);
          const existing = await professorsDB.getAllProfessors();
          if (existing.length === 0 && legacyProfessors.length > 0) {
            console.log('🔄 Migrando profesores desde localStorage a IndexedDB...');
            for (const prof of legacyProfessors) {
              await professorsDB.saveProfessor(prof);
            }
            console.log(`✅ Migrados ${legacyProfessors.length} profesores`);
          }
          localStorage.removeItem(legacyKey);
        } catch (e) {
          console.warn('No se pudo migrar datos legacy de profesores:', e);
        }
      }

      // Si no hay ninguno, cargar los predeterminados
      const existing = await professorsDB.getAllProfessors();
      if (existing.length === 0) {
        console.log('📚 Inicializando profesores predeterminados...');
        for (const professor of defaultProfessors) {
          await professorsDB.saveProfessor(professor);
        }
      }

      await loadProfessors();
    } catch (err) {
      console.error('Error initializing professors DB:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProfessors = async () => {
    try {
      const all = await professorsDB.getAllProfessors();
      setProfessors(all.filter((p) => p.activo));
    } catch (err) {
      console.error('Error loading professors:', err);
      setError(err instanceof Error ? err.message : 'Error cargando profesores');
    }
  };

  const saveProfessor = async (
    professorData: Omit<Professor, 'id' | 'fechaIngreso'>
  ): Promise<boolean> => {
    try {
      const newProfessor: Professor = {
        ...professorData,
        id: Date.now().toString(),
        fechaIngreso: new Date().toISOString().split('T')[0],
        activo: true,
      };
      await professorsDB.saveProfessor(newProfessor);
      await loadProfessors();
      return true;
    } catch (err) {
      console.error('Error saving professor:', err);
      setError(err instanceof Error ? err.message : 'Error guardando profesor');
      return false;
    }
  };

  const updateProfessor = async (id: string, updates: Partial<Professor>): Promise<boolean> => {
    try {
      await professorsDB.updateProfessor(id, updates);
      await loadProfessors();
      return true;
    } catch (err) {
      console.error('Error updating professor:', err);
      setError(err instanceof Error ? err.message : 'Error actualizando profesor');
      return false;
    }
  };

  const deleteProfessor = async (id: string): Promise<boolean> => {
    try {
      await professorsDB.deleteProfessor(id);
      await loadProfessors();
      return true;
    } catch (err) {
      console.error('Error deleting professor:', err);
      setError(err instanceof Error ? err.message : 'Error eliminando profesor');
      return false;
    }
  };

  const getAllProfessors = async (): Promise<Professor[]> => {
    return professorsDB.getAllProfessors();
  };

  return {
    professors,
    allProfessors: professors,
    isLoading,
    error,
    saveProfessor,
    updateProfessor,
    deleteProfessor,
    loadProfessors,
    getAllProfessors,
  };
};
