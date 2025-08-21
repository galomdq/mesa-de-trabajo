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
}

const STORAGE_KEY = 'gym_professors';

// Profesores de ejemplo
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
    activo: true
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
    activo: true
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
    activo: true
  }
];

export const useProfessors = () => {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfessors();
  }, []);

  const loadProfessors = () => {
    setIsLoading(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProfessors(JSON.parse(stored));
      } else {
        setProfessors(defaultProfessors);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProfessors));
      }
    } catch (error) {
      console.error('Error loading professors:', error);
      setProfessors(defaultProfessors);
    }
    setIsLoading(false);
  };

  const saveProfessor = (professor: Omit<Professor, 'id' | 'fechaIngreso'>) => {
    try {
      const newProfessor: Professor = {
        ...professor,
        id: Date.now().toString(),
        fechaIngreso: new Date().toISOString().split('T')[0],
        activo: true
      };

      const updatedProfessors = [...professors, newProfessor];
      setProfessors(updatedProfessors);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfessors));
      return true;
    } catch (error) {
      console.error('Error saving professor:', error);
      return false;
    }
  };

  const updateProfessor = (id: string, updates: Partial<Professor>) => {
    try {
      const updatedProfessors = professors.map(professor =>
        professor.id === id ? { ...professor, ...updates } : professor
      );
      setProfessors(updatedProfessors);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfessors));
      return true;
    } catch (error) {
      console.error('Error updating professor:', error);
      return false;
    }
  };

  const deleteProfessor = (id: string) => {
    try {
      // Soft delete - mark as inactive instead of removing
      const updatedProfessors = professors.map(professor =>
        professor.id === id ? { ...professor, activo: false } : professor
      );
      setProfessors(updatedProfessors);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfessors));
      return true;
    } catch (error) {
      console.error('Error deleting professor:', error);
      return false;
    }
  };

  const getActiveProfessors = () => professors.filter(prof => prof.activo);

  return {
    professors: getActiveProfessors(),
    allProfessors: professors,
    isLoading,
    saveProfessor,
    updateProfessor,
    deleteProfessor,
    loadProfessors
  };
};