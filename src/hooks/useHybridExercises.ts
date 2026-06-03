import { useState, useEffect } from 'react';
import { useIndexedDBExercises, ExerciseTemplate, Category, Equipment } from './useIndexedDBExercises';

const defaultExercises: ExerciseTemplate[] = [
  {
    id: '1',
    nombre: 'Press de Banca',
    categoria: 'Pecho',
    descripcion: 'Ejercicio compuesto para desarrollo del pecho',
    musculosObjetivo: ['Pectorales', 'Tríceps', 'Deltoides anterior'],
    equipamiento: 'Barra',
    nivelDificultad: 'Intermedio',
    fechaCreacion: '2024-01-01',
    activo: true
  },
  {
    id: '2',
    nombre: 'Sentadillas',
    categoria: 'Piernas',
    descripcion: 'Ejercicio fundamental para piernas',
    musculosObjetivo: ['Cuádriceps', 'Glúteos', 'Isquiotibiales'],
    equipamiento: 'Barra',
    nivelDificultad: 'Principiante',
    fechaCreacion: '2024-01-01',
    activo: true
  },
];

const defaultCategories: Category[] = [
  { id: '1', name: 'Pecho' },
  { id: '2', name: 'Espalda' },
  { id: '3', name: 'Piernas' },
  { id: '4', name: 'Hombros' },
  { id: '5', name: 'Brazos' },
  { id: '6', name: 'Core' },
  { id: '7', name: 'Cardio' },
  { id: '8', name: 'Funcional' },
];

const defaultEquipments: Equipment[] = [
  { id: '1', name: 'Barra' },
  { id: '2', name: 'Mancuernas' },
  { id: '3', name: 'Máquina' },
  { id: '4', name: 'Cable' },
  { id: '5', name: 'Peso Corporal' },
  { id: '6', name: 'Kettlebell' },
  { id: '7', name: 'TRX' },
];

export const useHybridExercises = () => {
  const {
    exercises: localExercises,
    allExercises: allLocalExercises,
    categories: localCategories,
    equipments: localEquipments,
    isReady: indexedDBReady,
    saveExercise: saveLocalExercise,
    deleteExercise: deleteLocalExercise,
    saveCategory: saveLocalCategory,
    deleteCategory: deleteLocalCategory,
    saveEquipment: saveLocalEquipment,
    deleteEquipment: deleteLocalEquipment,
    saveMultipleExercises,
    saveMultipleCategories,
    saveMultipleEquipment,
    searchExercises: localSearchExercises
  } = useIndexedDBExercises();

  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing] = useState(false);

  // Initialize with defaults if no local data
  useEffect(() => {
    const initDefaults = async () => {
      if (indexedDBReady && allLocalExercises.length === 0) {
        try {
          await Promise.all([
            saveMultipleExercises(defaultExercises),
            saveMultipleCategories(defaultCategories),
            saveMultipleEquipment(defaultEquipments)
          ]);
        } catch (error) {
          console.error('Error initializing defaults:', error);
        }
      }
      setIsLoading(false);
    };

    initDefaults();
  }, [indexedDBReady, allLocalExercises.length]);

  // Manual sync function (now just refreshes local data)
  const manualSync = async () => {
    return { success: true, message: 'Datos locales actualizados' };
  };

  // Exercise operations
  const saveExercise = async (exerciseData: Omit<ExerciseTemplate, 'id' | 'fechaCreacion'>): Promise<boolean> => {
    const newExercise: ExerciseTemplate = {
      ...exerciseData,
      id: Date.now().toString(),
      fechaCreacion: new Date().toISOString().split('T')[0],
      activo: true
    };

    return await saveLocalExercise(newExercise);
  };

  const updateExercise = async (id: string, updates: Partial<ExerciseTemplate>): Promise<boolean> => {
    const existing = allLocalExercises.find(ex => ex.id === id);
    if (!existing) return false;

    const updated = { ...existing, ...updates };
    return await saveLocalExercise(updated);
  };

  const deleteExercise = async (id: string): Promise<boolean> => {
    const existing = allLocalExercises.find(ex => ex.id === id);
    if (!existing) return false;

    const updated = { ...existing, activo: false };
    return await saveLocalExercise(updated);
  };

  // Category operations
  const addCategory = async (name: string): Promise<boolean> => {
    if (localCategories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
      return false;
    }

    const newCategory: Category = {
      id: Date.now().toString(),
      name
    };

    return await saveLocalCategory(newCategory);
  };

  const updateCategory = async (id: string, name: string): Promise<boolean> => {
    if (localCategories.some(cat => cat.name.toLowerCase() === name.toLowerCase() && cat.id !== id)) {
      return false;
    }

    const existing = localCategories.find(cat => cat.id === id);
    if (!existing) return false;

    const updated = { ...existing, name };
    return await saveLocalCategory(updated);
  };

  const removeCategory = async (id: string): Promise<boolean> => {
    return await deleteLocalCategory(id);
  };

  // Equipment operations
  const addEquipment = async (name: string): Promise<boolean> => {
    if (localEquipments.some(eq => eq.name.toLowerCase() === name.toLowerCase())) {
      return false;
    }

    const newEquipment: Equipment = {
      id: Date.now().toString(),
      name
    };

    return await saveLocalEquipment(newEquipment);
  };

  const updateEquipment = async (id: string, name: string): Promise<boolean> => {
    if (localEquipments.some(eq => eq.name.toLowerCase() === name.toLowerCase() && eq.id !== id)) {
      return false;
    }

    const existing = localEquipments.find(eq => eq.id === id);
    if (!existing) return false;

    const updated = { ...existing, name };
    return await saveLocalEquipment(updated);
  };

  const removeEquipment = async (id: string): Promise<boolean> => {
    return await deleteLocalEquipment(id);
  };

  // Search function
  const searchExercises = (searchTerm: string): ExerciseTemplate[] => {
    return localSearchExercises(searchTerm);
  };

  return {
    // Data
    exercises: localExercises,
    allExercises: allLocalExercises,
    categories: localCategories,
    equipments: localEquipments,
    
    // Status
    isLoading,
    isSyncing,
    
    // Exercise operations
    saveExercise,
    updateExercise,
    deleteExercise,
    
    // Category operations
    onAddCategory: addCategory,
    onUpdateCategory: updateCategory,
    onDeleteCategory: removeCategory,
    
    // Equipment operations
    onAddEquipment: addEquipment,
    onUpdateEquipment: updateEquipment,
    onDeleteEquipment: removeEquipment,
    
    // Sync
    manualSync,
    
    // Search
    searchExercises
  };
};
