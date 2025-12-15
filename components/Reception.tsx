
import React, { useState } from 'react';
import { UserPlus, Clock, Save, X, Plus } from 'lucide-react';
import { Department, Patient, Severity } from '../types';

interface ReceptionProps {
  onAddPatient: (patient: Patient) => void;
}

export const Reception: React.FC<ReceptionProps> = ({ onAddPatient }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    age: '',
    gender: 'Male',
    symptom: '',
    duration: '',
    unit: 'Hours',
  });
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleAddAllergy = (e: React.MouseEvent | React.KeyboardEvent) => {
      e.preventDefault();
      if (allergyInput.trim()) {
          if (!allergies.includes(allergyInput.trim())) {
              setAllergies([...allergies, allergyInput.trim()]);
          }
          setAllergyInput('');
      }
  };

  const removeAllergy = (allergy: string) => {
      setAllergies(allergies.filter(a => a !== allergy));
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate AI Processing
    setTimeout(() => {
        const newPatient: Patient = {
            id: `P-${Math.floor(Math.random() * 10000)}`,
            name: formData.name,
            phone: formData.phone,
            age: parseInt(formData.age),
            gender: formData.gender as Patient['gender'],
            complaints: [{
                symptom: formData.symptom,
                duration: parseInt(formData.duration) || 1,
                unit: formData.unit as 'Hours' | 'Days' | 'Weeks'
            }],
            severity: determineSeverity(formData.symptom),
            suggestedDepartment: determineDepartment(formData.symptom),
            aiSummary: generateAISummary(formData.symptom, parseInt(formData.age)),
            status: 'waiting',
            notes: [],
            admittedDate: new Date().toISOString(),
            allergies: allergies,
        };

        onAddPatient(newPatient);
        
        setSuccessMsg(`Patient ${newPatient.name} registered successfully.`);
        setFormData({ name: '', phone: '', age: '', gender: 'Male', symptom: '', duration: '', unit: 'Hours' });
        setAllergies([]);
        setAllergyInput('');
        setIsSubmitting(false);

        setTimeout(() => setSuccessMsg(''), 3000);
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="bg-blue-600 dark:bg-blue-700 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
                <UserPlus size={24} />
                <h2 className="text-xl font-bold">New Patient Registration</h2>
            </div>
            {successMsg && (
                <div className="bg-green-500 text-white text-sm px-3 py-1 rounded-full animate-pulse">
                    {successMsg}
                </div>
            )}
        </div>

        <form onSubmit={handleRegister} className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Personal Info */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-2">Personal Information</h3>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                        <input 
                            required 
                            type="text" 
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="flex-1">
                             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Age</label>
                             <input 
                                required 
                                type="number" 
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                                placeholder="35"
                                value={formData.age}
                                onChange={(e) => setFormData({...formData, age: e.target.value})}
                             />
                        </div>
                        <div className="flex-1">
                             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gender</label>
                             <select 
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                value={formData.gender}
                                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                             >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                             </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                        <input 
                            required 
                            type="tel" 
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                            placeholder="(555) 000-0000"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Known Allergies</label>
                        <div className="flex gap-2 mb-2">
                            <input 
                                type="text" 
                                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                                placeholder="e.g. Penicillin, Peanuts"
                                value={allergyInput}
                                onChange={(e) => setAllergyInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddAllergy(e)}
                            />
                            <button 
                                type="button"
                                onClick={handleAddAllergy}
                                className="px-3 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 min-h-[24px]">
                            {allergies.map(alg => (
                                <span key={alg} className="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 border border-red-100 dark:border-red-800">
                                    {alg}
                                    <button type="button" onClick={() => removeAllergy(alg)} className="hover:text-red-900 dark:hover:text-red-100"><X size={12}/></button>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Complaint Info */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-2">Chief Complaint</h3>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Primary Symptom</label>
                        <textarea 
                            required 
                            rows={3}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                            placeholder="e.g. Severe headache with nausea..."
                            value={formData.symptom}
                            onChange={(e) => setFormData({...formData, symptom: e.target.value})}
                        />
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                            <Clock size={16} /> Duration
                        </label>
                        <div className="flex gap-2">
                             <input 
                                required 
                                type="number" 
                                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                                placeholder="2"
                                value={formData.duration}
                                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                             />
                             <select 
                                className="w-32 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                value={formData.unit}
                                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                             >
                                <option value="Hours">Hours</option>
                                <option value="Days">Days</option>
                                <option value="Weeks">Weeks</option>
                             </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-slate-100 dark:border-slate-700">
                <button 
                    type="button" 
                    className="px-6 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2"
                    onClick={() => {
                        setFormData({ name: '', phone: '', age: '', gender: 'Male', symptom: '', duration: '', unit: 'Hours' });
                        setAllergies([]);
                        setAllergyInput('');
                    }}
                >
                    <X size={18} /> Cancel
                </button>
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {isSubmitting ? 'Processing AI...' : <><Save size={18} /> Register Patient</>}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

// Mock AI Logic Helpers
function determineSeverity(text: string): Severity {
    const t = text.toLowerCase();
    if (t.includes('chest') || t.includes('heart') || t.includes('breath') || t.includes('blood') || t.includes('stroke')) return 'emergency';
    if (t.includes('fever') || t.includes('pain') || t.includes('broken')) return 'high';
    return 'medium';
}

function determineDepartment(text: string): Department {
    const t = text.toLowerCase();
    if (t.includes('chest') || t.includes('heart')) return 'Cardiology';
    if (t.includes('head') || t.includes('dizzy')) return 'Neurology';
    if (t.includes('bone') || t.includes('break') || t.includes('wrist') || t.includes('leg')) return 'Orthopedics';
    if (t.includes('child') || t.includes('baby')) return 'Pediatrics';
    return 'General';
}

function generateAISummary(symptom: string, age: number): string {
    const severities = ['Needs immediate attention.', 'Monitor vitals closely.', 'Standard admission recommended.'];
    const advice = severities[Math.floor(Math.random() * severities.length)];
    return `Patient (Age: ${age}) presents with ${symptom}. AI analysis suggests ${determineDepartment(symptom)} referral. ${advice}`;
}
