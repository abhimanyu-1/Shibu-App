import React, { useRef, useEffect, useState } from 'react';

const ShibuCharacter = ({ speaking = false, audioData = null, onAudioEnd = () => { } }) => {
  const [mouthOpenness, setMouthOpenness] = useState(0); // 0 to 1
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (!audioData) return;

    const playAudio = async () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        // Decode Base64
        const binaryString = window.atob(audioData);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const buffer = await ctx.decodeAudioData(bytes.buffer);

        // Disconnect old source
        if (sourceRef.current) {
          try { sourceRef.current.stop(); } catch (e) { }
          sourceRef.current.disconnect();
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyser.connect(ctx.destination);

        sourceRef.current = source;
        analyserRef.current = analyser;

        source.onended = () => {
          onAudioEnd();
          cancelAnimationFrame(animationFrameRef.current);
          setMouthOpenness(0);
        };

        source.start(0);
        analyzeAudio();

      } catch (e) {
        console.error("Audio playback error", e);
        onAudioEnd();
      }
    };

    const analyzeAudio = () => {
      if (!analyserRef.current) return;

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);

      // Average Volume
      const sum = dataArray.reduce((a, b) => a + b, 0);
      const average = sum / dataArray.length;

      // Map volume (0-255) to mouth openness (0-1)
      // Sensitivity factor: divid by ~50 to max out easily
      let open = average / 40;
      if (open > 1) open = 1;
      if (open < 0.1) open = 0; // Noise gate

      setMouthOpenness(open);

      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    };

    playAudio();

    return () => {
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch (e) { }
      }
      cancelAnimationFrame(animationFrameRef.current);
    };

  }, [audioData]);

  // Fallback for visual "speaking" prop
  useEffect(() => {
    if (!audioData && speaking) {
      // Simple mock animation loop could go here, but for now we just open it
      setMouthOpenness(0.5);
    } else if (!audioData && !speaking) {
      setMouthOpenness(0);
    }
  }, [speaking, audioData]);

  // --- SVG Character Drawing ---
  return (
    <div className="fixed md:absolute left-0 bottom-0 pointer-events-none flex items-end justify-start z-50">
      <div className="relative w-[300px] h-[300px] md:w-[450px] md:h-[450px] pointer-events-auto bg-transparent transition-transform duration-1000 ease-in-out hover:scale-105">

        {/* CSS Animation for Idle Breathing */}
        <style>{`
          @keyframes breathe {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-5px) scale(1.01); }
          }
          @keyframes head-bob {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(1deg); }
          }
        `}</style>

        <svg
          viewBox="0 0 200 240"
          className="w-full h-full drop-shadow-2xl"
          style={{ animation: 'breathe 4s infinite ease-in-out' }}
        >
          {/* Group for Head Animation */}
          <g style={{ animation: 'head-bob 6s infinite ease-in-out', transformOrigin: '100px 200px' }}>

            {/* Neck */}
            <path d="M70 180 L70 240 L130 240 L130 180 Z" fill="#8D5524" />
            {/* Shirt Collar */}
            <path d="M60 220 L140 220 L140 250 L60 250 Z" fill="#FFFFFF" />
            <path d="M100 220 L100 250" stroke="#DDD" strokeWidth="1" />

            {/* Head Shape */}
            <ellipse cx="100" cy="110" rx="60" ry="75" fill="#C68642" />

            {/* Ears */}
            <circle cx="40" cy="110" r="12" fill="#C68642" />
            <circle cx="160" cy="110" r="12" fill="#C68642" />

            {/* Hair (Balding/Side Grey) */}
            <path d="M40 90 Q40 40 100 35 Q160 40 160 90 L165 90 Q170 30 100 25 Q30 30 35 90 Z" fill="#444" />
            <path d="M35 80 L35 120 L45 120 L45 80 Z" fill="#444" /> {/* Sideburn L */}
            <path d="M155 80 L155 120 L165 120 L165 80 Z" fill="#444" /> {/* Sideburn R */}

            {/* Glasses Frame */}
            <g stroke="#333" strokeWidth="3" fill="none">
              <circle cx="75" cy="100" r="18" fill="rgba(255,255,255,0.2)" />
              <circle cx="125" cy="100" r="18" fill="rgba(255,255,255,0.2)" />
              <line x1="93" y1="100" x2="107" y2="100" /> {/* Bridge */}
              <line x1="57" y1="100" x2="35" y2="105" /> {/* Arm L */}
              <line x1="143" y1="100" x2="165" y2="105" /> {/* Arm R */}
            </g>

            {/* Eyes */}
            <circle cx="75" cy="100" r="4" fill="#000" />
            <circle cx="125" cy="100" r="4" fill="#000" />

            {/* Eyebrows (Bushy) */}
            <path d="M60 75 Q75 70 90 75" stroke="#444" strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M110 75 Q125 70 140 75" stroke="#444" strokeWidth="5" strokeLinecap="round" fill="none" />

            {/* Nose */}
            <path d="M100 105 L95 130 L105 130 Z" fill="#A05A2C" />

            {/* Moustache (Thick) */}
            <path d="M70 145 Q100 135 130 145 Q135 155 130 155 Q100 145 70 155 Q65 155 70 145 Z" fill="#222" />

            {/* Mouth (Animated) */}
            {/* The mouth is a simple ellipse located under the moustache. 
                    Height (ry) animates based on volume. 
                    Default (0 volume) ry is 1 (almost closed line).
                    Max (1 volume) ry is 15 (open O shape).
                */}
            <ellipse
              cx="100"
              cy="158"
              rx="12"
              ry={2 + (mouthOpenness * 18)}
              fill="#3f1d1d"
            />

            {/* Teeth (Optional, visible when open wide) */}
            {mouthOpenness > 0.3 && (
              <path d="M92 153 L108 153 L106 156 L94 156 Z" fill="#FFF" />
            )}

          </g>
        </svg>

      </div>
    </div>
  );
};

export default ShibuCharacter;
