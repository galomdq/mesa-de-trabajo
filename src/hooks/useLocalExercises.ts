import { useState, useEffect } from 'react';

export interface LocalExerciseTemplate {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string | null;
  musculos_objetivo: string | null;
  equipamiento: string | null;
  nivel_dificultad: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocalCategory {
  id: string;
  nombre: string;
}

export interface LocalEquipment {
  id: string;
  nombre: string;
}

const DB_NAME = 'GymLocalDB';
const DB_VERSION = 3;
const EXERCISES_STORE = 'exercises';
const CATEGORIES_STORE = 'categories';
const EQUIPMENT_STORE = 'equipment';

// Default data
const defaultCategories: LocalCategory[] = [
  { id: '1', nombre: 'Pecho' },
  { id: '2', nombre: 'Espalda' },
  { id: '3', nombre: 'Piernas' },
  { id: '4', nombre: 'Hombros' },
  { id: '5', nombre: 'Brazos' },
  { id: '6', nombre: 'Core' },
  { id: '7', nombre: 'Cardio' }
];

const defaultEquipment: LocalEquipment[] = [
  { id: '1', nombre: 'Mancuernas' },
  { id: '2', nombre: 'Barra' },
  { id: '3', nombre: 'Máquina' },
  { id: '4', nombre: 'Peso Corporal' },
  { id: '5', nombre: 'Bandas Elásticas' },
  { id: '6', nombre: 'Kettlebell' },
  { id: '7', nombre: 'TRX' }
];

const defaultExercises: LocalExerciseTemplate[] = [
  {
    id: '1',
    nombre: 'Press de Banca',
    categoria: 'Pecho',
    descripcion: 'Ejercicio principal para el desarrollo del pecho',
    musculos_objetivo: 'Pectoral mayor, tríceps, deltoides anterior',
    equipamiento: 'Barra',
    nivel_dificultad: 'Intermedio',
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    nombre: 'Sentadilla',
    categoria: 'Piernas',
    descripcion: 'Ejercicio fundamental para piernas',
    musculos_objetivo: 'Cuádriceps, glúteos, isquiotibiales',
    equipamiento: 'Barra',
    nivel_dificultad: 'Intermedio',
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    nombre: 'Dominadas',
    categoria: 'Espalda',
    descripcion: 'Ejercicio para desarrollar la espalda',
    musculos_objetivo: 'Dorsales, bíceps',
    equipamiento: 'Peso Corporal',
    nivel_dificultad: 'Avanzado',
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

class LocalExercisesDB {
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
        
        // Create exercises store
        if (!db.objectStoreNames.contains(EXERCISES_STORE)) {
          const exercisesStore = db.createObjectStore(EXERCISES_STORE, { keyPath: 'id' });
          exercisesStore.createIndex('nombre', 'nombre', { unique: false });
          exercisesStore.createIndex('categoria', 'categoria', { unique: false });
          exercisesStore.createIndex('activo', 'activo', { unique: false });
        }

        // Create categories store
        if (!db.objectStoreNames.contains(CATEGORIES_STORE)) {
          db.createObjectStore(CATEGORIES_STORE, { keyPath: 'id' });
        }

        // Create equipment store
        if (!db.objectStoreNames.contains(EQUIPMENT_STORE)) {
          db.createObjectStore(EQUIPMENT_STORE, { keyPath: 'id' });
        }
      };
    });
  }

  // Exercise operations
  async saveExercise(exercise: LocalExerciseTemplate): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EXERCISES_STORE], 'readwrite');
      const store = transaction.objectStore(EXERCISES_STORE);
      const request = store.put(exercise);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllExercises(): Promise<LocalExerciseTemplate[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EXERCISES_STORE], 'readonly');
      const store = transaction.objectStore(EXERCISES_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteExercise(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EXERCISES_STORE], 'readwrite');
      const store = transaction.objectStore(EXERCISES_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Category operations
  async saveCategory(category: LocalCategory): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CATEGORIES_STORE], 'readwrite');
      const store = transaction.objectStore(CATEGORIES_STORE);
      const request = store.put(category);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllCategories(): Promise<LocalCategory[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CATEGORIES_STORE], 'readonly');
      const store = transaction.objectStore(CATEGORIES_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteCategory(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CATEGORIES_STORE], 'readwrite');
      const store = transaction.objectStore(CATEGORIES_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Equipment operations
  async saveEquipment(equipment: LocalEquipment): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EQUIPMENT_STORE], 'readwrite');
      const store = transaction.objectStore(EQUIPMENT_STORE);
      const request = store.put(equipment);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllEquipment(): Promise<LocalEquipment[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EQUIPMENT_STORE], 'readonly');
      const store = transaction.objectStore(EQUIPMENT_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteEquipment(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EQUIPMENT_STORE], 'readwrite');
      const store = transaction.objectStore(EQUIPMENT_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

const dbInstance = new LocalExercisesDB();

export const useLocalExercises = () => {
  const [exercises, setExercises] = useState<LocalExerciseTemplate[]>([]);
  const [categories, setCategories] = useState<LocalCategory[]>([]);
  const [equipment, setEquipment] = useState<LocalEquipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeDB();
  }, []);

  const initializeDB = async () => {
    try {
      setIsLoading(true);
      await dbInstance.init();
      
      // Load or initialize data
      const [loadedExercises, loadedCategories, loadedEquipment] = await Promise.all([
        dbInstance.getAllExercises(),
        dbInstance.getAllCategories(),
        dbInstance.getAllEquipment()
      ]);

      // Initialize with default data if empty
      if (loadedCategories.length === 0) {
        await Promise.all(defaultCategories.map(cat => dbInstance.saveCategory(cat)));
        setCategories(defaultCategories);
      } else {
        setCategories(loadedCategories);
      }

      if (loadedEquipment.length === 0) {
        await Promise.all(defaultEquipment.map(eq => dbInstance.saveEquipment(eq)));
        setEquipment(defaultEquipment);
      } else {
        setEquipment(loadedEquipment);
      }

      if (loadedExercises.length === 0) {
        await Promise.all(defaultExercises.map(ex => dbInstance.saveExercise(ex)));
        setExercises(defaultExercises);
      } else {
        setExercises(loadedExercises);
      }
    } catch (err) {
      console.error('Error initializing exercises database:', err);
      setError('Error al inicializar base de datos de ejercicios');
    } finally {
      setIsLoading(false);
    }
  };

  const loadExercises = async () => {
    const allExercises = await dbInstance.getAllExercises();
    setExercises(allExercises);
  };

  const loadCategories = async () => {
    const allCategories = await dbInstance.getAllCategories();
    setCategories(allCategories);
  };

  const loadEquipment = async () => {
    const allEquipment = await dbInstance.getAllEquipment();
    setEquipment(allEquipment);
  };

  // Exercise operations
  const saveExercise = async (exerciseData: Omit<LocalExerciseTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newExercise: LocalExerciseTemplate = {
        ...exerciseData,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await dbInstance.saveExercise(newExercise);
      await loadExercises();
      return { success: true, exercise: newExercise };
    } catch (err) {
      console.error('Error saving exercise:', err);
      return { success: false, error: 'Error al guardar ejercicio' };
    }
  };

  const updateExercise = async (id: string, updates: Partial<LocalExerciseTemplate>) => {
    try {
      const exercise = exercises.find(e => e.id === id);
      if (!exercise) throw new Error('Exercise not found');

      const updatedExercise = {
        ...exercise,
        ...updates,
        updated_at: new Date().toISOString()
      };

      await dbInstance.saveExercise(updatedExercise);
      await loadExercises();
      return { success: true };
    } catch (err) {
      console.error('Error updating exercise:', err);
      return { success: false, error: 'Error al actualizar ejercicio' };
    }
  };

  const deleteExercise = async (id: string) => {
    try {
      await dbInstance.deleteExercise(id);
      await loadExercises();
      return { success: true };
    } catch (err) {
      console.error('Error deleting exercise:', err);
      return { success: false, error: 'Error al eliminar ejercicio' };
    }
  };

  // Category operations
  const saveCategory = async (category: Omit<LocalCategory, 'id'>) => {
    try {
      const newCategory: LocalCategory = {
        ...category,
        id: crypto.randomUUID()
      };

      await dbInstance.saveCategory(newCategory);
      await loadCategories();
      return { success: true, category: newCategory };
    } catch (err) {
      console.error('Error saving category:', err);
      return { success: false, error: 'Error al guardar categoría' };
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await dbInstance.deleteCategory(id);
      await loadCategories();
      return { success: true };
    } catch (err) {
      console.error('Error deleting category:', err);
      return { success: false, error: 'Error al eliminar categoría' };
    }
  };

  // Equipment operations
  const saveEquipment = async (equipmentData: Omit<LocalEquipment, 'id'>) => {
    try {
      const newEquipment: LocalEquipment = {
        ...equipmentData,
        id: crypto.randomUUID()
      };

      await dbInstance.saveEquipment(newEquipment);
      await loadEquipment();
      return { success: true, equipment: newEquipment };
    } catch (err) {
      console.error('Error saving equipment:', err);
      return { success: false, error: 'Error al guardar equipamiento' };
    }
  };

  const deleteEquipment = async (id: string) => {
    try {
      await dbInstance.deleteEquipment(id);
      await loadEquipment();
      return { success: true };
    } catch (err) {
      console.error('Error deleting equipment:', err);
      return { success: false, error: 'Error al eliminar equipamiento' };
    }
  };

  const searchExercises = (searchTerm: string) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return exercises.filter(e => e.activo);

    return exercises.filter(e => 
      e.activo && (
        e.nombre.toLowerCase().includes(term) ||
        e.categoria.toLowerCase().includes(term) ||
        (e.descripcion && e.descripcion.toLowerCase().includes(term)) ||
        (e.musculos_objetivo && e.musculos_objetivo.toLowerCase().includes(term))
      )
    );
  };

  return {
    exercises,
    categories,
    equipment,
    isLoading,
    error,
    saveExercise,
    updateExercise,
    deleteExercise,
    saveCategory,
    deleteCategory,
    saveEquipment,
    deleteEquipment,
    searchExercises,
    refreshExercises: loadExercises,
    refreshCategories: loadCategories,
    refreshEquipment: loadEquipment
  };
};
