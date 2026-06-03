import { useState, useEffect } from 'react';

export interface ExerciseTemplate {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  musculosObjetivo: string[];
  equipamiento: string;
  nivelDificultad: 'Principiante' | 'Intermedio' | 'Avanzado';
  fechaCreacion: string;
  activo: boolean;
}

export interface Category {
  id: string;
  name: string;
}

export interface Equipment {
  id: string;
  name: string;
}

const DB_NAME = 'GymExercisesDB';
const DB_VERSION = 1;

const EXERCISES_STORE = 'exercises';
const CATEGORIES_STORE = 'categories';
const EQUIPMENT_STORE = 'equipment';

export const useIndexedDBExercises = () => {
  const [exercises, setExercises] = useState<ExerciseTemplate[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [db, setDb] = useState<IDBDatabase | null>(null);

  // Initialize IndexedDB
  useEffect(() => {
    const initDB = async () => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => {
          console.error('Error opening IndexedDB');
        };
        
        request.onupgradeneeded = (event) => {
          const database = (event.target as IDBOpenDBRequest).result;
          
          // Create exercises store
          if (!database.objectStoreNames.contains(EXERCISES_STORE)) {
            const exerciseStore = database.createObjectStore(EXERCISES_STORE, { keyPath: 'id' });
            exerciseStore.createIndex('nombre', 'nombre', { unique: false });
            exerciseStore.createIndex('categoria', 'categoria', { unique: false });
            exerciseStore.createIndex('activo', 'activo', { unique: false });
          }
          
          // Create categories store
          if (!database.objectStoreNames.contains(CATEGORIES_STORE)) {
            const categoryStore = database.createObjectStore(CATEGORIES_STORE, { keyPath: 'id' });
            categoryStore.createIndex('name', 'name', { unique: false });
          }
          
          // Create equipment store
          if (!database.objectStoreNames.contains(EQUIPMENT_STORE)) {
            const equipmentStore = database.createObjectStore(EQUIPMENT_STORE, { keyPath: 'id' });
            equipmentStore.createIndex('name', 'name', { unique: false });
          }
        };
        
        request.onsuccess = (event) => {
          const database = (event.target as IDBOpenDBRequest).result;
          setDb(database);
          setIsReady(true);
        };
      } catch (error) {
        console.error('Error initializing IndexedDB:', error);
      }
    };

    initDB();
  }, []);

  // Load data when DB is ready
  useEffect(() => {
    if (isReady && db) {
      loadAllData();
    }
  }, [isReady, db]);

  const loadAllData = async () => {
    if (!db) return;

    try {
      const [exercisesData, categoriesData, equipmentData] = await Promise.all([
        loadExercises(),
        loadCategories(),
        loadEquipment()
      ]);
      
      setExercises(exercisesData);
      setCategories(categoriesData);
      setEquipments(equipmentData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadExercises = (): Promise<ExerciseTemplate[]> => {
    return new Promise((resolve, reject) => {
      if (!db) {
        resolve([]);
        return;
      }
      
      const transaction = db.transaction([EXERCISES_STORE], 'readonly');
      const store = transaction.objectStore(EXERCISES_STORE);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  };

  const loadCategories = (): Promise<Category[]> => {
    return new Promise((resolve, reject) => {
      if (!db) {
        resolve([]);
        return;
      }
      
      const transaction = db.transaction([CATEGORIES_STORE], 'readonly');
      const store = transaction.objectStore(CATEGORIES_STORE);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  };

  const loadEquipment = (): Promise<Equipment[]> => {
    return new Promise((resolve, reject) => {
      if (!db) {
        resolve([]);
        return;
      }
      
      const transaction = db.transaction([EQUIPMENT_STORE], 'readonly');
      const store = transaction.objectStore(EQUIPMENT_STORE);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  };

  const saveExercise = async (exercise: ExerciseTemplate): Promise<boolean> => {
    if (!db) return false;
    
    try {
      const transaction = db.transaction([EXERCISES_STORE], 'readwrite');
      const store = transaction.objectStore(EXERCISES_STORE);
      await store.put(exercise);
      
      setExercises(prev => {
        const index = prev.findIndex(e => e.id === exercise.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = exercise;
          return updated;
        }
        return [...prev, exercise];
      });
      
      return true;
    } catch (error) {
      console.error('Error saving exercise:', error);
      return false;
    }
  };

  const deleteExercise = async (id: string): Promise<boolean> => {
    if (!db) return false;
    
    try {
      const transaction = db.transaction([EXERCISES_STORE], 'readwrite');
      const store = transaction.objectStore(EXERCISES_STORE);
      await store.delete(id);
      
      setExercises(prev => prev.filter(e => e.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting exercise:', error);
      return false;
    }
  };

  const saveCategory = async (category: Category): Promise<boolean> => {
    if (!db) return false;
    
    try {
      const transaction = db.transaction([CATEGORIES_STORE], 'readwrite');
      const store = transaction.objectStore(CATEGORIES_STORE);
      await store.put(category);
      
      setCategories(prev => {
        const index = prev.findIndex(c => c.id === category.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = category;
          return updated;
        }
        return [...prev, category];
      });
      
      return true;
    } catch (error) {
      console.error('Error saving category:', error);
      return false;
    }
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    if (!db) return false;
    
    try {
      const transaction = db.transaction([CATEGORIES_STORE], 'readwrite');
      const store = transaction.objectStore(CATEGORIES_STORE);
      await store.delete(id);
      
      setCategories(prev => prev.filter(c => c.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      return false;
    }
  };

  const saveEquipment = async (equipment: Equipment): Promise<boolean> => {
    if (!db) return false;
    
    try {
      const transaction = db.transaction([EQUIPMENT_STORE], 'readwrite');
      const store = transaction.objectStore(EQUIPMENT_STORE);
      await store.put(equipment);
      
      setEquipments(prev => {
        const index = prev.findIndex(e => e.id === equipment.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = equipment;
          return updated;
        }
        return [...prev, equipment];
      });
      
      return true;
    } catch (error) {
      console.error('Error saving equipment:', error);
      return false;
    }
  };

  const deleteEquipment = async (id: string): Promise<boolean> => {
    if (!db) return false;
    
    try {
      const transaction = db.transaction([EQUIPMENT_STORE], 'readwrite');
      const store = transaction.objectStore(EQUIPMENT_STORE);
      await store.delete(id);
      
      setEquipments(prev => prev.filter(e => e.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting equipment:', error);
      return false;
    }
  };

  const saveMultipleExercises = async (exercisesToSave: ExerciseTemplate[]): Promise<boolean> => {
    if (!db) return false;
    
    try {
      const transaction = db.transaction([EXERCISES_STORE], 'readwrite');
      const store = transaction.objectStore(EXERCISES_STORE);
      
      for (const exercise of exercisesToSave) {
        await store.put(exercise);
      }
      
      setExercises(exercisesToSave);
      return true;
    } catch (error) {
      console.error('Error saving multiple exercises:', error);
      return false;
    }
  };

  const saveMultipleCategories = async (categoriesToSave: Category[]): Promise<boolean> => {
    if (!db) return false;
    
    try {
      const transaction = db.transaction([CATEGORIES_STORE], 'readwrite');
      const store = transaction.objectStore(CATEGORIES_STORE);
      
      for (const category of categoriesToSave) {
        await store.put(category);
      }
      
      setCategories(categoriesToSave);
      return true;
    } catch (error) {
      console.error('Error saving multiple categories:', error);
      return false;
    }
  };

  const saveMultipleEquipment = async (equipmentToSave: Equipment[]): Promise<boolean> => {
    if (!db) return false;
    
    try {
      const transaction = db.transaction([EQUIPMENT_STORE], 'readwrite');
      const store = transaction.objectStore(EQUIPMENT_STORE);
      
      for (const equipment of equipmentToSave) {
        await store.put(equipment);
      }
      
      setEquipments(equipmentToSave);
      return true;
    } catch (error) {
      console.error('Error saving multiple equipment:', error);
      return false;
    }
  };

  const searchExercises = (searchTerm: string): ExerciseTemplate[] => {
    if (!searchTerm.trim()) return exercises.filter(e => e.activo);
    
    const term = searchTerm.toLowerCase();
    return exercises.filter(exercise => 
      exercise.activo && (
        exercise.nombre.toLowerCase().includes(term) ||
        exercise.categoria.toLowerCase().includes(term) ||
        exercise.descripcion.toLowerCase().includes(term) ||
        exercise.musculosObjetivo.some(musculo => 
          musculo.toLowerCase().includes(term)
        ) ||
        exercise.equipamiento.toLowerCase().includes(term)
      )
    );
  };

  return {
    exercises: exercises.filter(e => e.activo),
    allExercises: exercises,
    categories,
    equipments,
    isReady,
    saveExercise,
    deleteExercise,
    saveCategory,
    deleteCategory,
    saveEquipment,
    deleteEquipment,
    saveMultipleExercises,
    saveMultipleCategories,
    saveMultipleEquipment,
    searchExercises
  };
};