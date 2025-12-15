
import React, { useState, useEffect } from 'react';
import { User as UserIcon, Bell, Shield, Moon, Globe, Save, Lock, Mail, Smartphone } from 'lucide-react';
import { User, Language } from '../types';

interface SettingsProps {
  user: User;
  currentTheme: 'light' | 'dark';
  currentLanguage?: Language;
  onSave: (updatedProfile: Partial<User>, newTheme: 'light' | 'dark', newLanguage: Language) => void;
}

export const Settings: React.FC<SettingsProps> = ({ user, currentTheme, currentLanguage = 'en', onSave }) => {
  // Form State
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [theme, setTheme] = useState<'light' | 'dark'>(currentTheme);
  const [language, setLanguage] = useState<Language>(currentLanguage);
  const [compactMode, setCompactMode] = useState(false);
  const [timezone, setTimezone] = useState('UTC-05:00 (Eastern Time)');
  
  // Notification State
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);

  // Sync state if props change (e.g. user switches account)
  useEffect(() => {
    setName(user.name);
    setPhone(user.phone || '');
    setTheme(currentTheme);
    setLanguage(currentLanguage);
  }, [user, currentTheme, currentLanguage]);

  const handleSave = () => {
    // Trigger update in parent App
    onSave({ name, phone }, theme, language);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-10">
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Settings & Preferences</h2>
      
      <div className="space-y-6">
        
        {/* Profile Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2">
            <UserIcon className="text-blue-500" size={20} />
            <h3 className="font-bold text-slate-800 dark:text-white">Profile Information</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Display Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
              <input 
                type="email" 
                value={user.email} 
                disabled 
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
              <input 
                type="text" 
                value={user.role.charAt(0).toUpperCase() + user.role.slice(1)} 
                disabled 
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2">
            <Bell className="text-orange-500" size={20} />
            <h3 className="font-bold text-slate-800 dark:text-white">Notifications</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">Email Notifications</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Receive daily summaries and critical alerts via email.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={emailNotif} onChange={(e) => setEmailNotif(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                  <Smartphone size={18} />
                </div>
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">SMS Alerts</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Receive instant SMS for Code Blue and critical patient updates.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={smsNotif} onChange={(e) => setSmsNotif(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2">
            <Shield className="text-purple-500" size={20} />
            <h3 className="font-bold text-slate-800 dark:text-white">Security</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
               <div>
                  <p className="font-medium text-slate-800 dark:text-white">Two-Factor Authentication (2FA)</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Add an extra layer of security to your account.</p>
               </div>
               <button className="px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg font-medium text-sm hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">
                  Enable 2FA
               </button>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-4">
               <div>
                  <p className="font-medium text-slate-800 dark:text-white">Change Password</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Last changed: 3 months ago</p>
               </div>
               <button className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  Update Password
               </button>
            </div>
          </div>
        </div>

        {/* Appearance & Region */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Moon size={18} className="text-slate-500" /> Appearance
                </h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-700 dark:text-slate-300">Theme</span>
                        <select 
                            value={theme}
                            onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm outline-none dark:text-white cursor-pointer"
                        >
                            <option value="light">Light Mode</option>
                            <option value="dark">Dark Mode</option>
                        </select>
                    </div>
                     <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-700 dark:text-slate-300">Compact Mode</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={compactMode} onChange={(e) => setCompactMode(e.target.checked)} className="sr-only peer" />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
            </div>

             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Globe size={18} className="text-blue-400" /> Region & Time
                </h3>
                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-sm text-slate-700 dark:text-slate-300">Language</label>
                        <select 
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as Language)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm outline-none dark:text-white"
                        >
                            <option value="en">English (US)</option>
                            <option value="hi">Hindi (हिन्दी)</option>
                            <option value="kn">Kannada (ಕನ್ನಡ)</option>
                        </select>
                    </div>
                     <div className="space-y-1">
                        <label className="text-sm text-slate-700 dark:text-slate-300">Timezone</label>
                        <select 
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm outline-none dark:text-white"
                        >
                            <option>UTC-05:00 (Eastern Time)</option>
                            <option>UTC+00:00 (London)</option>
                            <option>UTC+05:30 (India Standard Time)</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
             <button 
                onClick={handleSave}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
             >
                 <Save size={20} /> Save Changes
             </button>
        </div>
      </div>
    </div>
  );
};
