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
  const [isHandsFree, setIsHandsFree] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

useEffect(() => {
  return () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
}, []);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;

    const chooseDefaultVoice = (list: SpeechSynthesisVoice[]) => {
      // Prioritize high-quality voices
      const preferenceOrder = [
        'natural', 'neural', 'premium', 'enhanced', 'wavenet',
        'aria', 'jenny', 'emma', 'samantha', 'alex',
        'google us english', 'microsoft'
      ];
      return (
        list.find((voice) =>
          preferenceOrder.some((keyword) => voice.name.toLowerCase().includes(keyword))
        ) || list[0]
      );
    };

    const populateVoices = () => {
      const list = synth.getVoices();
      if (!list.length) return;
      setVoices(list);
      setSelectedVoice((prev) => {
        if (prev) return prev;
        const preferred = chooseDefaultVoice(list);
        return preferred?.voiceURI || '';
      });
    };

    populateVoices();
    synth.onvoiceschanged = populateVoices;

    return () => {
      synth.onvoiceschanged = null;
    };
  }, []);

  const startRecording = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setInputText(transcript);
        const isFinal = event.results[event.results.length - 1]?.isFinal;
        if (isFinal && transcript.trim() && isHandsFree) {
          stopRecording();
          sendMessage(transcript.trim());
        }
      };
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

  const speakWithBrowser = (text: string) => {
    if (!('speechSynthesis' in window) || !text) return;
    try {
      stopRecording();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-US';
      
      // Auto-select best quality voice if none selected
      const voice = voices.find((v) => v.voiceURI === selectedVoice) || 
                    voices.find((v) => v.name.toLowerCase().includes('natural')) ||
                    voices.find((v) => v.name.toLowerCase().includes('neural')) ||
                    voices.find((v) => v.name.toLowerCase().includes('premium')) ||
                    voices.find((v) => v.name.toLowerCase().includes('enhanced')) ||
                    voices.find((v) => v.name.toLowerCase().includes('google')) ||
                    voices[0];
      
      if (voice) {
        utter.voice = voice;
        utter.lang = voice.lang || 'en-US';
      }
      
      // Optimized for natural speech
      utter.pitch = 1.0;
      utter.rate = 0.88;
      utter.volume = 1.0;
      
      utter.onend = () => {
        if (isHandsFree) {
          startRecording();
        }
      };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch (err) {
      console.error('Speech synthesis error', err);
    }
  };

  const playRemoteAudio = (base64: string | null, fallbackText: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (!base64) {
      speakWithBrowser(fallbackText);
      return;
    }
    try {
      stopRecording();
      const audio = new Audio(`data:audio/mp3;base64,${base64}`);
      audioRef.current = audio;
      audio.onended = () => {
        audioRef.current = null;
        if (isHandsFree) startRecording();
      };
      audio.onerror = () => {
        audioRef.current = null;
        speakWithBrowser(fallbackText);
      };
      audio.play().catch(() => {
        audioRef.current = null;
        speakWithBrowser(fallbackText);
      });
    } catch (err) {
      console.error('Audio playback error', err);
      speakWithBrowser(fallbackText);
    }
  };

  const sendMessage = async (message: string) => {
    if (!message) return;
    if (isRecording) {
      stopRecording();
    }
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
      playRemoteAudio(data?.audio || null, reply);
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

        <div className="mb-4 flex flex-wrap gap-3 text-sm text-slate-300">
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-slate-400">Preferred voice</span>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="rounded-lg bg-slate-700/70 px-3 py-2 text-white"
            >
              {voices.length === 0 && <option value="">System default</option>}
              {voices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} {voice.lang ? `(${voice.lang})` : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-full border border-slate-600/80 px-3 py-2 text-xs uppercase tracking-wide">
            <input
              type="checkbox"
              checked={isHandsFree}
              onChange={(e) => setIsHandsFree(e.target.checked)}
              className="h-4 w-4 accent-amber-400"
            />
            Auto listen after replies
          </label>
          <p className="text-xs text-slate-400">
            Powered by Gemini voice for a more natural conversation.
          </p>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 space-y-4">
          {history.length === 0 && (
            <div className="text-center text-slate-400 p-8">
              <p>I'm ready to talk about today's scripture.</p>
              <p className="text-sm">Type a question, speak, or let me respond naturally.</p>
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
