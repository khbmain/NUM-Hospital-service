export interface User {
  _id: string;
  email?: string;
  phone?: string;
  firstname: string;
  lastname: string;
  role: string;
  gender?: string;
  birthdate?: string;
  profilePic?: string;
  status?: string;
}

export interface Patient {
  _id: string;
  userId?: User;
  registrationNumber: string;
  firstname: string;
  lastname: string;
  phone?: string;
  email?: string;
  gender?: string;
  birthdate?: string;
  category?: string;
  bloodType?: string;
  allergies?: string[];
  emergencyContact?: { name?: string; phone?: string; relationship?: string };
  address?: string;
  notes?: string;
  status?: string;
  createdAt?: string;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
}

export interface Service {
  _id: string;
  name: string;
  code: string;
  category: string;
  description?: string;
  defaultDurationMinutes?: number;
  defaultBufferMinutes?: number;
  requiresDoctor?: boolean;
  requiresNurse?: boolean;
  requiresDevice?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

export interface Staff {
  _id: string;
  userId: User;
  department?: Department;
  staffType: string;
  specialization?: string;
  title?: string;
  isAvailable?: boolean;
}

export interface Appointment {
  _id: string;
  patient: Patient;
  doctor: Staff;
  department?: Department;
  scheduledDate: string;
  scheduledTime: string;
  duration?: number;
  type: string;
  status: AppointmentStatus;
  queueNumber?: number;
  chiefComplaint?: string;
  notes?: string;
  createdAt?: string;
}

export interface Visit {
  _id: string;
  appointment?: Appointment;
  patient: Patient;
  doctor: Staff;
  visitDate: string;
  status: string;
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  physicalExamination?: string;
  assessment?: string;
  plan?: string;
  notes?: string;
  vitalSigns?: VitalSign;
  diagnoses?: Diagnosis[];
  prescriptions?: Prescription[];
  completedAt?: string;
  createdAt?: string;
}

export interface VitalSign {
  _id: string;
  temperature?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
}

export interface Diagnosis {
  _id: string;
  name: string;
  icdCode?: string;
  description?: string;
  type: string;
  severity?: string;
  notes?: string;
  createdAt?: string;
}

export interface Prescription {
  _id: string;
  prescriptionNumber: string;
  items: PrescriptionItem[];
  notes?: string;
  status: string;
  doctor: Staff;
  createdAt?: string;
}

export interface PrescriptionItem {
  medicationName: string;
  dosage: string;
  frequency: string;
  duration?: string;
  quantity?: number;
  unit?: string;
  instructions?: string;
}

export type AppointmentStatus =
  | 'scheduled'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Товлосон',
  checked_in: 'Бүртгэгдсэн',
  in_progress: 'Үзлэгт',
  completed: 'Дууссан',
  cancelled: 'Цуцлагдсан',
  no_show: 'Ирээгүй',
  active: 'Идэвхтэй',
  draft: 'Ноорог',
  dispensed: 'Олгосон',
  primary: 'Үндсэн',
  secondary: 'Хавсарсан',
  differential: 'Ялгах',
  mild: 'Хөнгөн',
  moderate: 'Дунд',
  severe: 'Хүнд',
  critical: 'Маш хүнд',
};
