import React from 'react';

const testimonials = [
  {
    step: '01',
    phase: 'Diagnóstico',
    title: 'Entendemos tu empresa, mercado y situación actual.',
    description: 'Analizamos tus canales, tu competencia y tus datos para saber exactamente desde dónde partimos.',
  },
  {
    step: '02',
    phase: 'Estrategia',
    title: 'Definimos qué hacer y cómo conectarlo.',
    description: 'Trazamos el camino, seleccionamos las herramientas y diseñamos el sistema que conectará marketing y ventas.',
  },
  {
    step: '03',
    phase: 'Implementación',
    title: 'Construimos los canales y sistemas necesarios.',
    description: 'Ejecutamos la estrategia, configuramos las automatizaciones y dejamos todo listo para captar y convertir.',
  },
];

export default function Testimonials() {
  return (
    <section id="experiencia" className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-28 border-t border-white/10">
      
      {/* Encabezado de la sección */}
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white">
          Primero entendemos.
        </h2>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white">
          Después construimos.
        </h2>
        <p className="mt-4 text-base md:text-lg text-white/60 max-w-2xl mx-auto">
          Descubre cómo equipos líderes están transformando su forma de trabajar.
        </p>
      </div>

      {/* Grid de Tarjetas */}
      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.map((t) => (
          <figure 
            key={t.step} 
            className="liquid-glass rounded-2xl p-6 flex flex-col justify-between min-h-[280px]"
          >
            {/* Contenido principal de la tarjeta */}
            <div>
              {/* Número Grande y Fase */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-5xl font-extrabold text-cyan-400 tracking-tighter">
                  {t.step}
                </span>
                <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">
                  {t.phase}
                </span>
              </div>

              {/* Título y Descripción (Reemplazan al blockquote original) */}
              <blockquote className="text-sm text-white/80 leading-[1.6]">
                <h3 className="text-lg md:text-xl font-bold text-white leading-snug mb-3">
                  {t.title}
                </h3>
                <p className="text-white/60">
                  {t.description}
                </p>
              </blockquote>
            </div>

            {/* Pie de página (Opcional, si quieres mantener la línea inferior) */}
            <figcaption className="mt-6 pt-5 border-t border-white/10">
              <div className="text-xs text-white/50">
                Paso {t.step} de 3
              </div>
            </figcaption>

          </figure>
        ))}
      </div>
    </section>
  );
}