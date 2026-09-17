import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react'; // Importamos X para cerrar
import { MonogramLogo, AppleButton } from './primitives';

const links = [
  { label: 'Contacto', href: '#contacto' },
  { label: 'Marcas', href: '#marcas' },
  { label: 'Comunicación', href: '#comunicacion' },
  { label: 'Servicios', href: '#servicios' },
  { label: 'Procesos', href: '#procesos' },
];

export default function Navbar() {
  // Estado para controlar si el menú móvil está abierto
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative z-50 max-w-6xl mx-auto px-6 h-20 flex items-center justify-between"
    >
      <MonogramLogo />

      {/* Enlaces de escritorio (ocultos en móvil) */}
      <div className="hidden md:flex gap-8">
        {links.map((link, i) => (
          <motion.a
            key={link.label}
            href={link.href}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.05 }}
            className="text-white/70 text-sm font-medium hover:text-white transition-colors"
          >
            {link.label}
          </motion.a>
        ))}
      </div>

      {/* Botón de escritorio (oculto en móvil) */}
      <div className="hidden md:block">
        <AppleButton />
      </div>

      {/* Botón de menú móvil (visible solo en pantallas pequeñas) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center z-50"
        aria-label="Abrir menú"
      >
        {isOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
      </button>

      {/* Panel desplegable del menú móvil */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="absolute top-20 left-0 right-0 md:hidden overflow-hidden bg-black/80 backdrop-blur-md border-b border-white/10"
          >
            <div className="flex flex-col px-6 py-6 gap-6">
              {links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsOpen(false)} // Cierra el menú al hacer clic
                  className="text-white/70 text-base font-medium hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ))}
              
              {/* Botón de Apple dentro del menú móvil */}
              <div className="pt-4 border-t border-white/10">
                <AppleButton />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}