export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';

export interface Campaign {
  id: string;
  name: string;
  practiceName: string;
  status: CampaignStatus;
  patientsCount: number;
  respondedCount: number;
  nps: number;
  createdAt: string;
}

export type PatientStatus = 'PENDING' | 'SENT' | 'RESPONDED' | 'OPT_OUT';

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  lastVisit: string;
  campaign: string;
  status: PatientStatus;
  rating?: number;
}

export interface Practice {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  googlePlaceId: string | null;
}

export interface Plan {
  id: string;
  name: string;
  price: string;
  messages: number;
}

export const MOCK_PLANS: Plan[] = [
  { id: 'FREE', name: 'Free', price: '$0', messages: 50 },
  { id: 'STARTER', name: 'Starter', price: '$39', messages: 500 },
  { id: 'PROFESSIONAL', name: 'Professional', price: '$129', messages: 2000 },
];

export type MessageType =
  | 'INITIAL'
  | 'FOLLOWUP_HAPPY'
  | 'FOLLOWUP_UNHAPPY'
  | 'REMINDER';

export interface Template {
  id: string;
  name: string;
  type: MessageType;
  content: string;
  variables: string[];
  isDefault?: boolean;
  updatedAt: string;
}

export type UserRole = 'OWNER' | 'DOCTOR' | 'RECEPTIONIST';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Dr. Juan Pérez',
    email: 'juan@consultorio.com',
    role: 'OWNER',
    createdAt: '2025-01-15',
  },
  {
    id: '2',
    name: 'Dra. María González',
    email: 'maria@consultorio.com',
    role: 'DOCTOR',
    createdAt: '2025-01-20',
  },
  {
    id: '3',
    name: 'Ana Recepción',
    email: 'ana@consultorio.com',
    role: 'RECEPTIONIST',
    createdAt: '2025-02-01',
  },
];
