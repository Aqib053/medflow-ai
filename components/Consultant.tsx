
import React, { useState, useEffect, useRef } from 'react';
import { Patient, Role, Order } from '../types';
import { Search, Filter, AlertTriangle, FileText, CheckCircle, Mic, Square, Sparkles, Send, Plus, Trash2, MessageSquare, Activity, TestTube, Calculator, ArrowRightLeft, Video, Thermometer, Download, Printer, Save, AlertOctagon, Zap, TrendingUp, TrendingDown, Info, Bot, User, LayoutGrid, List, ArrowLeft, Bed, Users, Clipboard, Pill } from 'lucide-react';

interface ConsultantProps {
  patients: Patient[];
  userRole: Role;
  initialPatientId?: string | null;
  onPlaceOrder?: (order: Order) => void;
}

interface Medication {
    name: string;
    dosage: string;
    frequency: string;
}

interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    time: string;
}

interface EMRData {
    symptoms: string;
    diagnosis: string;
    vitals: string;
    plan: string;
}

// Add Webkit Speech Recognition Type Support
declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

// Mock Drug Interactions Database
const DRUG_INTERACTIONS: Record<string, string[]> = {
    'Aspirin': ['Warfarin', 'Heparin', 'Ibuprofen'],
    'Warfarin': ['Aspirin', 'Metronidazole', 'Ciprofloxacin'],
    'Simvastatin': ['Erythromycin', 'Clarithromycin', 'Verapamil'],
    'Nitroglycerin': ['Sildenafil', 'Tadalafil'],
    'Ibuprofen': ['Aspirin', 'Warfarin', 'Lithium']
};

export const Consultant: React.FC<ConsultantProps> = ({ patients, userRole, initialPatientId, onPlaceOrder }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'records' | 'live' | 'vitals' | 'labs' | 'query'>('records');
  const [isOverview, setIsOverview] = useState(true); // New Overview Mode State

  // AI Scribe State
  const [consultationStatus, setConsultationStatus] = useState<'ready' | 'recording' | 'review'>('ready');
  const [transcript, setTranscript] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const recognitionRef = useRef<any>(null);

  // Structured Voice-to-EMR State
  const [emrData, setEmrData] = useState<EMRData>({ symptoms: '', diagnosis: '', vitals: '', plan: '' });
  const [dischargeDraft, setDischargeDraft] = useState('');
  const [clinicalAlerts, setClinicalAlerts] = useState<string[]>([]);

  // Prescription State
  const [medications, setMedications] = useState<Medication[]>([]);
  const [newMed, setNewMed] = useState<Medication>({ name: '', dosage: '', frequency: '' });
  const [rxAlerts, setRxAlerts] = useState<string[]>([]);

  // Calculator State
  const [bmi, setBmi] = useState({ weight: '', height: '', result: '' });
  
  // Lab Orders
  const [selectedLabs, setSelectedLabs] = useState<string[]>([]);

  // AI Clinical Query State
  const [queryHistory, setQueryHistory] = useState<ChatMessage[]>([
      { id: '1', sender: 'ai', text: "I'm ready to answer clinical questions based on this patient's context.", time: 'Now' }
  ]);
  const [queryInput, setQueryInput] = useState('');

  // Effect to select initial patient if provided
  useEffect(() => {
    if (initialPatientId) {
        setSelectedId(initialPatientId);
        setIsOverview(false); // Switch to detail view if patient selected from dashboard
    }
  }, [initialPatientId]);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
    (filterDept === 'All' || p.suggestedDepartment === filterDept)
  );

  const activePatient = patients.find(p => p.id === selectedId);
  const isReadOnly = userRole === 'intern';

  useEffect(() => {
    // Reset state when changing patients
    setConsultationStatus('ready');
    setTranscript('');
    setAiSummary('');
    setMedications([]);
    setSelectedLabs([]);
    setBmi({ weight: '', height: '', result: '' });
    setRxAlerts([]);
    setClinicalAlerts([]);
    setEmrData({ symptoms: '', diagnosis: '', vitals: '', plan: '' });
    setDischargeDraft('');
    setQueryHistory([{ id: '1', sender: 'ai', text: "I'm ready to answer clinical questions based on this patient's context.", time: 'Now' }]);
    setViewMode('records');
  }, [selectedId]);

  // Clinical Red-Flag Detector
  useEffect(() => {
      if (activePatient) {
          const alerts: string[] = [];
          
          // 1. Vitals Trends (Mock)
          if (activePatient.severity === 'emergency') {
              alerts.push('CRITICAL: Patient marked as Emergency severity.');
          }
          if (activePatient.age > 65 && activePatient.severity !== 'low') {
              alerts.push('RISK: Geriatric patient with active symptoms. Fall risk elevated.');
          }

          // 2. Keyword Analysis
          const combinedNotes = activePatient.notes.join(' ').toLowerCase();
          if (combinedNotes.includes('tachycardia') || combinedNotes.includes('chest pain')) {
              alerts.push('TREND: Recurrent cardiac symptoms detected in notes.');
          }
          if (combinedNotes.includes('fever') && combinedNotes.includes('hypotension')) {
              alerts.push('SEPSIS ALERT: Potential Sepsis criteria met (Fever + Hypotension keywords).');
          }

          setClinicalAlerts(alerts);
      }
  }, [activePatient]);

  // Check for interactions whenever medications list changes
  useEffect(() => {
      const alerts: string[] = [];
      
      // 1. Check Drug-Drug Interactions
      for (let i = 0; i < medications.length; i++) {
          const medA = medications[i].name;
          const interactions = DRUG_INTERACTIONS[medA] || [];
          
          for (let j = i + 1; j < medications.length; j++) {
              const medB = medications[j].name;
              if (interactions.includes(medB)) {
                  alerts.push(`⚠️ Interaction: ${medA} + ${medB} (Bleeding/Toxicity Risk)`);
              }
          }
      }

      // 2. Check Drug-Allergy Interactions
      if (activePatient?.allergies) {
          medications.forEach(med => {
             activePatient.allergies.forEach(allergy => {
                 if (med.name.toLowerCase().includes(allergy.toLowerCase()) || 
                     (allergy.toLowerCase() === 'nsaids' && ['ibuprofen', 'aspirin', 'naproxen'].includes(med.name.toLowerCase()))) {
                     alerts.push(`🚫 Contraindication: Patient allergic to ${allergy} (${med.name})`);
                 }
             });
          });
      }

      setRxAlerts(alerts);
  }, [medications, activePatient]);

  // Speech Recognition Logic
  const startListening = () => {
    if ('webkitSpeechRecognition' in window) {
        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            setTranscript(prev => prev + ' ' + finalTranscript);
        };

        recognition.start();
        recognitionRef.current = recognition;
        setConsultationStatus('recording');
    } else {
        alert("Speech recognition not supported in this browser. Simulation mode.");
        setConsultationStatus('recording');
        // Simulation fallback
        setTimeout(() => {
            setTranscript("Patient reports vomiting for 2 days. No fever. BP is 120 over 80. Diagnosis is likely viral gastroenteritis. Prescribe Ondansetron 4mg.");
        }, 1500);
    }
  };

  const stopListening = () => {
      recognitionRef.current?.stop();
      setConsultationStatus('review');
      if (transcript) processTranscriptToEMR(transcript);
      else processTranscriptToEMR("Patient reports vomiting for 2 days. No fever. BP is 120 over 80. Diagnosis is likely viral gastroenteritis. Prescribe Ondansetron 4mg.");
  };

  const processTranscriptToEMR = (text: string) => {
      const lower = text.toLowerCase();
      
      // 1. Extract Symptoms
      const symptoms = lower.match(/(?:complains of|reports|symptoms of)\s+([^.]+)/i)?.[1] 
          || (lower.includes('vomiting') ? 'Vomiting, Nausea' : 'Unspecified');

      // 2. Extract Vitals
      const vitals = lower.match(/(?:bp|blood pressure) is\s+([^.]+)/i)?.[1] 
          || lower.match(/120 over 80/i) ? '120/80 mmHg' : 'Stable';

      // 3. Extract Diagnosis
      const diagnosis = lower.match(/(?:diagnosis is|likely)\s+([^.]+)/i)?.[1] 
          || 'Under Investigation';

      // 4. Extract Plan/Rx
      const plan = lower.match(/(?:prescribe|plan is)\s+([^.]+)/i)?.[1] 
          || 'Observe and Monitor';
      
      // Auto-populate State
      setEmrData({
          symptoms: capitalize(symptoms),
          vitals: capitalize(vitals),
          diagnosis: capitalize(diagnosis),
          plan: capitalize(plan)
      });

      // Generate Draft Discharge Summary
      const summary = `DISCHARGE SUMMARY\n\nPatient Name: ${activePatient?.name}\nDate: ${new Date().toLocaleDateString()}\n\nDiagnosis: ${capitalize(diagnosis)}\n\nHistory of Present Illness:\nPatient presented with ${symptoms}. Vitals recorded as ${vitals}.\n\nTreatment Plan:\n${plan}\n\nDischarge Instructions:\nFollow up in OPD. Return if symptoms worsen.`;
      
      setDischargeDraft(summary);
      setAiSummary("Consultation processed. Structured data extracted.");

      // Auto-add meds if detected
      if (lower.includes('ondansetron')) {
          setMedications(prev => [...prev, { name: 'Ondansetron', dosage: '4mg', frequency: 'TID' }]);
      }
  };

  const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

  const handleGenerateSummary = () => {
      // Logic handled in stopListening/processTranscriptToEMR now, but kept for manual trigger
      if (!transcript) return;
      processTranscriptToEMR(transcript);
  };

  const handleDownloadPDF = () => {
      const content = `
          MEDICAL CONSULTATION REPORT
          ---------------------------
          Patient: ${activePatient?.name}
          ID: ${activePatient?.id}
          Date: ${new Date().toLocaleDateString()}
          
          TRANSCRIPT:
          ${transcript || 'No transcript available.'}
          
          STRUCTURED EMR DATA:
          Symptoms: ${emrData.symptoms}
          Diagnosis: ${emrData.diagnosis}
          Vitals: ${emrData.vitals}
          Plan: ${emrData.plan}

          DRAFT DISCHARGE SUMMARY:
          ${dischargeDraft}
          
          MEDICATIONS PRESCRIBED:
          ${medications.map(m => `- ${m.name} ${m.dosage} (${m.frequency})`).join('\n') || 'None'}
          
          Dr. MedFlow AI System
      `;

      const element = document.createElement("a");
      const file = new Blob([content], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `${activePatient?.name.replace(' ', '_')}_Report.txt`;
      document.body.appendChild(element); // Required for this to work in FireFox
      element.click();
      alert("Report downloaded successfully.");
  };

  const addMedication = () => {
      if (newMed.name && newMed.dosage) {
          setMedications([...medications, newMed]);
          setNewMed({ name: '', dosage: '', frequency: '' });
      }
  };

  const handleSmartSuggest = () => {
      if (!activePatient) return;
      
      let suggested: Medication[] = [];
      switch(activePatient.suggestedDepartment) {
          case 'Cardiology':
              suggested = [
                  { name: 'Aspirin', dosage: '81mg', frequency: 'QD' },
                  { name: 'Atorvastatin', dosage: '40mg', frequency: 'QHS' }
              ];
              break;
          case 'Neurology':
              suggested = [
                  { name: 'Sumatriptan', dosage: '50mg', frequency: 'PRN' },
                  { name: 'Ondansetron', dosage: '4mg', frequency: 'PRN' }
              ];
              break;
          case 'Orthopedics':
              suggested = [
                  { name: 'Ibuprofen', dosage: '400mg', frequency: 'TID' },
                  { name: 'Acetaminophen', dosage: '500mg', frequency: 'Q6H' }
              ];
              break;
          case 'General':
              suggested = [
                  { name: 'Amoxicillin', dosage: '500mg', frequency: 'TID' },
                  { name: 'Paracetamol', dosage: '650mg', frequency: 'Q4H PRN' }
              ];
              break;
      }
      setMedications([...medications, ...suggested]);
  };

  const handleSendWhatsApp = () => {
      if (!activePatient) return;
      
      const medsList = medications.map((m, i) => `${i+1}. ${m.name} - ${m.dosage} (${m.frequency})`).join('\n');
      const text = `*🏥 MedFlow e-Prescription*\n\n*Patient:* ${activePatient.name}\n*Date:* ${new Date().toLocaleDateString()}\n\n*📝 Clinical Note:*\n${emrData.diagnosis || activePatient.aiSummary}\n\n*💊 Prescribed Medications:*\n${medsList}\n\n*⚠️ Alerts:*\n${rxAlerts.length > 0 ? rxAlerts.join('\n') : 'None'}\n\n_Dr. MedFlow System_`;
      
      const encoded = encodeURIComponent(text);
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const calculateBMI = () => {
      const w = parseFloat(bmi.weight);
      const h = parseFloat(bmi.height) / 100; // cm to m
      if(w && h) {
          setBmi({ ...bmi, result: (w/(h*h)).toFixed(1) });
      }
  };

  const toggleLab = (lab: string) => {
      if (selectedLabs.includes(lab)) setSelectedLabs(selectedLabs.filter(l => l !== lab));
      else setSelectedLabs([...selectedLabs, lab]);
  };

  // Handle Order Placement
  const handlePlaceOrderClick = () => {
      if (!activePatient || selectedLabs.length === 0 || !onPlaceOrder) return;
      
      const newOrder: Order = {
          id: `ORD-${Date.now()}`,
          patientId: activePatient.id,
          patientName: activePatient.name,
          doctorName: "Dr. Aditi Verma", // Mock current user
          items: selectedLabs,
          status: 'Pending',
          priority: activePatient.severity === 'emergency' ? 'Urgent' : 'Routine',
          timestamp: new Date().toISOString()
      };

      onPlaceOrder(newOrder);
      setSelectedLabs([]);
      alert(`Order successfully placed for ${activePatient.name}`);
  };

  // Handle AI Clinical Query
  const handleClinicalQuery = (e?: React.FormEvent, prompt?: string) => {
      if (e) e.preventDefault();
      const text = prompt || queryInput;
      if (!text.trim() || !activePatient) return;

      const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text, time: 'Now' };
      setQueryHistory(prev => [...prev, userMsg]);
      setQueryInput('');

      // Simulate Context-Aware AI Response
      setTimeout(() => {
          let responseText = "I'm analyzing the patient data...";
          const lowerText = text.toLowerCase();
          
          if (lowerText.includes('likely') || lowerText.includes('diagnosis')) {
              responseText = `Based on the symptoms (${activePatient.complaints[0].symptom}) and severity, the most likely diagnosis is **${activePatient.aiSummary.split('.')[0]}**. Consider ruling out differentials relevant to ${activePatient.suggestedDepartment}.`;
          } else if (lowerText.includes('antibiotic') || lowerText.includes('penicillin') || lowerText.includes('allergic')) {
              if (activePatient.allergies.some(a => a.toLowerCase().includes('penicillin'))) {
                  responseText = "⚠️ **Patient has a Penicillin allergy.** Suggesting alternatives: **Azithromycin** (Macrolide) or **Clindamycin** depending on infection type. Avoid Cephalosporins if reaction was anaphylactic.";
              } else {
                  responseText = "Patient has **No known Penicillin allergy**. Amoxicillin or Augmentin are safe first-line options.";
              }
          } else if (lowerText.includes('summary') || lowerText.includes('discharge')) {
              responseText = `**Discharge Summary Draft:** Patient ${activePatient.name} treated for ${activePatient.aiSummary.split('.')[0]}. Stable on discharge. Follow up in 1 week. Return if symptoms worsen.`;
          } else {
              responseText = `I've noted that. Is there anything specific about the **${activePatient.suggestedDepartment}** protocol you'd like to check?`;
          }

          const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'ai', text: responseText, time: 'Now' };
          setQueryHistory(prev => [...prev, botMsg]);
      }, 1000);
  };

  // If Overview Mode enabled and no specific patient selected
  if (isOverview && !selectedId) {
      return (
          <div className="h-full flex flex-col animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                  <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Users className="text-blue-600" /> Consultant Dashboard
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400">Overview of all admitted patients • {filteredPatients.length} Active Cases</p>
                  </div>
                  <div className="flex gap-3">
                      <div className="relative">
                          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                          <input 
                              type="text" 
                              placeholder="Filter patients..." 
                              className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white w-64"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                          />
                      </div>
                      <button 
                          onClick={() => setIsOverview(false)}
                          className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                      >
                          <List size={18} /> List View
                      </button>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-6">
                  {filteredPatients.map(patient => (
                      <div 
                          key={patient.id}
                          onClick={() => { setSelectedId(patient.id); setIsOverview(false); }}
                          className="bg-slate-900 text-white rounded-xl p-5 border border-slate-700 shadow-lg cursor-pointer hover:border-blue-500 hover:shadow-blue-500/10 transition-all active:scale-[0.98] group relative overflow-hidden"
                      >
                          {/* Top Badge */}
                          <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm text-[10px] font-bold px-2 py-1 rounded-full text-white border border-white/10">
                              3 changes in 24h
                          </div>

                          <div className="flex items-center gap-3 mb-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                                  patient.gender === 'Female' ? 'bg-pink-500/20 text-pink-300' : 'bg-blue-500/20 text-blue-300'
                              }`}>
                                  {patient.name.charAt(0)}
                              </div>
                              <div>
                                  <h4 className="font-bold text-base">{patient.name}</h4>
                                  <p className="text-xs text-slate-400 flex items-center gap-2">
                                      <User size={12}/> {patient.age}y / {patient.gender} 
                                      <span className="text-slate-600">•</span>
                                      <Bed size={12}/> {patient.ward || 'Gen'} • {patient.room || '00'}
                                  </p>
                              </div>
                          </div>

                          <div className="mb-4">
                              <div className="flex gap-2 mb-2 flex-wrap">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                      patient.severity === 'emergency' ? 'bg-red-500 text-white' : 
                                      patient.severity === 'high' ? 'bg-orange-500 text-white' : 
                                      'bg-green-600 text-white'
                                  }`}>
                                      {patient.severity}
                                  </span>
                                  {patient.complaints.slice(0,2).map((c, i) => (
                                      <span key={i} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                                          {c.symptom}
                                      </span>
                                  ))}
                              </div>
                              <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                                  <div className="flex items-center gap-1 text-[10px] font-bold text-blue-400 mb-1">
                                      <Sparkles size={10} /> AI Summary
                                  </div>
                                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                                      {patient.aiSummary}
                                  </p>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      );
  }

  // STANDARD SPLIT VIEW
  return (
    <div className="flex flex-col md:flex-row h-full md:h-[calc(100vh-140px)] gap-6">
        {/* Left Panel: List (Hidden on mobile if patient selected) */}
        <div className={`${selectedId ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex-col overflow-hidden transition-colors h-[500px] md:h-full`}>
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 space-y-3">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 dark:text-white">Patient List</h3>
                    <button 
                        onClick={() => { setIsOverview(true); setSelectedId(null); }}
                        className="text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        <LayoutGrid size={14} /> Grid View
                    </button>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search patients..." 
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-slate-400" />
                    <select 
                        className="flex-1 text-sm border-none bg-transparent font-medium text-slate-600 dark:text-slate-300 focus:ring-0 cursor-pointer"
                        value={filterDept}
                        onChange={(e) => setFilterDept(e.target.value)}
                    >
                        <option value="All">All Departments</option>
                        <option value="Cardiology">Cardiology</option>
                        <option value="Neurology">Neurology</option>
                        <option value="General">General</option>
                    </select>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                {filteredPatients.map(p => (
                    <div 
                        key={p.id}
                        onClick={() => setSelectedId(p.id)}
                        className={`p-4 border-b border-slate-50 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer transition-colors
                            ${selectedId === p.id ? 'bg-blue-50 dark:bg-slate-700 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}
                        `}
                    >
                        <div className="flex justify-between items-start">
                            <h4 className="font-bold text-slate-800 dark:text-slate-200">{p.name}</h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                p.severity === 'emergency' 
                                  ? 'bg-red-100 text-red-600 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800' 
                                  : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600'
                            }`}>
                                {p.suggestedDepartment}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{p.aiSummary}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* Right Panel: Detail Workspace (Full width on mobile when selected) */}
        <div className={`${selectedId ? 'flex' : 'hidden md:flex'} flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex-col transition-colors min-h-[500px] md:h-full`}>
            {activePatient ? (
                <>
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        {/* Clinical Alert Banner (RED FLAG SYSTEM) */}
                        {clinicalAlerts.length > 0 && (
                            <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 animate-fade-in">
                                <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-bold text-sm mb-1">
                                    <AlertTriangle size={16} /> Clinical Red Flags Detected
                                </div>
                                <ul className="list-disc pl-5 space-y-0.5">
                                    {clinicalAlerts.map((alert, idx) => (
                                        <li key={idx} className="text-xs text-red-600 dark:text-red-300 font-medium">{alert.replace('CRITICAL: ', '').replace('RISK: ', '').replace('TREND: ', '').replace('SEPSIS ALERT: ', '')}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                {/* Mobile Back Button */}
                                <button 
                                    onClick={() => setSelectedId(null)}
                                    className="md:hidden p-2 bg-white dark:bg-slate-700 rounded-full shadow-sm"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{activePatient.name}</h2>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                                        {activePatient.gender}, {activePatient.age} years • ID: {activePatient.id}
                                    </p>
                                    {activePatient.allergies && activePatient.allergies.length > 0 && (
                                        <div className="flex gap-2 mt-2">
                                            {activePatient.allergies.map(alg => (
                                                <span key={alg} className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded border border-red-100 dark:border-red-800">
                                                    <AlertOctagon size={12} /> Allergy: {alg}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {isReadOnly && (
                                    <div className="bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-200 dark:border-yellow-800 px-3 py-1 rounded-full text-xs font-bold">
                                        Read Only Mode (Intern)
                                    </div>
                                )}
                                <button className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-200 transition-colors" title="Start Telemedicine Call">
                                    <Video size={18} />
                                </button>
                            </div>
                        </div>
                        
                        {/* Mode Switcher */}
                        <div className="flex p-1 bg-slate-200 dark:bg-slate-700 rounded-lg inline-flex overflow-x-auto w-full md:w-auto">
                            <button 
                                onClick={() => setViewMode('records')}
                                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all whitespace-nowrap ${viewMode === 'records' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                Medical Records
                            </button>
                            <button 
                                onClick={() => setViewMode('live')}
                                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${viewMode === 'live' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                <Mic size={14} /> Live Consult
                            </button>
                            <button 
                                onClick={() => setViewMode('vitals')}
                                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${viewMode === 'vitals' ? 'bg-white dark:bg-slate-600 shadow-sm text-red-600 dark:text-red-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                <Activity size={14} /> Vitals Trends
                            </button>
                            <button 
                                onClick={() => setViewMode('labs')}
                                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${viewMode === 'labs' ? 'bg-white dark:bg-slate-600 shadow-sm text-purple-600 dark:text-purple-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                <TestTube size={14} /> Labs & Imaging
                            </button>
                            <button 
                                onClick={() => setViewMode('query')}
                                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${viewMode === 'query' ? 'bg-white dark:bg-slate-600 shadow-sm text-teal-600 dark:text-teal-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                <Bot size={14} /> AI Query
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8">
                        
                        {/* VIEW MODE: RECORDS */}
                        {viewMode === 'records' && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                                    <h3 className="text-indigo-900 dark:text-indigo-300 font-bold flex items-center gap-2 mb-3">
                                        <FileText className="text-indigo-600 dark:text-indigo-400" /> Clinical History Summary
                                    </h3>
                                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                        {activePatient.aiSummary}
                                    </p>
                                </div>

                                {/* Clinical Tools / Calculator */}
                                <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl border border-slate-200 dark:border-slate-600">
                                    <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                        <Calculator size={18} /> Clinical Tools
                                    </h4>
                                    <div className="flex items-end gap-3 flex-wrap">
                                        <div className="flex-1 min-w-[120px]">
                                            <label className="text-xs text-slate-500 dark:text-slate-400 font-bold">Weight (kg)</label>
                                            <input type="number" value={bmi.weight} onChange={(e) => setBmi({...bmi, weight: e.target.value})} className="w-full p-2 rounded border text-sm outline-none dark:bg-slate-600 dark:border-slate-500 dark:text-white" />
                                        </div>
                                        <div className="flex-1 min-w-[120px]">
                                            <label className="text-xs text-slate-500 dark:text-slate-400 font-bold">Height (cm)</label>
                                            <input type="number" value={bmi.height} onChange={(e) => setBmi({...bmi, height: e.target.value})} className="w-full p-2 rounded border text-sm outline-none dark:bg-slate-600 dark:border-slate-500 dark:text-white" />
                                        </div>
                                        <button onClick={calculateBMI} className="bg-slate-800 dark:bg-slate-600 text-white px-4 py-2 rounded text-sm font-bold">Calc BMI</button>
                                        {bmi.result && (
                                            <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded border border-slate-200 dark:border-slate-600 font-bold text-slate-800 dark:text-white">
                                                BMI: {bmi.result}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Transfer Workflow */}
                                <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
                                    <button className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-bold flex items-center gap-2 transition-colors">
                                        <ArrowRightLeft size={16} /> Transfer / Refer Patient
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* VIEW MODE: VITALS */}
                        {viewMode === 'vitals' && (
                             <div className="space-y-6 animate-fade-in">
                                 {/* SMART PROGRESSION RADAR */}
                                 <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-10">
                                        <Zap size={100} />
                                    </div>
                                    <div className="flex-1 z-10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                <Activity className="text-blue-500" /> Smart Progression Radar
                                            </h3>
                                            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                                                AI INSIGHT
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                                            Visualizing multi-organ stress. Expanding area indicates deteriorating condition before clinical signs are obvious.
                                        </p>
                                        <ul className="space-y-3">
                                            <li className="flex items-center gap-3 text-sm">
                                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                <span className="text-slate-600 dark:text-slate-300">Heart Rate</span>
                                                <span className="ml-auto font-bold text-red-500 flex items-center gap-1">115 bpm <TrendingUp size={14}/></span>
                                            </li>
                                            <li className="flex items-center gap-3 text-sm">
                                                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                                <span className="text-slate-600 dark:text-slate-300">WBC Count</span>
                                                <span className="ml-auto font-bold text-purple-500 flex items-center gap-1">16.5 K/uL <TrendingUp size={14}/></span>
                                            </li>
                                            <li className="flex items-center gap-3 text-sm">
                                                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                                <span className="text-slate-600 dark:text-slate-300">Creatinine</span>
                                                <span className="ml-auto font-bold text-orange-500 flex items-center gap-1">2.1 mg/dL <TrendingUp size={14}/></span>
                                            </li>
                                            <li className="flex items-center gap-3 text-sm">
                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                <span className="text-slate-600 dark:text-slate-300">Hypoxia Risk (Low SpO2)</span>
                                                <span className="ml-auto font-bold text-blue-500 flex items-center gap-1">91% <TrendingDown size={14}/></span>
                                            </li>
                                        </ul>
                                    </div>
                                    
                                    {/* SVG Radar Chart */}
                                    <div className="w-[300px] h-[300px] relative flex items-center justify-center">
                                        <svg width="300" height="300" viewBox="0 0 300 300" className="drop-shadow-xl">
                                            {/* Background Webs */}
                                            <polygon points="150,50 250,150 150,250 50,150" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 4" className="dark:stroke-slate-700" />
                                            <polygon points="150,75 225,150 150,225 75,150" fill="none" stroke="#cbd5e1" strokeWidth="1" className="dark:stroke-slate-700" />
                                            <polygon points="150,100 200,150 150,200 100,150" fill="none" stroke="#cbd5e1" strokeWidth="1" className="dark:stroke-slate-700" />
                                            
                                            {/* Axes */}
                                            <line x1="150" y1="150" x2="150" y2="20" stroke="#94a3b8" strokeWidth="1" className="dark:stroke-slate-600" />
                                            <line x1="150" y1="150" x2="280" y2="150" stroke="#94a3b8" strokeWidth="1" className="dark:stroke-slate-600" />
                                            <line x1="150" y1="150" x2="150" y2="280" stroke="#94a3b8" strokeWidth="1" className="dark:stroke-slate-600" />
                                            <line x1="150" y1="150" x2="20" y2="150" stroke="#94a3b8" strokeWidth="1" className="dark:stroke-slate-600" />
                                            
                                            {/* Data Polygon */}
                                            <polygon 
                                                points="150,60 230,150 150,230 80,150" 
                                                fill="rgba(239, 68, 68, 0.2)" 
                                                stroke="#ef4444" 
                                                strokeWidth="2"
                                                className="animate-pulse"
                                            />

                                            {/* Points */}
                                            <circle cx="150" cy="60" r="4" fill="#ef4444" /> {/* HR */}
                                            <circle cx="230" cy="150" r="4" fill="#8b5cf6" /> {/* WBC */}
                                            <circle cx="150" cy="230" r="4" fill="#f97316" /> {/* Cr */}
                                            <circle cx="80" cy="150" r="4" fill="#3b82f6" /> {/* SpO2 */}
                                            
                                            {/* Labels */}
                                            <text x="150" y="15" textAnchor="middle" className="text-[10px] font-bold fill-slate-500 dark:fill-slate-400">HEART RATE</text>
                                            <text x="285" y="155" textAnchor="start" className="text-[10px] font-bold fill-slate-500 dark:fill-slate-400">WBC</text>
                                            <text x="150" y="295" textAnchor="middle" className="text-[10px] font-bold fill-slate-500 dark:fill-slate-400">CREATININE</text>
                                            <text x="15" y="155" textAnchor="end" className="text-[10px] font-bold fill-slate-500 dark:fill-slate-400">HYPOXIA RISK</text>
                                        </svg>
                                    </div>
                                 </div>

                                 <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mt-8">
                                     <Activity className="text-red-500" /> 24-Hour Trends
                                 </h3>
                                 {/* Mock Chart Area */}
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     {/* BP Chart */}
                                     <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                         <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4">Blood Pressure (mmHg)</h4>
                                         <div className="h-48 flex items-end justify-between gap-1 relative px-2">
                                             {[120, 118, 122, 125, 130, 128, 124, 120, 122].map((val, i) => (
                                                 <div key={i} className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-t relative group">
                                                     <div className="absolute bottom-0 w-full bg-blue-500 hover:bg-blue-600 transition-all rounded-t" style={{ height: `${(val/180)*100}%` }}></div>
                                                 </div>
                                             ))}
                                         </div>
                                     </div>

                                     {/* Heart Rate Chart */}
                                     <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                         <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4">Heart Rate (BPM)</h4>
                                         <div className="h-48 relative flex items-center">
                                             <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="none">
                                                 <path 
                                                    d="M0,25 Q10,20 20,28 T40,30 T60,20 T80,25 T100,22" 
                                                    fill="none" 
                                                    stroke="#ef4444" 
                                                    strokeWidth="2" 
                                                    className="drop-shadow-md"
                                                 />
                                             </svg>
                                         </div>
                                     </div>
                                 </div>
                             </div>
                        )}

                        {/* VIEW MODE: LABS & IMAGING */}
                        {viewMode === 'labs' && (
                             <div className="space-y-8 animate-fade-in">
                                 <div>
                                     <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                         <TestTube className="text-purple-500" /> Order Investigations
                                     </h3>
                                     
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                         <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 rounded-xl">
                                             <h4 className="font-bold text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Laboratory</h4>
                                             <div className="space-y-3">
                                                 {['Complete Blood Count (CBC)', 'Basic Metabolic Panel', 'Liver Function Test', 'Lipid Panel', 'Urinalysis', 'Troponin I'].map(lab => (
                                                     <label key={lab} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer transition-colors">
                                                         <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedLabs.includes(lab) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                                                             {selectedLabs.includes(lab) && <CheckCircle size={12} />}
                                                         </div>
                                                         <input type="checkbox" className="hidden" onChange={() => toggleLab(lab)} checked={selectedLabs.includes(lab)} />
                                                         <span className="text-sm font-medium dark:text-slate-300">{lab}</span>
                                                     </label>
                                                 ))}
                                             </div>
                                         </div>

                                         <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 rounded-xl">
                                             <h4 className="font-bold text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Imaging</h4>
                                             <div className="space-y-3">
                                                 {['Chest X-Ray', 'CT Head', 'MRI Brain', 'Ultrasound Abdomen', 'ECG 12-Lead'].map(img => (
                                                     <label key={img} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer transition-colors">
                                                         <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedLabs.includes(img) ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                                                             {selectedLabs.includes(img) && <CheckCircle size={12} />}
                                                         </div>
                                                         <input type="checkbox" className="hidden" onChange={() => toggleLab(img)} checked={selectedLabs.includes(img)} />
                                                         <span className="text-sm font-medium dark:text-slate-300">{img}</span>
                                                     </label>
                                                 ))}
                                             </div>
                                         </div>
                                     </div>
                                 </div>

                                 <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
                                     <button 
                                        disabled={selectedLabs.length === 0}
                                        className="px-6 py-2 bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-colors"
                                        onClick={handlePlaceOrderClick}
                                     >
                                         Sign & Place Orders ({selectedLabs.length})
                                     </button>
                                 </div>
                             </div>
                        )}

                        {/* VIEW MODE: AI QUERY CHAT */}
                        {viewMode === 'query' && (
                            <div className="flex flex-col h-full animate-fade-in">
                                <div className="bg-teal-50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-800/30 p-4 rounded-xl mb-4">
                                    <h3 className="text-teal-800 dark:text-teal-300 font-bold flex items-center gap-2 mb-2">
                                        <Bot size={18} /> AI Clinical Assistant
                                    </h3>
                                    <p className="text-sm text-teal-700 dark:text-teal-400">
                                        Ask specific medical questions based on <strong>{activePatient.name}'s</strong> live context (Labs, Allergies, Symptoms).
                                    </p>
                                    <div className="flex gap-2 mt-3 flex-wrap">
                                        <button onClick={(e) => handleClinicalQuery(e, "What is the most likely diagnosis?")} className="text-xs bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 px-3 py-1.5 rounded-full hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors">
                                            🩺 Likely Diagnosis?
                                        </button>
                                        <button onClick={(e) => handleClinicalQuery(e, "Suggest antibiotics if allergic to penicillin.")} className="text-xs bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 px-3 py-1.5 rounded-full hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors">
                                            💊 Med Alternatives
                                        </button>
                                        <button onClick={(e) => handleClinicalQuery(e, "Write a short discharge summary.")} className="text-xs bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 px-3 py-1.5 rounded-full hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors">
                                            📄 Discharge Summary
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-2">
                                    {queryHistory.map((msg) => (
                                        <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === 'user' ? 'bg-slate-200 dark:bg-slate-700' : 'bg-teal-100 dark:bg-teal-900'}`}>
                                                {msg.sender === 'user' ? <User size={16} className="text-slate-600 dark:text-slate-300" /> : <Bot size={16} className="text-teal-600 dark:text-teal-400" />}
                                            </div>
                                            <div className={`p-3 rounded-2xl max-w-[85%] text-sm shadow-sm leading-relaxed ${
                                                msg.sender === 'user' 
                                                ? 'bg-blue-600 text-white rounded-tr-none' 
                                                : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-600 rounded-tl-none'
                                            }`}>
                                                {/* Simple markdown parser for bolding */}
                                                {msg.text.split('**').map((part, i) => 
                                                    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                                                )}
                                                <div className={`text-[10px] mt-1 opacity-70 ${msg.sender === 'user' ? 'text-blue-100' : 'text-slate-400'}`}>
                                                    {msg.time}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <form onSubmit={(e) => handleClinicalQuery(e)} className="relative">
                                    <input 
                                        type="text" 
                                        value={queryInput}
                                        onChange={(e) => setQueryInput(e.target.value)}
                                        placeholder="Ask a clinical question..."
                                        className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={!queryInput.trim()}
                                        className="absolute right-2 top-2 p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Send size={16} />
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* VIEW MODE: LIVE CONSULTATION (ENHANCED) */}
                        {viewMode === 'live' && (
                            <div className="space-y-8 animate-slide-up">
                                {/* Workflow State Machine */}
                                
                                {consultationStatus === 'ready' && (
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 p-10 text-center">
                                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 dark:text-blue-400">
                                            <Mic size={32} />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Start Voice-to-EMR Session</h3>
                                        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
                                            Speak naturally. AI will extract symptoms, vitals, diagnosis, and prescriptions automatically for <span className="font-bold text-slate-800 dark:text-white">{activePatient.name}</span>.
                                        </p>
                                        <button 
                                            onClick={startListening}
                                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-2 mx-auto"
                                        >
                                            <Mic size={20} /> Start Listening
                                        </button>
                                    </div>
                                )}

                                {consultationStatus === 'recording' && (
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-red-200 dark:border-red-900/50 p-6 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse"></div>
                                        <div className="flex justify-between items-center mb-6">
                                            <div className="flex items-center gap-3">
                                                <span className="relative flex h-3 w-3">
                                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                                </span>
                                                <h3 className="font-bold text-red-600 dark:text-red-400">Listening to Patient...</h3>
                                            </div>
                                            <button 
                                                onClick={stopListening}
                                                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                                            >
                                                <Square size={14} fill="currentColor" /> Stop & Finalize
                                            </button>
                                        </div>
                                        
                                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 min-h-[150px]">
                                            <p className="text-slate-600 dark:text-slate-300 italic leading-relaxed">
                                                "{transcript || 'Listening for speech...'}"
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {consultationStatus === 'review' && (
                                    <div className="space-y-6 animate-fade-in">
                                         {/* SPLIT VIEW: STRUCTURED DATA & DRAFT */}
                                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            
                                            {/* LEFT: Structured Voice Extraction */}
                                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                                                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                                                    <Zap size={18} className="text-yellow-500" /> Extracted EMR Data
                                                </h3>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Symptoms Detected</label>
                                                        <input 
                                                            type="text" 
                                                            value={emrData.symptoms} 
                                                            onChange={(e) => setEmrData({...emrData, symptoms: e.target.value})}
                                                            className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium dark:text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Vitals Captured</label>
                                                        <input 
                                                            type="text" 
                                                            value={emrData.vitals} 
                                                            onChange={(e) => setEmrData({...emrData, vitals: e.target.value})}
                                                            className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium dark:text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Provisional Diagnosis</label>
                                                        <input 
                                                            type="text" 
                                                            value={emrData.diagnosis} 
                                                            onChange={(e) => setEmrData({...emrData, diagnosis: e.target.value})}
                                                            className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-bold text-blue-600 dark:text-blue-400"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Treatment Plan / Rx</label>
                                                        <textarea 
                                                            rows={3}
                                                            value={emrData.plan} 
                                                            onChange={(e) => setEmrData({...emrData, plan: e.target.value})}
                                                            className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium dark:text-white resize-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* RIGHT: Draft Discharge Summary */}
                                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col">
                                                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                                                    <Clipboard size={18} className="text-green-500" /> Draft Discharge Summary
                                                </h3>
                                                <textarea 
                                                    value={dischargeDraft}
                                                    onChange={(e) => setDischargeDraft(e.target.value)}
                                                    className="flex-1 w-full p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl text-sm font-mono text-slate-800 dark:text-slate-200 leading-relaxed resize-none focus:ring-2 focus:ring-yellow-500 outline-none"
                                                />
                                                <div className="mt-4 flex gap-2 justify-end">
                                                    <button 
                                                        onClick={() => alert("Summary Saved to Patient Record")}
                                                        className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-sm hover:bg-slate-200 transition-colors"
                                                    >
                                                        Save Draft
                                                    </button>
                                                    <button 
                                                        onClick={handleDownloadPDF}
                                                        className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                                                    >
                                                        <CheckCircle size={16} /> Finalize & Print
                                                    </button>
                                                </div>
                                            </div>

                                         </div>

                                        {/* Transcript & Meds (Below) */}
                                         <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                    <FileText size={18} className="text-blue-500" /> Full Transcript
                                                </h3>
                                                <button 
                                                    onClick={() => setConsultationStatus('recording')}
                                                    className="text-xs font-bold text-blue-600 hover:underline"
                                                >
                                                    Resume Recording
                                                </button>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg text-sm text-slate-700 dark:text-slate-300 mb-6 border border-slate-100 dark:border-slate-700">
                                                {transcript}
                                            </div>
                                         </div>

                                        {/* e-Prescription Pad (Always visible in Review mode) */}
                                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                    <Pill size={18} className="text-purple-500" /> Smart e-Prescription
                                                </h3>
                                                <button 
                                                    onClick={handleSmartSuggest}
                                                    className="text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-purple-200 transition-colors"
                                                >
                                                    <Sparkles size={12} /> AI Auto-Suggest
                                                </button>
                                            </div>
                                            
                                            {/* RX Alerts Section */}
                                            {rxAlerts.length > 0 && (
                                                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                                    <h4 className="text-xs font-bold text-red-600 dark:text-red-400 mb-1 flex items-center gap-1">
                                                        <AlertTriangle size={12} /> Contraindications Detected
                                                    </h4>
                                                    <ul className="list-disc pl-4 space-y-0.5">
                                                        {rxAlerts.map((alert, idx) => (
                                                            <li key={idx} className="text-xs text-red-700 dark:text-red-300">{alert.replace('⚠️ ', '').replace('🚫 ', '')}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            <div className="flex gap-4 mb-4 flex-wrap md:flex-nowrap">
                                                <input 
                                                    type="text" 
                                                    placeholder="Medication Name"
                                                    className="flex-2 w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:border-blue-500"
                                                    value={newMed.name}
                                                    onChange={(e) => setNewMed({...newMed, name: e.target.value})}
                                                />
                                                <input 
                                                    type="text" 
                                                    placeholder="Dosage (e.g. 500mg)"
                                                    className="flex-1 w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:border-blue-500"
                                                    value={newMed.dosage}
                                                    onChange={(e) => setNewMed({...newMed, dosage: e.target.value})}
                                                />
                                                <input 
                                                    type="text" 
                                                    placeholder="Freq (e.g. BID)"
                                                    className="flex-1 w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:border-blue-500"
                                                    value={newMed.frequency}
                                                    onChange={(e) => setNewMed({...newMed, frequency: e.target.value})}
                                                />
                                                <button 
                                                    onClick={addMedication}
                                                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex-shrink-0"
                                                >
                                                    <Plus size={20} />
                                                </button>
                                            </div>

                                            {medications.length > 0 && (
                                                <div className="mb-6 space-y-2">
                                                    {medications.map((m, i) => (
                                                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
                                                            <span className="font-bold text-slate-700 dark:text-white">{i+1}. {m.name}</span>
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-sm text-slate-500 dark:text-slate-300">{m.dosage} • {m.frequency}</span>
                                                                <button 
                                                                    onClick={() => setMedications(medications.filter((_, idx) => idx !== i))}
                                                                    className="text-red-500 hover:text-red-700"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
                                                <button 
                                                    onClick={handleSendWhatsApp}
                                                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md flex items-center gap-2 transition-transform hover:scale-105"
                                                >
                                                    <MessageSquare size={18} /> Send to WhatsApp
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                    <FileText size={48} className="mb-4 opacity-20" />
                    <p>Select a patient to view details</p>
                </div>
            )}
        </div>
    </div>
  );
};
