import { useState, useEffect } from 'react';

export interface LocalExercise {
  id: string;
  exercise_id: string;
  ejercicio: string;
  series: string;
  repeticiones: string;
  observaciones: string;
  orden: number;
}

export interface LocalDayRoutineData {
  entradaCalor: LocalExercise[];
  entrenamiento: LocalExercise[];
}

export interface LocalRoutine {
  id: string;
  client_id: string;
  template_id: string | null;
  profesor_nombre: string;
  fecha_asignacion: string;
  fecha_vencimiento: string | null;
  activa: boolean;
  notas: string | null;
  created_at: string;
  updated_at: string;
  dias: {
    dia1: LocalDayRoutineData;
    dia2: LocalDayRoutineData;
    dia3: LocalDayRoutineData;
    dia4: LocalDayRoutineData;
    dia5: LocalDayRoutineData;
  };
}

export interface LocalTemplate {
  id: string;
  nombre: string;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
  routine: LocalRoutine;
}

const DB_NAME = 'GymLocalDB';
const DB_VERSION = 2;
const ROUTINES_STORE = 'routines';
const TEMPLATES_STORE = 'templates';

class LocalRoutinesDB {
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
        
        // Create routines store
        if (!db.objectStoreNames.contains(ROUTINES_STORE)) {
          const routinesStore = db.createObjectStore(ROUTINES_STORE, { keyPath: 'id' });
          routinesStore.createIndex('client_id', 'client_id', { unique: false });
          routinesStore.createIndex('activa', 'activa', { unique: false });
          routinesStore.createIndex('profesor_nombre', 'profesor_nombre', { unique: false });
        }

        // Create templates store
        if (!db.objectStoreNames.contains(TEMPLATES_STORE)) {
          const templatesStore = db.createObjectStore(TEMPLATES_STORE, { keyPath: 'id' });
          templatesStore.createIndex('nombre', 'nombre', { unique: false });
        }
      };
    });
  }

  async saveRoutine(routine: LocalRoutine): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([ROUTINES_STORE], 'readwrite');
      const store = transaction.objectStore(ROUTINES_STORE);
      const request = store.put(routine);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getRoutinesByClient(clientId: string): Promise<LocalRoutine[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([ROUTINES_STORE], 'readonly');
      const store = transaction.objectStore(ROUTINES_STORE);
      const index = store.index('client_id');
      const request = index.getAll(clientId);

      request.onsuccess = () => {
        const routines = request.result || [];
        // Sort by fecha_asignacion descending
        routines.sort((a, b) => 
          new Date(b.fecha_asignacion).getTime() - new Date(a.fecha_asignacion).getTime()
        );
        resolve(routines);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllRoutines(): Promise<LocalRoutine[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([ROUTINES_STORE], 'readonly');
      const store = transaction.objectStore(ROUTINES_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteRoutine(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([ROUTINES_STORE], 'readwrite');
      const store = transaction.objectStore(ROUTINES_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveTemplate(template: LocalTemplate): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([TEMPLATES_STORE], 'readwrite');
      const store = transaction.objectStore(TEMPLATES_STORE);
      const request = store.put(template);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllTemplates(): Promise<LocalTemplate[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([TEMPLATES_STORE], 'readonly');
      const store = transaction.objectStore(TEMPLATES_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteTemplate(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([TEMPLATES_STORE], 'readwrite');
      const store = transaction.objectStore(TEMPLATES_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

const dbInstance = new LocalRoutinesDB();

export const useLocalRoutines = () => {
  const [routines, setRoutines] = useState<LocalRoutine[]>([]);
  const [templates, setTemplates] = useState<LocalTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeDB();
  }, []);

  const initializeDB = async () => {
    try {
      setIsLoading(true);
      await dbInstance.init();
      await loadRoutines();
      await loadTemplates();
    } catch (err) {
      console.error('Error initializing routines database:', err);
      setError('Error al inicializar base de datos de rutinas');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRoutines = async () => {
    try {
      const allRoutines = await dbInstance.getAllRoutines();
      setRoutines(allRoutines);
    } catch (err) {
      console.error('Error loading routines:', err);
      setError('Error al cargar rutinas');
    }
  };

  const loadTemplates = async () => {
    try {
      const allTemplates = await dbInstance.getAllTemplates();
      setTemplates(allTemplates);
    } catch (err) {
      console.error('Error loading templates:', err);
      setError('Error al cargar plantillas');
    }
  };

  const saveRoutine = async (routineData: Omit<LocalRoutine, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newRoutine: LocalRoutine = {
        ...routineData,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await dbInstance.saveRoutine(newRoutine);
      await loadRoutines();
      return { success: true, routine: newRoutine };
    } catch (err) {
      console.error('Error saving routine:', err);
      return { success: false, error: 'Error al guardar rutina' };
    }
  };

  const updateRoutine = async (id: string, updates: Partial<LocalRoutine>) => {
    try {
      const allRoutines = await dbInstance.getAllRoutines();
      const routine = allRoutines.find(r => r.id === id);
      
      if (!routine) throw new Error('Routine not found');

      const updatedRoutine = {
        ...routine,
        ...updates,
        updated_at: new Date().toISOString()
      };

      await dbInstance.saveRoutine(updatedRoutine);
      await loadRoutines();
      return { success: true };
    } catch (err) {
      console.error('Error updating routine:', err);
      return { success: false, error: 'Error al actualizar rutina' };
    }
  };

  const deleteRoutine = async (id: string) => {
    try {
      await dbInstance.deleteRoutine(id);
      await loadRoutines();
      return { success: true };
    } catch (err) {
      console.error('Error deleting routine:', err);
      return { success: false, error: 'Error al eliminar rutina' };
    }
  };

  const getRoutinesByClient = async (clientId: string) => {
    try {
      return await dbInstance.getRoutinesByClient(clientId);
    } catch (err) {
      console.error('Error getting client routines:', err);
      return [];
    }
  };

  const saveTemplate = async (templateData: Omit<LocalTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newTemplate: LocalTemplate = {
        ...templateData,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await dbInstance.saveTemplate(newTemplate);
      await loadTemplates();
      return { success: true, template: newTemplate };
    } catch (err) {
      console.error('Error saving template:', err);
      return { success: false, error: 'Error al guardar plantilla' };
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      await dbInstance.deleteTemplate(id);
      await loadTemplates();
      return { success: true };
    } catch (err) {
      console.error('Error deleting template:', err);
      return { success: false, error: 'Error al eliminar plantilla' };
    }
  };

  return {
    routines,
    templates,
    isLoading,
    error,
    saveRoutine,
    updateRoutine,
    deleteRoutine,
    getRoutinesByClient,
    saveTemplate,
    deleteTemplate,
    refreshRoutines: loadRoutines,
    refreshTemplates: loadTemplates
  };
};
