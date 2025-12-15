
import React, { useState } from 'react';
import { User, Role } from '../types';
import { USERS } from '../constants';
import { Activity, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('doctor');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const userEntry = USERS[email];
    
    if (userEntry && userEntry.password === password) {
      if (userEntry.role === role) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...userWithoutPassword } = userEntry;
        onLogin(userWithoutPassword);
      } else {
        setError(`Email exists, but role does not match. Try selecting '${userEntry.role}'.`);
      }
    } else {
      setError('Invalid email or password.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 relative overflow-hidden transition-colors">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-100 dark:bg-blue-900/30 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-indigo-100 dark:bg-indigo-900/30 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md z-10 border border-slate-200 dark:border-slate-700 transition-colors animate-fade-in relative">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-200 dark:shadow-none">
            <Activity size={36} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">MedFlow AI</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-center">Secure Hospital Intelligence Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">Role</label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none text-slate-900 dark:text-white font-bold cursor-pointer z-20"
              >
                <option value="doctor">Doctor</option>
                <option value="nurse">Nurse</option>
                <option value="intern">Intern</option>
                <option value="receptionist">Receptionist</option>
                <option value="cleaner">Cleaner</option>
              </select>
              <ShieldCheck className="absolute left-3 top-3.5 text-slate-500 dark:text-slate-300 pointer-events-none z-20" size={18} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white font-bold placeholder-slate-400 z-20 relative"
              placeholder="name@medflow.ai"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white font-bold placeholder-slate-400 z-20 relative"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm rounded-lg border border-red-200 dark:border-red-900/50 flex items-center font-medium">
              <span className="mr-2">⚠️</span> {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all transform active:scale-[0.98] text-lg cursor-pointer z-20 relative"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
          <p>Restricted Access • MedFlow Systems Inc. © 2024</p>
        </div>
      </div>
    </div>
  );
};