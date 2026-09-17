import { motion } from 'motion/react';
import { AppleButton, gradientStyle } from './primitives';

export default function Hero() {
  return (
    <section className="relative z-10 pt-16 md:pt-28 pb-20 text-center flex flex-col items-center px-6">
      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="text-4xl md:text-7xl font-semibold tracking-tight leading-[0.9]"
      >
        <span className="block text-white">CRECE CON </span>
        <span className="block animate-shiny" style={gradientStyle}>
          ESTRATEGIA
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="mt-8 text-white/60 max-w-md text-base leading-[1.5]"
      >
        Convierte tu presencia digital en un sistema para atraer y convertir clientes.

      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="mt-8 flex flex-col items-center gap-3"
      >

        <span className="text-sm text-white/50">Diseñamos estrategias, canales y sistemas digitales que conectan tu marketing con tus ventas.</span>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="mt-8 flex flex-col items-center gap-3"
      >
        <AppleButton />
        <span className="text-xs text-white/40">[Solicitar diagnóstico]</span>
      </motion.div>
    </section>
  );
}
