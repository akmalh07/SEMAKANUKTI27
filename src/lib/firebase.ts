import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export async function testFirebaseConnection() {
  try {
    // Uji sambungan ke Firestore server
    await getDocFromServer(doc(db, 'calon_2027', '000000000000'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline:', error.message);
    }
  }
}
