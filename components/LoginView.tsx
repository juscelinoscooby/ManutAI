import React, { useState } from 'react';
import { User } from '../types';
import { Button } from './Button';
import { loginUser, updateUserPassword } from '../services/storageService';
import { Wrench, LogIn, Lock, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  
  // State to handle the "Force Password Change" flow
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (pendingUser) {
      // Handle Password Change
      if (newPassword !== confirmPassword) {
        setError('As senhas não coincidem.');
        return;
      }
      if (newPassword.length < 4) {
        setError('A senha deve ter pelo menos 4 caracteres.');
        return;
      }
      
      const updatedUser = updateUserPassword(pendingUser.id, newPassword);
      if (updatedUser) {
        onLogin(updatedUser);
      } else {
        setError('Erro ao atualizar senha.');
      }
      return;
    }

    // Handle Login
    if (!email || !password) {
      setError('Preencha todos os campos.');
      return;
    }

    const user = loginUser(email, password);
    if (user) {
      if (user.mustChangePassword) {
        setPendingUser(user);
        setError('');
      } else {
        onLogin(user);
      }
    } else {
      setError('E-mail ou senha incorretos.');
    }
  };

  if (pendingUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col p-8">
          <div className="text-center mb-6">
            <div className="bg-amber-100 p-3 rounded-full inline-flex text-amber-600 mb-4">
              <Lock size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Alteração de Senha</h2>
            <p className="text-slate-500 mt-2">
              Olá, {pendingUser.name}. Como é seu primeiro acesso (ou solicitado pelo admin), você precisa definir uma nova senha.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nova Senha</label>
              <input
                type="password"
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nova senha"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Senha</label>
              <input
                type="password"
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <Button fullWidth type="submit">Atualizar e Entrar</Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="bg-blue-600 p-8 text-center">
          <div className="inline-flex bg-white/20 p-4 rounded-full mb-4">
            <Wrench className="text-white h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold text-white">ManutAI</h1>
          <p className="text-blue-100 mt-2">Gestão Inteligente de Manutenção</p>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Login</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
              <input
                type="email"
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="nome@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <input
                type="password"
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                {error}
              </div>
            )}

            <Button fullWidth type="submit" className="mt-4">
              <LogIn size={18} className="mr-2" /> Entrar
            </Button>
          </form>
          
          <div className="mt-6 text-center text-xs text-slate-400">
             <p>Acesso restrito a usuários autorizados.</p>
          </div>
        </div>
      </div>
    </div>
  );
};