
import { useState, useEffect, useMemo } from 'react';

export interface Client {
  id: string;
  numeroCliente: string;
  nombre: string;
  documento: string;
  email: string;
  fechaIngreso: string;
  hasActiveRoutine: boolean;
  memo?: string;
}

export interface Exercise {
  id: string;
  ejercicio: string;
  series: string;
  repeticiones: string;
  observaciones: string;
}

export interface DayRoutineData {
  entradaCalor: Exercise[];
  entrenamiento: Exercise[];
}

export interface Routine {
  id: string;
  clienteId: string;
  profesorId: string;
  profesorNombre: string;
  fechaCreacion: string;
  dias: {
    dia1: DayRoutineData;
    dia2: DayRoutineData;
    dia3: DayRoutineData;
    dia4: DayRoutineData;
    dia5: DayRoutineData;
  };
  esPlantilla?: boolean;
  nombrePlantilla?: string;
  templateName?: string;
}

export interface Professor {
  id: string;
  nombre: string;
  email?: string;
  especialidad?: string;
}

// Datos de ejemplo
const mockClients: Client[] = [
  {
    id: '1',
    numeroCliente: '001',
    nombre: 'García, Juan Carlos',
    documento: '12345678',
    email: 'juan.garcia@email.com',
    fechaIngreso: '2024-01-15',
    hasActiveRoutine: true,
  },
  {
    id: '2',
    numeroCliente: '002',
    nombre: 'Rodríguez, María Elena',
    documento: '87654321',
    email: 'maria.rodriguez@email.com',
    fechaIngreso: '2024-02-20',
    hasActiveRoutine: true,
  },
  {
    id: '3',
    numeroCliente: '003',
    nombre: 'López, Carlos Alberto',
    documento: '11223344',
    email: 'carlos.lopez@email.com',
    fechaIngreso: '2024-03-10',
    hasActiveRoutine: false,
  },
  {
    id: '4',
    numeroCliente: '004',
    nombre: 'Fernández, Ana Sofía',
    documento: '55667788',
    email: 'ana.fernandez@email.com',
    fechaIngreso: '2024-01-05',
    hasActiveRoutine: true,
  },
  {
    id: '5',
    numeroCliente: '005',
    nombre: 'Martín, Diego Sebastián',
    documento: '99887766',
    email: 'diego.martin@email.com',
    fechaIngreso: '2024-02-28',
    hasActiveRoutine: false,
  },
];

const STORAGE_KEYS = {
  ROUTINES: 'gym_routines',
  TEMPLATES: 'gym_templates'
};

const CLIENTS_STORAGE_KEY = 'gym_clients';

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadClients();
    
    // Escuchar cambios de otros componentes
    const handleClientsUpdated = () => {
      loadClients();
    };
    
    window.addEventListener('clientsUpdated', handleClientsUpdated);
    
    return () => {
      window.removeEventListener('clientsUpdated', handleClientsUpdated);
    };
  }, []);

  const loadClients = () => {
    setIsLoading(true);
    try {
      const stored = localStorage.getItem(CLIENTS_STORAGE_KEY);
      if (stored) {
        const parsedClients = JSON.parse(stored);
        setClients(parsedClients);
      } else {
        setClients(mockClients);
        localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(mockClients));
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      setClients(mockClients);
    }
    setIsLoading(false);
  };

  const saveClient = (client: Omit<Client, 'id' | 'fechaIngreso' | 'hasActiveRoutine'>) => {
    try {
      const newClient: Client = {
        ...client,
        id: Date.now().toString(),
        fechaIngreso: new Date().toISOString().split('T')[0],
        hasActiveRoutine: false
      };

      const updatedClients = [...clients, newClient];
      setClients(updatedClients);
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(updatedClients));
      
      // Disparar evento personalizado para notificar a otros componentes
      window.dispatchEvent(new CustomEvent('clientsUpdated'));
      
      return true;
    } catch (error) {
      console.error('Error saving client:', error);
      return false;
    }
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    try {
      const updatedClients = clients.map(client =>
        client.id === id ? { ...client, ...updates } : client
      );
      setClients(updatedClients);
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(updatedClients));
      
      // Disparar evento personalizado para notificar a otros componentes
      window.dispatchEvent(new CustomEvent('clientsUpdated'));
      
      return true;
    } catch (error) {
      console.error('Error updating client:', error);
      return false;
    }
  };

  const deleteClient = (id: string) => {
    try {
      const updatedClients = clients.filter(client => client.id !== id);
      setClients(updatedClients);
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(updatedClients));
      
      // Disparar evento personalizado para notificar a otros componentes
      window.dispatchEvent(new CustomEvent('clientsUpdated'));
      
      return true;
    } catch (error) {
      console.error('Error deleting client:', error);
      return false;
    }
  };

  const searchClients = useMemo(() => {
    return (searchTerm: string) => {
      if (!searchTerm.trim()) return clients;
      
      const term = searchTerm.toLowerCase().trim();
      return clients.filter(client => 
        client.nombre.toLowerCase().includes(term) ||
        client.documento.includes(term)
      );
    };
  }, [clients]);

  return {
    clients,
    searchClients,
    isLoading,
    saveClient,
    updateClient,
    deleteClient,
    loadClients
  };
};

export const useRoutines = () => {
  const saveRoutine = (routine: Routine) => {
    try {
      const existingRoutines = getRoutinesByClient(routine.clienteId);
      const updatedRoutines = [...existingRoutines, routine];
      
      // Guardar rutinas del cliente
      localStorage.setItem(`${STORAGE_KEYS.ROUTINES}_${routine.clienteId}`, JSON.stringify(updatedRoutines));
      
      console.log('Rutina guardada exitosamente:', routine);
      return true;
    } catch (error) {
      console.error('Error al guardar rutina:', error);
      return false;
    }
  };

  const getRoutinesByClient = (clienteId: string): Routine[] => {
    try {
      const routines = localStorage.getItem(`${STORAGE_KEYS.ROUTINES}_${clienteId}`);
      return routines ? JSON.parse(routines) : [];
    } catch (error) {
      console.error('Error al cargar rutinas:', error);
      return [];
    }
  };

  const getLastRoutineByClient = (clienteId: string): Routine | null => {
    const routines = getRoutinesByClient(clienteId);
    if (routines.length === 0) return null;
    
    // Ordenar por fecha de creación (más reciente primero)
    const sortedRoutines = routines.sort((a, b) => 
      new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
    );
    
    return sortedRoutines[0];
  };

  const saveTemplate = (routine: Routine, templateName: string) => {
    try {
      const template = {
        ...routine,
        id: Date.now().toString(),
        esPlantilla: true,
        templateName: templateName,
        clienteId: 'template'
      };

      const existingTemplates = getTemplates();
      const updatedTemplates = [...existingTemplates, template];
      
      localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(updatedTemplates));
      
      console.log('Plantilla guardada exitosamente:', template);
      return true;
    } catch (error) {
      console.error('Error al guardar plantilla:', error);
      return false;
    }
  };

  const getTemplates = (): Routine[] => {
    try {
      const templates = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
      return templates ? JSON.parse(templates) : [];
    } catch (error) {
      console.error('Error al cargar plantillas:', error);
      return [];
    }
  };

  const getAllRoutines = (): (Routine & { clienteNombre: string })[] => {
    try {
      const allRoutines: (Routine & { clienteNombre: string })[] = [];
      const clientsData = localStorage.getItem(CLIENTS_STORAGE_KEY);
      const clients = clientsData ? JSON.parse(clientsData) : mockClients;
      
      clients.forEach((client: Client) => {
        const clientRoutines = getRoutinesByClient(client.id);
        clientRoutines.forEach(routine => {
          allRoutines.push({
            ...routine,
            clienteNombre: client.nombre
          });
        });
      });
      
      // Ordenar por fecha descendente
      return allRoutines.sort((a, b) => 
        new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
      );
    } catch (error) {
      console.error('Error al cargar todas las rutinas:', error);
      return [];
    }
  };

  return {
    saveRoutine,
    getRoutinesByClient,
    getLastRoutineByClient,
    saveTemplate,
    getTemplates,
    getAllRoutines
  };
};
