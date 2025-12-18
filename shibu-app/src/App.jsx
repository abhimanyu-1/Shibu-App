import React, { useState, useEffect, useRef } from 'react';
import ShibuCharacter from './components/ShibuCharacter';
import OnboardingForm from './components/OnboardingForm';
import InterviewInterface from './components/InterviewInterface';
import HealthCheck from './components/HealthCheck';

function App() {
  const [appState, setAppState] = useState('onboarding'); // 'onboarding' | 'interview'
  const [userData, setUserData] = useState(null);
  const [shibuSpeaking, setShibuSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState("");

  // Session ID for backend
  // FIX: Initialize immediately to prevent stale closure in SpeechRecognition
  const [sessionId] = useState(() => "session_" + Math.random().toString(36).substr(2, 9));

  // Refs for Speech APIs
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(window.speechSynthesis);

  // Initialize Speech Recognition
  useEffect(() => {
    // Session ID is already set.

    // Browser compatibility check

    // Browser compatibility check
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Stop after one sentence
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleUserMessage(transcript);
        }
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("Speech Recognition not supported in this browser.");
      setMessages(prev => [...prev, { sender: 'shibu', text: "Voice input is not supported in this browser. Please use text." }]);
    }

    // Cleanup speech synthesis on unmount
    return () => {
      if (synthesisRef.current) synthesisRef.current.cancel();
    };
  }, []);



  const [currentAudio, setCurrentAudio] = useState(null);

  const handleShibuSpeak = (text, audioBase64) => {
    // Always add message first
    setMessages(prev => [...prev, { sender: 'shibu', text }]);

    if (audioBase64) {
      // Pass audio data to component
      setShibuSpeaking(true);
      setCurrentAudio(audioBase64);
    } else {
      console.warn("No audio received from backend");
    }
  };

  const handleAudioEnd = () => {
    setShibuSpeaking(false);
    setCurrentAudio(null);
  };

  const handleOnboardingSubmit = async (data) => {
    setUserData(data);
    setAppState('interview');

    // Call Backend Initialize
    try {
      const response = await fetch('http://localhost:8000/start_interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          name: data.name,
          domain: data.domain,
          age: data.age,
          experience: data.experience
        })
      });
      const result = await response.json();

      handleShibuSpeak(result.reply, result.audio);
      setCurrentQuestion("Interview in progress...");

    } catch (error) {
      console.error("Backend Error:", error);
      setMessages(prev => [...prev, { sender: 'shibu', text: "Connection to server failed. Please check backend." }]);
    }
  };

  const handleUserMessage = async (text) => {
    if (!text) return;
    setMessages(prev => [...prev, { sender: 'user', text }]);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: text
        })
      });
      const result = await response.json();

      handleShibuSpeak(result.reply, result.audio);

      if (result.is_finished) {
        setCurrentQuestion("Interview Completed.");
        // Disable input or show summary here if needed
      }

    } catch (error) {
      console.error("Backend Error:", error);
      setMessages(prev => [...prev, { sender: 'shibu', text: "I lost connection to the server." }]);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error("Speech start error or already started", e);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden relative selection:bg-shibu-accent selection:text-slate-900">
      <HealthCheck />

      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-2/3 h-2/3 bg-shibu-neon/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-shibu-accent/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Content Layout */}
      <div className="flex flex-col md:flex-row h-screen relative z-10">

        {/* Left Side: Shibu Character */}
        <div className="flex-none h-[40vh] md:h-full md:w-1/3 relative flex items-end justify-center pointer-events-none">
          {/* Shibu lives here */}
          <ShibuCharacter
            speaking={shibuSpeaking}
            audioData={currentAudio}
            onAudioEnd={handleAudioEnd}
          />

          <div className="absolute top-4 left-4 md:top-10 md:left-10 z-20">
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter italic shadow-black drop-shadow-lg">
              <span className="text-shibu-accent">SHIBU</span>
              <span className="text-slate-400 text-sm md:text-lg not-italic font-normal ml-2 inline-block">AI Interviewer</span>
            </h1>
          </div>
        </div>

        {/* Right Side: Interface */}
        <div className="flex-1 h-[60vh] md:h-full flex items-center justify-center p-4">
          {appState === 'onboarding' ? (
            <OnboardingForm onSubmit={handleOnboardingSubmit} />
          ) : (
            <div className="w-full h-full md:pt-10 pb-4 flex flex-col">
              <InterviewInterface
                messages={messages}
                onSendMessage={handleUserMessage}
                isListening={isListening}
                toggleListening={toggleListening}
                currentQuestion={currentQuestion}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
