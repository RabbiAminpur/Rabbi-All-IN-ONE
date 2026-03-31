import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type ProjectBudget } from '../lib/db';
import { translations, type Language, cn } from '../lib/utils';
import { Plus, Trash2, ChevronLeft, Calculator, PieChart, PlusCircle, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { exportDataToPDF } from '../lib/pdfUtils';

export default function ProjectBudgetView({ lang, onBack }: { lang: Language, onBack: () => void }) {
  const t = translations[lang];
  const projects = useLiveQuery(() => db.projectBudgets.orderBy('createdAt').reverse().toArray());
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectBudget | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!projects || projects.length === 0) return;

    const title = lang === 'bn' ? 'খরচ ক্যালকুলেটর রিপোর্ট' : 'Expense Calculator Report';
    const columns = [
      lang === 'bn' ? 'প্রজেক্ট' : 'Project',
      lang === 'bn' ? 'মোট বাজেট' : 'Total Budget',
      lang === 'bn' ? 'সেক্টরসমূহ' : 'Sectors',
      lang === 'bn' ? 'তারিখ' : 'Date'
    ];

    const data = projects.map(p => [
      p.title,
      `৳ ${p.targetAmount.toLocaleString()}`,
      p.sectors.map(s => `${s.name}: ৳${s.amount.toLocaleString()}`).join('\n'),
      new Date(p.createdAt).toLocaleDateString()
    ]);

    try {
      await exportDataToPDF(title, columns, data, 'project_budgets', lang);
    } catch (err) {
      setError(lang === 'bn' ? 'PDF তৈরি করতে সমস্যা হয়েছে।' : 'Failed to create PDF.');
    }
  };
  
  // New Project State
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [sectors, setSectors] = useState<{ name: string; amount: number }[]>([]);
  const [sectorName, setSectorName] = useState('');
  const [sectorAmount, setSectorAmount] = useState('');

  const addSector = () => {
    if (sectorName && sectorAmount) {
      setSectors([...sectors, { name: sectorName, amount: Number(sectorAmount) }]);
      setSectorName('');
      setSectorAmount('');
    }
  };

  const removeSector = (index: number) => {
    setSectors(sectors.filter((_, i) => i !== index));
  };

  const handleSaveProject = async () => {
    if (!newTitle || !newTarget) return;
    
    await db.projectBudgets.add({
      title: newTitle,
      targetAmount: Number(newTarget),
      sectors: sectors,
      createdAt: new Date()
    });
    
    setNewTitle('');
    setNewTarget('');
    setSectors([]);
    setShowAddModal(false);
  };

  const deleteProject = async (id: number) => {
    await db.projectBudgets.delete(id);
    setShowDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {lang === 'bn' ? 'খরচ ক্যালকুলেটর' : 'Expense Calculator'}
          </h1>
        </div>
        <button 
          onClick={handleDownload}
          className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 text-slate-600"
        >
          <Download size={20} />
        </button>
      </header>

      {/* Projects List */}
      <div className="space-y-4">
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-full p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center gap-2 text-slate-400 hover:text-primary hover:border-primary transition-all"
        >
          <PlusCircle size={32} />
          <span className="font-bold">{lang === 'bn' ? 'নতুন প্রজেক্ট বাজেট তৈরি করুন' : 'Create New Project Budget'}</span>
        </button>

        {projects?.map(project => (
          <motion.div 
            key={project.id}
            layout
            className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg">{project.title}</h3>
                <p className="text-xs text-slate-500">{new Date(project.createdAt).toLocaleDateString()}</p>
              </div>
              <button 
                onClick={() => project.id && setShowDeleteConfirm(project.id)}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-500">{lang === 'bn' ? 'মোট বাজেট' : 'Total Budget'}</span>
                <span className="font-bold text-primary">৳ {project.targetAmount.toLocaleString()}</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary" 
                  style={{ width: `${Math.min(100, (project.sectors.reduce((a, b) => a + b.amount, 0) / project.targetAmount) * 100)}%` }} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{lang === 'bn' ? 'সেক্টর ভিত্তিক খরচ' : 'Sector Breakdown'}</p>
              {project.sectors.map((sector, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 dark:text-slate-400">{sector.name}</span>
                  <span className="font-medium">৳ {sector.amount.toLocaleString()}</span>
                </div>
              ))}
              {project.sectors.length === 0 && (
                <p className="text-xs text-slate-400 italic">{lang === 'bn' ? 'কোন সেক্টর যোগ করা হয়নি' : 'No sectors added'}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm !== null && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[150] p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-xs rounded-3xl p-6 text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-lg font-bold mb-2">{lang === 'bn' ? 'আপনি কি নিশ্চিত?' : 'Are you sure?'}</h3>
              <p className="text-slate-500 text-sm mb-6">
                {lang === 'bn' ? 'এটি স্থায়ীভাবে মুছে ফেলা হবে।' : 'This action cannot be undone.'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(null)}
                  className="py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-sm"
                >
                  {lang === 'bn' ? 'না' : 'No'}
                </button>
                <button 
                  onClick={() => deleteProject(showDeleteConfirm)}
                  className="py-3 bg-red-500 text-white rounded-xl font-bold text-sm"
                >
                  {lang === 'bn' ? 'হ্যাঁ' : 'Yes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-4 right-4 bg-red-500 text-white p-4 rounded-2xl shadow-lg z-[200] flex justify-between items-center"
          >
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => setError(null)}><X size={18} /></button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-[110] p-4" onClick={() => setShowAddModal(false)}>
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{lang === 'bn' ? 'নতুন প্রজেক্ট' : 'New Project'}</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{lang === 'bn' ? 'প্রজেক্টের নাম' : 'Project Name'}</label>
                  <input 
                    type="text" 
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder={lang === 'bn' ? 'যেমন: নতুন বাড়ি' : 'e.g. New House'}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{lang === 'bn' ? 'মোট সম্ভাব্য বাজেট' : 'Total Estimated Budget'}</label>
                  <input 
                    type="number" 
                    value={newTarget}
                    onChange={e => setNewTarget(e.target.value)}
                    placeholder="৳ 0"
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-3">{lang === 'bn' ? 'সেক্টর যোগ করুন' : 'Add Sectors'}</label>
                  <div className="flex gap-2 mb-4">
                    <input 
                      type="text" 
                      value={sectorName}
                      onChange={e => setSectorName(e.target.value)}
                      placeholder={lang === 'bn' ? 'সেক্টর (যেমন: ইট)' : 'Sector (e.g. Brick)'}
                      className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm border-none"
                    />
                    <input 
                      type="number" 
                      value={sectorAmount}
                      onChange={e => setSectorAmount(e.target.value)}
                      placeholder="৳"
                      className="w-24 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm border-none"
                    />
                    <button 
                      onClick={addSector}
                      className="p-3 bg-primary text-white rounded-xl active:scale-95 transition-transform"
                    >
                      <Plus size={20} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {sectors.map((s, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm">
                        <span>{s.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-bold">৳ {s.amount.toLocaleString()}</span>
                          <button onClick={() => removeSector(i)} className="text-red-500">
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={handleSaveProject}
                  disabled={!newTitle || !newTarget}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold mt-6 disabled:opacity-50 active:scale-95 transition-transform"
                >
                  {lang === 'bn' ? 'বাজেট সংরক্ষণ করুন' : 'Save Budget'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
