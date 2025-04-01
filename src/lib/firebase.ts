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
  ignoreUndefinedProperties: true
});

// Inicializar outros serviços
const auth = getAuth(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Configurar persistência de autenticação
setPersistence(auth, browserLocalPersistence).catch(console.error);

// Configurar emuladores APENAS em desenvolvimento local
const isLocalDev = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' ||
                   window.location.hostname.includes('stackblitz');

if (isLocalDev && import.meta.env.DEV) {
  try {
    console.log('Conectando aos emuladores Firebase...');
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('Emuladores Firebase conectados com sucesso');
  } catch (error) {
    console.warn('Erro ao conectar aos emuladores:', error);
  }
}

// Estado da conexão
let isOnline = navigator.onLine;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000;
const OFFLINE_CACHE_KEY = 'firestore_offline_cache';

// Habilitar persistência offline com retry
const enablePersistence = async (retryCount = 0) => {
  if (retryCount >= 3) return;

  try {
    await enableIndexedDbPersistence(db, {
      synchronizeTabs: true,
      forceOwnership: false
    });
    console.log('Persistência offline habilitada com sucesso');
  } catch (err: any) {
    if (err.code === 'failed-precondition') {
      console.warn('Múltiplas abas abertas, persistência disponível em apenas uma');
    } else if (err.code === 'unimplemented') {
      console.warn('Navegador não suporta persistência offline');
    } else {
      console.warn(`Tentativa ${retryCount + 1} de habilitar persistência falhou, tentando novamente em 2s...`);
      setTimeout(() => enablePersistence(retryCount + 1), 2000);
    }
  }
};

// Iniciar persistência
enablePersistence();

// Função para reconectar ao Firestore
export const reconnectFirestore = async (attempt = 0): Promise<boolean> => {
  if (attempt >= MAX_RECONNECT_ATTEMPTS) {
    console.error('Máximo de tentativas de reconexão atingido');
    return false;
  }

  try {
    await enableNetwork(db);
    await waitForPendingWrites(db);
    console.log('Reconectado ao Firestore com sucesso');
    reconnectAttempts = 0;
    return true;
  } catch (error) {
    console.warn(`Tentativa ${attempt + 1} de reconexão falhou:`, error);
    
    // Tentar novamente após delay
    await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY));
    return reconnectFirestore(attempt + 1);
  }
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
