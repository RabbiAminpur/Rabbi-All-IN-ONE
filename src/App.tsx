import React, { useState, useEffect } from 'react';
import { Home, Wallet, Notebook, Settings, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from './lib/db';
import { translations, type Language, cn } from './lib/utils';

// Views
import HomeView from './components/HomeView';
import TrackerView from './components/TrackerView';
import NotebookView from './components/NotebookView';
import SettingsView from './components/SettingsView';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'tracker' | 'notes' | 'settings'>('home');
  const [lang, setLang] = useState<Language>('bn');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    const savedLang = localStorage.getItem('prottoy_lang') as Language;
    if (savedLang) setLang(savedLang);
    
    const savedTheme = localStorage.getItem('prottoy_theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleLang = () => {
    const newLang = lang === 'bn' ? 'en' : 'bn';
    setLang(newLang);
    localStorage.setItem('prottoy_lang', newLang);
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('prottoy_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('prottoy_theme', 'light');
    }
  };

  const renderView = () => {
    switch (activeTab) {
      case 'home': return <HomeView lang={lang} setActiveTab={setActiveTab} />;
      case 'tracker': return <TrackerView lang={lang} />;
      case 'notes': return <NotebookView lang={lang} />;
      case 'settings': return <SettingsView lang={lang} toggleLang={toggleLang} toggleTheme={toggleTheme} isDarkMode={isDarkMode} />;
      default: return <HomeView lang={lang} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className={cn("min-h-screen pb-24 safe-area-inset-bottom", isDarkMode ? "dark" : "")}>
      <main className="max-w-md mx-auto px-4 pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FAB */}
      {activeTab !== 'settings' && (
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-40"
          aria-label="Add New"
        >
          <Plus size={28} />
        </button>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-3 flex justify-between items-center z-50">
        <NavButton 
          active={activeTab === 'home'} 
          onClick={() => setActiveTab('home')} 
          icon={<Home size={24} />} 
          label={t.home} 
        />
        <NavButton 
          active={activeTab === 'tracker'} 
          onClick={() => setActiveTab('tracker')} 
          icon={<Wallet size={24} />} 
          label={t.tracker} 
        />
        <NavButton 
          active={activeTab === 'notes'} 
          onClick={() => setActiveTab('notes')} 
          icon={<Notebook size={24} />} 
          label={t.notes} 
        />
        <NavButton 
          active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')} 
          icon={<Settings size={24} />} 
          label={t.settings} 
        />
      </nav>

      {/* Global Add Modal Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-[100] p-4" onClick={() => setShowAddModal(false)}>
           <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl p-6"
            onClick={e => e.stopPropagation()}
           >
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6" />
              <h2 className="text-xl font-bold mb-6 text-center">{lang === 'bn' ? 'নতুন কিছু যোগ করুন' : 'Add Something New'}</h2>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => { setActiveTab('tracker'); setShowAddModal(false); }}
                  className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex flex-col items-center gap-2 border border-blue-100 dark:border-blue-800"
                >
                  <Wallet className="text-blue-600" />
                  <span className="font-medium">{t.tracker}</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('notes'); setShowAddModal(false); }}
                  className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-2xl flex flex-col items-center gap-2 border border-pink-100 dark:border-pink-800"
                >
                  <Notebook className="text-pink-600" />
                  <span className="font-medium">{t.notes}</span>
                </button>
              </div>
           </motion.div>
        </div>
      )}
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-colors",
        active ? "text-primary" : "text-slate-400 dark:text-slate-500"
      )}
    >
      {icon}
      <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
    </button>
  );
}
