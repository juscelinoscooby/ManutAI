import { ChecklistTemplate, InspectionReport, User } from '../types';

const TEMPLATES_KEY = 'manutai_templates';
const REPORTS_KEY = 'manutai_reports';
const USERS_KEY = 'manutai_users';

// Templates
export const getTemplates = (): ChecklistTemplate[] => {
  const stored = localStorage.getItem(TEMPLATES_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveTemplate = (template: ChecklistTemplate): void => {
  const templates = getTemplates();
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify([...templates, template]));
};

export const deleteTemplate = (id: string): void => {
  const templates = getTemplates().filter(t => t.id !== id);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
};

// Reports
export const getReports = (): InspectionReport[] => {
  const stored = localStorage.getItem(REPORTS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveReport = (report: InspectionReport): void => {
  const reports = getReports();
  // Check if report exists to update it, otherwise add new
  const index = reports.findIndex(r => r.id === report.id);
  if (index >= 0) {
    reports[index] = report;
  } else {
    reports.push(report);
  }
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
};

export const deleteReport = (id: string): void => {
  const reports = getReports().filter(r => r.id !== id);
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
};

// Users
export const getUsers = (): User[] => {
  const stored = localStorage.getItem(USERS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const registerUser = (user: User): { success: boolean, message: string } => {
  const users = getUsers();
  if (users.some(u => u.email === user.email)) {
    return { success: false, message: 'E-mail já cadastrado.' };
  }
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
  return { success: true, message: 'Usuário cadastrado com sucesso.' };
};

export const loginUser = (email: string, password: string): User | null => {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  return user || null;
};

export const updateUserPassword = (userId: string, newPassword: string): User | null => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) return null;

  const updatedUser = { 
    ...users[index], 
    password: newPassword, 
    mustChangePassword: false 
  };
  
  users[index] = updatedUser;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return updatedUser;
};

export const deleteUser = (userId: string): void => {
    const users = getUsers().filter(u => u.id !== userId);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Helper to seed initial admin if empty
export const seedInitialAdmin = () => {
  const users = getUsers();
  if (users.length === 0) {
    const admin: User = {
      id: 'admin-1',
      name: 'Administrador',
      email: 'admin@manutai.com',
      password: '123',
      role: 'ADMIN',
      mustChangePassword: true
    };
    registerUser(admin);
  }
};