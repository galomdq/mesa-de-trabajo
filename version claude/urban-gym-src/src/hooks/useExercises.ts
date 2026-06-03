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

const EXERCISE_STORAGE_KEY = 'gym_exercise_templates';
const CATEGORY_STORAGE_KEY = 'gym_exercise_categories';
const EQUIPMENT_STORAGE_KEY = 'gym_exercise_equipment';

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

export const useExercises = () => {
  const [exercises, setExercises] = useState<ExerciseTemplate[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadExercises();
    loadCategories();
    loadEquipments();
  }, []);

  const loadData = <T,>(key: string, defaultData: T[], setter: React.Dispatch<React.SetStateAction<T[]>>) => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        setter(JSON.parse(stored));
      } else {
        setter(defaultData);
        localStorage.setItem(key, JSON.stringify(defaultData));
      }
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
      setter(defaultData);
    }
  };

  const loadExercises = () => {
    setIsLoading(true);
    loadData(EXERCISE_STORAGE_KEY, defaultExercises, setExercises);
    setIsLoading(false);
  };

  const loadCategories = () => loadData(CATEGORY_STORAGE_KEY, defaultCategories, setCategories);
  const loadEquipments = () => loadData(EQUIPMENT_STORAGE_KEY, defaultEquipments, setEquipments);

  const saveData = <T,>(key: string, data: T[], setter: React.Dispatch<React.SetStateAction<T[]>>) => {
    setter(data);
    localStorage.setItem(key, JSON.stringify(data));
  };

  const saveExercise = (exercise: Omit<ExerciseTemplate, 'id' | 'fechaCreacion'>) => {
    try {
      const newExercise: ExerciseTemplate = {
        ...exercise,
        id: Date.now().toString(),
        fechaCreacion: new Date().toISOString().split('T')[0],
        activo: true
      };
      const updatedExercises = [...exercises, newExercise];
      saveData(EXERCISE_STORAGE_KEY, updatedExercises, setExercises);
      return true;
    } catch (error) {
      console.error('Error saving exercise:', error);
      return false;
    }
  };

  const updateExercise = (id: string, updates: Partial<ExerciseTemplate>) => {
    try {
      const updatedExercises = exercises.map(ex => (ex.id === id ? { ...ex, ...updates } : ex));
      saveData(EXERCISE_STORAGE_KEY, updatedExercises, setExercises);
      return true;
    } catch (error) {
      console.error('Error updating exercise:', error);
      return false;
    }
  };

  const deleteExercise = (id: string) => {
    try {
      const updatedExercises = exercises.map(ex => (ex.id === id ? { ...ex, activo: false } : ex));
      saveData(EXERCISE_STORAGE_KEY, updatedExercises, setExercises);
      return true;
    } catch (error) {
      console.error('Error deleting exercise:', error);
      return false;
    }
  };

  const addItem = <T extends { id: string; name: string }>(name: string, items: T[], key: string, setter: React.Dispatch<React.SetStateAction<T[]>>): boolean => {
    if (items.some(item => item.name.toLowerCase() === name.toLowerCase())) {
      return false;
    }
    const newItem = { id: Date.now().toString(), name } as T;
    const updatedItems = [...items, newItem];
    saveData(key, updatedItems, setter);
    return true;
  };

  const updateItem = <T extends { id: string; name: string }>(id: string, name: string, items: T[], key: string, setter: React.Dispatch<React.SetStateAction<T[]>>): boolean => {
    if (items.some(item => item.name.toLowerCase() === name.toLowerCase() && item.id !== id)) {
      return false;
    }
    const updatedItems = items.map(item => (item.id === id ? { ...item, name } : item));
    saveData(key, updatedItems, setter);
    return true;
  };

  const deleteItem = <T extends { id: string }>(id: string, items: T[], key: string, setter: React.Dispatch<React.SetStateAction<T[]>>): boolean => {
    const updatedItems = items.filter(item => item.id !== id);
    saveData(key, updatedItems, setter);
    return true;
  };

  const onAddCategory = (name: string) => addItem(name, categories, CATEGORY_STORAGE_KEY, setCategories);
  const onUpdateCategory = (id: string, name: string) => updateItem(id, name, categories, CATEGORY_STORAGE_KEY, setCategories);
  const onDeleteCategory = (id: string) => deleteItem(id, categories, CATEGORY_STORAGE_KEY, setCategories);

  const onAddEquipment = (name: string) => addItem(name, equipments, EQUIPMENT_STORAGE_KEY, setEquipments);
  const onUpdateEquipment = (id: string, name: string) => updateItem(id, name, equipments, EQUIPMENT_STORAGE_KEY, setEquipments);
  const onDeleteEquipment = (id: string) => deleteItem(id, equipments, EQUIPMENT_STORAGE_KEY, setEquipments);

  const getActiveExercises = () => exercises.filter(ex => ex.activo);

  return {
    exercises: getActiveExercises(),
    allExercises: exercises,
    isLoading,
    saveExercise,
    updateExercise,
    deleteExercise,
    categories,
    onAddCategory,
    onUpdateCategory,
    onDeleteCategory,
    equipments,
    onAddEquipment,
    onUpdateEquipment,
    onDeleteEquipment,
  };
};