import React, { useState, useEffect, useRef } from 'react';
import { Scripture, BibleVersion } from '../types';
import CloseIcon from './icons/CloseIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';
import LoadingSpinner from './LoadingSpinner';

interface VoiceAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  scripture: Scripture;
  selectedVersion: BibleVersion;
  theme: string;
}

// A secure voice assistant implementation that sends user queries to a server-side
// chat endpoint and uses the browser SpeechSynthesis API to play replies.
const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ isOpen, onClose, scripture, selectedVersion, theme }) => {
  const [history, setHistory] = useState<Array<{ source: 'user' | 'assistant'; text: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const recognitionRef = useRef<any>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    // Scroll-to-bottom or other UI effects can be added here if needed.
  }, [history]);

  useEffect(() => {
    // Initialize Web Speech Recognition if available
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = 'en-US';
      rec.interimResults = true;
      rec.onresult = (event: any) => {
        const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join('');
        setInputText(transcript);
      };
      rec.onerror = (e: any) => {
        console.error('Speech recognition error', e);
        setIsRecording(false);
      };
      recognitionRef.current = rec;
    }
  }, []);

  const startRecording = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (e) {
      console.error('Failed to start speech recognition', e);
    }
  };

  const stopRecording = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (e) {
      console.error('Failed to stop speech recognition', e);
    }
    setIsRecording(false);
  };

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-US';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.error('Speech synthesis error', e);
    }
  };

  const sendMessage = async (message: string) => {
    if (!message) return;
    setHistory((h) => [...h, { source: 'user', text: message }]);
    setInputText('');
    setLoading(true);
    try {
      const payload = {
        theme,
        scripture: { reference: scripture.reference, text: scripture.versions[selectedVersion] },
        message,
      };
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error('Server returned an error');
      const data = await resp.json();
      const reply: string = data?.reply || 'Sorry, I could not generate a response.';
      setHistory((h) => [...h, { source: 'assistant', text: reply }]);
      speak(reply);
    } catch (err) {
      console.error('Chat error', err);
      setHistory((h) => [...h, { source: 'assistant', text: 'An error occurred while contacting the server.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="flex h-full max-h-[80vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-700 bg-slate-800 p-4 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
          <h2 className="text-xl font-bold text-amber-300">Voice Assistant</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 space-y-4">
          {history.length === 0 && (
            <div className="text-center text-slate-400 p-8">
              <p>I'm ready to talk about today's scripture.</p>
              <p className="text-sm">Type a question or use the microphone.</p>
            </div>
          )}
          {history.map((entry, i) => (
            <div key={i} className={`flex ${entry.source === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl px-4 py-2 ${entry.source === 'user' ? 'bg-blue-600' : 'bg-slate-600'}`}>
                <p>{entry.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-slate-700 pt-4 flex items-center gap-2">
          <div className="flex-1">
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(inputText); }}
              className="w-full rounded-lg px-4 py-2 bg-slate-700 text-white"
              placeholder="Ask about this scripture..."
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { if (isRecording) stopRecording(); else startRecording(); }}
              className={`rounded-full p-2 ${isRecording ? 'bg-red-500' : 'bg-white/10'}`}
              aria-label="Toggle recording"
            >
              <MicrophoneIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => sendMessage(inputText)}
              disabled={loading}
              className="rounded-full px-4 py-2 bg-amber-400 text-slate-900 font-semibold"
            >
              {loading ? <LoadingSpinner /> : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;
