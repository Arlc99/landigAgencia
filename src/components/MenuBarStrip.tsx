import { motion } from 'motion/react';
import { Search } from 'lucide-react';
import { MonogramLogo } from './primitives';


const menuItems = ['File', 'Edit', 'View', 'Go', 'Window', 'Help'];

function obtenerFechaColombia() {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date());
}



export default function MenuBarStrip() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.9 }}
      className="relative z-10 h-10 bg-black/40 backdrop-blur-md border-t border-b border-white/10"
    >
      <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between text-xs">
        <div className="flex items-center gap-5">
          <MonogramLogo className="w-3.5 h-3.5" />
          <span className="font-bold text-white">jualu.co</span>
          {menuItems.map((item, i) => (
            <span
              key={item}
              className={`text-white/60 ${i > 2 ? 'hidden sm:inline' : ''} ${i > 3 ? 'hidden md:inline' : ''
                }`}
            >
              {item}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 text-white/60">
          <Search className="w-3.5 h-3.5" />
          <span>{ obtenerFechaColombia()}</span>
        </div>
      </div>
    </motion.div>
  );
}
