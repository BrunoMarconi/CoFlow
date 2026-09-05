"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export default function ConnectivityStatus() {
  const [online, setOnline] = useState(true);
  const [recovered, setRecovered] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    function sync() {
      const nextOnline = navigator.onLine;
      if (nextOnline && wasOffline.current) {
        setRecovered(true);
        window.setTimeout(() => setRecovered(false), 2600);
      }
      if (!nextOnline) wasOffline.current = true;
      setOnline(nextOnline);
    }
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  const visible = !online || recovered;
  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} role="status" aria-live="polite" className="fixed left-1/2 top-[calc(var(--safe-top)+4.75rem)] z-(--z-toast) -translate-x-1/2">
          <div className={`flex min-h-10 items-center gap-2 rounded-full border px-4 text-xs font-bold shadow-[0_12px_35px_rgba(20,42,32,.14)] backdrop-blur-xl ${online ? "border-primary/15 bg-[#edf8f1]/95 text-primary-dark" : "border-black/10 bg-[#202622]/95 text-white"}`}>
            <span className={`h-2 w-2 rounded-full ${online ? "bg-primary" : "bg-[#ffcc66]"}`} />
            {online ? "Conexión recuperada" : "Sin conexión · conservamos lo que estabas viendo"}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
