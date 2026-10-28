import { Check, Loader2, TriangleAlert } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useId } from 'react';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

const base =
  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full px-6 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400';

const variants: Record<Variant, string> = {
  primary: 'bg-white text-black hover:bg-white/90 active:scale-[0.98]',
  secondary: 'border border-white/15 bg-white/5 text-white hover:bg-white/10 active:scale-[0.98]',
  ghost: 'text-white/60 hover:bg-white/5 hover:text-white',
};

interface CommonProps {
  variant?: Variant;
  icon?: ReactNode;
  iconRight?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Button({
  variant = 'primary',
  icon,
  iconRight,
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
}

export function LinkButton({
  variant = 'primary',
  icon,
  iconRight,
  children,
  className = '',
  ...props
}: CommonProps & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a {...props} className={`${base} ${variants[variant]} ${className}`}>
      {icon}
      {children}
      {iconRight}
    </a>
  );
}

export function FieldError({ id, message }: { id?: string; message?: string }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.p
          id={id}
          role="alert"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-red-300"
        >
          <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  icon: ReactNode;
  error?: string;
  hint?: string;
}

export function TextField({ label, icon, error, hint, className = '', ...props }: TextFieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-white/80">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-white/40" aria-hidden>
          {icon}
        </span>
        <input
          {...props}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`min-h-12 w-full rounded-2xl border bg-white/5 py-3 pl-11 pr-4 text-base text-white outline-none transition placeholder:text-white/30 focus:bg-white/10 focus:ring-2 sm:text-sm ${
            error
              ? 'border-red-400/60 focus:border-red-400 focus:ring-red-400/25'
              : 'border-white/10 hover:border-white/25 focus:border-cyan-400/70 focus:ring-cyan-400/20'
          }`}
        />
      </div>
      {error ? (
        <FieldError id={`${id}-error`} message={error} />
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-xs text-white/40">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

interface ChoiceCardProps {
  type: 'radio' | 'checkbox';
  name: string;
  value: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  icon?: ReactNode;
  size?: 'lg' | 'sm';
}

/** Opción seleccionable basada en un input nativo (accesible por teclado y lector de pantalla). */
export function ChoiceCard({
  type,
  name,
  value,
  checked,
  onChange,
  label,
  description,
  icon,
  size = 'lg',
}: ChoiceCardProps) {
  return (
    <label className="group relative block cursor-pointer">
      <input
        type={type}
        name={name}
        value={value}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        className={`flex min-h-11 items-center gap-3 rounded-2xl border transition peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-400 ${
          size === 'lg' ? 'p-4' : 'px-3.5 py-3'
        } ${
          checked
            ? 'border-cyan-400/70 bg-cyan-400/10 shadow-[0_8px_30px_-12px_rgba(0,210,255,0.55)]'
            : 'border-white/10 bg-white/[0.03] group-hover:border-white/25 group-hover:bg-white/[0.06]'
        }`}
      >
        {icon && (
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
              checked ? 'bg-cyan-400/15 text-cyan-300' : 'bg-white/5 text-white/50 group-hover:text-white'
            }`}
            aria-hidden
          >
            {icon}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className={`block font-medium text-white ${size === 'lg' ? 'text-[15px]' : 'text-sm'}`}>{label}</span>
          {description && <span className="mt-0.5 block text-xs leading-relaxed text-white/50">{description}</span>}
        </span>
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center border transition ${
            type === 'radio' ? 'rounded-full' : 'rounded-md'
          } ${checked ? 'border-cyan-300 bg-cyan-300 text-black' : 'border-white/25'}`}
          aria-hidden
        >
          {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
        </span>
      </span>
    </label>
  );
}
