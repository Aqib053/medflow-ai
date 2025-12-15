
import React, { useState } from 'react';
import { 
  Users, AlertCircle, Clock, Search, Plus, Activity, X, Calendar, Phone, Shield, ChevronRight, 
  Volume2, MessageCircle, Share2, Siren, Bed, Stethoscope, Pause, Check, Clipboard, CalendarClock, Send, Syringe, Thermometer, UserCheck, Trash2, CheckCircle, Pill, Filter, TestTube, Zap, HeartPulse, Brain, TrendingUp, TrendingDown, ArrowRight
} from 'lucide-react';
import { Patient, Role, Language, Order } from '../types';
import { TRANSLATIONS } from '../constants';

interface DashboardProps {
  patients: Patient[];
  userRole: Role;
  orders?: Order[];
  onCheckIn: () => void;
  onConsultPatient?: (id: string) => void;
  showCodeBlue: boolean;
  setShowCodeBlue: (show: boolean) => void;
  language?: Language;
}

export const Dashboard: React.FC<DashboardProps> = ({ patients, userRole, orders = [], onCheckIn, onConsultPatient, showCodeBlue, setShowCodeBlue, language = 'en' }) => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [notice, setNotice] = useState("Shift Handoff: Dr. Verma on call. Bed 4 needs cardio consult.");
  const [filterStatus, setFilterStatus] = useState<'all' | 'waiting' | 'seen' | 'admitted' | 'discharged'>('all');

  // Translation Helper
  const t = (key: string) => TRANSLATIONS[language][key] || key;

  // Stats Calculation
  const totalPatients = patients.length;
  const criticalCount = patients.filter(p => p.severity === 'emergency' || p.severity === 'high').length;
  const waitingCount = patients.filter(p => p.status === 'waiting').length;

  // Filter lists for columns based on global filter
  const getFilteredPatients = (list: Patient[]) => {
      if (filterStatus === 'all') return list;
      return list.filter(p => p.status === filterStatus);
  };

  const waitingList = getFilteredPatients(patients.filter(p => p.status === 'waiting'));
  const activeList = getFilteredPatients(patients.filter(p => p.status === 'seen' || p.status === 'admitted'));
  const dischargedList = getFilteredPatients(patients.filter(p => p.status === 'discharged'));
  
  // Follow up list
  const followUpList = patients.filter(p => p.followUp && (p.followUp.status === 'scheduled' || p.followUp.status === 'missed'));

  // Nurse Specific Data
  const admittedPatients = patients.filter(p => p.status === 'admitted');

  // Text to Speech Logic
  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
      }
    }
  };

  // WhatsApp Logic
  const handleWhatsApp = (patient: Patient) => {
    const message = `Hello ${patient.name}, this is MedFlow AI. Your recent check-up summary: ${patient.aiSummary} Please follow the prescribed protocol.`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };
  
  const handleSendReminder = (patient: Patient) => {
      const message = `Hello ${patient.name}, this is a reminder for your upcoming follow-up appointment on ${new Date(patient.followUp?.date!).toLocaleDateString()}. Please confirm your availability.`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Stop speech when modal closes
  const closePatientModal = () => {
    if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }
    setSelectedPatient(null);
  };

  // NURSE SPECIFIC VIEW
  if (userRole === 'nurse') {
      return (
          <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-in pb-12">
               <div className="flex items-center justify-between">
                  <div>
                      <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                          <Clipboard className="text-pink-500" /> Nursing Station Dashboard
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">Ward Monitoring & Care Tasks</p>
                  </div>
                  <button 
                      onClick={() => setShowCodeBlue(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg shadow-red-500/30 animate-pulse transition-transform active:scale-95"
                  >
                      <Siren size={20} /> {t('codeBlue')}
                  </button>
               </div>

               {/* Ward Status Grid */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <div className="lg:col-span-2 space-y-6">
                       <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                           <Bed className="text-blue-500" /> Admitted Patients (Live Monitoring)
                       </h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {admittedPatients.map(p => (
                               <div 
                                    key={p.id} 
                                    onClick={() => setSelectedPatient(p)}
                                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col gap-2 hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer active:scale-[0.98]"
                                >
                                   <div className="flex justify-between items-start">
                                       <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
                                                {p.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 dark:text-white">{p.name}</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{p.gender}, {p.age}y</p>
                                            </div>
                                       </div>
                                       <span className={`px-2 py-1 rounded text-xs font-bold ${
                                           p.severity === 'emergency' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                       }`}>
                                           {p.condition || 'Stable'}
                                       </span>
                                   </div>
                                   <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                                       <div className="bg-slate-50 dark:bg-slate-700/50 p-2 rounded">
                                           <p className="text-xs text-slate-400 font-bold">LOCATION</p>
                                           <p className="font-medium text-slate-700 dark:text-slate-200">{p.ward || 'General'} - Bed {p.room || '?'}</p>
                                       </div>
                                       <div className="bg-slate-50 dark:bg-slate-700/50 p-2 rounded">
                                           <p className="text-xs text-slate-400 font-bold">NEXT MEDS</p>
                                           <p className="font-medium text-slate-700 dark:text-slate-200">14:00 PM</p>
                                       </div>
                                   </div>
                               </div>
                           ))}
                           {admittedPatients.length === 0 && (
                               <div className="col-span-2 p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400">
                                   No patients currently admitted to your ward.
                               </div>
                           )}
                       </div>
                   </div>

                   {/* Right Column: Shift Tasks & Pending Orders */}
                   <div className="space-y-6">
                       {/* Pending Lab Orders (NEW) */}
                       <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 h-fit shadow-sm hover:shadow-md transition-shadow">
                           <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                               <TestTube className="text-indigo-500" /> Pending Lab Orders
                           </h3>
                           <div className="space-y-3 max-h-[300px] overflow-y-auto">
                               {orders.length === 0 ? (
                                   <p className="text-sm text-slate-400 italic">No pending orders.</p>
                               ) : (
                                   orders.map(order => (
                                       <div key={order.id} className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                                           <div className="flex justify-between items-start mb-1">
                                               <p className="font-bold text-sm text-slate-800 dark:text-white">{order.patientName}</p>
                                               <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${order.priority === 'Urgent' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                   {order.priority}
                                               </span>
                                           </div>
                                           <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">by {order.doctorName}</p>
                                           <div className="flex flex-wrap gap-1">
                                               {order.items.map((item, idx) => (
                                                   <span key={idx} className="text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                                       {item}
                                                   </span>
                                               ))}
                                           </div>
                                       </div>
                                   ))
                               )}
                           </div>
                       </div>

                       {/* Shift Tasks */}
                       <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 h-fit shadow-sm hover:shadow-md transition-shadow">
                           <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                               <Clipboard className="text-purple-500" /> Shift Tasks
                           </h3>
                           <div className="space-y-3">
                               {[
                                   { id: 1, task: 'Check Vitals - Bed 4', type: 'vitals', time: '10:00 AM' },
                                   { id: 2, task: 'IV Drip Change - Bed 2', type: 'drip', time: '10:15 AM' },
                                   { id: 3, task: 'Medication Round - Ward A', type: 'meds', time: '11:00 AM' },
                               ].map(task => (
                                   <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm cursor-pointer transition-all duration-200 active:scale-95">
                                       <div className={`p-2 rounded-full ${
                                           task.type === 'vitals' ? 'bg-blue-100 text-blue-600' : 
                                           task.type === 'drip' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'
                                       }`}>
                                           {task.type === 'vitals' ? <Activity size={14} /> : task.type === 'drip' ? <Syringe size={14} /> : <Pill size={14} />}
                                       </div>
                                       <div className="flex-1">
                                           <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{task.task}</p>
                                           <p className="text-xs text-slate-500">{task.time}</p>
                                       </div>
                                       <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                                   </div>
                               ))}
                           </div>
                       </div>
                   </div>
               </div>
          </div>
      );
  }

  // STANDARD DOCTOR/ADMIN VIEW
  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-6 animate-fade-in relative">
      
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
           <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-200 dark:shadow-blue-900/20">
                  <Activity className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{t('dashboard')}</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Real-time Patient Flow & Operations Center</p>
              </div>
           </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 items-center">
            {/* Code Blue Button */}
            <button 
              onClick={() => setShowCodeBlue(true)}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-red-950/10 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-600 dark:hover:text-white transition-all rounded-lg font-bold group active:scale-95 whitespace-nowrap"
            >
                <Siren size={20} className="group-hover:animate-ping" /> {t('codeBlue')}
            </button>

            <div className="bg-white dark:bg-slate-800 flex items-center px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition-all w-full md:w-64">
                <Search size={18} className="text-slate-400" />
                <input 
                  type="text" 
                  placeholder={t('searchPatients')}
                  className="bg-transparent border-none outline-none text-sm ml-2 w-full text-slate-700 dark:text-slate-200 placeholder-slate-400" 
                />
            </div>

            {/* Status Filter Dropdown */}
            <div className="relative group w-full md:w-auto">
                <div className="bg-white dark:bg-slate-800 flex items-center px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:border-blue-500 transition-all">
                    <Filter size={18} className="text-slate-500 dark:text-slate-400" />
                    <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="bg-transparent border-none outline-none text-sm ml-2 text-slate-700 dark:text-slate-200 font-medium cursor-pointer appearance-none pr-6 w-full md:w-auto"
                    >
                        <option value="all">{t('allStatus')}</option>
                        <option value="waiting">{t('waiting')}</option>
                        <option value="seen">{t('seen')}</option>
                        <option value="admitted">{t('admitted')}</option>
                        <option value="discharged">{t('discharged')}</option>
                    </select>
                </div>
            </div>
            
            <button 
              onClick={onCheckIn}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 active:scale-95 whitespace-nowrap"
            >
                <Plus size={20} /> {t('checkIn')}
            </button>
        </div>
      </div>

      {/* Emergency Notice Board */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-lg flex justify-between items-center animate-slide-in shadow-sm">
          <div className="flex items-center gap-3">
              <AlertCircle className="text-amber-600 dark:text-amber-500" />
              <p className="text-amber-800 dark:text-amber-200 text-sm font-medium">
                  <span className="font-bold">{t('notice')}:</span> {notice}
              </p>
          </div>
          <button className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline">Edit Notice</button>
      </div>

      {/* Stats Cards - Interactive */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-blue-200 dark:hover:border-blue-800/50 cursor-pointer active:scale-95 group">
           <div>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">{t('totalPatients')}</p>
              <h3 className="text-4xl font-extrabold text-slate-900 dark:text-white mt-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{totalPatients}</h3>
              <p className="text-green-600 dark:text-green-400 text-xs font-bold mt-2 flex items-center gap-1">
                 <span className="bg-green-100 dark:bg-green-900/50 px-1.5 py-0.5 rounded">+12%</span> vs yesterday
              </p>
           </div>
           <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <Users size={28} />
           </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-red-200 dark:hover:border-red-800/50 cursor-pointer active:scale-95 group">
           <div>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">{t('criticalAttention')}</p>
              <h3 className="text-4xl font-extrabold text-slate-900 dark:text-white mt-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{criticalCount}</h3>
              <p className="text-red-600 dark:text-red-400 text-xs font-bold mt-2">{t('requiresAction')}</p>
           </div>
           <div className="w-14 h-14 bg-red-50 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform animate-pulse">
              <AlertCircle size={28} />
           </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-orange-200 dark:hover:border-orange-800/50 cursor-pointer active:scale-95 group">
           <div>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">{t('waitingRoom')}</p>
              <h3 className="text-4xl font-extrabold text-slate-900 dark:text-white mt-2 group-hover:text-orange-500 transition-colors">{waitingCount}</h3>
              <p className="text-orange-500 text-xs font-bold mt-2">{t('avgWait')} 14m</p>
           </div>
           <div className="w-14 h-14 bg-orange-50 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
              <Clock size={28} />
           </div>
        </div>
      </div>

      {/* Kanban Board - Patient Flow */}
      {/* Grid container with sticky headers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start h-auto">
          
          {/* Column 1: Waiting Room */}
          <div className="flex flex-col bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-200 dark:border-slate-700 p-2 h-auto">
               <div className="flex items-center justify-between p-3 mb-2 sticky top-0 bg-slate-50 dark:bg-slate-900 z-10 rounded-xl shadow-sm">
                   <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                       <h3 className="font-bold text-slate-700 dark:text-slate-300">{t('waitingRoom')}</h3>
                   </div>
                   <span className="bg-white dark:bg-slate-700 px-2 py-0.5 rounded-md text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">{waitingList.length}</span>
               </div>
               
               <div className="space-y-3 px-1 pb-2">
                   {waitingList.map(patient => (
                       <PatientCard key={patient.id} patient={patient} setSelectedPatient={setSelectedPatient} />
                   ))}
               </div>
          </div>

          {/* Column 2: Active Treatment */}
          <div className="flex flex-col bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800 p-2 h-auto">
               <div className="flex items-center justify-between p-3 mb-2 sticky top-0 bg-blue-50 dark:bg-blue-900/20 z-10 rounded-xl shadow-sm border border-blue-100 dark:border-blue-800/50">
                   <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                       <h3 className="font-bold text-blue-900 dark:text-blue-100">{t('activeTreatment')}</h3>
                   </div>
                   <span className="bg-white dark:bg-slate-700 px-2 py-0.5 rounded-md text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">{activeList.length}</span>
               </div>
               
               <div className="space-y-3 px-1 pb-2">
                   {activeList.map(patient => (
                       <PatientCard key={patient.id} patient={patient} setSelectedPatient={setSelectedPatient} />
                   ))}
               </div>
          </div>

          {/* Column 3: Discharged */}
          <div className="flex flex-col bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-200 dark:border-slate-700 p-2 h-auto">
               <div className="flex items-center justify-between p-3 mb-2 sticky top-0 bg-slate-50 dark:bg-slate-900 z-10 rounded-xl shadow-sm">
                   <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-green-500"></div>
                       <h3 className="font-bold text-slate-700 dark:text-slate-300">{t('discharged')}</h3>
                   </div>
                   <span className="bg-white dark:bg-slate-700 px-2 py-0.5 rounded-md text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">{dischargedList.length}</span>
               </div>
               
               <div className="space-y-3 px-1 pb-2">
                   {dischargedList.map(patient => (
                       <PatientCard key={patient.id} patient={patient} setSelectedPatient={setSelectedPatient} />
                   ))}
               </div>
          </div>
      </div>

      {/* Patient Follow-up & Retention Center */}
      <div className="relative z-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm mt-8 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CalendarClock className="text-indigo-500" /> {t('followUpCenter')}
              </h3>
              <div className="flex gap-2">
                  <button className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                      {t('viewAll')}
                  </button>
              </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {followUpList.length > 0 ? followUpList.map(p => (
                  <div key={p.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col gap-3 hover:shadow-md transition-shadow">
                      <div className="flex justify-between">
                          <div>
                              <p className="font-bold text-slate-800 dark:text-white">{p.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{t('lastSeen')}: {new Date(p.admittedDate).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-[10px] font-bold h-fit ${
                              p.followUp?.status === 'missed' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                              {t(p.followUp?.status || 'scheduled')}
                          </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700">
                          <Clock size={14} /> {t('due')}: {new Date(p.followUp?.date!).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2 mt-auto">
                          <button 
                              onClick={() => handleSendReminder(p)}
                              className="flex-1 py-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-green-200 transition-colors"
                          >
                              <MessageCircle size={14} /> {t('remind')}
                          </button>
                          {p.followUp?.status === 'missed' && (
                              <button className="flex-1 py-1.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-red-200 transition-colors">
                                  <Phone size={14} /> {t('escalate')}
                              </button>
                          )}
                      </div>
                  </div>
              )) : (
                  <div className="col-span-3 text-center py-8 text-slate-400 italic bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      No pending follow-ups scheduled.
                  </div>
              )}
          </div>
      </div>
      
      {/* Lower Dashboard Sections: Staffing & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          
          {/* Staffing & Resources */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Activity className="text-blue-500" /> {t('hospitalResources')}
              </h3>
              
              <div className="space-y-6">
                  {/* Bed Occupancy */}
                  <div>
                      <div className="flex justify-between text-sm mb-2 font-medium">
                          <span className="text-slate-600 dark:text-slate-300">{t('bedOccupancy')}</span>
                          <span className="text-slate-900 dark:text-white font-bold">85%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                          <div className="bg-red-500 h-2.5 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                  </div>
                  <div>
                      <div className="flex justify-between text-sm mb-2 font-medium">
                          <span className="text-slate-600 dark:text-slate-300">General Ward Availability</span>
                          <span className="text-slate-900 dark:text-white font-bold">42%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                          <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '42%' }}></div>
                      </div>
                  </div>

                  {/* Staff on Duty */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                       <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">{t('doctorsOnDuty')}</h4>
                       <div className="flex gap-3">
                           {['Dr. Mehta', 'Dr. Rao', 'Dr. Iyer'].map((doc, i) => (
                               <div key={i} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                                   <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                   <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{doc}</span>
                               </div>
                           ))}
                       </div>
                  </div>
              </div>
          </div>

          {/* Pending Department Tasks */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
               <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Share2 className="text-purple-500" /> {t('crossDeptTasks')}
              </h3>
              <div className="space-y-3">
                  {[
                      { from: 'Cardiology', to: 'Imaging', task: 'Urgent Echo for Bed 4', time: '10m ago', priority: 'high' },
                      { from: 'ER', to: 'General', task: 'Transfer Request: P-102', time: '25m ago', priority: 'medium' },
                      { from: 'General', to: 'Lab', task: 'Blood Culture Results Pending', time: '1h ago', priority: 'low' },
                  ].map((task, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                          <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs
                                  ${task.priority === 'high' ? 'bg-red-100 text-red-600' : task.priority === 'medium' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}
                              `}>
                                  {task.from.substring(0,3)}
                              </div>
                              <div>
                                  <p className="font-bold text-sm text-slate-800 dark:text-white">{task.task}</p>
                                  <p className="text-xs text-slate-500 flex items-center gap-1">
                                      {task.from} <ChevronRight size={10}/> {task.to} • {task.time}
                                  </p>
                              </div>
                          </div>
                          <button className="p-2 text-slate-400 hover:text-green-600 transition-colors opacity-0 group-hover:opacity-100">
                              <CheckCircle size={18} />
                          </button>
                      </div>
                  ))}
              </div>
          </div>

      </div>

      {/* AI Operational Insights (KPIs) - NEW SECTION */}
      <div className="mt-8">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Brain className="text-teal-500" /> AI Operational Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* KPI 1: CT Utilization */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start mb-3">
                      <div>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">CT Machine Utilization</p>
                          <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">78%</h4>
                      </div>
                      <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400 flex items-center gap-1 text-xs font-bold">
                          <TrendingDown size={14} /> -12%
                      </div>
                  </div>
                  <div className="bg-teal-50 dark:bg-teal-900/20 p-3 rounded-lg border border-teal-100 dark:border-teal-800/50">
                      <p className="text-xs text-teal-800 dark:text-teal-300 leading-relaxed font-medium">
                          <strong>AI Insight:</strong> Idle time increased by 12% today. Check scheduling gaps between 2 PM - 4 PM.
                      </p>
                  </div>
              </div>

              {/* KPI 2: OPD Wait Time */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start mb-3">
                      <div>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">OPD Avg Wait Time</p>
                          <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">14m</h4>
                      </div>
                      <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400 flex items-center gap-1 text-xs font-bold">
                          <TrendingDown size={14} /> -5m
                      </div>
                  </div>
                  <div className="bg-teal-50 dark:bg-teal-900/20 p-3 rounded-lg border border-teal-100 dark:border-teal-800/50">
                      <p className="text-xs text-teal-800 dark:text-teal-300 leading-relaxed font-medium">
                          <strong>AI Insight:</strong> Wait time reduced significantly due to optimal staffing distribution in General Ward.
                      </p>
                  </div>
              </div>

              {/* KPI 3: ER High Risk */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start mb-3">
                      <div>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">ER High-Risk Ratio</p>
                          <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">22%</h4>
                      </div>
                      <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400 flex items-center gap-1 text-xs font-bold">
                          <TrendingUp size={14} /> +4%
                      </div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800/50">
                      <p className="text-xs text-red-800 dark:text-red-300 leading-relaxed font-medium">
                          <strong>AI Alert:</strong> High-risk cases increasing. Recommendation: Increase triage priority staffing immediately.
                      </p>
                  </div>
              </div>

          </div>
      </div>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={closePatientModal}>
          <div 
            className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-slide-up border border-slate-200 dark:border-slate-700"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative bg-slate-900 p-6 text-white overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Activity size={120} />
                </div>
                <div className="relative z-10 flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl font-bold border border-white/20">
                            {selectedPatient.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{selectedPatient.name}</h2>
                            <div className="flex items-center gap-3 text-slate-300 text-sm mt-1">
                                <span className="flex items-center gap-1"><Clock size={14}/> {selectedPatient.age} Years</span>
                                <span className="flex items-center gap-1"><UserCheck size={14}/> {selectedPatient.gender}</span>
                                <span className="flex items-center gap-1"><Phone size={14}/> 555-0124</span>
                            </div>
                            <span className={`mt-3 inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                selectedPatient.severity === 'emergency' ? 'bg-red-500 text-white' : 
                                selectedPatient.severity === 'high' ? 'bg-orange-500 text-white' : 
                                'bg-green-500 text-white'
                            }`}>
                                {selectedPatient.severity} Priority
                            </span>
                        </div>
                    </div>
                    <button onClick={closePatientModal} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
                
                {/* AI Summary Section */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-100 dark:border-blue-800">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-blue-800 dark:text-blue-300 font-bold flex items-center gap-2">
                            <Activity size={18} /> AI Clinical Assessment
                        </h3>
                        <div className="flex gap-2">
                             <button 
                                onClick={() => handleSpeak(selectedPatient.aiSummary)}
                                className={`text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all ${
                                    isSpeaking 
                                    ? 'bg-red-100 text-red-600 border-red-200 animate-pulse' 
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                                }`}
                             >
                                 {isSpeaking ? <Pause size={12} /> : <Volume2 size={12} />} 
                                 {isSpeaking ? 'Stop' : 'Listen'}
                             </button>
                             <button 
                                onClick={() => handleWhatsApp(selectedPatient)}
                                className="text-xs flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 border border-green-200 rounded-lg hover:bg-green-200 transition-colors font-bold"
                             >
                                 <MessageCircle size={12} /> Send to Patient
                             </button>
                        </div>
                    </div>
                    <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed">
                        {selectedPatient.aiSummary}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Chief Complaint</p>
                        <div className="flex justify-between items-center">
                            <p className="font-bold text-slate-800 dark:text-white">{selectedPatient.complaints[0].symptom}</p>
                            <span className="text-xs bg-white dark:bg-slate-600 px-2 py-1 rounded border border-slate-200 dark:border-slate-500 text-slate-500 dark:text-slate-300">
                                {selectedPatient.complaints[0].duration} {selectedPatient.complaints[0].unit}
                            </span>
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                         <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Department</p>
                         <div className="flex items-center gap-2">
                             <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                 <Shield size={16} />
                             </div>
                             <div>
                                 <p className="font-bold text-slate-800 dark:text-white">{selectedPatient.suggestedDepartment}</p>
                                 <p className="text-[10px] text-slate-500">Recommended by AI</p>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Clinical Notes */}
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wide mb-3">Clinical Notes & Updates</h3>
                    <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                        {selectedPatient.notes.length > 0 ? (
                            selectedPatient.notes.map((note, i) => (
                                <div key={i} className="text-sm bg-white dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 p-3 rounded-lg text-slate-600 dark:text-slate-300 flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0"></div>
                                    {note}
                                </div>
                            ))
                        ) : (
                            <div className="text-sm text-slate-400 italic">No notes added yet.</div>
                        )}
                    </div>
                </div>

            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <button 
                    onClick={closePatientModal}
                    className="text-slate-500 font-bold text-sm hover:text-slate-800 dark:hover:text-slate-200"
                >
                    Close
                </button>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        Add Note
                    </button>
                    <button 
                        onClick={() => {
                            if (onConsultPatient) {
                                onConsultPatient(selectedPatient.id);
                                closePatientModal();
                            }
                        }}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-colors flex items-center gap-2"
                    >
                        Open Consultant View <ChevronRight size={16} />
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Code Blue Overlay */}
      {showCodeBlue && (
          <div className="fixed inset-0 z-[60] bg-red-900/90 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl max-w-lg w-full border-4 border-red-600 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-red-600 animate-pulse"></div>
                  <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                      <Siren size={48} className="text-red-600" />
                  </div>
                  <h2 className="text-4xl font-black text-red-600 mb-2">CODE BLUE ALERT</h2>
                  <p className="text-slate-600 dark:text-slate-300 text-lg mb-8 font-medium">Emergency Broadcast has been sent to all available units.</p>
                  
                  {/* Crash Kit Timer Component Placeholder */}
                  <div className="mb-8 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl">
                      <p className="font-mono text-2xl font-bold text-red-600">00:00:00</p>
                      <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Crash Timer Active</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-8">
                      <button 
                        onClick={() => setShowCodeBlue(false)}
                        className="py-4 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white font-bold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                      >
                          False Alarm
                      </button>
                      <button 
                        onClick={() => setShowCodeBlue(false)}
                        className="py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-500/40 transition-colors animate-pulse"
                      >
                          Team Arrived
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
const PatientCard: React.FC<{patient: Patient, setSelectedPatient: (p: Patient) => void}> = ({ patient, setSelectedPatient }) => {
    // Determine border color based on severity
    const borderColor = 
      patient.severity === 'emergency' ? 'border-l-red-500' :
      patient.severity === 'high' ? 'border-l-orange-500' :
      patient.severity === 'medium' ? 'border-l-yellow-500' :
      patient.severity === 'low' ? 'border-l-green-500' :
      'border-l-slate-300';
  
    return (
        <div 
            onClick={() => setSelectedPatient(patient)}
            className={`bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 ${borderColor} shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer active:scale-[0.98] group`}
        >
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{patient.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{patient.gender.charAt(0)} / {patient.age}y • P-{patient.id.slice(-3)}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                     patient.severity === 'emergency' ? 'bg-red-100 text-red-700' : 
                     patient.severity === 'high' ? 'bg-orange-100 text-orange-700' : 
                     patient.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' : 
                     'bg-slate-100 text-slate-600'
                }`}>
                    {patient.severity}
                </span>
            </div>
            
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3 line-clamp-1">{patient.complaints[0].symptom}</p>
            
            {/* Live Vitals Ticker */}
            <div className="mb-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-1.5 flex justify-around text-xs font-mono text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1"><HeartPulse size={10} className="text-red-500" /> 72</span>
                <span className="flex items-center gap-1"><Activity size={10} className="text-blue-500" /> 120/80</span>
                <span className="flex items-center gap-1"><Thermometer size={10} className="text-orange-500" /> 98.6</span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-700/50">
                <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock size={12} /> 06:15 PM
                </div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                    {patient.suggestedDepartment}
                </span>
            </div>

            {/* Next Shift Handoff */}
            <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 italic border-t border-slate-100 dark:border-slate-700 pt-2 flex items-center gap-1">
                <Zap size={10} className="text-amber-500" />
                <span>Next Shift: Stable. Monitor BP.</span>
            </div>

            {/* If Admitted, show location */}
            {patient.status === 'admitted' && (
                <div className="mt-2 bg-slate-50 dark:bg-slate-700/30 p-1.5 rounded text-xs flex items-center gap-2">
                    <Bed size={12} className="text-slate-400" />
                    <span className="font-bold text-slate-600 dark:text-slate-300">{patient.ward || 'Gen'}</span>
                </div>
            )}
        </div>
    );
};
