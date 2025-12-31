
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, 
  doc, query, where, orderBy, limit, serverTimestamp, setDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { DataContextType, Appointment, Moderator, Shift, ModeratorSession, Transaction, LogEntry, AppUser, PrintSettings, TabPrintConfig, PrintElement } from '../types';

const DataContext = createContext<DataContextType | undefined>(undefined);

// --- GENERIC DESIGN GENERATOR ---
const createGenericElements = (paperSize: 'A4' | 'A5'): PrintElement[] => {
    return [
        // Clinic Header
        { id: 'clinic_name', type: 'text', x: 5, y: 3, w: 90, h: 5, content: '{{CLINIC_NAME}}', fontSize: 24, fontWeight: 'bold', align: 'center', zIndex: 10 },
        { id: 'dr_name', type: 'text', x: 5, y: 8, w: 90, h: 4, content: '{{DOCTOR_NAME}}', fontSize: 14, fontWeight: 'bold', align: 'center', zIndex: 10 },
        { id: 'specialty', type: 'text', x: 5, y: 12, w: 90, h: 4, content: '{{SPECIALTY}}', fontSize: 10, align: 'center', zIndex: 10 },
        
        // Metadata Row
        { id: 'date', type: 'text', x: 75, y: 18, w: 20, h: 4, content: 'Date: {{DATE}}', fontSize: 10, align: 'right', zIndex: 10 },
        { id: 'patient_name', type: 'text', x: 5, y: 18, w: 50, h: 4, content: 'Patient: {{PATIENT_NAME}}', fontSize: 12, fontWeight: 'bold', align: 'left', zIndex: 10 },
        { id: 'age', type: 'text', x: 55, y: 18, w: 15, h: 4, content: 'Age: {{AGE}}', fontSize: 10, align: 'left', zIndex: 10 },
        
        // Divider
        { id: 'divider', type: 'text', x: 5, y: 22, w: 90, h: 1, content: '____________________________________________________________________________________', fontSize: 10, align: 'center', zIndex: 5 },

        // Main Data Block
        { id: 'data_block', type: 'data_block', x: 5, y: 28, w: 90, h: 60, content: ':: DATA SPACE ::', fontSize: 12, align: 'left', zIndex: 1 },

        // Footer
        { id: 'footer', type: 'text', x: 5, y: 92, w: 90, h: 5, content: '{{PHONES}} | {{ADDRESSES}}', fontSize: 9, align: 'center', zIndex: 10 }
    ];
};

const DEFAULT_TAB_CONFIG = (size: 'A4' | 'A5'): TabPrintConfig => ({
  paperSize: size,
  backgroundUrl: undefined,
  elements: createGenericElements(size)
});

const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  rx: DEFAULT_TAB_CONFIG('A5'),
  requests: DEFAULT_TAB_CONFIG('A5'),
  reports: DEFAULT_TAB_CONFIG('A4'),
  clinicName: '',
  doctorName: '',
  phones: [],
  addresses: [],
  specialty: 'General Practice'
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { firebaseUser } = useAuth();
  const clinicId = firebaseUser?.uid;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorStatus, setDoctorStatusLocal] = useState<'available' | 'resting'>('available');
  const [callingPatientId, setCallingPatientIdLocal] = useState<string | null>(null);
  
  // Assistant Doctor State
  const [assistantDoctorStatus, setAssistantDoctorStatusLocal] = useState<'available' | 'resting'>('available');
  const [callingPatientIdAssistant, setCallingPatientIdAssistantLocal] = useState<string | null>(null);
  const [hasAssistantDoctor, setHasAssistantDoctor] = useState(false);

  const [isBookingPaused, setIsBookingPaused] = useState(false);
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [moderatorSessions, setModeratorSessions] = useState<ModeratorSession[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [printSettings, setPrintSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS);

  useEffect(() => {
    if (!clinicId) {
      setAppointments([]);
      setTransactions([]);
      setLogs([]);
      setModerators([]);
      setShifts([]);
      setModeratorSessions([]);
      setAppUsers([]);
      setPrintSettings(DEFAULT_PRINT_SETTINGS);
    }
  }, [clinicId]);

  useEffect(() => {
    if (!clinicId) return;
    const unsubscribe = onSnapshot(doc(db, 'clinics', clinicId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const settings = data.settings || {};
        setIsBookingPaused(settings.isBookingPaused || false);
        setDoctorStatusLocal(settings.doctorStatus || 'available');
        setCallingPatientIdLocal(settings.callingPatientId || null);
        
        // Sync Assistant Data
        setAssistantDoctorStatusLocal(settings.assistantDoctorStatus || 'available');
        setCallingPatientIdAssistantLocal(settings.callingPatientIdAssistant || null);
        
        if (settings.printSettings) {
            const ps = settings.printSettings;
            // Merge logic to handle old/new structure if needed, or simply overwrite with safe defaults
            setPrintSettings({
                ...DEFAULT_PRINT_SETTINGS,
                ...ps,
                rx: { ...DEFAULT_TAB_CONFIG('A5'), ...(ps.rx || {}) },
                requests: { ...DEFAULT_TAB_CONFIG('A5'), ...(ps.requests || {}) },
                reports: { ...DEFAULT_TAB_CONFIG('A4'), ...(ps.reports || {}) },
            });
        }
      }
    });
    return () => unsubscribe();
  }, [clinicId]);

  useEffect(() => {
    if (!clinicId) return;

    const collectionConfigs = [
      { name: 'appointments', setter: setAppointments },
      { name: 'moderators', setter: setModerators },
      { name: 'shifts', setter: setShifts },
      { name: 'moderatorSessions', setter: setModeratorSessions },
      { name: 'transactions', setter: setTransactions },
      { name: 'activityLogs', setter: setLogs, limit: 20 },
      { name: 'app_users', setter: (users: AppUser[]) => {
          setAppUsers(users);
          setHasAssistantDoctor(users.some(u => u.role === 'assistant_doctor'));
      }}
    ];

    const unsubscribes = collectionConfigs.map(col => {
      let q = query(collection(db, col.name), where('clinicId', '==', clinicId));
      
      return onSnapshot(q, (snapshot) => {
        let items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        
        if (col.name === 'activityLogs') {
          items.sort((a: any, b: any) => {
            const timeA = a.timestamp?.seconds || 0;
            const timeB = b.timestamp?.seconds || 0;
            return timeB - timeA;
          });
          if (col.limit) items = items.slice(0, col.limit);
        }
        
        col.setter(items as any);
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [clinicId]);

  const addAppointment = async (appt: any) => {
    if (!clinicId) return;
    const count = appointments.length + 1;
    await addDoc(collection(db, 'appointments'), { 
      ...appt, 
      no: count,
      clinicId, 
      timestamp: serverTimestamp() 
    });
    await logActivity(`New appointment added: ${appt.name}`, 'success');
  };

  const updateAppointment = async (id: string, data: any) => {
    const sanitizedData = JSON.parse(JSON.stringify(data));
    await updateDoc(doc(db, 'appointments', id), sanitizedData);
  };

  const deleteAppointment = async (id: string) => {
    await deleteDoc(doc(db, 'appointments', id));
    await logActivity(`Appointment deleted`, 'warning');
  };

  const reorderQueue = async (startIndex: number, endIndex: number) => {
    const checkedIn = appointments
      .filter(a => a.status === 'checked-in')
      .sort((a, b) => (a.queueOrder ?? 9999) - (b.queueOrder ?? 9999) || (a.checkInTime || 0) - (b.checkInTime || 0));
    
    const result: Appointment[] = [...checkedIn];
    const removedItems = result.splice(startIndex, 1);
    const removed = removedItems[0];
    
    if (removed) {
      result.splice(endIndex, 0, removed);
      const batchPromises = result.map((appt: Appointment, index: number) => 
        updateDoc(doc(db, 'appointments', appt.id), { queueOrder: index })
      );
      await Promise.all(batchPromises);
    }
  };

  const addTransaction = async (tx: any) => {
    if (!clinicId) return;
    await addDoc(collection(db, 'transactions'), { ...tx, clinicId, timestamp: serverTimestamp() });
    await logActivity(`Financial transaction logged: ${tx.description}`, 'info');
  };

  const toggleBookingPause = async () => {
    if (!clinicId) return;
    await updateDoc(doc(db, 'clinics', clinicId), { 'settings.isBookingPaused': !isBookingPaused });
    await logActivity(`Booking system ${!isBookingPaused ? 'paused' : 'resumed'}`, 'warning');
  };

  const setDoctorStatus = async (status: string) => {
    if (!clinicId) return;
    await updateDoc(doc(db, 'clinics', clinicId), { 'settings.doctorStatus': status });
    await logActivity(`Doctor status changed to ${status}`, 'info');
  };

  const setCallingPatientId = async (id: string | null) => {
    if (!clinicId) return;
    await updateDoc(doc(db, 'clinics', clinicId), { 'settings.callingPatientId': id });
  };

  const setAssistantDoctorStatus = async (status: string) => {
    if (!clinicId) return;
    await updateDoc(doc(db, 'clinics', clinicId), { 'settings.assistantDoctorStatus': status });
  };

  const setCallingPatientIdAssistant = async (id: string | null) => {
    if (!clinicId) return;
    await updateDoc(doc(db, 'clinics', clinicId), { 'settings.callingPatientIdAssistant': id });
  };

  const logActivity = async (message: string, type: any = 'info') => {
    if (!clinicId) return;
    await addDoc(collection(db, 'activityLogs'), { 
      clinicId, 
      message, 
      type, 
      timestamp: serverTimestamp() 
    });
  };

  const updatePrintSettings = async (settings: Partial<PrintSettings>) => {
      if (!clinicId) return;
      const newSettings = { ...printSettings, ...settings };
      const sanitizedSettings = JSON.parse(JSON.stringify(newSettings));
      await updateDoc(doc(db, 'clinics', clinicId), { 'settings.printSettings': sanitizedSettings });
      await logActivity(`Print customization updated`, 'success');
  };

  return (
    <DataContext.Provider value={{
      appointments, addAppointment, updateAppointment, deleteAppointment,
      updateAppointmentStatus: (id: string, status: any) => updateDoc(doc(db, 'appointments', id), { status }),
      reorderQueue,
      doctorStatus, setDoctorStatus, callingPatientId, setCallingPatientId,
      assistantDoctorStatus, setAssistantDoctorStatus, callingPatientIdAssistant, setCallingPatientIdAssistant, hasAssistantDoctor,
      isBookingPaused, toggleBookingPause,
      transactions, addTransaction, 
      updateTransaction: (id: string, data: any) => updateDoc(doc(db, 'transactions', id), data),
      deleteTransaction: (id: string) => deleteDoc(doc(db, 'transactions', id)),
      logs, logActivity,
      moderators, 
      addModerator: (name: string) => addDoc(collection(db, 'moderators'), { name, clinicId }),
      updateModerator: (id: string, name: string) => updateDoc(doc(db, 'moderators', id), { name }),
      deleteModerator: (id: string) => deleteDoc(doc(db, 'moderators', id)),
      shifts,
      addShift: (shift: any) => addDoc(collection(db, 'shifts'), { ...shift, clinicId }),
      updateShift: (id: string, shift: any) => updateDoc(doc(db, 'shifts', id), shift),
      deleteShift: (id: string) => deleteDoc(doc(db, 'shifts', id)),
      moderatorSessions,
      checkInModerator: async (session: any) => {
        const res = await addDoc(collection(db, 'moderatorSessions'), { ...session, clinicId });
        return (res as any).id;
      },
      checkOutModerator: (id: string, time: string, status: string) => updateDoc(doc(db, 'moderatorSessions', id), { checkOutTime: time, checkOutStatus: status }),
      appUsers,
      addAppUser: (user: any) => addDoc(collection(db, 'app_users'), { ...user, clinicId }),
      updateAppUser: (id: string, user: any) => updateDoc(doc(db, 'app_users', id), user),
      deleteAppUser: (id: string) => deleteDoc(doc(db, 'app_users', id)),
      printSettings, updatePrintSettings
    } as DataContextType}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
