import { 
  collection,
  doc, 
  deleteDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import {
  deleteUser as deleteAuthUser,
  updatePassword as updateAuthPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  getAuth
} from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import type { User } from '../types/user';

export const userService = {
  async deleteUserAccount(userId: string): Promise<void> {
    try {
      // Verificar se é admin tentando excluir
      const adminDoc = await getDoc(doc(db, 'users', auth.currentUser?.uid || ''));
      if (!adminDoc.exists() || adminDoc.data().role !== 'admin') {
        throw new Error('Apenas administradores podem excluir usuários');
      }

      // Não permitir excluir o próprio admin
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('Usuário não encontrado');
      }

      const userData = userDoc.data();
      if (userData.email === 'thiagomateus.ti@neurosaber.com.br') {
        throw new Error('Não é possível excluir o usuário administrador principal');
      }

      // Excluir documento do Firestore
      await deleteDoc(doc(db, 'users', userId));

      // Excluir usuário do Authentication
      try {
        const userAuth = await getAuth().getUser(userId);
        await deleteAuthUser(userAuth);
      } catch (authError) {
        console.error('Erro ao excluir usuário do Authentication:', authError);
        // Continua mesmo se falhar no Auth, pelo menos removemos do Firestore
      }

    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      throw new Error(error instanceof Error ? error.message : 'Erro ao excluir usuário');
    }
  },

  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    try {
      // Verificar se é admin tentando alterar
      const adminDoc = await getDoc(doc(db, 'users', auth.currentUser?.uid || ''));
      if (!adminDoc.exists() || adminDoc.data().role !== 'admin') {
        throw new Error('Apenas administradores podem alterar senhas');
      }

      // Não permitir alterar senha do admin principal por segurança
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('Usuário não encontrado');
      }

      const userData = userDoc.data();
      if (userData.email === 'thiagomateus.ti@neurosaber.com.br') {
        throw new Error('Não é possível alterar a senha do administrador principal por este método');
      }

      // Atualizar senha no Authentication
      try {
        await getAuth().updateUser(userId, {
          password: newPassword
        });
      } catch (authError) {
        console.error('Erro ao atualizar senha no Authentication:', authError);
        throw new Error('Erro ao atualizar senha no sistema de autenticação');
      }

      // Registrar alteração no Firestore
      await updateDoc(doc(db, 'users', userId), {
        passwordUpdatedAt: Timestamp.now(),
        passwordUpdatedBy: auth.currentUser?.uid,
        updatedAt: Timestamp.now()
      });

    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      throw new Error(error instanceof Error ? error.message : 'Erro ao atualizar senha');
    }
  },

  async updateUserData(userId: string, data: Partial<User>): Promise<void> {
    try {
      // Verificar se é admin tentando alterar
      const adminDoc = await getDoc(doc(db, 'users', auth.currentUser?.uid || ''));
      if (!adminDoc.exists() || adminDoc.data().role !== 'admin') {
        throw new Error('Apenas administradores podem editar usuários');
      }

      // Não permitir alterar dados do admin principal
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('Usuário não encontrado');
      }

      const userData = userDoc.data();
      if (userData.email === 'thiagomateus.ti@neurosaber.com.br') {
        throw new Error('Não é possível alterar dados do administrador principal');
      }

      // Atualizar dados no Firestore
      await updateDoc(doc(db, 'users', userId), {
        ...data,
        updatedAt: Timestamp.now(),
        updatedBy: auth.currentUser?.uid
      });

    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw new Error(error instanceof Error ? error.message : 'Erro ao atualizar usuário');
    }
  }
};