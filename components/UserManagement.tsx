import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole } from '../types';
import { Button } from './Button';
import { registerUser, getUsers, deleteUser } from '../services/storageService';
import { UserPlus, Trash2, ArrowLeft, Shield, Wrench, User as UserIcon, Mail } from 'lucide-react';

interface UserManagementProps {
  onClose: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('TECNICO');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setUsers(getUsers());
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name || !email || !password) {
      setError('Preencha todos os campos.');
      return;
    }

    const newUser: User = {
      id: uuidv4(),
      name,
      email,
      password,
      role
    };

    const result = registerUser(newUser);
    if (result.success) {
      setSuccessMsg('Usuário criado com sucesso!');
      setName('');
      setEmail('');
      setPassword('');
      setRole('TECNICO');
      loadUsers();
    } else {
      setError(result.message);
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Tem certeza que deseja remover este usuário?')) {
      deleteUser(userId);
      loadUsers();
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <div className="flex items-center mb-6">
        <button onClick={onClose} className="mr-4 p-2 rounded-full hover:bg-slate-200">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gerenciar Usuários</h2>
          <p className="text-slate-500 text-sm">Cadastre e visualize os usuários do sistema</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Registration Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-4">
            <h3 className="font-bold text-lg mb-4 flex items-center">
              <UserPlus size={20} className="mr-2 text-blue-600" /> Novo Usuário
            </h3>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                <input
                  type="text"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do funcionário"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                <input
                  type="email"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@empresa.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Senha Inicial</label>
                <input
                  type="text"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha de acesso"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Permissão</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('TECNICO')}
                    className={`flex items-center justify-center p-2 rounded-lg border text-sm transition-colors ${role === 'TECNICO' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Wrench size={14} className="mr-1" /> Técnico
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('ADMIN')}
                    className={`flex items-center justify-center p-2 rounded-lg border text-sm transition-colors ${role === 'ADMIN' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Shield size={14} className="mr-1" /> Admin
                  </button>
                </div>
              </div>

              {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}
              {successMsg && <div className="text-green-600 text-sm bg-green-50 p-2 rounded">{successMsg}</div>}

              <Button fullWidth type="submit" className="mt-2">Cadastrar</Button>
            </form>
          </div>
        </div>

        {/* Users List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-700">Usuários Cadastrados ({users.length})</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {users.map(user => (
                <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                      {user.role === 'ADMIN' ? <Shield size={20} /> : <Wrench size={20} />}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{user.name}</p>
                      <div className="flex items-center text-xs text-slate-500 mt-0.5">
                        <Mail size={12} className="mr-1" /> {user.email}
                      </div>
                    </div>
                  </div>
                  
                  {user.email !== 'admin@manutai.com' && (
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                      title="Remover Usuário"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
              
              {users.length === 0 && (
                <div className="p-8 text-center text-slate-400">Nenhum usuário encontrado.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};