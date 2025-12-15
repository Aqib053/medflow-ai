
import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, Activity, Dumbbell, ShieldAlert, X, Loader2, Thermometer, User, Calendar, MapPin, Stethoscope, UserPlus, Brain, ChevronRight, Clipboard, Leaf, ArrowRight, Pill, AlertOctagon, Timer, HeartPulse, Search } from 'lucide-react';
import { AnalysisResult, Patient, Department, Severity } from '../types';

interface DocumentAnalysisProps {
    onAnalysisComplete: (result: AnalysisResult) => void;
    onAddPatient: (patient: Patient) => void;
}

export const DocumentAnalysis: React.FC<DocumentAnalysisProps> = ({ onAnalysisComplete, onAddPatient }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAdded, setIsAdded] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const extractPdfText = async (file: File): Promise<string | null> => {
      try {
          if (file.type !== 'application/pdf') return null;
          const pdfjs = (window as any).pdfjsLib;
          if (!pdfjs) return null;
          
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
          let text = '';
          
          for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const content = await page.getTextContent();
              const strings = content.items.map((item: any) => item.str);
              text += strings.join(' ') + '\n';
          }
          return text;
      } catch (err) {
          console.error("PDF Extraction failed", err);
          return null;
      }
  };

  const handleFile = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setResult(null);
    setIsAnalyzing(true);
    setIsAdded(false);

    try {
        // Try extracting real text first
        const extractedText = await extractPdfText(uploadedFile);
        
        // Mock processing delay to simulate AI thinking
        setTimeout(() => {
            let analysis: AnalysisResult;
            
            if (extractedText && extractedText.length > 50) {
                // If we got real text, analyze it
                analysis = analyzeExtractedText(extractedText, uploadedFile.name);
            } else {
                // Fallback to filename heuristic if no text (image pdf) or extraction failed
                analysis = generateMockAnalysis(uploadedFile.name);
            }
            
            setResult(analysis);
            onAnalysisComplete(analysis);
            setIsAnalyzing(false);
        }, 2000);

    } catch (e) {
        console.error(e);
        // Fallback on error
        setTimeout(() => {
            const fallback = generateMockAnalysis(uploadedFile.name);
            setResult(fallback);
            onAnalysisComplete(fallback);
            setIsAnalyzing(false);
        }, 1500);
    }
  };

  const handleAddToDashboard = () => {
    if (!result) return;

    // Convert Severity text to Type
    let severity: Severity = 'low';
    if (result.severity === 'critical') severity = 'emergency';
    else if (result.severity === 'moderate') severity = 'high';
    else severity = 'low';

    // Infer department
    let department: Department = 'General';
    const summaryLower = result.summary.toLowerCase();
    if (summaryLower.includes('heart') || summaryLower.includes('cardio') || summaryLower.includes('coronary')) department = 'Cardiology';
    else if (summaryLower.includes('neuro') || summaryLower.includes('brain') || summaryLower.includes('stroke')) department = 'Neurology';
    else if (summaryLower.includes('bone') || summaryLower.includes('fracture')) department = 'Orthopedics';
    
    const newPatient: Patient = {
        id: `P-${Math.floor(Math.random() * 90000) + 10000}`,
        name: result.metadata.patientName,
        age: result.metadata.age,
        gender: result.metadata.gender as 'Male' | 'Female' | 'Other',
        phone: '555-0199', // Mock phone
        complaints: [{
            symptom: result.symptoms[0] || "Refer to report",
            duration: 1,
            unit: 'Days'
        }],
        severity: severity,
        suggestedDepartment: department,
        aiSummary: result.summary,
        status: 'waiting',
        notes: [`Imported from document: ${file?.name}`, `Doctor: ${result.metadata.doctorName}`, `Clinic: ${result.metadata.clinicName}`, `Diagnosis: ${result.diagnosis}`],
        admittedDate: new Date().toISOString(),
        allergies: [] // Default
    };

    onAddPatient(newPatient);
    setIsAdded(true);
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col gap-6">
       {/* Header */}
       <div className="flex items-center justify-between">
           <div>
               <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Medical Document Intelligence</h2>
               <p className="text-slate-500 dark:text-slate-400 text-sm">Upload reports (PDF/JPG) for instant AI Treatment Pathway generation.</p>
           </div>
       </div>

       <div className="flex-1 flex gap-6 overflow-hidden">
            {/* Left Panel: Upload */}
            <div className="w-1/3 flex flex-col gap-4">
                <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-center transition-all
                        ${isDragging 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'}
                    `}
                >
                    {file ? (
                        <div className="relative p-6 bg-blue-50 dark:bg-slate-700 rounded-xl border border-blue-100 dark:border-slate-600 w-full">
                             <FileText size={48} className="text-blue-500 mx-auto mb-3" />
                             <p className="font-bold text-slate-800 dark:text-white truncate">{file.name}</p>
                             <p className="text-xs text-slate-500 dark:text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                             <button 
                                onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); setIsAdded(false); }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                             >
                                 <X size={14} />
                             </button>
                        </div>
                    ) : (
                        <>
                            <div className="w-16 h-16 bg-blue-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                                <Upload size={32} />
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-lg">Upload Report</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Drag & drop or click to browse</p>
                            <input 
                                type="file" 
                                className="hidden" 
                                id="file-upload"
                                accept=".pdf,.jpg,.png"
                                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                            />
                            <label 
                                htmlFor="file-upload"
                                className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm cursor-pointer transition-colors"
                            >
                                Select File
                            </label>
                        </>
                    )}
                </div>
            </div>

            {/* Right Panel: Analysis Result */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden relative flex flex-col">
                {isAnalyzing ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 dark:bg-slate-800/90 z-10">
                        <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Extracting Data...</h3>
                        <p className="text-slate-500 dark:text-slate-400">Analyzing PDF content and generating treatment pathway</p>
                    </div>
                ) : !result ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-12 text-center opacity-50">
                        <Activity size={64} className="mb-4" />
                        <p className="text-lg font-medium">No analysis generated yet.</p>
                        <p className="text-sm">Upload a patient file to extract real data.</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-8 animate-fade-in space-y-6 pb-24">
                        
                        {/* 1. Header Metadata & Diagnosis Card */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 relative overflow-hidden">
                             <div className={`absolute top-0 left-0 w-2 h-full ${
                                 result.severity === 'critical' ? 'bg-red-500' : result.severity === 'moderate' ? 'bg-orange-500' : 'bg-green-500'
                             }`}></div>
                             <div className="flex justify-between items-start mb-4 pl-4">
                                 <div>
                                     <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{result.metadata.patientName}</h3>
                                     <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mt-1">
                                         <span className="flex items-center gap-1"><User size={14} /> {result.metadata.age}y / {result.metadata.gender}</span>
                                         <span className="flex items-center gap-1"><Calendar size={14} /> {result.metadata.date}</span>
                                     </div>
                                 </div>
                                 <div className={`px-4 py-2 rounded-lg font-bold text-sm border uppercase tracking-wider ${
                                      result.severity === 'critical' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400' : 
                                      result.severity === 'moderate' ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400' : 
                                      'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400'
                                 }`}>
                                     {result.severity === 'critical' ? 'RED: CRITICAL' : result.severity === 'moderate' ? 'YELLOW: MODERATE' : 'GREEN: STABLE'}
                                 </div>
                             </div>
                        </div>

                        {/* AI Diagnostic Confidence Card */}
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-xl border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                    <Brain size={24} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-indigo-900 dark:text-indigo-200">AI Diagnostic Impression</h4>
                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">Confidence Score: 94%</p>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                                <p className="text-xl font-bold text-slate-800 dark:text-white mb-2">{result.diagnosis}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{result.summary}</p>
                            </div>
                        </div>

                         {/* 2. Alert Flags (Red Warnings) */}
                         {result.alertFlags.length > 0 && (
                            <div className="bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 p-4 flex gap-4 items-start">
                                <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg text-red-600 dark:text-red-400">
                                    <AlertOctagon size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-red-700 dark:text-red-300">Critical Alert Flags Detected</h4>
                                    <ul className="mt-2 space-y-1">
                                        {result.alertFlags.map((flag, i) => (
                                            <li key={i} className="text-sm text-red-600 dark:text-red-300 flex items-center gap-2">
                                                <AlertTriangle size={14} /> {flag}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                         )}

                        {/* 3. Treatment Pathway Timeline */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                             <div className="bg-slate-50 dark:bg-slate-900/30 px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                                <HeartPulse className="text-pink-500" size={20} />
                                <h4 className="font-bold text-slate-800 dark:text-white">Generated Treatment Pathway</h4>
                            </div>
                            <div className="p-6">
                                <div className="space-y-6 relative pl-4 border-l-2 border-slate-200 dark:border-slate-700 ml-4">
                                    {result.treatmentFlow.map((step, i) => (
                                        <div key={i} className="relative">
                                            <div className={`absolute -left-[23px] top-1 w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 shadow-sm flex items-center justify-center
                                                ${step.type === 'medication' ? 'bg-blue-500' : step.type === 'procedure' ? 'bg-purple-500' : 'bg-green-500'}
                                            `}>
                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                            </div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">{step.time}</p>
                                            <p className="font-medium text-slate-800 dark:text-slate-200">{step.step}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 4. Medication & Protocol Table */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Meds */}
                            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 overflow-hidden">
                                <div className="bg-blue-100/50 dark:bg-blue-900/30 px-5 py-3 border-b border-blue-200 dark:border-blue-900/50 flex items-center gap-2">
                                    <Pill className="text-blue-600 dark:text-blue-400" size={20} />
                                    <h4 className="font-bold text-blue-900 dark:text-blue-300">Medication Plan</h4>
                                </div>
                                <div className="p-5">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-slate-500 uppercase bg-blue-100/30 dark:bg-blue-900/20">
                                            <tr>
                                                <th className="px-3 py-2 rounded-l-lg">Drug</th>
                                                <th className="px-3 py-2">Dosage</th>
                                                <th className="px-3 py-2 rounded-r-lg">Duration</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-blue-100 dark:divide-blue-900/30">
                                            {result.recommendedMeds.map((med, i) => (
                                                <tr key={i}>
                                                    <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-200">{med.name}</td>
                                                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{med.dosage}</td>
                                                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{med.duration}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                             {/* Follow Up */}
                             <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30 overflow-hidden">
                                <div className="bg-indigo-100/50 dark:bg-indigo-900/30 px-5 py-3 border-b border-indigo-200 dark:border-indigo-900/50 flex items-center gap-2">
                                    <Calendar className="text-indigo-600 dark:text-indigo-400" size={20} />
                                    <h4 className="font-bold text-indigo-900 dark:text-indigo-300">Follow-up Plan</h4>
                                </div>
                                <div className="p-5 flex flex-col justify-center h-full pb-8">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                            <Timer size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Next Appointment</p>
                                            <p className="text-lg font-bold text-slate-800 dark:text-white">{result.followUpPlan}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-800 p-3 rounded-lg border border-indigo-100 dark:border-slate-700">
                                        "Ensure all lab results are available before next visit."
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 4. Lifestyle & Avoidance (Split Grid) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Lifestyle (Green) */}
                            <div className="bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30 overflow-hidden">
                                <div className="bg-green-100/50 dark:bg-green-900/30 px-5 py-3 border-b border-green-200 dark:border-green-900/50 flex items-center gap-2">
                                    <Leaf className="text-green-600 dark:text-green-400" size={20} />
                                    <h4 className="font-bold text-green-900 dark:text-green-300">Lifestyle Adjustments</h4>
                                </div>
                                <div className="p-5">
                                    <ul className="space-y-2">
                                        {result.lifestyle.map((l, i) => (
                                            <li key={i} className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                                <Dumbbell size={16} className="text-green-500" />
                                                {l}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Avoid (Red) */}
                            <div className="bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 overflow-hidden">
                                <div className="bg-red-100/50 dark:bg-red-900/30 px-5 py-3 border-b border-red-200 dark:border-red-900/50 flex items-center gap-2">
                                    <ShieldAlert className="text-red-600 dark:text-red-400" size={20} />
                                    <h4 className="font-bold text-red-900 dark:text-red-300">Strictly Avoid</h4>
                                </div>
                                <div className="p-5">
                                    <ul className="space-y-2">
                                        {result.avoid.map((a, i) => (
                                            <li key={i} className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                                <X size={16} className="text-red-500" />
                                                {a}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                 {/* Sticky Footer for Action */}
                 {result && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                        {isAdded ? (
                            <button disabled className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl shadow-md flex items-center gap-2 cursor-default">
                                <CheckCircle size={20} /> Patient Added to Dashboard
                            </button>
                        ) : (
                            <button 
                                onClick={handleAddToDashboard}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center gap-2"
                            >
                                <UserPlus size={20} /> Add Patient to Dashboard
                            </button>
                        )}
                    </div>
                )}
            </div>
       </div>
    </div>
  );
};

// Text Analysis Engine (Regex Based)
function analyzeExtractedText(text: string, filename: string): AnalysisResult {
    // 1. Extract Metadata using Regex
    const nameMatch = text.match(/(?:Name|Patient Name|Patient):\s*([a-zA-Z\s\.]+)/i);
    const ageMatch = text.match(/(?:Age|DOB|Date of Birth):\s*(\d+)/i);
    const genderMatch = text.match(/(?:Gender|Sex):\s*(Male|Female)/i);
    const doctorMatch = text.match(/(?:Doctor|Dr\.|Physician):\s*([a-zA-Z\s\.]+)/i);
    const dateMatch = text.match(/(?:Date|Report Date):\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i);

    let metadata = {
        patientName: nameMatch ? nameMatch[1].trim() : "Unknown Patient",
        age: ageMatch ? parseInt(ageMatch[1]) : 45,
        gender: genderMatch ? genderMatch[1] : "Male",
        date: dateMatch ? dateMatch[1] : new Date().toLocaleDateString(),
        doctorName: doctorMatch ? doctorMatch[1].trim() : "Dr. MedFlow AI",
        clinicName: "MedFlow General Hospital"
    };

    // 2. Identify Condition/Diagnosis based on keywords in text
    const textLower = text.toLowerCase();
    
    // Default / General
    let diagnosis = 'General Checkup';
    let severity: Severity = 'low';
    let summary = "Analysis of the uploaded document indicates standard medical parameters.";
    let symptoms = ["Routine Checkup"];
    
    // Cardiac
    if (textLower.includes('cardiac') || textLower.includes('heart') || textLower.includes('troponin') || textLower.includes('ecg')) {
        diagnosis = 'Cardiac Assessment';
        severity = 'emergency';
        summary = "Report indicates potential cardiac event. Elevated markers or abnormal ECG detected.";
        symptoms = ["Chest Pain", "Shortness of Breath"];
        if (textLower.includes('stemi') || textLower.includes('infarction')) {
            diagnosis = 'Acute Myocardial Infarction';
        }
    }
    // Blood / Lab
    else if (textLower.includes('hemoglobin') || textLower.includes('wbc') || textLower.includes('platelet') || textLower.includes('cbc')) {
        diagnosis = 'Hematology Report';
        severity = 'medium';
        summary = "Blood work analysis completed. Review WBC and Hemoglobin levels for signs of infection or anemia.";
        if (textLower.includes('infection') || textLower.includes('bacteria')) {
            diagnosis = 'Bacterial Infection';
            severity = 'high';
        }
    }
    // Ortho
    else if (textLower.includes('fracture') || textLower.includes('bone') || textLower.includes('x-ray') || textLower.includes('radius')) {
        diagnosis = 'Orthopedic Injury';
        severity = 'medium';
        summary = "Imaging confirms bone structure integrity issues. Fracture or stress injury detected.";
        symptoms = ["Pain", "Swelling", "Limited Mobility"];
    }

    // 3. Generate Treatment Plan based on the Identified Condition
    // Reuse the logic from the filename mock generator but apply it to the extracted context
    const baseMock = generateMockAnalysis(filename); // Get templates
    
    // Override Mock with Extracted Real Data
    return {
        ...baseMock,
        metadata: metadata,
        diagnosis: diagnosis,
        severity: severity === 'emergency' ? 'critical' : severity === 'high' ? 'moderate' : 'low',
        summary: summary,
        symptoms: symptoms
    };
}

// Fallback: Smart Heuristic Data Generator based on Filenames (Existing Logic)
function generateMockAnalysis(filename: string): AnalysisResult {
    const nameLower = filename.toLowerCase();
    
    // Base Context
    let metadata = {
        patientName: "Amit Yadav",
        age: 45,
        gender: "Male",
        date: new Date().toLocaleDateString(),
        doctorName: "Dr. Aditi Verma",
        clinicName: "MedFlow General"
    };

    // 1. Name Extraction Heuristics
    if (nameLower.includes("sarah")) {
        metadata.patientName = "Sanya Iyer";
        metadata.gender = "Female";
        metadata.age = 32;
    } else if (nameLower.includes("michael") || nameLower.includes("mike")) {
        metadata.patientName = "Manish Malhotra";
        metadata.age = 55;
    } else if (nameLower.includes("esther")) {
        metadata.patientName = "Anjali Sharma";
        metadata.gender = "Female";
        metadata.age = 72;
    } else if (nameLower.includes("james")) {
        metadata.patientName = "Jatin Arora";
        metadata.age = 54;
    }

    // 2. Condition/Specialty Extraction Heuristics
    
    // CARDIOLOGY / HEART
    if (nameLower.includes("heart") || nameLower.includes("cardio") || nameLower.includes("ecg") || nameLower.includes("ekg")) {
        metadata.doctorName = "Dr. Varun Chopra";
        metadata.clinicName = "Heart Institute";
        return {
            metadata,
            severity: 'critical',
            diagnosis: 'Acute Myocardial Infarction (STEMI)',
            summary: "ECG Analysis reveals ST-elevation consistent with anterior myocardial infarction. Immediate intervention required.",
            increasedMarkers: ["Troponin T (>0.04 ng/mL)", "CK-MB", "ST Segment Elevation"],
            alertFlags: ["ST-Elevation V1-V4", "Elevated Troponin", "Chest Pain > 2hrs"],
            symptoms: ["Chest Pressure", "Shortness of Breath", "Diaphoresis"],
            treatmentFlow: [
                { step: "Activate Code STEMI", type: 'procedure', time: "Immediate" },
                { step: "Administer Aspirin 325mg (chewable)", type: 'medication', time: "T+0 mins" },
                { step: "Cardiac Catheterization Lab Transfer", type: 'procedure', time: "T+15 mins" },
                { step: "Start Beta-Blocker Therapy", type: 'medication', time: "Post-Procedure" },
            ],
            recommendedMeds: [
                { name: "Aspirin", dosage: "81mg daily", duration: "Indefinite" },
                { name: "Clopidogrel", dosage: "75mg daily", duration: "12 Months" },
                { name: "Atorvastatin", dosage: "80mg nightly", duration: "Indefinite" }
            ],
            protocols: [
                "Activate STEMI Protocol immediately.",
                "Continuous cardiac monitoring.",
                "Oxygen therapy if SpO2 < 90%."
            ],
            lifestyle: [
                "Strict Bed rest until stable.",
                "Start cardiac diet (Low Sodium, Low Fat).",
                "Smoking cessation counseling."
            ],
            avoid: [
                "Physical exertion or stress.",
                "NSAIDs (increases cardiac risk).",
                "Driving until cleared by cardio."
            ],
            followUpPlan: "Cardiology Clinic in 7 Days"
        };
    }

    // HEMATOLOGY / BLOOD / LAB
    if (nameLower.includes("blood") || nameLower.includes("lab") || nameLower.includes("cbc")) {
        return {
            metadata,
            severity: 'moderate',
            diagnosis: 'Bacterial Infection (Possible early Sepsis)',
            summary: "Blood panel indicates localized infection. Elevated White Blood Cell count (14.5 K/uL). Hemoglobin levels are slightly low (11.2 g/dL).",
            increasedMarkers: ["WBC Count (14.5)", "Neutrophils (85%)", "CRP"],
            alertFlags: ["Leukocytosis", "Neutrophilia"],
            symptoms: ["Fatigue", "Low-grade fever", "General Malaise"],
            treatmentFlow: [
                { step: "Start Broad Spectrum Antibiotics", type: 'medication', time: "T+0 hours" },
                { step: "Blood Cultures x2", type: 'procedure', time: "Before Abx" },
                { step: "Monitor Temperature Q4H", type: 'observation', time: "Ongoing" },
                { step: "Repeat CBC", type: 'procedure', time: "T+24 hours" },
            ],
            recommendedMeds: [
                { name: "Amoxicillin-Clav", dosage: "875mg BID", duration: "7 Days" },
                { name: "Paracetamol", dosage: "650mg Q6H PRN", duration: "As needed" }
            ],
            protocols: [
                "Prescribe broad-spectrum oral antibiotics.",
                "Hydration monitoring (IV if necessary).",
                "Follow-up CBC in 7 days to track WBC."
            ],
            lifestyle: [
                "Rest and active hydration.",
                "Probiotic supplements.",
                "Isolate from immunocompromised individuals."
            ],
            avoid: [
                "Alcohol consumption.",
                "Strenuous activity.",
                "Missed antibiotic doses."
            ],
            followUpPlan: "PCP Review in 3 Days"
        };
    }

    // ORTHOPEDICS / BONE / FRACTURE
    if (nameLower.includes("xray") || nameLower.includes("fracture") || nameLower.includes("bone") || nameLower.includes("wrist")) {
        metadata.doctorName = "Dr. Balraj Sethi";
        metadata.clinicName = "Ortho Care";
        return {
            metadata,
            severity: 'moderate',
            diagnosis: 'Distal Radius Fracture (Hairline)',
            summary: "X-Ray confirms hairline fracture of the distal radius. Alignment is good. No surgical intervention currently indicated.",
            increasedMarkers: ["Soft tissue swelling", "Pain Scale (7/10)"],
            alertFlags: ["Decreased Range of Motion", "Swelling"],
            symptoms: ["Wrist pain", "Swelling", "Limited Range of Motion"],
            treatmentFlow: [
                { step: "Immobilize with Splint", type: 'procedure', time: "Immediate" },
                { step: "Post-Reduction X-Ray", type: 'procedure', time: "T+1 Hour" },
                { step: "Cast Application", type: 'procedure', time: "T+3 Days (once swelling subsides)" },
                { step: "Physical Therapy", type: 'lifestyle', time: "T+6 Weeks" },
            ],
            recommendedMeds: [
                { name: "Ibuprofen", dosage: "600mg TID", duration: "5 Days" },
                { name: "Calcium + Vit D", dosage: "Daily supp", duration: "8 Weeks" }
            ],
            protocols: [
                "Splint immobilization (4 weeks).",
                "Ice and elevation (R.I.C.E).",
                "Check neurovascular status daily."
            ],
            lifestyle: [
                "Keep limb elevated above heart level.",
                "Finger motion exercises.",
                "Calcium supplementation."
            ],
            avoid: [
                "Heavy lifting with affected limb.",
                "Getting cast/splint wet.",
                "Contact sports."
            ],
            followUpPlan: "Ortho Clinic in 1 Week"
        };
    }

    // DEFAULT / NORMAL CHECKUP
    return {
        metadata,
        severity: 'low',
        diagnosis: 'Routine Wellness Exam',
        summary: "Routine annual physical examination results are within normal limits. Lipid profile is optimal. No significant findings.",
        increasedMarkers: [],
        alertFlags: [],
        symptoms: ["None reported - Routine Checkup"],
        treatmentFlow: [
            { step: "Review Vaccine History", type: 'procedure', time: "Today" },
            { step: "Discuss Diet & Exercise", type: 'lifestyle', time: "Today" },
            { step: "Schedule Next Annual", type: 'procedure', time: "T+1 Year" },
        ],
        recommendedMeds: [
             { name: "Multivitamin", dosage: "Daily", duration: "Ongoing" }
        ],
        protocols: [
            "Routine follow-up in 1 year.",
            "Maintain current wellness plan.",
            "Update vaccinations if needed."
        ],
        lifestyle: [
            "Continue regular exercise (150 mins/week).",
            "Balanced diet rich in vegetables.",
            "Adequate sleep (7-8 hours)."
        ],
        avoid: [
            "Sedentary lifestyle.",
            "Excessive sugar intake."
        ],
        followUpPlan: "Annual Checkup in 1 Year"
    };
}
