import React, { useState, useEffect } from 'react';
import { getTodaysScriptureFromFirestore } from '../services/dailyScriptureService';
import { Scripture, BibleVersion } from '../types';
import { BIBLE_VERSIONS } from '../constants';
import LoadingSpinner from './LoadingSpinner';
import ShareIcon from './icons/ShareIcon';
import VoiceAssistant from './VoiceAssistant';
import MicrophoneIcon from './icons/MicrophoneIcon';

interface UserViewProps {
  theme: string;
}

const SCRIPTURE_TZ =
  import.meta.env.VITE_SCRIPTURE_TIMEZONE || 'America/Denver';

const UserView: React.FC<UserViewProps> = ({ theme }) => {
  const [scripture, setScripture] = useState<Scripture | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>('NIV');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const today = new Date();
  const dayOfMonth = today.getDate();
  const dateString = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    if (!theme) {
      setScripture(null);
      setError(null); // Not an error, just no theme set
      return;
    }

    const fetchScripture = async () => {
      setLoading(true);
      setError(null);

      try {
        // Always fetch fresh scripture from Firestore (no localStorage caching)
        const dailyScripture = await getTodaysScriptureFromFirestore();
        setScripture(dailyScripture);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchScripture();
  }, [theme, dayOfMonth]);

  const handleShare = async () => {
    if (scripture) {
      const shareText = `"${scripture.versions[selectedVersion]}" - ${scripture.reference} (${selectedVersion})\n\nToday's theme: ${theme}`;
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Daily Scripture from The Eagles Ark`,
            text: shareText,
          });
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            // User cancelled, do nothing.
          } else {
            console.error('Error sharing scripture:', error);
          }
        }
      } else {
        navigator.clipboard.writeText(shareText).then(() => {
          alert('Scripture copied to clipboard!');
        }, (err) => {
          console.error('Failed to copy to clipboard:', err);
          alert('Could not copy scripture.');
        });
      }
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center text-center h-64">
          <LoadingSpinner />
          <p className="mt-4 text-lg">Generating your daily scripture...</p>
          <p className="text-sm text-slate-300">This may take a moment.</p>
        </div>
      );
    }

    if (error) {
      return <p className="text-center text-red-400 text-lg h-64 flex items-center justify-center">{error}</p>;
    }

    if (!theme) {
      return (
        <div className="text-center h-64 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-semibold mb-2">Welcome!</h2>
          <p className="text-slate-300">The theme for this month hasn't been set yet.</p>
          <p className="text-slate-300">Please contact an admin to set it.</p>
        </div>
      );
    }

    if (scripture) {
      return (
        <>
          <p className="text-center text-amber-300 font-semibold mb-2 tracking-wide">
            Theme for the Month: {theme}
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">{scripture.reference}</h2>

          <div className="my-6">
            <div className="flex justify-center items-center flex-wrap gap-2">
              {BIBLE_VERSIONS.map((version) => (
                <button
                  key={version}
                  onClick={() => setSelectedVersion(version)}
                  className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 ${
                    selectedVersion === version
                      ? 'bg-amber-400 text-slate-900'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {version}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xl md:text-2xl leading-relaxed text-center font-serif my-6 min-h-[100px]">
            "{isExpanded && scripture.expandedVersions 
              ? scripture.expandedVersions[selectedVersion] 
              : scripture.versions[selectedVersion]}"
          </p>

          {/* Read More button - only show if expandedVersions exist */}
          {scripture.expandedVersions && (
            <div className="flex justify-center mb-4">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-4 py-2 text-sm font-semibold rounded-full bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 transition-colors duration-200"
              >
                {isExpanded ? '← Show Less' : 'Read More →'}
              </button>
            </div>
          )}

          {/* Show expanded reference when expanded */}
          {isExpanded && scripture.expandedReference && (
            <p className="text-center text-amber-300/70 text-sm mb-4">
              {scripture.expandedReference}
            </p>
          )}

          <div className="flex justify-center items-center gap-4 mt-8">
             <button
                onClick={() => setIsAssistantOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200"
                aria-label="Ask about this scripture"
            >
                <MicrophoneIcon className="h-5 w-5" />
                <span>Ask</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200"
            >
              <ShareIcon className="h-5 w-5" />
              <span>Share</span>
            </button>
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6 md:p-8 bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700">
      <div className="text-center mb-6">
        <p className="text-lg text-slate-300">{dateString}</p>
      </div>
      {renderContent()}
       {isAssistantOpen && scripture && (
        <VoiceAssistant
          isOpen={isAssistantOpen}
          onClose={() => setIsAssistantOpen(false)}
          scripture={scripture}
          selectedVersion={selectedVersion}
          theme={theme}
        />
      )}
    </div>
  );
};

export default UserView;
