import { useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/authService';

export function useAuth() {
  const { 
    user,
    userData,
    loading,
    error,
    setUser,
    setUserData,
    setLoading,
    setError 
  } = useAuthStore();

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const user = await authService.signIn(email, password);
      const userData = await authService.fetchUserData(user.uid);
      setUser(user);
      setUserData(userData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setUser, setUserData]);

  const signInWithGoogle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { user, userData } = await authService.signInWithGoogle();
      setUser(user);
      setUserData(userData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao fazer login com Google');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setUser, setUserData]);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await authService.signOut();
      setUser(null);
      setUserData(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao fazer logout');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setUser, setUserData]);

  return {
    user,
    userData,
    loading,
    error,
    signIn,
    signInWithGoogle,
    signOut
  };
}