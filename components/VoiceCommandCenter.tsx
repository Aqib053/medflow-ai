
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Activity, Zap, Command, X } from 'lucide-react';

interface VoiceCommandCenterProps {
  onCommandDetected: (intent: string, patientName: string | null, rawText: string) => void;
}

export const VoiceCommandCenter: React.FC<VoiceCommandCenterProps> = ({ onCommandDetected }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.interimResults = true;

      recognition.onstart = () => {
          setIsListening(true);
          setFeedback("Listening for command...");
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          interimTranscript += event.results[i][0].transcript;
        }
        setTranscript(interimTranscript);
      };

      recognition.onend = () => {
        setIsListening(false);
        // Process final result
        if (transcript.trim().length > 0) {
            processCommand(transcript);
        }
      };

      recognitionRef.current = recognition;
    }
  }, [transcript]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      setFeedback(null);
      recognitionRef.current?.start();
    }
  };

  const processCommand = (text: string) => {
      const lower = text.toLowerCase();
      
      // Keyword Detection Logic
      if (lower.includes('emergency') || lower.includes('code blue') || lower.includes('cardiac')) {
          setFeedback("⚠️ Emergency Protocol Identified");
          
          // Simple name extraction heuristic (looks for words after "for" or "patient")
          let name = null;
          const nameMatch = lower.match(/(?:patient|for)\s+([a-z]+)/i);
          if (nameMatch && nameMatch[1]) {
              name = nameMatch[1];
          }

          setTimeout(() => {
              onCommandDetected('emergency_cardiac', name, text);
              setTranscript('');
              setFeedback(null);
          }, 800);
      } else {
          setFeedback("Command not recognized.");
          setTimeout(() => setFeedback(null), 2000);
      }
  };

  return (
    <div className="relative">
      <button 
        onClick={toggleListening}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold border transition-all ${
            isListening 
            ? 'bg-red-600 text-white border-red-500 animate-pulse ring-2 ring-red-400' 
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}
        title="AI Command Mode"
      >
        {isListening ? <Activity size={18} /> : <Mic size={18} />}
        <span className="hidden md:inline">{isListening ? 'Listening...' : 'Voice Command'}</span>
      </button>

      {/* Floating Feedback Overlay */}
      {(isListening || feedback) && (
          <div className="absolute top-12 right-0 w-80 bg-slate-900/90 backdrop-blur text-white p-4 rounded-xl shadow-2xl border border-slate-700 z-50 animate-slide-up">
              <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Zap size={12} className="text-yellow-400" /> AI Command Processor
                  </span>
                  <button onClick={() => { setIsListening(false); setFeedback(null); recognitionRef.current?.stop(); }}><X size={14}/></button>
              </div>
              <p className="font-mono text-lg leading-tight mb-2">
                  "{transcript}"
              </p>
              {feedback && (
                  <div className={`text-xs font-bold px-2 py-1 rounded flex items-center gap-2 ${feedback.includes('Emergency') ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {feedback.includes('Emergency') && <Activity size={12} />}
                      {feedback}
                  </div>
              )}
          </div>
      )}
    </div>
  );
};
