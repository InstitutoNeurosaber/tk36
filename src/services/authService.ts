import { 
  signInWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  type User
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { UserData } from '../types/user';

export const authService = {
  async signIn(email: string, password: string): Promise<User> {
    try {
      // Verificar se é o email do admin
      const isAdmin = email.toLowerCase() === 'thiagomateus.ti@neurosaber.com.br';
      
      // Tentar fazer login
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Verificar se o usuário existe no Firestore
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      // Se não existir, criar documento do usuário
      if (!userDoc.exists()) {
        const userData: UserData = {
          id: result.user.uid,
          email: result.user.email!.toLowerCase(),
          name: isAdmin ? 'Thiago Mateus' : 'Usuário',
          role: isAdmin ? 'admin' : 'user',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: new Date()
        };
        
        await setDoc(doc(db, 'users', result.user.uid), {
          ...userData,
          createdAt: Timestamp.fromDate(userData.createdAt),
          updatedAt: Timestamp.fromDate(userData.updatedAt),
          lastLogin: Timestamp.fromDate(userData.lastLogin)
        });
      } else {
        // Atualizar último login
        await setDoc(doc(db, 'users', result.user.uid), {
          lastLogin: Timestamp.now(),
          updatedAt: Timestamp.now()
        }, { merge: true });
      }
      
      return result.user;
    } catch (error) {
      console.error('Erro no login:', error);
      if (error instanceof Error) {
        if (error.message.includes('auth/invalid-credential') || 
            error.message.includes('auth/invalid-email') ||
            error.message.includes('auth/user-not-found') ||
            error.message.includes('auth/wrong-password')) {
          throw new Error('Email ou senha inválidos');
        }
        if (error.message.includes('auth/too-many-requests')) {
          throw new Error('Muitas tentativas de login. Tente novamente mais tarde');
        }
        if (error.message.includes('auth/network-request-failed')) {
          throw new Error('Erro de conexão. Verifique sua internet');
        }
        throw error;
      }
      throw new Error('Erro ao fazer login');
    }
  },

  async signInWithGoogle(): Promise<{ user: User; userData: UserData }> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Verificar se é o email do admin
      const isAdmin = result.user.email?.toLowerCase() === 'thiagomateus.ti@neurosaber.com.br';
      
      // Verificar se o usuário já existe
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (!userDoc.exists()) {
        const userData: UserData = {
          id: result.user.uid,
          email: result.user.email!.toLowerCase(),
          name: isAdmin ? 'Thiago Mateus' : (result.user.displayName || 'Usuário Google'),
          role: isAdmin ? 'admin' : 'user',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: new Date()
        };
        
        await setDoc(doc(db, 'users', result.user.uid), {
          ...userData,
          createdAt: Timestamp.fromDate(userData.createdAt),
          updatedAt: Timestamp.fromDate(userData.updatedAt),
          lastLogin: Timestamp.fromDate(userData.lastLogin)
        });
        
        return { user: result.user, userData };
      }
      
      // Atualizar último login
      await setDoc(doc(db, 'users', result.user.uid), {
        lastLogin: Timestamp.now(),
        updatedAt: Timestamp.now()
      }, { merge: true });
      
      const data = userDoc.data();
      return { 
        user: result.user, 
        userData: { 
          ...data,
          id: userDoc.id,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          lastLogin: data.lastLogin?.toDate() || new Date()
        } as UserData
      };
    } catch (error) {
      console.error('Erro no login com Google:', error);
      if (error instanceof Error) {
        if (error.message.includes('popup-closed-by-user')) {
          throw new Error('Login cancelado pelo usuário');
        }
        if (error.message.includes('network-request-failed')) {
          throw new Error('Erro de conexão. Verifique sua internet');
        }
        throw error;
      }
      throw new Error('Erro ao fazer login com Google');
    }
  },

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw new Error('Erro ao fazer logout');
    }
  },

  async fetchUserData(userId: string): Promise<UserData | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          ...data,
          id: userDoc.id,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          lastLogin: data.lastLogin?.toDate()
        } as UserData;
      }
      
      // Se não existir e for o email do admin, criar o documento
      const user = auth.currentUser;
      if (user?.email?.toLowerCase() === 'thiagomateus.ti@neurosaber.com.br') {
        const userData: UserData = {
          id: userId,
          email: 'thiagomateus.ti@neurosaber.com.br',
          name: 'Thiago Mateus',
          role: 'admin',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: new Date()
        };
        
        await setDoc(doc(db, 'users', userId), {
          ...userData,
          createdAt: Timestamp.fromDate(userData.createdAt),
          updatedAt: Timestamp.fromDate(userData.updatedAt),
          lastLogin: Timestamp.fromDate(userData.lastLogin)
        });
        
        return userData;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      throw new Error('Erro ao buscar dados do usuário');
    }
  },

  async ensureAdminUser(): Promise<void> {
    try {
      // Verificar se o usuário admin já existe
      const adminQuery = query(
        collection(db, 'users'), 
        where('email', '==', 'thiagomateus.ti@neurosaber.com.br')
      );
      
      const snapshot = await getDocs(adminQuery);
      
      if (snapshot.empty) {
        // Criar documento do usuário admin
        const now = Timestamp.now();
        const adminData = {
          id: 'admin',
          email: 'thiagomateus.ti@neurosaber.com.br',
          name: 'Thiago Mateus',
          role: 'admin',
          active: true,
          createdAt: now,
          updatedAt: now,
          lastLogin: null
        };
        
        await setDoc(doc(db, 'users', 'admin'), adminData);
        console.log('Usuário admin criado com sucesso');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar usuário admin:', error);
    }
  }
};

// Garantir que o usuário admin existe ao inicializar o serviço
authService.ensureAdminUser().catch(console.error);