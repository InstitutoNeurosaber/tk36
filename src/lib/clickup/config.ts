import { 
  collection, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc, 
  getDocs,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import type { ClickUpConfig } from '../../types/clickup';

export class ClickUpConfigManager {
  private collectionRef = collection(db, 'clickup_configs');

  async getConfig(userId: string): Promise<ClickUpConfig | null> {
    const q = query(this.collectionRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const configDoc = snapshot.docs[0];
      return {
        id: configDoc.id,
        ...configDoc.data(),
        createdAt: configDoc.data().createdAt.toDate(),
        updatedAt: configDoc.data().updatedAt.toDate()
      } as ClickUpConfig;
    }
    
    return null;
  }

  async saveConfig(data: Omit<ClickUpConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<ClickUpConfig> {
    const now = Timestamp.now();
    const docRef = await addDoc(this.collectionRef, {
      ...data,
      createdAt: now,
      updatedAt: now
    });

    return {
      ...data,
      id: docRef.id,
      createdAt: now.toDate(),
      updatedAt: now.toDate()
    };
  }

  async updateConfig(id: string, data: Partial<ClickUpConfig>): Promise<void> {
    const configRef = doc(this.collectionRef, id);
    await updateDoc(configRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
  }

  async deleteConfig(id: string): Promise<void> {
    await deleteDoc(doc(this.collectionRef, id));
  }
}