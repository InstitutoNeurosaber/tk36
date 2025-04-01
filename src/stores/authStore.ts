import { create } from 'zustand';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  type User
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, reconnectFirestore } from '../lib/firebase';
import { authService } from '../services/authService';
import type { UserData } from '../types/user';

interface AuthState {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchUserData: (userId: string) => Promise<UserData | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userData: null,
  loading: true,
  error: null,

  fetchUserData: async (userId: string) => {
    try {
      // Tentar reconectar antes de buscar dados
      await reconnectFirestore();

      const userData = await authService.fetchUserData(userId);
      if (userData) {
        set({ userData });
      }
      return userData;
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      // Não propagar erro para não bloquear o fluxo
      return null;
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });
      const result = await signInWithEmailAndPassword(auth, email, password);
      await get().fetchUserData(result.user.uid);
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ loading: true, error: null });
      const { user } = await authService.signInWithGoogle();
      await get().fetchUserData(user.uid);
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email: string, password: string, name: string) => {
    try {
      set({ loading: true, error: null });
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      const userData: UserData = {
        id: result.user.uid,
        email: result.user.email!,
        name,
        role: 'user',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date()
      };
      
      await setDoc(doc(db, 'users', result.user.uid), userData);
      set({ userData });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null });
      await firebaseSignOut(auth);
      set({ userData: null });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  }
}));

// Observar mudanças no estado de autenticação
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userData = await useAuthStore.getState().fetchUserData(user.uid);
    useAuthStore.setState({ user, userData, loading: false });
  } else {
    useAuthStore.setState({ user: null, userData: null, loading: false });
  }
});