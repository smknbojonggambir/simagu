import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut, Auth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

let authInstance: Auth | null = null;
let providerInstance: GoogleAuthProvider | null = null;

export const getFirebaseAuth = (): Auth | null => {
  if (typeof window === 'undefined') return null;
  if (!authInstance) {
    try {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      authInstance = getAuth(app);
    } catch (err) {
      console.warn('Firebase auth lazy init notice:', err);
    }
  }
  return authInstance;
};

const getGoogleProvider = (): GoogleAuthProvider => {
  if (!providerInstance) {
    providerInstance = new GoogleAuthProvider();
    providerInstance.addScope('https://www.googleapis.com/auth/drive');
    providerInstance.addScope('https://www.googleapis.com/auth/drive.file');
    providerInstance.addScope('https://www.googleapis.com/auth/drive.metadata');
  }
  return providerInstance;
};

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
): (() => void) => {
  try {
    const auth = getFirebaseAuth();
    if (!auth) {
      if (onAuthFailure) onAuthFailure();
      return () => {};
    }

    return onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        if (cachedAccessToken) {
          if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
        } else if (!isSigningIn) {
          if (onAuthFailure) onAuthFailure();
        }
      } else {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    });
  } catch (err) {
    console.warn('initAuth handled:', err);
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Layanan autentikasi Google tidak tersedia di lingkungan ini.');
  }

  try {
    isSigningIn = true;
    const provider = getGoogleProvider();
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal memperoleh access token Google Drive.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const logoutGoogle = async () => {
  const auth = getFirebaseAuth();
  if (auth) {
    await signOut(auth);
  }
  cachedAccessToken = null;
};
