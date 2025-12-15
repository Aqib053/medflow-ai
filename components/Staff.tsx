
import React, { useState } from 'react';
import { Users, Clock, Calendar, Search, Filter, Phone, Mail, CheckCircle, XCircle, Coffee } from 'lucide-react';

export const Staff: React.FC = () => {
  const [filter, setFilter] = useState('All');
  
  // Mock Staff Data
  const [staff] = useState([
    { id: 1, name: 'Dr. Aditi Verma', role: 'Doctor', dept: 'Cardiology', status: 'On Duty', shift: '08:00 - 16:00', contact: '555-0101' },
    { id: 2, name: 'Nurse Meera Nair', role: 'Nurse', dept: 'Emergency', status: 'Busy', shift: '08:00 - 20:00', contact: '555-0102' },
    { id: 3, name: 'Dr. Rohan Das', role: 'Doctor', dept: 'Orthopedics', status: 'On Duty', shift: '09:00 - 17:00', contact: '555-0103' },
    { id: 4, name: 'Vikram Malhotra', role: 'Intern', dept: 'General', status: 'Break', shift: '08:00 - 16:00', contact: '555-0104' },
    { id: 5, name: 'Riya Kapoor', role: 'Receptionist', dept: 'Front Desk', status: 'On Duty', shift: '07:00 - 15:00', contact: '555-0105' },
    { id: 6, name: 'Dr. Suresh Menon', role: 'Doctor', dept: 'Diagnostic', status: 'Off Duty', shift: 'Off', contact: '555-0106' },
  ]);

  const filteredStaff = staff.filter(s => filter === 'All' || s.role === filter || s.status === filter);

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Staff Roster</h2>
           <p className="text-slate-500 dark:text-slate-400">Manage shifts, availability and contact info.</p>
        </div>
        <div className="flex gap-2">
           <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2">
               <Calendar size={18} /> Manage Schedule
           </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex-1 flex flex-col overflow-hidden">
         {/* Toolbar */}
         <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
             <div className="flex items-center gap-4">
                 <div className="relative">
                     <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                     <input type="text" placeholder="Search staff..." className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" />
                 </div>
                 <div className="flex items-center gap-2">
                     <Filter size={18} className="text-slate-400" />
                     <select 
                        value={filter} 
                        onChange={(e) => setFilter(e.target.value)}
                        className="bg-transparent text-sm font-medium text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer"
                     >
                         <option value="All">All Staff</option>
                         <option value="Doctor">Doctors</option>
                         <option value="Nurse">Nurses</option>
                         <option value="On Duty">On Duty</option>
                         <option value="Off Duty">Off Duty</option>
                     </select>
                 </div>
             </div>
             <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                 <span className="text-green-600 dark:text-green-400 font-bold">{staff.filter(s => s.status === 'On Duty' || s.status === 'Busy').length}</span> Active Now
             </div>
         </div>

         {/* Table */}
         <div className="overflow-y-auto flex-1 p-4">
             <table className="w-full text-left border-collapse">
                 <thead>
                     <tr className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700">
                         <th className="py-3 pl-2">Member</th>
                         <th className="py-3">Role / Dept</th>
                         <th className="py-3">Status</th>
                         <th className="py-3">Shift Time</th>
                         <th className="py-3 text-right pr-2">Actions</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                     {filteredStaff.map(s => (
                         <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                             <td className="py-3 pl-2">
                                 <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                                         {s.name.charAt(0)}
                                     </div>
                                     <div>
                                         <p className="font-bold text-slate-900 dark:text-white">{s.name}</p>
                                         <p className="text-xs text-slate-500 dark:text-slate-400">{s.contact}</p>
                                     </div>
                                 </div>
                             </td>
                             <td className="py-3">
                                 <p className="text-slate-800 dark:text-slate-200 font-medium">{s.role}</p>
                                 <p className="text-xs text-slate-500 dark:text-slate-400">{s.dept}</p>
                             </td>
                             <td className="py-3">
                                 <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1
                                    ${s.status === 'On Duty' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                                      s.status === 'Busy' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                      s.status === 'Break' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                      'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}
                                 `}>
                                     {s.status === 'On Duty' && <CheckCircle size={12} />}
                                     {s.status === 'Busy' && <Clock size={12} />}
                                     {s.status === 'Break' && <Coffee size={12} />}
                                     {s.status === 'Off Duty' && <XCircle size={12} />}
                                     {s.status}
                                 </span>
                             </td>
                             <td className="py-3 text-slate-600 dark:text-slate-300 font-mono">
                                 {s.shift}
                             </td>
                             <td className="py-3 text-right pr-2">
                                 <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 rounded-lg" onClick={() => window.location.href = `tel:${s.contact}`} title="Call">
                                         <Phone size={16} />
                                     </button>
                                     <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg" onClick={() => window.location.href = `mailto:staff@medflow.ai`} title="Message">
                                         <Mail size={16} />
                                     </button>
                                 </div>
                             </td>
                         </tr>
                     ))}
                 </tbody>
             </table>
         </div>
      </div>
    </div>
  );
};
