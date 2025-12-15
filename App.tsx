
import React, { useState, useEffect } from 'react';
import { User, Role, Patient, View, AnalysisResult, Language, Order, Severity } from './types';
import { INITIAL_PATIENTS, TRANSLATIONS } from './constants';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Reception } from './components/Reception';
import { Triage } from './components/Triage';
import { Consultant } from './components/Consultant';
import { Cleaner } from './components/Cleaner';
import { Chatbot } from './components/Chatbot';
import { DocumentAnalysis } from './components/DocumentAnalysis';
import { Settings } from './components/Settings';
import { Staff } from './components/Staff';
import { Pharmacy } from './components/Pharmacy';
import { Billing } from './components/Billing';
import { VoiceCommandCenter } from './components/VoiceCommandCenter';
import { 
  LayoutDashboard, UserPlus, ClipboardList, Stethoscope, 
  Sparkles, LogOut, Menu, X, Bell, Moon, Sun, Zap, FileText, Settings as SettingsIcon, Save, Check, Trash2,
  Coffee, Pill, CreditCard, Users, Activity
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [orders, setOrders] = useState<Order[]>([]);
  // Initialize based on screen width
  const [isSidebarOpen, setIsSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [showCodeBlue, setShowCodeBlue] = useState(false);
  
  // Profile Editing State
  const [profileForm, setProfileForm] = useState({
      name: '',
      phone: '',
      bio: ''
  });

  // Notification State
  const [notifications, setNotifications] = useState<{id: string, title: string, time: string, type: 'alert' | 'info' | 'success'}[]>([
    { id: '1', title: 'System Maintenance scheduled for 2 AM', time: '2 hours ago', type: 'info' },
    { id: '2', title: 'New Shift Schedule available', time: '5 hours ago', type: 'success' }
  ]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    }
    return 'light';
  });

  // Language State
  const [language, setLanguage] = useState<Language>('en');

  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Initial redirect based on role
  useEffect(() => {
    if (user) {
       if (user.role === 'cleaner') setView('cleaner');
       else setView('dashboard');
    }
  }, [user]);

  // Handle Resize for Responsive Sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    // Set initial state correctly
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Apply Theme to DOM
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Simulate Real-Time Updates
  useEffect(() => {
    if (!user) return; // Only update when logged in

    const interval = setInterval(() => {
        setPatients(current => {
            if (current.length === 0) return current;
            
            // 1. Select a random patient to update
            const randomIndex = Math.floor(Math.random() * current.length);
            const targetPatient = { ...current[randomIndex] };
            let notificationTitle = '';
            let notificationType: 'info' | 'alert' | 'success' = 'info';

            // 2. Determine type of update (Note, Severity, or Status Workflow)
            const updateRoll = Math.random();

            if (updateRoll < 0.4) {
                // A. Add a Clinical Note (40% chance)
                const mockNotes = [
                    "Vitals Update: BP 125/82, HR 78, SpO2 98%",
                    "Lab Results: Electrolytes within normal limits",
                    "Nurse Observation: Patient resting comfortably",
                    "Radiology: Chest X-Ray completed, awaiting review",
                    "Dietary: Patient finished lunch, good appetite",
                    "Vitals Alert: Slight tachycardia noted (102 bpm)"
                ];
                const noteText = mockNotes[Math.floor(Math.random() * mockNotes.length)];
                targetPatient.notes = [noteText, ...targetPatient.notes];
                
                setLastUpdate(`${targetPatient.name}: ${noteText.split(':')[0]}`);
                notificationTitle = `Update: ${targetPatient.name}`;
                notificationType = 'info';

            } else if (updateRoll < 0.7) {
                // B. Change Severity (30% chance)
                const severities: Severity[] = ['stable', 'low', 'medium', 'high', 'emergency'];
                const newSeverity = severities[Math.floor(Math.random() * severities.length)];
                
                if (targetPatient.severity !== newSeverity) {
                    targetPatient.severity = newSeverity;
                    setLastUpdate(`${targetPatient.name} priority changed to ${newSeverity.toUpperCase()}`);
                    notificationTitle = `Alert: ${targetPatient.name} is now ${newSeverity.toUpperCase()}`;
                    notificationType = newSeverity === 'emergency' || newSeverity === 'high' ? 'alert' : 'info';
                }

            } else {
                // C. Workflow Status Progression (30% chance)
                if (targetPatient.status === 'waiting') {
                    targetPatient.status = 'seen';
                    setLastUpdate(`${targetPatient.name} marked as SEEN`);
                    notificationTitle = `Status: ${targetPatient.name} is being seen`;
                    notificationType = 'success';
                } else if (targetPatient.status === 'seen') {
                    // Randomly admit or discharge
                    if (Math.random() > 0.6) {
                        targetPatient.status = 'admitted';
                        targetPatient.ward = 'General Ward A';
                        targetPatient.room = 'A-04';
                        setLastUpdate(`${targetPatient.name} ADMITTED to Ward A`);
                        notificationTitle = `Admission: ${targetPatient.name}`;
                    } else {
                        targetPatient.status = 'discharged';
                        setLastUpdate(`${targetPatient.name} DISCHARGED`);
                        notificationTitle = `Discharge: ${targetPatient.name}`;
                    }
                    notificationType = 'success';
                }
            }

            // Only update state if something actually changed (simplification: we assume we mutated targetPatient above)
            const newPatients = [...current];
            newPatients[randomIndex] = targetPatient;

            // Push Notification
            if (notificationTitle) {
                setNotifications(prev => [{
                    id: Date.now().toString(),
                    title: notificationTitle,
                    time: 'Just now',
                    type: notificationType
                }, ...prev].slice(0, 10)); // Keep last 10
            }

            return newPatients;
        });
    }, 5000); // Update every 5 seconds for real-time feel

    return () => clearInterval(interval);
  }, [user]);

  // Auth Handlers
  const handleLogin = (userData: User) => setUser(userData);
  const handleLogout = () => { setUser(null); setView('dashboard'); setAnalysisResult(null); setSelectedPatientId(null); };

  // Data Handlers
  const handleAddPatient = (patient: Patient) => {
    setPatients(prev => [patient, ...prev]);
    setLastUpdate(`New patient registered: ${patient.name}`);
    setNotifications(prev => [{
        id: Date.now().toString(),
        title: `New Admission: ${patient.name}`,
        time: 'Just now',
        type: 'success' as const
    }, ...prev]);
  };

  const handleUpdatePatient = (id: string, updates: Partial<Patient>) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleConsultPatient = (id: string) => {
    setSelectedPatientId(id);
    setView('consultant');
  };

  const handlePlaceOrder = (order: Order) => {
      setOrders(prev => [order, ...prev]);
      setLastUpdate(`New Order for ${order.patientName}`);
      setNotifications(prev => [{
          id: Date.now().toString(),
          title: `Order Placed: ${order.items.length} items for ${order.patientName}`,
          time: 'Just now',
          type: 'info' as const
      }, ...prev]);
  };

  const handleCoffeeBreak = () => {
      setIsOnBreak(!isOnBreak);
      if (!isOnBreak) {
          setNotifications(prev => [{
              id: Date.now().toString(),
              title: `Shift Status: You are now on break. Cases delegated to On-Call Resident.`,
              time: 'Just now',
              type: 'info' as const
          }, ...prev]);
      } else {
           setNotifications(prev => [{
              id: Date.now().toString(),
              title: `Shift Status: Welcome back! You are now Live.`,
              time: 'Just now',
              type: 'success' as const
          }, ...prev]);
      }
  };

  // Navigation Handler (Auto-close on mobile)
  const handleNavClick = (viewId: View) => {
      setView(viewId);
      if (window.innerWidth < 768) {
          setIsSidebarOpen(false);
      }
  };

  // Profile Handlers
  const handleOpenProfile = () => {
      if (user) {
          setProfileForm({
              name: user.name,
              phone: user.phone || '+1 (555) 000-0000',
              bio: user.bio || 'Medical professional committed to patient care.'
          });
          setIsProfileOpen(true);
      }
  };

  const handleSaveProfile = () => {
      if (user) {
          setUser({ ...user, ...profileForm });
          setNotifications(prev => [{
              id: Date.now().toString(),
              title: 'Profile Updated Successfully',
              time: 'Just now',
              type: 'success' as const
          }, ...prev]);
          setIsProfileOpen(false);
      }
  };
  
  const handleSaveSettings = (updatedProfile: Partial<User>, newTheme: 'light' | 'dark', newLanguage: Language) => {
      if (user) {
          setUser({ ...user, ...updatedProfile });
          setTheme(newTheme);
          setLanguage(newLanguage);
          setNotifications(prev => [{
              id: Date.now().toString(),
              title: 'Settings Saved Successfully',
              time: 'Just now',
              type: 'success' as const
          }, ...prev]);
      }
  };

  // AI Voice Command Processor
  const handleVoiceCommand = (intent: string, patientName: string | null, rawText: string) => {
      if (intent === 'emergency_cardiac') {
          // 1. Identify Patient
          let targetPatient = null;
          if (patientName) {
              targetPatient = patients.find(p => p.name.toLowerCase().includes(patientName.toLowerCase()));
          }
          
          if (!targetPatient) {
              // Fallback: If no name matched, just trigger code blue generically
              setNotifications(prev => [{
                  id: Date.now().toString(),
                  title: `Voice Command Alert: Code Blue Triggered (General)`,
                  time: 'Just now',
                  type: 'alert' as const
              }, ...prev]);
          } else {
              // 2. Update Patient Status
              setPatients(prev => prev.map(p => {
                  if (p.id === targetPatient?.id) {
                      return { ...p, severity: 'emergency', status: 'admitted', notes: [...p.notes, 'VOICE COMMAND: Cardiac Emergency Protocol Activated'] };
                  }
                  return p;
              }));
              
              // 3. System Alerts
              setNotifications(prev => [
                  { id: Date.now().toString(), title: `CRITICAL: Cardiac Bed Reserved (ICU-01) for ${targetPatient?.name}`, time: 'Just now', type: 'alert' as const },
                  { id: (Date.now()+1).toString(), title: `Orders Placed: ECG + Troponin I + CXR`, time: 'Just now', type: 'info' as const },
                  { id: (Date.now()+2).toString(), title: `Team Alerted: Dr. Chen, Dr. Ross`, time: 'Just now', type: 'info' as const },
                  ...prev
              ]);
          }

          // 4. Trigger Global Code Blue
          setShowCodeBlue(true);
      }
  };

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // RBAC Helper
  const canAccess = (role: Role, targetView: View): boolean => {
    if (role === 'doctor') return true;
    if (role === 'receptionist') return ['dashboard', 'reception', 'billing', 'staff', 'settings'].includes(targetView);
    if (role === 'nurse') return ['dashboard', 'triage', 'analysis', 'pharmacy', 'staff', 'settings'].includes(targetView);
    if (role === 'intern') return ['dashboard', 'consultant', 'analysis', 'pharmacy', 'settings'].includes(targetView);
    if (role === 'cleaner') return ['cleaner', 'settings'].includes(targetView);
    return false;
  };

  // Translation Helper
  const t = (key: string) => TRANSLATIONS[language][key] || key;

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Define sidebar navigation items
  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard, roles: ['doctor', 'nurse', 'intern', 'receptionist'] },
    { id: 'reception', label: t('reception'), icon: UserPlus, roles: ['doctor', 'receptionist'] },
    { id: 'triage', label: t('triage'), icon: ClipboardList, roles: ['doctor', 'nurse'] },
    { id: 'consultant', label: t('consultant'), icon: Stethoscope, roles: ['doctor', 'intern'] },
    { id: 'analysis', label: t('analysis'), icon: FileText, roles: ['doctor', 'intern', 'nurse'] },
    // New Sidebar Options
    { id: 'pharmacy', label: t('pharmacy'), icon: Pill, roles: ['doctor', 'nurse', 'intern'] },
    { id: 'billing', label: t('billing'), icon: CreditCard, roles: ['receptionist', 'doctor'] },
    { id: 'staff', label: t('staff'), icon: Users, roles: ['doctor', 'nurse', 'receptionist'] },
    { id: 'cleaner', label: t('cleaner'), icon: Sparkles, roles: ['cleaner'] },
    { id: 'settings', label: t('settings'), icon: SettingsIcon, roles: ['doctor', 'nurse', 'intern', 'receptionist', 'cleaner'] },
  ];

  const currentNav = navItems.find(n => n.id === view);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-200">
      
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
      )}

      {/* Sidebar */}
      <aside 
        className={`bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 z-30
          fixed inset-y-0 left-0 h-full shadow-2xl md:shadow-none md:static
          ${isSidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full w-64 md:translate-x-0 md:w-20'}
        `}
      >
        <div className="h-16 flex items-center justify-center border-b border-slate-100 dark:border-slate-700 gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
             <Activity className="text-white" size={20} />
          </div>
          {isSidebarOpen && (
             <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">MedFlowAI</span>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.filter(item => item.roles.includes(user.role)).map(item => (
                <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id as View)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium whitespace-nowrap overflow-hidden
                        ${view === item.id 
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm' 
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'}
                    `}
                    title={item.label}
                >
                    <item.icon size={20} className="flex-shrink-0" />
                    {isSidebarOpen && <span>{item.label}</span>}
                </button>
            ))}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-700">
            <button 
                onClick={handleOpenProfile}
                className={`flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${!isSidebarOpen && 'justify-center'}`}
            >
                <img src={user.avatar} alt="User" className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-600 object-cover flex-shrink-0" />
                {isSidebarOpen && (
                    <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.role}</p>
                    </div>
                )}
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Top Navbar */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 z-10 transition-colors">
            <div className="flex items-center gap-4">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400">
                    <Menu size={20} />
                </button>
                <div className="hidden md:block">
                   <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">{currentNav?.label}</h1>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Voice Command Center */}
                {user.role === 'doctor' && (
                    <VoiceCommandCenter onCommandDetected={handleVoiceCommand} />
                )}

                {/* 1-Tap Coffee Break Button */}
                {user.role === 'doctor' && (
                    <button 
                        onClick={handleCoffeeBreak}
                        className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border
                            ${isOnBreak 
                                ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' 
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'}
                        `}
                        title={isOnBreak ? "Resume Work" : "Take a Break (Delegate Cases)"}
                    >
                        <Coffee size={14} />
                        {isOnBreak ? "On Break" : "Coffee Mode"}
                    </button>
                )}

                {/* Real-time ticker */}
                {lastUpdate && (
                    <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 animate-fade-in">
                        <Zap size={14} className="text-amber-500" />
                        <span className="truncate max-w-[200px]">{lastUpdate}</span>
                    </div>
                )}

                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${isOnBreak ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50' : 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50'}`}>
                    <span className={`w-2 h-2 rounded-full ${isOnBreak ? 'bg-amber-500' : 'bg-green-500 animate-pulse'}`}></span>
                    {isOnBreak ? 'Away' : 'Live'}
                </div>
                
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
                
                <button onClick={toggleTheme} className="p-2 text-slate-400 hover:text-blue-500 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>

                {/* Notification Bell */}
                <div className="relative">
                    <button 
                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors relative rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                        <Bell size={20} />
                        {notifications.length > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse"></span>
                        )}
                    </button>
                    
                    {/* Notification Dropdown */}
                    {isNotificationsOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-slide-up origin-top-right">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                                <h3 className="font-bold text-slate-800 dark:text-white">Notifications</h3>
                                <button onClick={() => setNotifications([])} className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1">
                                    <Trash2 size={12} /> Clear
                                </button>
                            </div>
                            <div className="max-h-[350px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
                                        <Bell size={24} className="opacity-20" />
                                        No new notifications
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n.id} className="p-4 border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex gap-3 group cursor-pointer">
                                            <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${n.type === 'alert' ? 'bg-red-500' : n.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{n.title}</p>
                                                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wide font-bold">{n.time}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="p-2 bg-slate-50 dark:bg-slate-800/50 text-center border-t border-slate-100 dark:border-slate-700">
                                <button onClick={() => setIsNotificationsOpen(false)} className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium">Close Panel</button>
                            </div>
                        </div>
                    )}
                </div>
                
                <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors ml-2 font-medium text-sm"
                >
                    <LogOut size={18} />
                    <span className="hidden md:inline">Logout</span>
                </button>
            </div>
        </header>

        {/* View Content */}
        <main className="flex-1 overflow-auto p-6 md:p-8 relative">
            {!canAccess(user.role, view) ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                        <X size={32} className="text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Access Denied</h2>
                    <p className="mt-2">Your role ({user.role}) does not have permission to view this page.</p>
                </div>
            ) : (
                <>
                    {view === 'dashboard' && <Dashboard patients={patients} orders={orders} userRole={user.role} onCheckIn={() => setView('reception')} onConsultPatient={handleConsultPatient} showCodeBlue={showCodeBlue} setShowCodeBlue={setShowCodeBlue} language={language} />}
                    {view === 'reception' && <Reception onAddPatient={handleAddPatient} />}
                    {view === 'triage' && <Triage patients={patients} onUpdatePatient={handleUpdatePatient} />}
                    {view === 'consultant' && <Consultant patients={patients} userRole={user.role} initialPatientId={selectedPatientId} onPlaceOrder={handlePlaceOrder} />}
                    {view === 'analysis' && <DocumentAnalysis onAnalysisComplete={setAnalysisResult} onAddPatient={handleAddPatient} />}
                    {view === 'cleaner' && <Cleaner />}
                    {view === 'pharmacy' && <Pharmacy />}
                    {view === 'billing' && <Billing />}
                    {view === 'staff' && <Staff />}
                    {view === 'settings' && <Settings user={user} currentTheme={theme} currentLanguage={language} onSave={handleSaveSettings} />}
                </>
            )}
        </main>
        
        {/* Global Chatbot: Integrated with Analysis Result (RAG) and Patient Data */}
        {user.role !== 'cleaner' && <Chatbot patients={patients} analysisResult={analysisResult} />}

        {/* Profile Edit Modal */}
        {isProfileOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-700 animate-slide-up">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Profile Settings</h3>
                        <button onClick={() => setIsProfileOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                            <X size={20} className="text-slate-500" />
                        </button>
                    </div>

                    <div className="flex flex-col items-center mb-6">
                         <div className="relative">
                            <img src={user.avatar} alt="Profile" className="w-24 h-24 rounded-full border-4 border-blue-50 dark:border-slate-700" />
                            <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 border-2 border-white dark:border-slate-800">
                                <SettingsIcon size={14} />
                            </button>
                         </div>
                         <h4 className="mt-3 font-bold text-lg dark:text-white">{user.name}</h4>
                         <span className="text-sm text-slate-500 dark:text-slate-400 capitalize bg-slate-100 dark:bg-slate-700 px-3 py-0.5 rounded-full">
                            {user.role}
                         </span>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                            <input 
                                type="text" 
                                value={profileForm.name} 
                                onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                            <input type="email" value={user.email} disabled className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900/50 text-slate-500 cursor-not-allowed dark:border-slate-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                            <input 
                                type="tel" 
                                value={profileForm.phone} 
                                onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bio</label>
                            <textarea 
                                rows={3} 
                                value={profileForm.bio} 
                                onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white resize-none" 
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                        <button onClick={() => setIsProfileOpen(false)} className="flex-1 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
                        <button onClick={handleSaveProfile} className="flex-1 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg shadow flex items-center justify-center gap-2">
                            <Save size={18} /> Save Changes
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}
