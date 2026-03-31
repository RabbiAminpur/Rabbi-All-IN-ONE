import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Note } from '../lib/db';
import { translations, type Language, cn } from '../lib/utils';
import { exportToPDF } from '../lib/pdfUtils';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Image as ImageIcon, 
  X, 
  Download, 
  ChevronLeft,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function NotebookView({ lang }: { lang: Language }) {
  const t = translations[lang];
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const notes = useLiveQuery(() => 
    db.notes.orderBy('updatedAt').reverse().toArray()
  );

  const filteredNotes = useMemo(() => {
    if (!notes) return [];
    if (!searchQuery) return notes;
    const query = searchQuery.toLowerCase();
    return notes.filter(note => 
      note.title.toLowerCase().includes(query) || 
      note.content.toLowerCase().includes(query)
    );
  }, [notes, searchQuery]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImages(prev => [...prev, reader.result as string]);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!title && !content) return;

    const now = new Date();
    if (editingNote?.id) {
      await db.notes.update(editingNote.id, {
        title,
        content,
        images,
        updatedAt: now
      });
    } else {
      await db.notes.add({
        title,
        content,
        images,
        createdAt: now,
        updatedAt: now
      });
    }

    closeEditor();
  };

  const openEditor = (note?: Note) => {
    if (note) {
      setEditingNote(note);
      setTitle(note.title);
      setContent(note.content);
      setImages(note.images);
    } else {
      setEditingNote(null);
      setTitle('');
      setContent('');
      setImages([]);
    }
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setEditingNote(null);
    setTitle('');
    setContent('');
    setImages([]);
  };

  const handleDelete = async (id: number) => {
    await db.notes.delete(id);
    if (viewingNote?.id === id) setViewingNote(null);
    setShowDeleteConfirm(null);
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!viewingNote) return;
    setIsExporting(true);
    await exportToPDF('note-content', viewingNote.title || 'note');
    setIsExporting(false);
  };

  return (
    <div className="space-y-6">
      {!viewingNote && !isEditorOpen && (
        <>
          <header className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.notes}</h1>
            <button 
              onClick={() => openEditor()}
              className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20"
            >
              <Plus size={20} />
            </button>
          </header>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder={t.search}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {filteredNotes.length === 0 ? (
              <div className="col-span-2 py-12 text-center text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                {t.no_data}
              </div>
            ) : (
              filteredNotes.map(note => (
                <motion.div 
                  key={note.id}
                  layoutId={`note-${note.id}`}
                  onClick={() => setViewingNote(note)}
                  className="p-4 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-50 dark:border-slate-800 space-y-2 active:scale-95 transition-transform cursor-pointer"
                >
                  {note.images.length > 0 && (
                    <img 
                      src={note.images[0]} 
                      alt="" 
                      className="w-full h-24 object-cover rounded-2xl mb-2"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{note.title || (lang === 'bn' ? 'শিরোনামহীন' : 'Untitled')}</h3>
                  <p className="text-[10px] text-slate-400 line-clamp-3 leading-relaxed">{note.content}</p>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1 text-[8px] text-slate-300">
                      <Calendar size={10} />
                      {new Date(note.updatedAt).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US')}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditor(note);
                      }}
                      className="p-1 text-slate-300 hover:text-primary transition-colors"
                    >
                      <Edit3 size={12} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </>
      )}

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
                {lang === 'bn' ? 'এই নোটটি স্থায়ীভাবে মুছে ফেলা হবে।' : 'This note will be permanently deleted.'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(null)}
                  className="py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-sm"
                >
                  {lang === 'bn' ? 'না' : 'No'}
                </button>
                <button 
                  onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
                  className="py-3 bg-red-500 text-white rounded-xl font-bold text-sm"
                >
                  {lang === 'bn' ? 'হ্যাঁ' : 'Yes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Note Viewer */}
      <AnimatePresence>
        {viewingNote && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed inset-0 bg-slate-50 dark:bg-slate-950 z-[60] p-6 overflow-y-auto"
          >
            <div className="max-w-md mx-auto space-y-6 pb-24">
              <div className="flex justify-between items-center">
                <button onClick={() => setViewingNote(null)} className="p-2 text-slate-500">
                  <ChevronLeft size={24} />
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={handleExport}
                    disabled={isExporting}
                    className={cn(
                      "p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 text-slate-600 transition-opacity",
                      isExporting && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Download size={20} className={isExporting ? "animate-bounce" : ""} />
                  </button>
                  <button 
                    onClick={() => { openEditor(viewingNote); setViewingNote(null); }}
                    className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 text-slate-600"
                  >
                    <Edit3 size={20} />
                  </button>
                  <button 
                    onClick={() => viewingNote.id && setShowDeleteConfirm(viewingNote.id)}
                    className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30 text-red-600"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              <div id="note-content" className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{viewingNote.title}</h2>
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                  <Calendar size={14} />
                  {new Date(viewingNote.updatedAt).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')}
                </div>
                
                <div className="space-y-4">
                  {viewingNote.images.map((img, idx) => (
                    <img key={idx} src={img} alt="" className="w-full rounded-2xl" referrerPolicy="no-referrer" />
                  ))}
                  <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {viewingNote.content}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Note Editor */}
      <AnimatePresence>
        {isEditorOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 bg-white dark:bg-slate-900 z-[70] p-6 flex flex-col"
          >
            <div className="max-w-md mx-auto w-full flex flex-col h-full">
              <div className="flex justify-between items-center mb-6">
                <button onClick={closeEditor} className="p-2 text-slate-500">
                  <X size={24} />
                </button>
                <button 
                  onClick={handleSave}
                  className="px-6 py-2 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/20"
                >
                  {t.save}
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto pb-24">
                <input 
                  type="text" 
                  placeholder={t.title}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full text-2xl font-bold bg-transparent border-none focus:ring-0 placeholder:text-slate-300"
                />
                
                <div className="flex gap-2 overflow-x-auto py-2">
                  <label className="flex-shrink-0 w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 cursor-pointer">
                    <ImageIcon size={24} />
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  {images.map((img, idx) => (
                    <div key={idx} className="flex-shrink-0 relative w-20 h-20">
                      <img src={img} alt="" className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" />
                      <button 
                        onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                <textarea 
                  placeholder={t.content}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full flex-1 bg-transparent border-none focus:ring-0 placeholder:text-slate-300 resize-none leading-relaxed min-h-[300px]"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
