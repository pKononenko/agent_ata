import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, PhoneOff, Volume2, Waves, Activity, Radio } from 'lucide-react';

function CallPanel() {
  const localRef = useRef<HTMLAudioElement>(null);
  const remoteRef = useRef<HTMLAudioElement>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Placeholder: integrate WebRTC media streams here.
    setConnected(true);
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-12 p-20">
      <motion.div
        initial={{ scale: 0.92, opacity: 0.7 }}
        animate={{ scale: connected ? 1 : 0.92, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        className="relative flex h-80 w-80 items-center justify-center rounded-full bg-gradient-to-br from-primary-500/60 via-accent/60 to-primary-950 shadow-neon"
      >
        <div className="absolute inset-4 rounded-full border border-white/30" />
        <div className="absolute inset-10 rounded-full border border-white/10" />
        <Waves className="h-20 w-20 text-white" />
        <audio ref={localRef} hidden playsInline />
        <audio ref={remoteRef} hidden playsInline autoPlay />
      </motion.div>
      <div className="flex items-center gap-4 text-white/70">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2">
          <Activity className="h-4 w-4 text-accent" />
          <span className="text-xs uppercase tracking-[0.3em]">Low latency</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2">
          <Radio className="h-4 w-4 text-accent" />
          <span className="text-xs uppercase tracking-[0.3em]">Groq realtime tokens</span>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <button className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20">
          <Volume2 className="h-6 w-6" />
        </button>
        <button className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-primary-950 shadow-neon transition hover:bg-accent/90">
          <Mic className="h-8 w-8" />
        </button>
        <button className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/80 text-white transition hover:bg-red-500">
          <PhoneOff className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}

export default CallPanel;
