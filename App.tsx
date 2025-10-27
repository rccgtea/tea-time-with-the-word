import React, { useState } from 'react';
import { useThemes } from './hooks/useTheme';
import UserView from './components/UserView';
import AdminView from './components/AdminView';
import CogIcon from './components/icons/CogIcon';
import AuthModal from './components/AuthModal';

const App: React.FC = () => {
  const [themes, setThemeForMonth] = useThemes();
  const [isAdminView, setIsAdminView] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, '0')}`;
  const currentTheme = themes[currentMonthKey] || '';

  const handleAdminClick = () => {
    if (isAuthenticated) {
      // If already authenticated, just toggle the view
      setIsAdminView(!isAdminView);
    } else {
      // If not authenticated, open the password modal
      setIsAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    setIsAdminView(true); // Directly open admin view on success
  };

  const backgroundStyle = {
    backgroundImage: `
      radial-gradient(circle at 10% 20%, rgba(253, 224, 71, 0.25), transparent 35%),
      radial-gradient(circle at 80% 0%, rgba(129, 140, 248, 0.25), transparent 35%),
      radial-gradient(circle at 50% 80%, rgba(45, 212, 191, 0.2), transparent 30%),
      linear-gradient(135deg, #020617, #0f172a 55%, #1e1b4b)
    `,
  } as const;

  return (
    <div className="relative min-h-screen w-full overflow-hidden text-white" style={backgroundStyle}>
      <div
        className="pointer-events-none absolute inset-0 opacity-20 mix-blend-screen"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)',
          backgroundSize: '120px 120px',
        }}
      />
      <div className="relative z-10 min-h-screen w-full bg-slate-950/60 backdrop-blur-lg flex flex-col items-center justify-center px-4 pt-28 pb-20">
        <header className="absolute top-0 left-0 w-full p-4 flex justify-between items-center">
          <div className="text-left">
            <h1 className="text-2xl font-bold tracking-tight">
              RCCG The Eagles Ark
            </h1>
            <p className="text-sm text-slate-300">
              Daily Spiritual Nourishment
            </p>
          </div>
          <button
            onClick={handleAdminClick}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200"
            aria-label="Admin Panel"
          >
            <CogIcon className="h-6 w-6 text-white" />
          </button>
        </header>

        <main className="w-full">
          {isAdminView && isAuthenticated ? (
            <AdminView
              themes={themes}
              setThemeForMonth={setThemeForMonth}
              onClose={() => setIsAdminView(false)}
            />
          ) : (
            <UserView theme={currentTheme} />
          )}
        </main>

        <footer className="absolute bottom-0 w-full text-center p-4 text-slate-400 text-sm">
          <p>
            &copy; {new Date().getFullYear()} RCCG The Eagles Ark. All Rights
            Reserved.
          </p>
        </footer>

        {isAuthModalOpen && (
          <AuthModal
            onClose={() => setIsAuthModalOpen(false)}
            onSuccess={handleAuthSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default App;
