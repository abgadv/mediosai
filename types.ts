
import React from 'react';

// ... (Previous User interfaces remain unchanged)

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role?: string;
  permissions?: UserPermissions;
}

export interface UserPermissions {
  [category: string]: {
    access: boolean;
    actions?: {
      [action: string]: boolean;
    }
  }
}

export interface AppUser {
  id: string;
  username: string;
  password: string;
  displayName: string;
  photoURL?: string;
  role: string;
  permissions: UserPermissions;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  photoURL?: string;
  createdAt: any;
}

export interface SidebarItem {
  name: string;
  icon: React.ReactNode;
  id: string;
  permissionKey: string;
}

export interface ThemeContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

// --- NEW DYNAMIC PRINT TYPES ---

export interface PrintElement {
  id: string;
  type: 'text' | 'image' | 'data_block';
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  w: number; // Percentage width
  h: number; // Percentage height
  content?: string; // Text content or Image URL
  fontSize?: number;
  fontWeight?: 'bold' | 'normal';
  align?: 'left' | 'center' | 'right';
  zIndex?: number;
  // Data Block Specifics
  dataLayout?: number; // 1, 2, 3
  showSectionHeader?: boolean;
}

export interface TabPrintConfig {
  paperSize: 'A4' | 'A5';
  backgroundUrl?: string;
  elements: PrintElement[];
}

export interface PrintSettings {
  rx: TabPrintConfig;
  requests: TabPrintConfig;
  reports: TabPrintConfig;
  // Metadata for generating defaults
  clinicName: string;
  doctorName: string;
  specialty: string;
  phones: string[];
  addresses: string[];
  logoUrl?: string;
}

// --- END PRINT TYPES ---

export interface AuthContextType {
  firebaseUser: User | null;
  loading: boolean;
  loginSaaS: (email: string, pass: string, remember?: boolean) => Promise<void>;
  signupSaaS: (email: string, pass: string, name: string, phone: string) => Promise<void>;
  logoutSaaS: () => Promise<void>;
  
  systemUser: AppUser | null;
  loginSystem: (username: string, pass: string, remember: boolean) => Promise<void>;
  logoutSystem: () => void;
  
  isSetupComplete: boolean;
  completeAdminSetup: (adminData: Omit<AppUser, 'id'>, initialPrintSettings?: Partial<PrintSettings>) => Promise<void>;
  
  updateUserProfile: (data: { displayName?: string; password?: string; photoURL?: string }) => Promise<void>;
  error: string | null;

  isVerified: boolean;
  verifyOTP: (otp: string) => Promise<void>;
  resendOTP: () => Promise<void>;
  trialExpiry: string | null;
  isTrialExpired: boolean;
  currentPlan: 'trial' | 'pro' | 'enterprise';

  requestPasswordResetOTP: (email: string) => Promise<void>;
  verifyPasswordResetOTP: (email: string, otp: string) => Promise<void>;
  completePasswordReset: (email: string, otp: string, newPass: string) => Promise<void>;
}

// ... (Rest of the interfaces: PrescriptionItem, InvestigationItem, Appointment, etc. remain unchanged)
export interface PrescriptionItem {
  drug: string;
  dose?: string;
  frequency: string;
  duration?: string;
}

export interface InvestigationItem {
  id: string;
  name: string;
  result?: string;
}

export interface MedicationEntry {
  name: string;
  frequency: string;
  duration: string;
  date: string;
  source?: string;
}

export interface ChronicConditionDetail {
  diagnosedDate: string;
  medications: MedicationEntry[];
}

export interface LabHistoryEntry {
  id: string;
  name: string;
  value: string;
  date: string;
}

export interface ScanHistoryEntry {
  id: string;
  name: string;
  comment: string;
  date: string;
  attachmentUrl?: string;
  attachmentUrls?: string[];
}

export interface Appointment {
  id: string;
  no: number;
  date: string;
  time: string;
  name: string;
  phone: string;
  contactingNumber?: string;
  source: string;
  paid: number;
  notes: string;
  status: 'booked' | 'checked-in' | 'in-exam' | 'completed' | 'cancelled' | 'in-assistant';
  checkInTime?: number;
  queueOrder?: number;
  isSheeted?: boolean;
  createdBy?: string;
  sessionId?: string;
  age?: string;
  residence?: string;
  visitType?: 'New' | 'Follow-up';
  weight?: string;
  height?: string;
  vitals?: {
    temp?: string;
    bp?: string;
    hr?: string;
    rr?: string;
    sugar?: string;
  };
  isSmoker?: boolean;
  smokingDetails?: {
    amount: string;
    duration: string;
    index: string;
  };
  isMarried?: boolean;
  marriageDetails?: {
    childrenCount: string;
    marriageDate: string;
    duration: string;
  };
  hasMenstrualHistory?: boolean;
  menstrualHistory?: {
    lmp: string;
    cycleDuration: string;
    flow: string;
    notes: string;
  };
  isPregnant?: boolean;
  pregnancyDetails?: {
    edd: string;
    gravida: string;
    para: string;
    notes: string;
  };
  chronicConditions?: Record<string, boolean>;
  chronicConditionDetails?: Record<string, ChronicConditionDetail>;
  allergies?: Record<string, boolean>;
  allergyComments?: Record<string, string>;
  pastHistory?: string;
  labHistory?: LabHistoryEntry[];
  scanHistory?: ScanHistoryEntry[];
  drugHistory?: MedicationEntry[];
  complaints?: string;
  symptoms?: string;
  signs?: string;
  generalNotes?: string;
  diagnosis?: string;
  investigationItems?: InvestigationItem[];
  scans?: InvestigationItem[];
  prescription?: PrescriptionItem[];
}

export interface Moderator {
  id: string;
  name: string;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export interface ModeratorSession {
  id: string;
  date: string;
  moderatorId: string;
  moderatorName: string;
  shiftId: string;
  shiftName: string;
  checkInTime: string;
  checkOutTime?: string;
  isCovering: boolean;
  coveringForName?: string;
  checkInStatus: 'On Time' | 'Late';
  checkOutStatus?: 'On Time' | 'Early Leave';
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  type: 'income' | 'expense';
  amount: number;
}

export interface LogEntry {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: any;
}

export interface DataContextType {
  appointments: Appointment[];
  addAppointment: (appt: Omit<Appointment, 'id' | 'no'>) => Promise<void>;
  updateAppointment: (id: string, data: Partial<Appointment>) => Promise<void>;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  deleteAppointment: (id: string) => void;
  
  doctorStatus: 'available' | 'resting';
  setDoctorStatus: (status: 'available' | 'resting') => void;
  callingPatientId: string | null;
  setCallingPatientId: (id: string | null) => void;
  
  assistantDoctorStatus: 'available' | 'resting';
  setAssistantDoctorStatus: (status: 'available' | 'resting') => void;
  callingPatientIdAssistant: string | null;
  setCallingPatientIdAssistant: (id: string | null) => void;
  hasAssistantDoctor: boolean;

  isBookingPaused: boolean;
  toggleBookingPause: () => Promise<void>;
  moderators: Moderator[];
  shifts: Shift[];
  moderatorSessions: ModeratorSession[];
  addModerator: (name: string) => Promise<void>;
  updateModerator: (id: string, name: string) => Promise<void>;
  deleteModerator: (id: string) => Promise<void>;
  addShift: (shift: Omit<Shift, 'id'>) => Promise<void>;
  updateShift: (id: string, shift: Omit<Shift, 'id'>) => Promise<void>;
  deleteShift: (id: string) => Promise<void>;
  checkInModerator: (session: Omit<ModeratorSession, 'id'>) => Promise<string>;
  checkOutModerator: (sessionId: string, checkOutTime: string, status: 'On Time' | 'Early Leave') => Promise<void>;
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  logs: LogEntry[];
  logActivity: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => Promise<void>;
  appUsers: AppUser[];
  addAppUser: (user: Omit<AppUser, 'id'>) => Promise<void>;
  updateAppUser: (id: string, user: Partial<AppUser>) => Promise<void>;
  deleteAppUser: (id: string) => Promise<void>;
  
  printSettings: PrintSettings;
  updatePrintSettings: (settings: Partial<PrintSettings>) => Promise<void>;
}
