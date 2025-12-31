import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged, 
  updateProfile,
  updatePassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, getDocs, query, where, addDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { AuthContextType, User, AppUser } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [systemUser, setSystemUser] = useState<AppUser | null>(null);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [trialExpiry, setTrialExpiry] = useState<string | null>(null);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<'trial' | 'pro' | 'enterprise'>('trial');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Manual session handling for Database-only authenticated users
  const [isManualAuth, setIsManualAuth] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (isManualAuth) return; // Prevent Auth state from overriding manual DB session
      
      setLoading(true);
      if (currentUser) {
        await syncUserData(currentUser.uid, {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          email: currentUser.email,
          photoURL: currentUser.photoURL,
        });
      } else {
        // Check if there is a manual session stored in localStorage
        const manualSession = localStorage.getItem('manual_db_session');
        if (manualSession) {
          const sessionData = JSON.parse(manualSession);
          setIsManualAuth(true);
          await syncUserData(sessionData.uid, sessionData);
        } else {
          clearSession();
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isManualAuth]);

  const syncUserData = async (uid: string, userBase: User) => {
    const clinicDocRef = doc(db, 'clinics', uid);
    
    // Subscribe to clinic data
    onSnapshot(clinicDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setIsSetupComplete(data.settings?.setupComplete || false);
        setIsVerified(data.settings?.isVerified || false);
        setTrialExpiry(data.trialExpiry || null);
        setCurrentPlan(data.plan || 'trial');

        if (data.plan === 'trial' && data.trialExpiry) {
            const expiryDate = new Date(data.trialExpiry);
            const now = new Date();
            setIsTrialExpired(now > expiryDate);
        } else {
            setIsTrialExpired(false);
        }
      }
    });

    setFirebaseUser(userBase);

    const savedSession = localStorage.getItem(`system_session_${uid}`);
    if (savedSession) {
      try {
        setSystemUser(JSON.parse(savedSession));
      } catch (e) {
        console.error("Failed to parse system session");
      }
    }
  };

  const clearSession = () => {
    setFirebaseUser(null);
    setSystemUser(null);
    setTrialExpiry(null);
    setIsTrialExpired(false);
    setIsVerified(false);
    setIsSetupComplete(false);
    setCurrentPlan('trial');
    setIsManualAuth(false);
    localStorage.removeItem('manual_db_session');
  };

  const loginSaaS = async (email: string, pass: string, remember: boolean = true) => {
    setError(null);
    try {
      // 1. Try standard Firebase Auth first
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      // 2. If Auth fails, check Firestore 'clinics' fallback
      const q = query(collection(db, 'clinics'), where('ownerEmail', '==', email), where('ownerPassword', '==', pass));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const clinicData = snap.docs[0].data();
        const manualUser: User = {
          uid: snap.docs[0].id,
          displayName: clinicData.ownerName,
          email: clinicData.ownerEmail,
          photoURL: null
        };
        
        if (remember) {
          localStorage.setItem('manual_db_session', JSON.stringify(manualUser));
        }
        
        setIsManualAuth(true);
        await syncUserData(snap.docs[0].id, manualUser);
      } else {
        // Fallback failed too - provide generic friendly error
        const message = "Access Denied. Incorrect email or password.";
        setError(message);
        throw new Error(message);
      }
    }
  };

  const sendRealEmail = async (email: string, name: string, otp: string, type: 'verify' | 'reset' = 'verify') => {
    if (!email) return;
    const SERVICE_ID = 'service_2mkov1h'; 
    const TEMPLATE_ID = 'ec15454546587464';    
    const PUBLIC_KEY = 'Yc3tBFQBCMQM1rwV-'; 
    const expiryTime = new Date(Date.now() + 15 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const data = {
      service_id: SERVICE_ID,
      template_id: TEMPLATE_ID,
      user_id: PUBLIC_KEY,
      template_params: {
        to_name: name || 'User',
        to_email: email,
        email: email,
        recipient_email: email,
        passcode: otp,
        otp: otp,
        time: expiryTime,
        project_name: 'AB Clinic System',
        subject: type === 'reset' ? 'Reset your password' : 'Verify your account'
      }
    };

    try {
      await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (err) {
      console.error('Email failed:', err);
    }
  };

  const signupSaaS = async (email: string, pass: string, name: string, phone: string) => {
    setError(null);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(res.user, { displayName: name });
      
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const trialExpiryDate = new Date();
      trialExpiryDate.setDate(trialExpiryDate.getDate() + 14);

      await setDoc(doc(db, 'clinics', res.user.uid), {
        ownerName: name,
        ownerEmail: email,
        ownerPassword: pass, // Store initial password for DB-auth fallback
        phone: phone,
        plan: 'trial',
        createdAt: new Date().toISOString(),
        trialExpiry: trialExpiryDate.toISOString(),
        settings: { setupComplete: false, isVerified: false }
      });

      await setDoc(doc(db, 'verifications', res.user.uid), { otp, email, createdAt: new Date().toISOString() });
      await sendRealEmail(email, name, otp);

      setFirebaseUser({ uid: res.user.uid, displayName: name, email: email, photoURL: null });
      setIsSetupComplete(false);
      setIsVerified(false);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const verifyOTP = async (code: string) => {
    if (!firebaseUser) return;
    setError(null);
    try {
      const verifyDoc = await getDoc(doc(db, 'verifications', firebaseUser.uid));
      if (verifyDoc.exists() && verifyDoc.data().otp === code) {
        await updateDoc(doc(db, 'clinics', firebaseUser.uid), { 'settings.isVerified': true });
        setIsVerified(true);
      } else {
        throw new Error("Invalid verification code. Please check your email.");
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const resendOTP = async () => {
    if (!firebaseUser || !firebaseUser.email) return;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await updateDoc(doc(db, 'verifications', firebaseUser.uid), { otp, createdAt: new Date().toISOString() });
    await sendRealEmail(firebaseUser.email, firebaseUser.displayName || 'User', otp);
  };

  const requestPasswordResetOTP = async (email: string) => {
    setError(null);
    try {
      const q = query(collection(db, 'clinics'), where('ownerEmail', '==', email));
      const snap = await getDocs(q);
      if (snap.empty) throw new Error("No registered clinic found with this email.");
      
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const clinicData = snap.docs[0].data();
      const clinicId = snap.docs[0].id;
      
      await setDoc(doc(db, 'password_resets', email), { 
        otp, 
        email, 
        clinicId: clinicId,
        createdAt: new Date().toISOString() 
      });
      
      await sendRealEmail(email, clinicData.ownerName, otp, 'reset');
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const verifyPasswordResetOTP = async (email: string, otp: string) => {
    setError(null);
    try {
      const resetDoc = await getDoc(doc(db, 'password_resets', email));
      if (!resetDoc.exists() || resetDoc.data().otp !== otp) {
        throw new Error("Invalid reset code. Please check your email.");
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const completePasswordReset = async (email: string, otp: string, newPass: string) => {
    setError(null);
    try {
      const resetDoc = await getDoc(doc(db, 'password_resets', email));
      if (resetDoc.exists() && resetDoc.data().otp === otp) {
        const clinicId = resetDoc.data().clinicId;
        
        // 1. Update the 'clinics' collection for the Terminal Login bypass
        await updateDoc(doc(db, 'clinics', clinicId), { ownerPassword: newPass });

        // 2. Update the 'admin' user in app_users for the secondary login
        const q = query(
          collection(db, 'app_users'), 
          where('clinicId', '==', clinicId), 
          where('role', '==', 'admin')
        );
        const userSnap = await getDocs(q);
        
        if (!userSnap.empty) {
            const userId = userSnap.docs[0].id;
            await updateDoc(doc(db, 'app_users', userId), { password: newPass });
        }
        
        await deleteDoc(doc(db, 'password_resets', email));
      } else {
        throw new Error("Reset session expired. Please start over.");
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const completeAdminSetup = async (adminData: Omit<AppUser, 'id'>) => {
    if (!firebaseUser) return;
    try {
      const userRef = await addDoc(collection(db, 'app_users'), {
        ...adminData,
        clinicId: firebaseUser.uid,
        role: 'admin',
        permissions: { 
          dashboard: { access: true }, 
          front_desk: { access: true }, 
          accountant: { access: true }, 
          analytics: { access: true }, 
          system_control: { access: true },
          examination_room: { access: true },
          social_media: { access: true }
        }
      });
      await updateDoc(doc(db, 'clinics', firebaseUser.uid), { 'settings.setupComplete': true });
      setIsSetupComplete(true);
      const fullUser = { id: userRef.id, ...adminData, role: 'admin' } as AppUser;
      setSystemUser(fullUser);
      localStorage.setItem(`system_session_${firebaseUser.uid}`, JSON.stringify(fullUser));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loginSystem = async (username: string, pass: string, remember: boolean) => {
    if (!firebaseUser) return;
    setError(null);
    try {
      const q = query(collection(db, 'app_users'), where('clinicId', '==', firebaseUser.uid), where('username', '==', username), where('password', '==', pass));
      const snapshot = await getDocs(q);
      if (snapshot.empty) throw new Error("Invalid credentials.");
      const userData = snapshot.docs[0].data() as AppUser;
      const fullUser = { id: snapshot.docs[0].id, ...userData };
      
      if (remember) {
        localStorage.setItem(`system_session_${firebaseUser.uid}`, JSON.stringify(fullUser));
      } else {
        localStorage.removeItem(`system_session_${firebaseUser.uid}`);
      }
      
      setSystemUser(fullUser);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const logoutSystem = () => { if (firebaseUser) localStorage.removeItem(`system_session_${firebaseUser.uid}`); setSystemUser(null); };
  
  const logoutSaaS = async () => { 
    await signOut(auth); 
    clearSession();
  };
  
  const updateUserProfile = async (data: any) => {
    if (!firebaseUser || !systemUser) return;
    
    // Update Firebase Auth if possible (only if standard login was used)
    if (auth.currentUser && !isManualAuth) {
        if (data.displayName) await updateProfile(auth.currentUser, { displayName: data.displayName });
        if (data.password) await updatePassword(auth.currentUser, data.password);
    }

    // Update 'app_users' record
    const userDocRef = doc(db, 'app_users', systemUser.id);
    const updates: any = {};
    if (data.displayName) updates.displayName = data.displayName;
    if (data.photoURL) updates.photoURL = data.photoURL;
    if (data.password) updates.password = data.password;
    
    await updateDoc(userDocRef, updates);

    // If updating owner, also sync to 'clinics'
    if (systemUser.role === 'admin') {
        const clinicUpdates: any = {};
        if (data.displayName) clinicUpdates.ownerName = data.displayName;
        if (data.password) clinicUpdates.ownerPassword = data.password;
        await updateDoc(doc(db, 'clinics', firebaseUser.uid), clinicUpdates);
    }

    const updatedSystemUser = { ...systemUser, ...updates };
    setSystemUser(updatedSystemUser);
    
    if (localStorage.getItem(`system_session_${firebaseUser.uid}`)) {
        localStorage.setItem(`system_session_${firebaseUser.uid}`, JSON.stringify(updatedSystemUser));
    }
  };

  return (
    <AuthContext.Provider value={{ 
      firebaseUser, loading, loginSaaS, signupSaaS, logoutSaaS, 
      systemUser, loginSystem, logoutSystem,
      isSetupComplete, completeAdminSetup,
      isVerified, verifyOTP, resendOTP, trialExpiry, isTrialExpired, currentPlan,
      requestPasswordResetOTP, verifyPasswordResetOTP, completePasswordReset,
      error, updateUserProfile 
    } as AuthContextType}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
