import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { AppleButton } from './primitives';

export default function FinalCTA() {
  return (
    <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-32">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="liquid-glass relative overflow-hidden rounded-3xl px-8 py-16 md:py-24 text-center"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(600px circle at 50% 0%, rgba(255,255,255,0.15), transparent 70%)',
            opacity: 0.3,
          }}
        />

        <div className="relative">
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.02]">
           Hacer marketing 
            <br />
            no es suficiente.
          </h2>
          <p className="mt-6 text-white/60 max-w-md mx-auto text-sm leading-[1.6]">
            
             Crear contenido, invertir en publicidad o tener redes sociales <span className="text-cyan-400/70 font-bold">no garantiza resultados</span>, cuando todo funciona por separado.
          </p>
          {/* Contenedor flex para centrar y dar espacio */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8 mb-6 text-xs sm:text-sm font-medium">

            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">
              Sin estrategia
            </span>
            <span className="text-white/30">→</span>

            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">
               Sin estructura
            </span>
            <span className="text-white/30">→</span>

            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">
             Sin conversión.
            </span>
           


          </div>
          
        </div>
      </motion.div>
    </section>
  );
}
