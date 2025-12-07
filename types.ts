export enum AppView {
  DASHBOARD = 'DASHBOARD',
  CREATE_TEMPLATE = 'CREATE_TEMPLATE',
  INSPECTION_CHAT = 'INSPECTION_CHAT',
  REPORTS = 'REPORTS',
  USERS = 'USERS'
}

export type UserRole = 'ADMIN' | 'TECNICO';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // In a real app, never store plain text passwords
  role: UserRole;
  mustChangePassword?: boolean;
}

export interface ChecklistItem {
  id: string;
  text: string;
}

export interface ChecklistTemplate {
  id: string;
  title: string;
  description: string;
  items: ChecklistItem[];
  createdAt: string;
}

export enum MessageSender {
  SYSTEM = 'SYSTEM',
  USER = 'USER',
  AI = 'AI'
}

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  text: string;
  timestamp: number;
}

export interface InspectionReport {
  id: string;
  templateId: string;
  templateTitle: string;
  technicianName: string;
  technicianId?: string;
  date: string;
  chatHistory: ChatMessage[];
  summary: string;
  status: 'COMPLETED' | 'IN_PROGRESS';
  issuesFound: boolean;
}