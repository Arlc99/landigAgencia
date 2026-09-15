import { motion } from 'motion/react';
import {
  Sparkles,
  Inbox as InboxIcon,
  Star,
  Send,
  FileEdit,
  Archive,
  Trash2,
  Search,
  Reply,
  Forward,
  MoreHorizontal,
  Paperclip,
} from 'lucide-react';

const navItems = [
  { icon: InboxIcon, label: 'Inbox', count: 12, active: true },
  { icon: Star, label: 'Starred', count: 3 },
  { icon: Send, label: 'Sent' },
  { icon: FileEdit, label: 'Drafts', count: 2 },
  { icon: Archive, label: 'Archive' },
  { icon: Trash2, label: 'Trash' },
];

const labels = [
  { name: 'Work', color: '#00d2ff' },
  { name: 'Personal', color: '#A4F4FD' },
  { name: 'Travel', color: '#f59e0b' },
  { name: 'Finance', color: '#10b981' },
];

const messages = [
  {
    name: 'Estrategia mensual',
    subject: 'Tu Empresa',
    preview: 'Plan de crecimiento y próximos objetivos...',
    time: '9:41 AM',
    unread: true,
    active: true,
  },
  {
    name: 'Reporte de campaña',
    subject: 'Tu Empresa',
    preview: 'Resultados de pauta y captación de leads..',
    time: '8:12 AM',
    unread: true,
  },
  {
    name: 'Nuevos leads',
    subject: 'Tu Empresa',
    preview: '18 nuevas oportunidades generadas...',
    time: 'Yesterday',
  },
  {
    name: 'Optimización',
    subject: 'Tu Empresa',
    preview: 'Ajustes realizados para mejorar el rendimiento...',
    time: 'Yesterday',
  },
  {
    name: 'Reunión estratégica',
    subject: 'Tu Empresa',
    preview: 'Próximos pasos y decisiones de campaña...',
    time: 'Mon',
  },
  {
    name: 'power bi',
    subject: '[aura/core] PR #482 approved',
    preview: 'david-lim approved your pull request.',
    time: 'Mon',
  },
];

const bodyParagraphs = [
  'Hola Agencia,',
  'Queremos compartirte los principales resultados de la semana y las acciones que seguiremos implementando para continuar haciendo crecer tu negocio.',
  'Identificamos las campañas con mejor rendimiento, optimizamos la inversión publicitaria y enfocamos los esfuerzos en atraer clientes potenciales con mayor intención.',
  'Próximos pasos:'

   
];

export default function InboxMockup() {
  return (
    <section className="relative z-10 max-w-6xl mx-auto px-6 py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 1.1 }}
        className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0e1014]/90 backdrop-blur-2xl"
      >
        {/* Title bar */}
        <div className="h-11 flex items-center px-4 border-b border-white/10 relative">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
            <span className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
            <span className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
          </div>
          <span className="absolute left-1/2 -translate-x-1/2 text-xs text-white/50">
            jualu.co — Inbox
          </span>
        </div>

        <div className="grid grid-cols-12 h-[520px]">
          {/* Sidebar */}
          <div className="col-span-3 border-r border-white/10 bg-black/30 p-4 hidden md:flex md:flex-col">
            <button className="rounded-lg bg-white text-black text-xs font-semibold px-3 py-2 flex items-center justify-center gap-2 mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Gemini
            </button>

            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-md text-sm ${item.active
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:bg-white/5'
                    }`}
                >
                  <span className="flex items-center gap-2.5">
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                  </span>
                  {item.count && (
                    <span className="text-xs text-white/40">{item.count}</span>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8">
              <div className="text-[10px] uppercase tracking-widest text-white/30 px-2.5 mb-2">
                Labels
              </div>
              <div className="flex flex-col gap-1">
                {labels.map((label) => (
                  <div
                    key={label.name}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 text-sm text-white/60"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: label.color }}
                    />
                    {label.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Message list */}
          <div className="col-span-12 md:col-span-4 border-r border-white/10 flex flex-col">
            <div className="flex items-center gap-2 px-4 h-12 border-b border-white/10 text-white/40 text-xs">
              <Search className="w-3.5 h-3.5" />
              <span>Search mail</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {messages.map((msg) => (
                <div
                  key={msg.name + msg.subject}
                  className={`px-4 py-3 border-b border-white/5 cursor-pointer ${msg.active ? 'bg-white/5' : 'hover:bg-white/[0.03]'
                    }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm ${msg.unread ? 'font-semibold text-white' : 'text-white/70'
                        }`}
                    >
                      {msg.name}
                    </span>
                    <span className="text-[11px] text-white/40">{msg.time}</span>
                  </div>
                  <div
                    className={`text-xs mb-1 ${msg.unread ? 'text-white/90' : 'text-white/60'
                      }`}
                  >
                    {msg.subject}
                  </div>
                  <div className="text-xs text-white/40 truncate">{msg.preview}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Reader */}
          <div className="hidden md:flex md:col-span-5 flex-col">
            <div className="flex items-center justify-between h-12 px-3 border-b border-white/10">
              <div className="flex items-center gap-1">
                <button className="w-7 h-7 rounded-md hover:bg-white/5 flex items-center justify-center text-white/60">
                  <Reply className="w-3.5 h-3.5" />
                </button>
                <button className="w-7 h-7 rounded-md hover:bg-white/5 flex items-center justify-center text-white/60">
                  <Forward className="w-3.5 h-3.5" />
                </button>
                <button className="w-7 h-7 rounded-md hover:bg-white/5 flex items-center justify-center text-white/60">
                  <Archive className="w-3.5 h-3.5" />
                </button>
                <button className="w-7 h-7 rounded-md hover:bg-white/5 flex items-center justify-center text-white/60">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <button className="w-7 h-7 rounded-md hover:bg-white/5 flex items-center justify-center text-white/60">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <h3 className="text-lg font-semibold mb-3">Estrategia y resultados</h3>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00d2ff] to-[#0B2551] flex items-center justify-center text-xs font-semibold">
                  L
                </div>
                <div className="text-xs">
                  <div className="text-white/80">Tu Empresa</div>
                  <div className="text-white/40">para tu negocio· 9:41 AM</div>
                </div>
                <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full border border-white/10 text-white/50">
                  Work
                </span>
              </div>

              <div className="liquid-glass rounded-lg p-3 mb-5">
                <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" style={{ color: '#A4F4FD' }} />
                  Resumen Estrategico
                </div>
                <p className="text-xs text-white/60 leading-relaxed">
                  Esta semana optimizamos tus campañas, analizamos el comportamiento de los anuncios y ajustamos la estrategia de captación.

                  +32 leads generados
                  +18% rendimiento de campaña
                  3 campañas optimizadas
                </p>
              </div>

              <div className="space-y-3 text-sm text-white/70 leading-relaxed">
                {bodyParagraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                <p className="text-white/50">— The Linear team</p>
              </div>

              <div className="mt-5 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-xs text-white/60">
                <Paperclip className="w-3.5 h-3.5" />
                digest-may-6.pdf
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
