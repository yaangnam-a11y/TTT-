import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  orderBy,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { PersonalInfo, MentalHealthResult } from './types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Error handling types and function as specified in skill guidelines
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is currently offline or connecting...');
    }
  }
}
testConnection();

// Authentication helpers
export async function loginWithGoogle(): Promise<FirebaseUser | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    console.error('Google Sign-in failed:', err);
    throw err;
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// 1. Save or sync user profile
export async function saveUserProfile(userId: string, profile: PersonalInfo): Promise<void> {
  const userPath = `users/${userId}`;
  try {
    await setDoc(doc(db, 'users', userId), {
      userId,
      gender: profile.gender || 'ไม่ระบุ',
      age: profile.age || '',
      year: profile.year || 'ปี 1',
      gpa: profile.gpa || '',
      hasChronicDisease: profile.hasChronicDisease,
      chronicDiseaseDetail: profile.chronicDiseaseDetail || '-',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, userPath);
  }
}

// 2. Fetch user profile
export async function getUserProfile(userId: string): Promise<PersonalInfo | null> {
  const userPath = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      const data = snap.data();
      return {
        gender: data.gender || '',
        age: data.age || '',
        year: data.year || '',
        gpa: data.gpa || '',
        hasChronicDisease: data.hasChronicDisease || 'ไม่มี',
        chronicDiseaseDetail: data.chronicDiseaseDetail || ''
      };
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, userPath);
    return null;
  }
}

// 3. Save mental health assessment record to history subcollection
export interface StoredMentalRecord {
  recordId: string;
  userId: string;
  createdAt: string;
  dateFormatted: string;
  stressScore: number;
  stressLevel: string;
  depressionSummary: string;
  nineQScore: number;
  eightQScore: number;
  resilienceScore: number;
  resilienceLevel: string;
  happinessScore: number;
  happinessLevel: string;
  burnoutScore: number;
  burnoutLevel: string;
  preTestScore: number;
  postTestScore: number;
  primaryRisk: string;
}

export async function saveMentalHealthRecord(
  userId: string,
  result: MentalHealthResult,
  preScore: number,
  postScore: number
): Promise<string> {
  const recordId = `rec_${Date.now()}`;
  const recordPath = `users/${userId}/records/${recordId}`;

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const recordPayload: StoredMentalRecord = {
    recordId,
    userId,
    createdAt: now.toISOString(),
    dateFormatted,
    stressScore: result.stress.score,
    stressLevel: result.stress.level,
    depressionSummary: result.depression.summaryLevel,
    nineQScore: result.depression.nineQScore,
    eightQScore: result.depression.eightQScore,
    resilienceScore: result.resilience.score,
    resilienceLevel: result.resilience.level,
    happinessScore: result.happiness.score,
    happinessLevel: result.happiness.level,
    burnoutScore: result.burnout.score,
    burnoutLevel: result.burnout.level,
    preTestScore: preScore,
    postTestScore: postScore,
    primaryRisk: result.primaryRisk
  };

  try {
    await setDoc(doc(db, 'users', userId, 'records', recordId), recordPayload);
    return recordId;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, recordPath);
    return recordId;
  }
}

// 4. Fetch historical mental health assessment records for user
export async function getMentalHealthHistory(userId: string): Promise<StoredMentalRecord[]> {
  const collectionPath = `users/${userId}/records`;
  try {
    const q = query(collection(db, 'users', userId, 'records'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const records: StoredMentalRecord[] = [];
    snapshot.forEach(docSnap => {
      records.push(docSnap.data() as StoredMentalRecord);
    });
    return records;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, collectionPath);
    return [];
  }
}

// 5. Save Satisfaction Survey
export async function saveSatisfactionSurvey(
  userId: string,
  ratings: Record<number, number>,
  feedback: string
): Promise<string> {
  const surveyId = `survey_${Date.now()}`;
  const path = `satisfaction_surveys/${surveyId}`;

  try {
    await setDoc(doc(db, 'satisfaction_surveys', surveyId), {
      surveyId,
      userId,
      ratings,
      feedback: feedback || '',
      submittedAt: new Date().toISOString()
    });
    return surveyId;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    return surveyId;
  }
}
