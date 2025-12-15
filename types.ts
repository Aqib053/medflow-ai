
export type Role = 'doctor' | 'nurse' | 'cleaner' | 'intern' | 'receptionist';
export type Language = 'en' | 'hi' | 'kn';

export interface User {
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  phone?: string;
  bio?: string;
  location?: string;
}

export type Severity = 'emergency' | 'high' | 'medium' | 'low' | 'stable';
export type Department = 'General' | 'Emergency' | 'Cardiology' | 'Neurology' | 'Orthopedics' | 'Pediatrics';

export interface Complaint {
  symptom: string;
  duration: number;
  unit: 'Hours' | 'Days' | 'Weeks';
}

export interface VitalsLog {
    date: string;
    bpSys: number;
    bpDia: number;
    heartRate: number;
    temp: number;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  complaints: Complaint[];
  severity: Severity;
  suggestedDepartment: Department;
  aiSummary: string;
  status: 'waiting' | 'seen' | 'admitted' | 'discharged';
  notes: string[];
  admittedDate: string;
  // New Fields
  allergies: string[];
  followUp?: {
      date: string; // ISO Date
      status: 'scheduled' | 'sent' | 'confirmed' | 'missed';
      type: 'routine' | 'urgent' | 'tele-consult';
  };
  adherenceScore?: number; // 0-100
  lastContacted?: string; // ISO Date string
  vitalsHistory?: VitalsLog[];
  ward?: string;
  room?: string;
  condition?: string;
  dischargeReport?: {
      summary: string;
      medications: string;
      instructions: string;
      date: string;
  };
}

export interface AnalysisResult {
    metadata: {
        doctorName: string;
        clinicName: string;
        date: string;
        patientName: string;
        age: number;
        gender: string;
    };
    severity: 'critical' | 'moderate' | 'low';
    diagnosis: string; // New: Specific Diagnosis
    summary: string;
    increasedMarkers: string[];
    alertFlags: string[]; // New: Critical Warnings
    symptoms: string[];
    treatmentFlow: { step: string; type: 'medication' | 'procedure' | 'observation' | 'lifestyle'; time: string }[]; // New: Visual Pathway
    recommendedMeds: { name: string; dosage: string; duration: string }[]; // New: Structured Meds
    protocols: string[];
    lifestyle: string[];
    avoid: string[];
    followUpPlan: string; // New: Specific plan
}

export interface Diagnosis {
    condition: string;
    probability: number; // 0-100
    riskLevel: 'low' | 'medium' | 'high';
    missingTests: string[];
}

export interface CodeBlueLog {
    startTime: string; // ISO
    cprCycles: number;
    shocks: number;
    medications: string[];
    endTime?: string;
}

export interface ConsultTask {
    id: string;
    fromDept: Department;
    toDept: Department;
    patientId: string;
    note: string;
    status: 'pending' | 'accepted' | 'completed';
    priority: 'routine' | 'urgent' | 'tele-consult';
    timestamp: string;
}

export interface FollowUp {
    id: string;
    patientId: string;
    name: string;
    date: string;
    type: 'Routine' | 'Urgent' | 'Lab Review';
    status: 'Pending' | 'Confirmed' | 'Missed';
}

export interface Order {
    id: string;
    patientId: string;
    patientName: string;
    doctorName: string;
    items: string[];
    status: 'Pending' | 'In Progress' | 'Completed';
    priority: 'Routine' | 'Urgent';
    timestamp: string;
}

export type View = 'dashboard' | 'reception' | 'triage' | 'consultant' | 'cleaner' | 'analysis' | 'pharmacy' | 'billing' | 'staff' | 'settings';
