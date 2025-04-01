import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { 
  getFirestore, 
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
  initializeFirestore,
  disableNetwork,
  enableNetwork,
  waitForPendingWrites,
  setLogLevel,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import localforage from 'localforage';

// Configurar nível de log do Firestore
setLogLevel('error');

// Configurar cache local
localforage.config({
  name: 'neuro-painel',
  storeName: 'cache'
});

const firebaseConfig = {
  apiKey: "AIzaSyBNGvGob1xRGf86twcBxEaGRMxvZH8sOT0",
  authDomain: "neuro-painel.firebaseapp.com",
  projectId: "neuro-painel",
  storageBucket: "neuro-painel.appspot.com",
  messagingSenderId: "790923095549",
  appId: "1:790923095549:web:6aff1a9ff9c9ff2f31bd94"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore com configurações otimizadas
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
    sizeBytes: 100 * 1024 * 1024 // 100MB de cache
  }),
  experimentalForceLongPolling: true, // Usar apenas uma opção de polling
  ignoreUndefinedProperties: true
});

// Inicializar outros serviços
const auth = getAuth(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Configurar persistência de autenticação
setPersistence(auth, browserLocalPersistence).catch(console.error);

// Configurar emuladores em desenvolvimento
/* if (import.meta.env.DEV) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
} */

// Estado da conexão
let isOnline = navigator.onLine;
let persistenceEnabled = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000;
const OFFLINE_CACHE_KEY = 'firestore_offline_cache';

// Habilitar persistência offline com retry
const enablePersistence = async (retryCount = 0) => {
  if (persistenceEnabled) return;

  try {
    await enableIndexedDbPersistence(db, {
      synchronizeTabs: true,
      forceOwnership: false
    });
    persistenceEnabled = true;
    console.log('Persistência offline habilitada com sucesso');
  } catch (err: any) {
    if (err.code === 'failed-precondition') {
      console.warn('Múltiplas abas abertas, persistência disponível em apenas uma');
      persistenceEnabled = true; // Consideramos ok neste caso
    } else if (err.code === 'unimplemented') {
      console.warn('Navegador não suporta persistência offline');
      persistenceEnabled = true; // Nada podemos fazer
    } else if (retryCount < 3) {
      console.warn(`Tentativa ${retryCount + 1} de habilitar persistência falhou, tentando novamente em 2s...`);
      setTimeout(() => enablePersistence(retryCount + 1), 2000);
    } else {
      console.error('Erro ao configurar persistência após várias tentativas:', err);
      // Tentar usar localforage como fallback
      try {
        await localforage.setItem(OFFLINE_CACHE_KEY, {
          enabled: true,
          timestamp: Date.now()
        });
      } catch (fallbackError) {
        console.error('Erro ao configurar cache fallback:', fallbackError);
      }
    }
  }
};

// Iniciar persistência
enablePersistence();

// Função para reconectar ao Firestore com retry
export const reconnectFirestore = async (attempt = 0): Promise<boolean> => {
  if (isOnline && attempt < MAX_RECONNECT_ATTEMPTS) {
    try {
      await enableNetwork(db);
      await waitForPendingWrites(db);
      console.log('Reconectado ao Firestore com sucesso');
      reconnectAttempts = 0;
      return true;
    } catch (error) {
      console.warn(`Tentativa ${attempt + 1} de reconexão falhou:`, error);
      
      // Tentar novamente após delay
      if (attempt < MAX_RECONNECT_ATTEMPTS - 1) {
        await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY));
        return reconnectFirestore(attempt + 1);
      }
      
      console.error('Máximo de tentativas de reconexão atingido');
      return false;
    }
  }
  return false;
};

// Função para desconectar do Firestore
export const disconnectFirestore = async (): Promise<boolean> => {
  if (!isOnline) return true;
  
  try {
    await waitForPendingWrites(db);
    await disableNetwork(db);
    isOnline = false;
    console.log('Desconectado do Firestore');
    return true;
  } catch (error) {
    console.error('Erro ao desconectar do Firestore:', error);
    return false;
  }
};

// Monitorar estado da conexão
window.addEventListener('online', async () => {
  isOnline = true;
  console.log('Conexão de rede restaurada');
  await reconnectFirestore();
});

window.addEventListener('offline', async () => {
  isOnline = false;
  console.log('Conexão de rede perdida');
  await disconnectFirestore();
});

// Verificar conexão inicial
if (!navigator.onLine) {
  disconnectFirestore();
}

export { app, db, auth, storage, functions };