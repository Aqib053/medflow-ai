import React, { useState } from 'react';

export const Cleaner: React.FC = () => {
  const [tasks, setTasks] = useState([
    { id: 1, area: 'Ward A - Room 101', time: '19:00', done: false },
    { id: 2, area: 'ICU - Waiting Area', time: '20:00', done: false },
    { id: 3, area: 'Emergency Entrance', time: '21:00', done: true },
    { id: 4, area: 'Radiology Hallway', time: '21:30', done: false },
  ]);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Cleaning Tasks & Zones</h2>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
        {tasks.map(task => (
            <div 
                key={task.id} 
                className={`p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between transition-colors ${task.done ? 'bg-green-50 dark:bg-green-900/20' : 'bg-white dark:bg-slate-800'}`}
            >
                <div className="flex items-center gap-4">
                    <input 
                        type="checkbox" 
                        checked={task.done} 
                        onChange={() => toggleTask(task.id)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                        <p className={`font-medium ${task.done ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                            {task.area}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Scheduled: {task.time}</p>
                    </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                    task.done 
                      ? 'bg-green-200 text-green-700 dark:bg-green-900/50 dark:text-green-300' 
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}>
                    {task.done ? 'COMPLETED' : 'PENDING'}
                </span>
            </div>
        ))}
      </div>
    </div>
  );
};