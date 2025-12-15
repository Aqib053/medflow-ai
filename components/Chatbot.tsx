
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Sparkles, Activity, FileText, AlertTriangle, Pill, Clipboard } from 'lucide-react';
import { Patient, AnalysisResult } from '../types';

interface ChatbotProps {
  patients: Patient[];
  analysisResult?: AnalysisResult | null;
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: React.ReactNode;
  timestamp: Date;
}

// Mock Medical Knowledge Base for General Queries
const GENERAL_MEDICAL_KB: Record<string, string> = {
    "diabetes": "**Diabetes Mellitus** is a chronic condition affecting how the body processes blood sugar (glucose). \n\n**Common Symptoms:** Increased thirst, frequent urination, fatigue, blurred vision. \n**Management:** Diet control, exercise, insulin or oral medications.",
    "hypertension": "**Hypertension (High Blood Pressure)** is a condition where the force of blood against artery walls is too high. \n\n**Risks:** Heart disease, stroke. \n**Management:** Low sodium diet, exercise, anti-hypertensive drugs.",
    "cpr": "**CPR (Cardiopulmonary Resuscitation)** is an emergency procedure.\n\n**Steps:**\n1. Call Emergency Services.\n2. Push hard and fast in the center of the chest (100-120 bpm).\n3. Give rescue breaths if trained.",
    "fever": "**Fever** is a temporary increase in body temperature, often due to an illness. \n\n**Advice:** Stay hydrated, rest, and take antipyretics (like Paracetamol) if uncomfortable. Seek help if > 103°F or persists > 3 days.",
    "stroke": "**Stroke** occurs when blood supply to part of the brain is interrupted. \n\n**Think F.A.S.T:**\n- **F**ace drooping\n- **A**rm weakness\n- **S**peech difficulty\n- **T**ime to call emergency services.",
    "blod": "**Blood** transports oxygen and nutrients to the lungs and tissues. Did you mean **Blood Pressure** or **Blood Test**?", 
    "blood": "**Blood** is essential for life. It carries oxygen (RBCs), fights infection (WBCs), and stops bleeding (Platelets). Common tests include CBC (Complete Blood Count)."
};

export const Chatbot: React.FC<ChatbotProps> = ({ patients, analysisResult }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [activeContext, setActiveContext] = useState<'general' | 'patient' | 'document'>('general');
  const [contextName, setContextName] = useState<string>('');
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: "Hello! I'm MedFlow Assistant. I can help with patient records or analyze uploaded documents.",
      timestamp: new Date()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Effect to announce document analysis completion in chat
  useEffect(() => {
      if (analysisResult) {
          const msg: Message = {
              id: Date.now().toString(),
              sender: 'bot',
              text: (
                <div className="animate-fade-in">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                        <FileText size={14}/> Document Processed
                    </span>
                    <div className="mt-1 font-medium">{analysisResult.metadata.patientName}</div>
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Ask me about:
                        <div className="flex gap-2 mt-2 flex-wrap">
                            <button onClick={() => handleQuickAction("Summarize this report")} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors border border-slate-200 dark:border-slate-600">Summary</button>
                            <button onClick={() => handleQuickAction("What are the risks?")} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors border border-slate-200 dark:border-slate-600">Critical Flags</button>
                            <button onClick={() => handleQuickAction("Treatment plan")} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 transition-colors border border-slate-200 dark:border-slate-600">Plan</button>
                        </div>
                    </div>
                </div>
              ),
              timestamp: new Date()
          };
          setMessages(prev => [...prev, msg]);
          setActiveContext('document');
          setContextName(analysisResult.metadata.patientName);
          setIsOpen(true); // Auto-open chat on analysis complete
      }
  }, [analysisResult]);

  const handleQuickAction = (text: string) => {
      setInput(text);
      // Optional: Auto-submit
      // handleSend(null, text);
  };

  const generateResponse = (query: string): React.ReactNode => {
    const lowerQuery = query.toLowerCase();
    
    // --- STRATEGY 1: Context Switching (Explicit Patient Name from DB) ---
    const matchedDbPatient = patients.find(p => 
      lowerQuery.includes(p.name.toLowerCase()) || 
      (p.name.split(' ')[0].length > 2 && lowerQuery.includes(p.name.split(' ')[0].toLowerCase()))
    );

    // If user mentions a DB patient name, force switch to that patient context
    if (matchedDbPatient) {
        if (!analysisResult || !analysisResult.metadata.patientName.toLowerCase().includes(matchedDbPatient.name.toLowerCase())) {
            setActiveContext('patient');
            setContextName(matchedDbPatient.name);
            return generateDbPatientResponse(matchedDbPatient, lowerQuery);
        }
    }

    // --- STRATEGY 2: RAG - Document Context (Priority if active or asked about) ---
    const isAskingAboutDoc = lowerQuery.includes('report') || lowerQuery.includes('document') || lowerQuery.includes('this patient') || (activeContext === 'document' && !matchedDbPatient);
    
    if (analysisResult && isAskingAboutDoc) {
         // Update context if not already
         if (activeContext !== 'document') {
             setActiveContext('document');
             setContextName(analysisResult.metadata.patientName);
         }
         return generateDocumentResponse(analysisResult, lowerQuery);
    }

    // --- STRATEGY 3: General Medical Knowledge (Fallback) ---
    for (const key in GENERAL_MEDICAL_KB) {
        if (lowerQuery.includes(key)) {
            setActiveContext('general');
            setContextName('');
            return (
                <div className="space-y-2 animate-fade-in">
                    <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold border-b border-teal-100 dark:border-teal-900/30 pb-1 text-xs uppercase tracking-wide">
                        <Bot size={12} /> Medical Knowledge Bank
                    </div>
                    <p className="text-sm whitespace-pre-line leading-relaxed text-slate-700 dark:text-slate-300">
                        {GENERAL_MEDICAL_KB[key]}
                    </p>
                    <p className="text-[10px] text-slate-400 italic">
                        Disclaimer: This is general information and not a substitute for professional medical advice.
                    </p>
                </div>
            );
        }
    }

    // --- STRATEGY 4: General Greeting / Help ---
    if (lowerQuery.includes('hello') || lowerQuery.includes('hi') || lowerQuery.includes('help')) {
        return "Hello! I can help you summarize patient records from the database or analyze uploaded documents. Try asking 'How is [Patient Name]?' or upload a PDF.";
    }

    return "I couldn't find specific data for that query. Please mention a patient's name, upload a document, or ask a general medical term (e.g. 'Diabetes').";
  };

  // Helper: Generate response based on DB Patient Data
  const generateDbPatientResponse = (patient: Patient, query: string) => {
      const q = query.toLowerCase();

      // Medication Query
      if (q.includes('medicine') || q.includes('medication') || q.includes('drug') || q.includes('prescri')) {
        const meds = getMockMeds(patient.suggestedDepartment);
        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-600 font-bold border-b border-blue-100 pb-1 mb-1">
                    <Pill size={14} /> Medication Protocol
                </div>
                <p className="text-sm">Standard protocol for <strong>{patient.suggestedDepartment}</strong>:</p>
                <ul className="list-disc pl-4 text-sm space-y-1 bg-slate-50 dark:bg-slate-700/50 p-2 rounded">
                    {meds.map(m => <li key={m}>{m}</li>)}
                </ul>
                {patient.allergies.length > 0 && (
                    <div className="text-xs text-red-500 font-bold mt-1">
                        ⚠️ Allergies: {patient.allergies.join(', ')}
                    </div>
                )}
            </div>
        );
      }
      
      // Discharge Summary
      if (q.includes('discharge') || q.includes('summary') || q.includes('draft')) {
          return (
              <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600 font-bold border-b border-green-100 pb-1 mb-1">
                      <Clipboard size={14} /> Discharge Draft
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded text-sm italic border-l-4 border-green-500">
                      "Patient {patient.name} admitted with {patient.complaints[0].symptom}. 
                      Clinical course: {patient.status === 'admitted' ? 'Under active management' : 'Stabilized'}. 
                      Current Status: {patient.severity.toUpperCase()}. 
                      Plan: Continue {patient.suggestedDepartment} protocol. Discharge when vitals stable for 24h."
                  </div>
              </div>
          )
      }
      
      // History / General Status
      return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm uppercase tracking-wide">
                <Activity size={14} /> Patient Record: {patient.name}
            </div>
            <p className="text-sm leading-relaxed">{patient.aiSummary}</p>
            
            <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-slate-50 dark:bg-slate-700/50 p-2 rounded border border-slate-100 dark:border-slate-600">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Vitals</span>
                    <div className="text-xs font-mono font-medium">BP: 120/80 • HR: 72</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 p-2 rounded border border-slate-100 dark:border-slate-600">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Location</span>
                    <div className="text-xs font-medium">{patient.ward || 'Triage'} {patient.room ? `- Bed ${patient.room}` : ''}</div>
                </div>
            </div>

            <div className="mt-2 flex gap-2">
                <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${
                    patient.severity === 'emergency' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                    {patient.severity}
                </span>
                <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-1 rounded font-bold border border-blue-100 dark:border-blue-800">
                    {patient.suggestedDepartment}
                </span>
            </div>
        </div>
      );
  };

  // Helper: Generate response based on Document Analysis (RAG)
  const generateDocumentResponse = (doc: AnalysisResult, query: string) => {
      const q = query.toLowerCase();

      // 1. Risks / Alerts
      if (q.includes('risk') || q.includes('alert') || q.includes('flag') || q.includes('critical')) {
          if (doc.alertFlags.length === 0 && doc.increasedMarkers.length === 0) {
              return "✅ No critical alerts or flags found in this report. The patient appears stable based on the extracted data.";
          }
          return (
              <div className="space-y-2 animate-fade-in">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold border-b border-red-100 dark:border-red-900/30 pb-1">
                      <AlertTriangle size={16} /> Critical Findings
                  </div>
                  {doc.alertFlags.length > 0 && (
                      <ul className="list-disc pl-4 text-sm space-y-1 text-slate-700 dark:text-slate-300">
                          {doc.alertFlags.map(f => <li key={f}>{f}</li>)}
                      </ul>
                  )}
                  {doc.increasedMarkers.length > 0 && (
                      <div className="mt-2">
                          <p className="text-xs font-bold text-slate-500 uppercase">Elevated Markers</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                              {doc.increasedMarkers.map(m => (
                                  <span key={m} className="text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-2 py-1 rounded">{m}</span>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
          );
      }

      // 2. Medications / Treatment
      if (q.includes('med') || q.includes('drug') || q.includes('treat') || q.includes('plan')) {
          return (
              <div className="space-y-2 animate-fade-in">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold border-b border-indigo-100 dark:border-indigo-800 pb-1">
                      <Pill size={16} /> Treatment Pathway
                  </div>
                  <p className="text-xs text-slate-500 mb-2">Based on analysis for {doc.metadata.patientName}:</p>
                  
                  <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                      <ul className="space-y-2 text-sm">
                          {doc.recommendedMeds.map((med, i) => (
                              <li key={i} className="flex justify-between">
                                  <span className="font-medium text-slate-800 dark:text-slate-200">{med.name}</span>
                                  <span className="text-slate-500 text-xs">{med.dosage}</span>
                              </li>
                          ))}
                      </ul>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Clipboard size={10} /> Follow up: {doc.followUpPlan}
                  </div>
              </div>
          );
      }

      // 3. Diagnosis
      if (q.includes('diagnosis') || q.includes('condition') || q.includes('problem')) {
          return (
              <div>
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold border-b border-purple-100 dark:border-purple-800 pb-1 mb-2">
                      <Sparkles size={16} /> Diagnostic Impression
                  </div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{doc.diagnosis}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{doc.summary}</p>
                  <div className="mt-2 text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 p-2 rounded">
                      Confidence: High based on extracted clinical markers.
                  </div>
              </div>
          );
      }

      // 4. Default Summary
      return (
          <div className="space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold border-b border-indigo-100 dark:border-indigo-800 pb-1">
                  <FileText size={16} /> Report Analysis
              </div>
              <p className="text-sm leading-relaxed">{doc.summary}</p>
              
              <div className="bg-slate-50 dark:bg-slate-700/50 p-2 rounded flex justify-between items-center text-xs text-slate-600 dark:text-slate-300">
                  <span>Patient: <strong>{doc.metadata.patientName}</strong></span>
                  <span>Age: {doc.metadata.age}</span>
              </div>
              
              <div className="flex gap-2 mt-1">
                  <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${
                      doc.severity === 'critical' ? 'bg-red-100 text-red-700' : 
                      doc.severity === 'moderate' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                  }`}>
                      {doc.severity} Severity
                  </span>
              </div>
          </div>
      );
  };

  const handleSend = (e: React.FormEvent | null, textOverride?: string) => {
    if (e) e.preventDefault();
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Simulate AI thinking delay
    setTimeout(() => {
        const botMsg: Message = {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: generateResponse(userMsg.text as string),
            timestamp: new Date()
        };
        setMessages(prev => [...prev, botMsg]);
    }, 600);
  };

  const getMockMeds = (dept: string) => {
      switch(dept) {
          case 'Cardiology': return ['Aspirin 81mg', 'Atorvastatin', 'Metoprolol', 'Nitroglycerin PRN'];
          case 'Neurology': return ['TPA (if eligible)', 'Anti-platelet therapy', 'Neuro-protective agents'];
          case 'Orthopedics': return ['Acetaminophen', 'Ibuprofen', 'Calcium + Vit D', 'Bisphosphonates'];
          case 'General': return ['Paracetamol', 'IV Fluids', 'Broad-spectrum antibiotics'];
          default: return ['Standard care meds', 'Vitamins'];
      }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[350px] md:w-[400px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-slide-up flex flex-col max-h-[500px]">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                    <Sparkles size={18} />
                </div>
                <div>
                    <h3 className="font-bold text-sm">MedFlow Assistant</h3>
                    <div className="flex items-center gap-2 text-xs text-blue-100">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> Online
                        </span>
                        {/* Context Badge */}
                        {contextName && (
                            <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 truncate max-w-[120px]">
                                {activeContext === 'document' ? <FileText size={10}/> : <User size={10}/>}
                                {contextName}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50 min-h-[300px]">
             {messages.map((msg) => (
                 <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === 'user' ? 'bg-slate-200 dark:bg-slate-700' : 'bg-blue-100 dark:bg-blue-900'}`}>
                         {msg.sender === 'user' ? <User size={16} className="text-slate-600 dark:text-slate-300" /> : <Bot size={16} className="text-blue-600 dark:text-blue-400" />}
                     </div>
                     <div className={`p-3 rounded-2xl max-w-[85%] text-sm shadow-sm ${
                         msg.sender === 'user' 
                           ? 'bg-blue-600 text-white rounded-tr-none' 
                           : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none'
                     }`}>
                         {msg.text}
                         <div className={`text-[10px] mt-1 opacity-70 ${msg.sender === 'user' ? 'text-blue-100' : 'text-slate-400'}`}>
                             {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                         </div>
                     </div>
                 </div>
             ))}
             <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={(e) => handleSend(e)} className="p-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={activeContext === 'document' ? `Ask about report...` : activeContext === 'patient' ? `Ask about ${contextName}...` : "Ask about a patient..."}
                className="flex-1 bg-slate-100 dark:bg-slate-900 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
              />
              <button 
                type="submit"
                disabled={!input.trim()}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                  <Send size={18} />
              </button>
          </form>
        </div>
      )}

      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-600/30 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 relative"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {analysisResult && !isOpen && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white animate-pulse"></span>
        )}
      </button>
    </div>
  );
};
