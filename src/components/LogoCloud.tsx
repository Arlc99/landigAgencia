import { motion } from 'motion/react';

import kupi from '../assets/logos/kupi.png';
import azucarMayaguez from '../assets/logos/images.png';
import newCambridgeSchool from '../assets/logos/cambrifge.png';
import espdelca from '../assets/logos/espdelca.png';
//import ramp from '../assets/logo/ramp.svg';
//import notion from '../assets/logo/notion.svg';
//import loom from '../assets/logo/loom.svg';
//import arc from '../assets/logo/arc.svg';

const logos = [
  { name: 'KUPI', src: kupi },
  { name: 'Azúcar Mayagüez', src: azucarMayaguez },
  { name: 'New Cambridge School', src: newCambridgeSchool },
  { name: 'espdelca', src: espdelca },
  //{ name: 'Ramp', src: ramp },
  //{ name: 'Notion', src: notion },
  //{ name: 'Loom', src: loom },
  //{ name: 'Arc', src: arc },
];

export default function LogoCloud() {
  return (
    <section className="relative z-10 max-w-6xl mx-auto px-6 py-16 md:py-24">
      <p className="text-center text-xs uppercase tracking-widest text-white/40">
        Marcas que confiaron @jualu.co
      </p>

      <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-10 gap-y-12 items-center">
        {logos.map((logo, i) => (
          <motion.div
            key={logo.name}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className="flex items-center justify-center h-20 md:h-24 px-4"
          >
            <img
              src={logo.src}
              alt={logo.name}
              className="max-h-12 md:max-h-16 w-auto max-w-full object-contain opacity-60 hover:opacity-100 transition-opacity duration-300"
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
