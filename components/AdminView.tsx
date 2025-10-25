import React, { useState, useEffect } from 'react';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';

interface AdminViewProps {
  themes: Record<string, string>;
  setThemeForMonth: (month: string, theme: string) => void;
  onClose: () => void;
}

const AdminView: React.FC<AdminViewProps> = ({ themes, setThemeForMonth, onClose }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newTheme, setNewTheme] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const getMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

  useEffect(() => {
    const monthKey = getMonthKey(selectedDate);
    setNewTheme(themes[monthKey] || '');
  }, [selectedDate, themes]);

  const handlePrevMonth = () => {
    setSelectedDate(current => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(current => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const monthKey = getMonthKey(selectedDate);
    setThemeForMonth(monthKey, newTheme.trim());
    setIsSaved(true);
    // After showing 'Saved!' for 1.5s, automatically close the admin view
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const selectedMonthKey = getMonthKey(selectedDate);
  const originalTheme = themes[selectedMonthKey] || '';
  const hasChanged = newTheme.trim() !== originalTheme;

  return (
    <div className="p-6 md:p-8 bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700 w-full max-w-lg mx-auto text-white">
      <h2 className="text-3xl font-bold text-center mb-4 text-amber-300">Admin Panel</h2>
      
      <div className="flex items-center justify-between mb-4">
        <button onClick={handlePrevMonth} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200" aria-label="Previous Month">
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        <h3 className="text-xl font-semibold text-center text-slate-100 tabular-nums">
          {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={handleNextMonth} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200" aria-label="Next Month">
          <ChevronRightIcon className="h-6 w-6" />
        </button>
      </div>

      <p className="text-center text-slate-300 mb-6">Set the spiritual theme for the selected month.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="theme" className="block text-slate-300 text-sm font-bold mb-2">
            Theme for {selectedDate.toLocaleString('default', { month: 'long' })}
          </label>
          <input
            id="theme"
            type="text"
            value={newTheme}
            onChange={(e) => setNewTheme(e.target.value)}
            placeholder="e.g., Divine Elevation"
            className="shadow appearance-none border rounded-lg w-full py-3 px-4 bg-slate-700 border-slate-600 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!hasChanged || isSaved}
            className={`font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-200 ${
              isSaved
                ? 'bg-green-600'
                : 'bg-amber-500 hover:bg-amber-400 disabled:bg-slate-500 disabled:cursor-not-allowed'
            }`}
          >
            {isSaved ? 'Saved!' : 'Save Theme'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminView;