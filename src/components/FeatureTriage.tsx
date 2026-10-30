import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { SectionEyebrow } from './primitives';
import { Turnstile, captchaConfigured } from './Turnstile';

const chips = ['Estrategia', 'Pauta digital', 'leads', 'Ventas'];

interface FormData {
  negocio: string;
  correo: string;
  celular: string;
  mensaje: string;
}

interface FormErrors {
  negocio?: string;
  correo?: string;
  celular?: string;
  mensaje?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CELULAR_REGEX = /^\d{7,15}$/;

function validateField(name: keyof FormData, value: string): string | undefined {
  const trimmed = value.trim();

  if (!trimmed) return 'Este campo es obligatorio';

  if (name === 'correo' && !EMAIL_REGEX.test(trimmed)) {
    return 'Correo electrónico inválido';
  }

  if (name === 'celular') {
    if (!CELULAR_REGEX.test(trimmed)) {
      return 'Solo números, entre 7 y 15 dígitos';
    }
  }

  if (name === 'negocio' && trimmed.length < 2) {
    return 'Nombre muy corto';
  }

  if (name === 'mensaje' && trimmed.length < 10) {
    return 'Cuéntanos un poco más (mínimo 10 caracteres)';
  }

  return undefined;
}

export default function FeatureTriage() {
  const [formData, setFormData] = useState<FormData>({
    negocio: '',
    correo: '',
    celular: '',
    mensaje: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  // Anti-spam: campo trampa invisible, tiempo de llenado y captcha (Cloudflare Turnstile).
  const [website, setWebsite] = useState('');
  const startedAt = useRef(Date.now());
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaKey, setCaptchaKey] = useState(0);
  const [formError, setFormError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name as keyof FormData, value),
      }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name as keyof FormData, value),
    }));
  };

  const validateAll = (): boolean => {
    const newErrors: FormErrors = {};
    (Object.keys(formData) as (keyof FormData)[]).forEach((key) => {
      const err = validateField(key, formData[key]);
      if (err) newErrors[key] = err;
    });
    setErrors(newErrors);
    setTouched({ negocio: true, correo: true, celular: true, mensaje: true });
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateAll()) {
      return; // no envía si hay errores
    }

    if (captchaConfigured && !captchaToken) {
      setFormError('Estamos verificando que eres una persona. Espera un momento e inténtalo de nuevo.');
      return;
    }

    setEnviando(true);
    setEnviado(false);
    setFormError('');

    try {
      const response = await fetch('/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          website: website || undefined,
          tardo: Date.now() - startedAt.current,
          turnstileToken: captchaToken || undefined,
        }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(data?.error?.message ?? `HTTP ${response.status}`);
      }

      setEnviado(true);
      setFormData({ negocio: '', correo: '', celular: '', mensaje: '' });
      setTouched({});
      setErrors({});
    } catch (error) {
      console.error('Error enviando formulario:', error);
      setFormError(error instanceof Error ? error.message : 'Error al enviar la solicitud.');
    } finally {
      // Los tokens del captcha son de un solo uso: se pide uno nuevo para un próximo envío.
      setCaptchaToken('');
      setCaptchaKey((k) => k + 1);
      setEnviando(false);
    }
  };

  const inputClass = (field: keyof FormData) =>
    `w-full px-4 py-3 rounded-lg bg-white/[0.03] border text-sm text-white placeholder:text-white/35 outline-none transition ${
      errors[field] && touched[field]
        ? 'border-red-400/60 focus:border-red-400'
        : 'border-white/10 focus:border-white/25'
    }`;

  return (
    <section
      id="contacto"
      className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-2 gap-10 md:gap-16 items-start"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        <SectionEyebrow label="Contactame" tag="instagram: @jualu.co" />

        <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.02]">
          Construimos el camino hacia la venta.
          <br />
          Publicidad que convierte.
        </h2>

        <p className="mt-6 text-white/60 text-base leading-[1.6] max-w-md">
          Conectamos tu presencia digital con la captación,   <span className="text-cyan-400/70 font-bold">gestión de leads y conversión</span>, 
          creando una estructura clara para tu empresa.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className="text-xs text-white/70 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03]"
            >
              {chip}
            </span>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="liquid-glass rounded-2xl p-5"
      >
        <div className="text-xs text-white/50 mb-5">
          Cuéntanos sobre tu negocio
        </div>

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <div>
            <input
              type="text"
              name="negocio"
              value={formData.negocio}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Nombre del negocio"
              className={inputClass('negocio')}
            />
            {errors.negocio && touched.negocio && (
              <p className="text-xs text-red-400 mt-1 px-1">{errors.negocio}</p>
            )}
          </div>

          <div>
            <input
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Correo electrónico"
              className={inputClass('correo')}
            />
            {errors.correo && touched.correo && (
              <p className="text-xs text-red-400 mt-1 px-1">{errors.correo}</p>
            )}
          </div>

          <div>
            <input
              type="tel"
              name="celular"
              value={formData.celular}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Celular"
              className={inputClass('celular')}
            />
            {errors.celular && touched.celular && (
              <p className="text-xs text-red-400 mt-1 px-1">{errors.celular}</p>
            )}
          </div>

          <div>
            <textarea
              name="mensaje"
              value={formData.mensaje}
              onChange={handleChange}
              onBlur={handleBlur}
              rows={6}
              placeholder="Cuéntanos qué quieres para tu negocio, qué necesitas mejorar y qué te gustaría lograr..."
              className={`${inputClass('mensaje')} resize-none`}
            />
            {errors.mensaje && touched.mensaje && (
              <p className="text-xs text-red-400 mt-1 px-1">{errors.mensaje}</p>
            )}
          </div>

          {/* Campo trampa: invisible para personas; los bots lo llenan. */}
          <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
            <label>
              Sitio web
              <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </label>
          </div>

          <Turnstile onToken={setCaptchaToken} resetKey={captchaKey} />
          {formError && (
            <p role="alert" className="text-xs text-red-400 px-1">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full mt-2 px-4 py-3 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition disabled:opacity-50"
          >
            {enviando
              ? 'Enviando...'
              : enviado
              ? 'Solicitud enviada ✓'
              : 'Enviar solicitud →'}
          </button>
        </form>
      </motion.div>
    </section>
  );
}