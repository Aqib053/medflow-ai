
import React, { useState } from 'react';
import { Pill, AlertTriangle, Plus, Search, ArrowDown, ArrowUp, ShoppingCart, RefreshCcw } from 'lucide-react';

export const Pharmacy: React.FC = () => {
  const [inventory, setInventory] = useState([
    { id: 101, name: 'Amoxicillin 500mg', category: 'Antibiotic', stock: 450, min: 200, status: 'In Stock' },
    { id: 102, name: 'Paracetamol 650mg', category: 'Analgesic', stock: 1200, min: 500, status: 'In Stock' },
    { id: 103, name: 'Atorvastatin 20mg', category: 'Statin', stock: 45, min: 100, status: 'Low Stock' },
    { id: 104, name: 'Insulin Glargine', category: 'Diabetic', stock: 12, min: 20, status: 'Critical' },
    { id: 105, name: 'Ibuprofen 400mg', category: 'NSAID', stock: 800, min: 300, status: 'In Stock' },
  ]);

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col">
       <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Pharmacy & Inventory</h2>
           <p className="text-slate-500 dark:text-slate-400">Real-time stock tracking and automated dispensing.</p>
        </div>
        <div className="flex gap-3">
           <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold shadow-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700">
               <RefreshCcw size={18} /> Sync
           </button>
           <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2">
               <Plus size={18} /> Add Item
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg"><Pill size={20} /></div>
                  <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded">+12%</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">2,507</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Items in Stock</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg"><AlertTriangle size={20} /></div>
                  <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">Action</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">5</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Low Stock Alerts</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg"><ShoppingCart size={20} /></div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">12</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Pending Orders</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg"><ArrowUp size={20} /></div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">98%</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Fill Rate</p>
          </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
             <div className="relative w-72">
                 <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                 <input type="text" placeholder="Search medications..." className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" />
             </div>
             <button className="text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400">Download Report</button>
         </div>

         <div className="overflow-y-auto flex-1 p-4">
             <table className="w-full text-left border-collapse">
                 <thead>
                     <tr className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700">
                         <th className="py-3 pl-2">Item Name</th>
                         <th className="py-3">Category</th>
                         <th className="py-3">Stock Level</th>
                         <th className="py-3">Status</th>
                         <th className="py-3 text-right pr-2">Actions</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                     {inventory.map(item => (
                         <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                             <td className="py-3 pl-2 font-medium text-slate-900 dark:text-white">{item.name}</td>
                             <td className="py-3 text-slate-600 dark:text-slate-400">{item.category}</td>
                             <td className="py-3">
                                 <div className="flex items-center gap-2">
                                     <span className="font-bold text-slate-800 dark:text-slate-200">{item.stock}</span>
                                     <span className="text-xs text-slate-400">/ {item.min} min</span>
                                 </div>
                                 <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                                     <div 
                                        className={`h-full rounded-full ${item.stock < item.min ? 'bg-red-500' : 'bg-green-500'}`} 
                                        style={{ width: `${Math.min((item.stock / (item.min * 2)) * 100, 100)}%` }}
                                     ></div>
                                 </div>
                             </td>
                             <td className="py-3">
                                 <span className={`px-2.5 py-1 rounded-full text-xs font-bold
                                    ${item.status === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                                      item.status === 'Low Stock' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}
                                 `}>
                                     {item.status}
                                 </span>
                             </td>
                             <td className="py-3 text-right pr-2">
                                 {item.status !== 'In Stock' && (
                                     <button className="text-xs font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                         Reorder
                                     </button>
                                 )}
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
