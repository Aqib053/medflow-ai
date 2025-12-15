
import React, { useState, useMemo } from 'react';
import { Patient, Severity } from '../types';
import { Activity, Clock, ChevronRight, X, User, AlertCircle, Sparkles, ClipboardCheck, Stethoscope, Bed, Thermometer, HeartPulse, FileText, CheckCircle, Building, LayoutList, PieChart, LogOut, Download, Save, Pill } from 'lucide-react';

interface TriageProps {
  patients: Patient[];
  onUpdatePatient: (id: string, updates: Partial<Patient>) => void;
}

// Mock Wards Data for Bed Selection
const WARDS = [
    { 
        id: 'icu', name: 'ICU', capacity: 8, 
        beds: [
            { id: 'ICU-01', status: 'occupied' }, { id: 'ICU-02', status: 'available' },
            { id: 'ICU-03', status: 'occupied' }, { id: 'ICU-04', status: 'occupied' },
            { id: 'ICU-05', status: 'available' }, { id: 'ICU-06', status: 'occupied' },
            { id: 'ICU-07', status: 'available' }, { id: 'ICU-08', status: 'occupied' }
        ] 
    },
    { 
        id: 'gen-a', name: 'General Ward A', capacity: 12, 
        beds: [
            { id: 'A-01', status: 'occupied' }, { id: 'A-02', status: 'available' },
            { id: 'A-03', status: 'available' }, { id: 'A-04', status: 'occupied' },
            { id: 'A-05', status: 'available' }, { id: 'A-06', status: 'available' },
            { id: 'A-07', status: 'occupied' }, { id: 'A-08', status: 'available' },
            { id: 'A-09', status: 'available' }, { id: 'A-10', status: 'occupied' },
            { id: 'A-11', status: 'occupied' }, { id: 'A-12', status: 'available' }
        ] 
    },
    { 
        id: 'neuro', name: 'Neurology Ward', capacity: 6, 
        beds: [
            { id: 'N-01', status: 'available' }, { id: 'N-02', status: 'occupied' },
            { id: 'N-03', status: 'occupied' }, { id: 'N-04', status: 'available' },
            { id: 'N-05', status: 'occupied' }, { id: 'N-06', status: 'occupied' }
        ] 
    }
];

// Helper to generate detailed mock data based on patient attributes
const getDetailedAIResponse = (patient: Patient) => {
    const dept = patient.suggestedDepartment || 'General';
    const severity = patient.severity;
    const symptom = patient.complaints[0]?.symptom || 'reported symptoms';
    const duration = `${patient.complaints[0]?.duration || 1} ${patient.complaints[0]?.unit || 'Hours'}`;

    const protocols: Record<string, string> = {
        'Cardiology': 'ACS / Chest Pain Protocol',
        'Neurology': 'Stroke Alert / Neuro Assessment',
        'Orthopedics': 'Trauma & Fracture Management',
        'Pediatrics': 'PALS Guidelines',
        'General': 'Standard Medical Admission',
        'Emergency': 'Critical Care & Stabilization'
    };

    const protocol = protocols[dept] || 'Standard Protocol';

    return {
        protocol,
        clinicalReasoning: `Patient presents with ${symptom} of ${duration} duration. The AI risk model calculates a ${severity} probability of acute pathology. Correlation with age (${patient.age}y) and gender suggests potential for underlying ${dept.toLowerCase()} issues requiring immediate clinical correlation.`,
        recommendations: [
            `Initiate '${protocol}' workflow immediately.`,
            `Prioritize vital signs monitoring every 15 minutes.`,
            `Prepare for likely diagnostic imaging (X-Ray/CT) relevant to ${symptom}.`,
            `Consult ${dept} on-call resident for admission orders.`
        ]
    };
};

export const Triage: React.FC<TriageProps> = ({ patients, onUpdatePatient }) => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [viewMode, setViewMode] = useState<'queue' | 'ward'>('queue');
  
  // Admission Modal State
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);
  const [admissionForm, setAdmissionForm] = useState({
      bp: '', hr: '', temp: '', spo2: '', diagnosis: '', note: ''
  });
  const [selectedWardId, setSelectedWardId] = useState('icu');
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);

  // Discharge Modal State
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [dischargePatient, setDischargePatient] = useState<Patient | null>(null);
  const [dischargeForm, setDischargeForm] = useState({
      summary: '',
      medications: '',
      instructions: ''
  });

  // Dynamic Ward Logic
  const currentWards = useMemo(() => {
      // Create a deep copy of static WARDS
      const dynamicWards = JSON.parse(JSON.stringify(WARDS));
      
      // Update with live patient data
      patients.filter(p => p.status === 'admitted').forEach(p => {
          if (p.ward && p.room) {
              // Find the ward
              const targetWard = dynamicWards.find((w: any) => w.name === p.ward);
              if (targetWard) {
                  // Find the bed and mark occupied
                  const targetBed = targetWard.beds.find((b: any) => b.id === p.room);
                  if (targetBed) {
                      targetBed.status = 'occupied';
                  }
              }
          }
      });
      return dynamicWards;
  }, [patients]);

  // Memoize the detailed summary
  const detailedAI = useMemo(() => {
      if (!selectedPatient) return null;
      return getDetailedAIResponse(selectedPatient);
  }, [selectedPatient]);

  const getSeverityColor = (sev: Severity) => {
    switch(sev) {
        case 'emergency': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800';
        case 'high': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800';
        case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800';
        default: return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800';
    }
  };

  const handleMarkAsSeen = () => {
    if (selectedPatient) {
        onUpdatePatient(selectedPatient.id, { status: 'seen' });
        setSelectedPatient(null);
    }
  };

  const handleOpenAdmission = () => {
      // Pre-fill diagnosis if AI summary exists
      setAdmissionForm({
          bp: '120/80', hr: '72', temp: '98.6', spo2: '98',
          diagnosis: selectedPatient?.aiSummary.split('.')[0] || '',
          note: ''
      });
      setShowAdmissionModal(true);
  };

  const handleConfirmAdmission = () => {
      if (selectedPatient && selectedBedId) {
          const wardName = currentWards.find((w:any) => w.id === selectedWardId)?.name;
          onUpdatePatient(selectedPatient.id, {
              status: 'admitted',
              ward: wardName,
              room: selectedBedId,
              condition: 'Admitted',
              notes: [`Admitted to ${wardName} Bed ${selectedBedId}`, `Vitals: BP ${admissionForm.bp}, HR ${admissionForm.hr}`, `Diagnosis: ${admissionForm.diagnosis}`]
          });
          setShowAdmissionModal(false);
          setSelectedPatient(null);
          // alert(`Patient admitted to ${wardName} - Bed ${selectedBedId}`); // Removed alert for smoother UX
      } else {
          alert("Please select an available bed.");
      }
  };

  // Discharge Handlers
  const handleOpenDischarge = (patient: Patient) => {
      setDischargePatient(patient);
      // Auto-Fill AI Discharge Summary
      const summary = `Patient admitted on ${new Date(patient.admittedDate).toLocaleDateString()}. \nDiagnosis: ${patient.aiSummary.split('.')[0]}. \nCourse in hospital was uncomplicated. Vitals stable at discharge.`;
      const meds = "1. Tab Paracetamol 500mg SOS \n2. Cap Amoxicillin 500mg TDS x 5 Days \n3. Tab Pantoprazole 40mg OD";
      const inst = "Review in OPD after 7 days. \nEmergency return if symptoms recur.";
      
      setDischargeForm({ summary, medications: meds, instructions: inst });
      setShowDischargeModal(true);
  };

  const handleConfirmDischarge = () => {
      if (dischargePatient) {
          onUpdatePatient(dischargePatient.id, { 
              status: 'discharged',
              dischargeReport: {
                  summary: dischargeForm.summary,
                  medications: dischargeForm.medications,
                  instructions: dischargeForm.instructions,
                  date: new Date().toISOString()
              },
              notes: [...dischargePatient.notes, "Discharged with summary."]
          });
          setShowDischargeModal(false);
          setDischargePatient(null);
      }
  };

  const handleDownloadDischarge = () => {
      if(!dischargePatient) return;
      const text = `
      DISCHARGE SUMMARY
      -----------------
      Patient: ${dischargePatient.name} (ID: ${dischargePatient.id})
      Date: ${new Date().toLocaleDateString()}
      
      Clinical Summary:
      ${dischargeForm.summary}
      
      Discharge Medications:
      ${dischargeForm.medications}
      
      Instructions:
      ${dischargeForm.instructions}
      
      Doctor Signature: _________________
      `;
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dischargePatient.name}_Discharge_Summary.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  // Filter lists based on mode
  const triageList = patients.filter(p => p.status === 'waiting');
  const admittedList = patients.filter(p => p.status === 'admitted');

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] relative">
       
       {/* Triage Navigation Header */}
       <div className="flex-shrink-0 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setViewMode('queue')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
                        viewMode === 'queue' 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                >
                    <ClipboardCheck size={18} /> Triage Queue
                    <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full bg-opacity-30">{triageList.length}</span>
                </button>
                <button 
                    onClick={() => setViewMode('ward')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
                        viewMode === 'ward' 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                >
                    <Bed size={18} /> Inpatient Ward
                    <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full bg-opacity-30">{admittedList.length}</span>
                </button>
            </div>
            
            {viewMode === 'queue' && (
                <span className="text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 py-1 px-3 rounded-full font-medium">
                  {triageList.length} Waiting
               </span>
            )}
       </div>

       {/* Main Content Area */}
       <div className="flex-1 flex overflow-hidden">
        
        {/* VIEW: TRIAGE QUEUE */}
        {viewMode === 'queue' && (
             <div className={`flex-1 overflow-y-auto pr-2 ${selectedPatient ? 'hidden md:block md:w-2/3 lg:w-3/4' : 'w-full'}`}>
                <div className="space-y-3">
                    {triageList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                             <CheckCircle size={48} className="mb-4 opacity-50" />
                             <p>Triage queue is empty. Great job!</p>
                        </div>
                    ) : (
                        triageList.map(p => (
                            <div 
                                key={p.id}
                                onClick={() => setSelectedPatient(p)}
                                className={`bg-white dark:bg-slate-800 p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md flex items-center justify-between
                                    ${selectedPatient?.id === p.id ? 'border-blue-500 ring-1 ring-blue-500 shadow-md dark:border-blue-400' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'}
                                `}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                                        ${p.gender === 'Female' ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-300' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300'}
                                    `}>
                                        {p.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white">{p.name} <span className="text-slate-400 dark:text-slate-500 font-normal text-sm">({p.age}y)</span></h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            {p.complaints.map((c, i) => (
                                                <span key={i} className="text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                                                    {c.symptom} ({c.duration} {c.unit})
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col items-end gap-2">
                                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">AI Suggestion</span>
                                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold ${getSeverityColor(p.severity)}`}>
                                        <AlertCircle size={14} />
                                        {p.severity.toUpperCase()} • {p.suggestedDepartment}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
             </div>
        )}

        {/* VIEW: INPATIENT WARD */}
        {viewMode === 'ward' && (
            <div className="flex-1 overflow-y-auto animate-fade-in flex flex-col gap-6">
                 
                 {/* BED AVAILABILITY SUMMARY */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {currentWards.map((ward: any) => {
                         const available = ward.beds.filter((b: any) => b.status === 'available').length;
                         const total = ward.capacity;
                         const occupancy = Math.round(((total - available) / total) * 100);
                         
                         return (
                             <div key={ward.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                                 <div className="flex justify-between items-start mb-2">
                                     <h3 className="font-bold text-slate-900 dark:text-white">{ward.name}</h3>
                                     <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                         occupancy > 90 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                     }`}>
                                         {occupancy}% Full
                                     </span>
                                 </div>
                                 <div className="flex items-center gap-2 mb-2">
                                     <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                         <div 
                                            className={`h-full ${occupancy > 90 ? 'bg-red-500' : 'bg-blue-500'}`} 
                                            style={{ width: `${occupancy}%` }}
                                         ></div>
                                     </div>
                                 </div>
                                 <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                     <span>{available} Beds Available</span>
                                     <span>{total} Total Capacity</span>
                                 </div>
                             </div>
                         );
                     })}
                 </div>

                 <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                     <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                         <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                             <LayoutList size={18} /> Admitted Patients List
                         </h3>
                     </div>
                     <table className="w-full text-left border-collapse">
                         <thead>
                             <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700">
                                 <th className="p-4">Patient</th>
                                 <th className="p-4">Location</th>
                                 <th className="p-4">Admission Time</th>
                                 <th className="p-4">Diagnosis / Condition</th>
                                 <th className="p-4">Vitals</th>
                                 <th className="p-4">Action</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                             {admittedList.length === 0 ? (
                                 <tr>
                                     <td colSpan={6} className="p-12 text-center text-slate-400 italic">No patients currently admitted to ward.</td>
                                 </tr>
                             ) : (
                                admittedList.map(p => (
                                     <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                         <td className="p-4">
                                             <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                                             <div className="text-xs text-slate-500">{p.age}y • {p.gender}</div>
                                         </td>
                                         <td className="p-4">
                                             <div className="flex items-center gap-2">
                                                 <Bed size={16} className="text-blue-500" />
                                                 <div>
                                                     <div className="font-bold text-slate-800 dark:text-slate-200">{p.ward || 'General'}</div>
                                                     <div className="text-xs text-slate-500">Bed {p.room || 'N/A'}</div>
                                                 </div>
                                             </div>
                                         </td>
                                         <td className="p-4 text-slate-600 dark:text-slate-300">
                                             {p.admittedDate ? new Date(p.admittedDate).toLocaleString() : 'N/A'}
                                         </td>
                                         <td className="p-4">
                                             <div className="font-medium text-slate-800 dark:text-slate-200">{p.aiSummary?.split('.')[0] || 'Under Observation'}</div>
                                         </td>
                                         <td className="p-4">
                                             <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                                                 BP: 120/80 • HR: 72
                                             </span>
                                         </td>
                                         <td className="p-4">
                                             <button 
                                                onClick={() => handleOpenDischarge(p)}
                                                className="flex items-center gap-1 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors"
                                             >
                                                 <LogOut size={14} /> Discharge
                                             </button>
                                         </td>
                                     </tr>
                                 ))
                             )}
                         </tbody>
                     </table>
                 </div>
            </div>
        )}

       {/* Details Drawer (Only visible in Queue Mode) */}
       {selectedPatient && viewMode === 'queue' && (
          <div className="absolute inset-y-0 right-0 w-full md:w-[450px] bg-white dark:bg-slate-800 shadow-2xl border-l border-slate-200 dark:border-slate-700 z-20 flex flex-col animate-slide-in">
             {/* Drawer Header */}
             <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-start justify-between bg-slate-50 dark:bg-slate-800/50">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedPatient.name}</h3>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mt-1">
                        <User size={14} /> {selectedPatient.gender}, {selectedPatient.age} years
                        <span className="mx-1">•</span>
                        ID: {selectedPatient.id}
                    </div>
                </div>
                <button onClick={() => setSelectedPatient(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                    <X size={20} className="text-slate-500 dark:text-slate-400" />
                </button>
             </div>

             {/* Drawer Content */}
             <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* AI Badge (Summary) */}
                <div className={`p-4 rounded-xl border-l-4 ${getSeverityColor(selectedPatient.severity)} bg-opacity-10 dark:bg-opacity-20`}>
                    <h4 className="font-bold flex items-center gap-2 mb-1">
                        <Activity size={18} /> Quick Analysis
                    </h4>
                    <p className="text-sm leading-relaxed opacity-90">
                        {selectedPatient.aiSummary}
                    </p>
                    <div className="mt-3 flex gap-2">
                         <span className="text-xs font-bold border border-current px-2 py-1 rounded">
                            {selectedPatient.suggestedDepartment}
                         </span>
                         <span className="text-xs font-bold border border-current px-2 py-1 rounded">
                            {selectedPatient.severity} Priority
                         </span>
                    </div>
                </div>

                {/* Detailed AI Patient Summary */}
                {detailedAI && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-xl p-5 relative overflow-hidden shadow-sm">
                        <div className="flex items-center gap-2 mb-3 text-indigo-700 dark:text-indigo-300">
                            <Sparkles size={18} className="fill-indigo-200 dark:fill-indigo-800" />
                            <h4 className="font-bold text-sm uppercase tracking-wide">AI Patient Summary</h4>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <h5 className="text-[10px] font-bold text-indigo-400 dark:text-indigo-300 uppercase tracking-wider mb-1">Clinical Reasoning</h5>
                                <p className="text-sm text-indigo-900/80 dark:text-indigo-200/90 leading-relaxed bg-white/50 dark:bg-slate-800/50 p-2 rounded border border-indigo-100/50 dark:border-indigo-700/50">
                                    {detailedAI.clinicalReasoning}
                                </p>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-indigo-100 dark:border-indigo-800 shadow-sm">
                                <h5 className="text-[10px] font-bold text-indigo-500 dark:text-indigo-300 uppercase mb-2 flex items-center gap-1">
                                    <ClipboardCheck size={12} /> Suggested Workflow: {detailedAI.protocol}
                                </h5>
                                <ul className="space-y-2">
                                    {detailedAI.recommendations.map((rec, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-[10px] font-bold mt-0.5 flex-shrink-0">
                                                {i+1}
                                            </div>
                                            <span className="leading-snug">{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Complaints */}
                <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2 text-sm"><Stethoscope size={16} className="text-slate-400" /> Complaints</h4>
                    <div className="bg-slate-50 dark:bg-slate-700/30 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                        {selectedPatient.complaints.map((c, i) => (
                             <div key={i} className="flex justify-between text-sm">
                                 <span className="font-medium text-slate-800 dark:text-slate-200">{c.symptom}</span>
                                 <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><Clock size={12}/> {c.duration} {c.unit}</span>
                             </div>
                        ))}
                    </div>
                </div>

                 {/* Mock Timeline */}
                <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-sm">Timeline</h4>
                    <div className="space-y-4 relative pl-4 border-l-2 border-slate-100 dark:border-slate-700">
                         <div className="relative">
                            <div className="absolute -left-[21px] top-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-slate-800 shadow"></div>
                            <p className="text-sm text-slate-800 dark:text-slate-200">Registration Complete</p>
                            <span className="text-xs text-slate-400">10 mins ago</span>
                         </div>
                         <div className="relative">
                            <div className="absolute -left-[21px] top-1 w-3 h-3 bg-slate-300 dark:bg-slate-600 rounded-full border-2 border-white dark:border-slate-800"></div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Vitals Check Pending</p>
                         </div>
                    </div>
                </div>

             </div>

             {/* Footer Actions */}
             <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                 <button 
                    onClick={handleMarkAsSeen}
                    className="flex-1 py-3 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm transition-all"
                 >
                    Mark Seen
                 </button>
                 <button 
                    onClick={handleOpenAdmission}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
                 >
                    <Bed size={18} /> Admit to Inpatient
                 </button>
             </div>
          </div>
       )}

       {/* Admission Modal */}
       {showAdmissionModal && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
               <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] overflow-hidden animate-slide-up">
                   {/* Modal Header */}
                   <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                       <div className="flex items-center gap-3">
                           <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                               <Building size={24} />
                           </div>
                           <div>
                               <h2 className="text-xl font-bold text-slate-900 dark:text-white">Hospital Admission Protocol</h2>
                               <p className="text-sm text-slate-500 dark:text-slate-400">Assign bed and record admission vitals</p>
                           </div>
                       </div>
                       <button onClick={() => setShowAdmissionModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                           <X size={24} className="text-slate-500" />
                       </button>
                   </div>

                   <div className="flex-1 overflow-y-auto p-6 space-y-8">
                       {/* Clinical Data & Bed Allocation Inputs (Same as before) */}
                       <div>
                           <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                               <Activity size={16} /> Admission Vitals & Diagnosis
                           </h3>
                           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                               <div className="space-y-1">
                                   <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Blood Pressure</label>
                                   <div className="relative">
                                       <HeartPulse size={14} className="absolute left-3 top-3 text-slate-400" />
                                       <input type="text" value={admissionForm.bp} onChange={(e) => setAdmissionForm({...admissionForm, bp: e.target.value})} className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" placeholder="120/80" />
                                   </div>
                               </div>
                               <div className="space-y-1">
                                   <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Heart Rate</label>
                                   <div className="relative">
                                       <Activity size={14} className="absolute left-3 top-3 text-slate-400" />
                                       <input type="text" value={admissionForm.hr} onChange={(e) => setAdmissionForm({...admissionForm, hr: e.target.value})} className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" placeholder="72 bpm" />
                                   </div>
                               </div>
                               <div className="space-y-1">
                                   <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Temperature</label>
                                   <div className="relative">
                                       <Thermometer size={14} className="absolute left-3 top-3 text-slate-400" />
                                       <input type="text" value={admissionForm.temp} onChange={(e) => setAdmissionForm({...admissionForm, temp: e.target.value})} className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" placeholder="98.6 F" />
                                   </div>
                               </div>
                               <div className="space-y-1">
                                   <label className="text-xs font-bold text-slate-700 dark:text-slate-300">SpO2 (%)</label>
                                   <div className="relative">
                                       <Activity size={14} className="absolute left-3 top-3 text-slate-400" />
                                       <input type="text" value={admissionForm.spo2} onChange={(e) => setAdmissionForm({...admissionForm, spo2: e.target.value})} className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" placeholder="99%" />
                                   </div>
                               </div>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Provisional Diagnosis</label>
                                    <input type="text" value={admissionForm.diagnosis} onChange={(e) => setAdmissionForm({...admissionForm, diagnosis: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" placeholder="e.g. Acute Appendicitis" />
                               </div>
                               <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Admission Notes</label>
                                    <input type="text" value={admissionForm.note} onChange={(e) => setAdmissionForm({...admissionForm, note: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" placeholder="Any special instructions..." />
                               </div>
                           </div>
                       </div>

                       {/* Section 2: Bed Allocation */}
                       <div>
                           <div className="flex justify-between items-end mb-4">
                                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-2">
                                    <Bed size={16} /> Bed Availability & Allocation
                                </h3>
                                <div className="flex gap-2">
                                    {currentWards.map((ward: any) => (
                                        <button 
                                            key={ward.id}
                                            onClick={() => setSelectedWardId(ward.id)}
                                            className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors ${
                                                selectedWardId === ward.id 
                                                ? 'bg-blue-600 text-white border-blue-600' 
                                                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            {ward.name}
                                        </button>
                                    ))}
                                </div>
                           </div>
                           
                           <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {currentWards.find((w: any) => w.id === selectedWardId)?.beds.map((bed: any) => (
                                        <button
                                            key={bed.id}
                                            disabled={bed.status === 'occupied'}
                                            onClick={() => setSelectedBedId(bed.id)}
                                            className={`relative p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                                                bed.status === 'occupied' 
                                                  ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed' 
                                                  : selectedBedId === bed.id 
                                                    ? 'bg-green-50 dark:bg-green-900/30 border-green-500 ring-2 ring-green-200 dark:ring-green-900' 
                                                    : 'bg-white dark:bg-slate-700 border-green-200 dark:border-green-800/50 hover:border-green-400 cursor-pointer'
                                            }`}
                                        >
                                            <Bed size={24} className={bed.status === 'occupied' ? 'text-slate-400' : selectedBedId === bed.id ? 'text-green-600' : 'text-green-400'} />
                                            <span className={`text-sm font-bold ${bed.status === 'occupied' ? 'text-slate-500' : 'text-slate-700 dark:text-slate-200'}`}>
                                                {bed.id}
                                            </span>
                                            {bed.status === 'occupied' && (
                                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                           </div>
                       </div>
                   </div>

                   {/* Footer */}
                   <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                       <button onClick={() => setShowAdmissionModal(false)} className="px-6 py-2 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                           Cancel
                       </button>
                       <button 
                           onClick={handleConfirmAdmission}
                           disabled={!selectedBedId}
                           className="px-8 py-2 bg-blue-600 disabled:bg-slate-400 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-colors flex items-center gap-2"
                       >
                           <CheckCircle size={18} /> Confirm Admission
                       </button>
                   </div>
               </div>
           </div>
       )}

       {/* Discharge Modal */}
       {showDischargeModal && dischargePatient && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
               <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] overflow-hidden animate-slide-up">
                   <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-green-50 dark:bg-green-900/20">
                       <div className="flex items-center gap-3">
                           <div className="p-2 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-lg">
                               <LogOut size={24} />
                           </div>
                           <div>
                               <h2 className="text-xl font-bold text-slate-900 dark:text-white">Prepare Discharge Summary</h2>
                               <p className="text-sm text-slate-500 dark:text-slate-400">Review AI generated summary and medications</p>
                           </div>
                       </div>
                       <button onClick={() => setShowDischargeModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                           <X size={24} className="text-slate-500" />
                       </button>
                   </div>

                   <div className="flex-1 overflow-y-auto p-6 space-y-6">
                       
                       {/* AI Summary Section */}
                       <div>
                           <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                               <Sparkles size={14} className="text-purple-500" /> AI Generated Clinical Course
                           </label>
                           <textarea 
                                value={dischargeForm.summary}
                                onChange={(e) => setDischargeForm({...dischargeForm, summary: e.target.value})}
                                rows={4}
                                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm leading-relaxed text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-green-500 outline-none"
                           />
                       </div>

                       {/* Medications */}
                       <div>
                           <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                               <Pill size={14} className="text-blue-500" /> Discharge Medications
                           </label>
                           <textarea 
                                value={dischargeForm.medications}
                                onChange={(e) => setDischargeForm({...dischargeForm, medications: e.target.value})}
                                rows={4}
                                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-green-500 outline-none"
                           />
                       </div>

                       {/* Instructions */}
                       <div>
                           <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                               <FileText size={14} className="text-orange-500" /> Follow-up Instructions
                           </label>
                           <textarea 
                                value={dischargeForm.instructions}
                                onChange={(e) => setDischargeForm({...dischargeForm, instructions: e.target.value})}
                                rows={3}
                                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-green-500 outline-none"
                           />
                       </div>
                   </div>

                   <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                       <button onClick={handleDownloadDischarge} className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2 hover:underline">
                           <Download size={16} /> Save & Download PDF
                       </button>
                       <div className="flex gap-3">
                           <button onClick={() => setShowDischargeModal(false)} className="px-6 py-2 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                               Cancel
                           </button>
                           <button 
                               onClick={handleConfirmDischarge}
                               className="px-8 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition-colors flex items-center gap-2"
                           >
                               <Save size={18} /> Finalize Discharge
                           </button>
                       </div>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};
