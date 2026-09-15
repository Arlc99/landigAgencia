import { motion } from 'motion/react';
import { Menu } from 'lucide-react';
import { LogoMark, AppleButton } from './primitives';

const links = [
  { label: 'Solutions', href: '#solutions' },
  { label: 'Contacto', href: '#contacto' },
  { label: 'Marcas', href: '#marcas' },
  { label: 'Experiencia', href: '#experiencia' },
  { label: 'Planes', href: '#planes' },
];

export default function Navbar() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative z-10 max-w-6xl mx-auto px-6 h-20 flex items-center justify-between"
    >
      <LogoMark />

      <div className="hidden md:flex gap-8">
        {links.map((link, i) => (
          <motion.a
            key={link.label}
            href={link.href}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.1 + i * 0.05,
            }}
            className="text-white/70 text-sm font-medium hover:text-white transition-colors"
          >
            {link.label}
          </motion.a>
        ))}
      </div>

      <div className="hidden md:block">
        <AppleButton />
      </div>

      <button className="md:hidden w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
        <Menu className="w-4 h-4" />
      </button>
    </motion.nav>
  );
}