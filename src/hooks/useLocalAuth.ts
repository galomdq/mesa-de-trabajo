import { useState, useEffect } from 'react';

interface LocalUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface StoredUser extends LocalUser {
  passwordHash: string;
}

const DB_NAME = 'GymAppAuth';
const DB_VERSION = 1;
const USERS_STORE = 'users';
const SESSION_KEY = 'gym_app_session';

// Simple hash function for passwords (in production, use a proper library)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

class LocalAuthDB {
  public db: IDBDatabase | null = null;

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
        
        if (!db.objectStoreNames.contains(USERS_STORE)) {
          const store = db.createObjectStore(USERS_STORE, { keyPath: 'id' });
          store.createIndex('email', 'email', { unique: true });
        }
      };
    });
  }

  async createUser(email: string, password: string, name: string): Promise<LocalUser> {
    if (!this.db) throw new Error('Database not initialized');

    const passwordHash = await hashPassword(password);
    const user: StoredUser = {
      id: crypto.randomUUID(),
      email: email.toLowerCase(),
      name,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([USERS_STORE], 'readwrite');
      const store = transaction.objectStore(USERS_STORE);
      const request = store.add(user);

      request.onsuccess = () => {
        const { passwordHash, ...userWithoutPassword } = user;
        resolve(userWithoutPassword);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async verifyUser(email: string, password: string): Promise<LocalUser | null> {
    if (!this.db) throw new Error('Database not initialized');

    const passwordHash = await hashPassword(password);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([USERS_STORE], 'readonly');
      const store = transaction.objectStore(USERS_STORE);
      const index = store.index('email');
      const request = index.get(email.toLowerCase());

      request.onsuccess = () => {
        const user = request.result as StoredUser | undefined;
        if (user && user.passwordHash === passwordHash) {
          const { passwordHash, ...userWithoutPassword } = user;
          resolve(userWithoutPassword);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async userExists(email: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([USERS_STORE], 'readonly');
      const store = transaction.objectStore(USERS_STORE);
      const index = store.index('email');
      const request = index.get(email.toLowerCase());

      request.onsuccess = () => resolve(!!request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

const authDB = new LocalAuthDB();

export const useLocalAuth = () => {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await authDB.init();
        
        // Check for existing session
        const sessionData = localStorage.getItem(SESSION_KEY);
        if (sessionData) {
          const parsedUser = JSON.parse(sessionData) as LocalUser;
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const verifiedUser = await authDB.verifyUser(email, password);
      
      if (!verifiedUser) {
        return { error: 'Email o contraseña incorrectos' };
      }

      localStorage.setItem(SESSION_KEY, JSON.stringify(verifiedUser));
      setUser(verifiedUser);
      return {};
    } catch (error) {
      console.error('Error signing in:', error);
      return { error: 'Error al iniciar sesión' };
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<{ error?: string }> => {
    try {
      const exists = await authDB.userExists(email);
      if (exists) {
        return { error: 'Este email ya está registrado' };
      }

      const newUser = await authDB.createUser(email, password, name);
      localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
      setUser(newUser);
      return {};
    } catch (error) {
      console.error('Error signing up:', error);
      return { error: 'Error al crear la cuenta' };
    }
  };

  const signOut = async () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  const getAllUsers = async (): Promise<LocalUser[]> => {
    if (!authDB.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = authDB.db!.transaction([USERS_STORE], 'readonly');
      const store = transaction.objectStore(USERS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const users = (request.result as StoredUser[]).map(({ passwordHash, ...user }) => user);
        resolve(users);
      };
      request.onerror = () => reject(request.error);
    });
  };

  const updateUser = async (id: string, updates: Partial<Omit<LocalUser, 'id' | 'createdAt'>>): Promise<{ error?: string }> => {
    try {
      if (!authDB.db) throw new Error('Database not initialized');

      return new Promise((resolve, reject) => {
        const transaction = authDB.db!.transaction([USERS_STORE], 'readwrite');
        const store = transaction.objectStore(USERS_STORE);
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
          const existingUser = getRequest.result as StoredUser | undefined;
          if (!existingUser) {
            resolve({ error: 'Usuario no encontrado' });
            return;
          }

          const updatedUser = { ...existingUser, ...updates };
          const updateRequest = store.put(updatedUser);

          updateRequest.onsuccess = () => {
            // Update session if updating current user
            if (user && user.id === id) {
              const { passwordHash, ...userWithoutPassword } = updatedUser;
              localStorage.setItem(SESSION_KEY, JSON.stringify(userWithoutPassword));
              setUser(userWithoutPassword);
            }
            resolve({});
          };
          updateRequest.onerror = () => reject(updateRequest.error);
        };
        getRequest.onerror = () => reject(getRequest.error);
      });
    } catch (error) {
      console.error('Error updating user:', error);
      return { error: 'Error al actualizar el usuario' };
    }
  };

  const deleteUser = async (id: string): Promise<{ error?: string }> => {
    try {
      if (!authDB.db) throw new Error('Database not initialized');

      // Prevent deleting yourself
      if (user && user.id === id) {
        return { error: 'No puedes eliminar tu propia cuenta' };
      }

      return new Promise((resolve, reject) => {
        const transaction = authDB.db!.transaction([USERS_STORE], 'readwrite');
        const store = transaction.objectStore(USERS_STORE);
        const request = store.delete(id);

        request.onsuccess = () => resolve({});
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      return { error: 'Error al eliminar el usuario' };
    }
  };

  return {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
    getAllUsers,
    updateUser,
    deleteUser,
  };
};
