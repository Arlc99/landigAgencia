import {
  Building,
  Check,
  CalendarClock,
  Globe,
  Hourglass,
  Mail,
  Megaphone,
  MessageCircle,
  TrendingUp,
  User,
  Wallet,
  Zap,
} from 'lucide-react';
import { useId, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import type { ContactInfo, DiagnosisAnswers } from '../../shared/schema';
import {
  BUDGET_CURRENCY,
  BUDGET_RANGES,
  OBJECTIVES,
  URGENCY_LEVELS,
  getObjective,
  type BudgetId,
  type DiagnosisQuestion,
  type ObjectiveId,
  type UrgencyId,
} from '../../shared/survey';
import type { StepErrors, SurveyDispatch } from './useSurvey';
import { ChoiceCard, FieldError, TextField } from './ui';

/* ---------- Paso 1: contacto ---------- */

export function ContactStep({
  contacto,
  consentimiento,
  errors,
  showAllErrors,
  dispatch,
}: {
  contacto: ContactInfo;
  consentimiento: boolean;
  errors: StepErrors;
  showAllErrors: boolean;
  dispatch: SurveyDispatch;
}) {
  const [touched, setTouched] = useState<Partial<Record<keyof ContactInfo, boolean>>>({});

  const field = (name: keyof ContactInfo) => ({
    value: contacto[name],
    error: showAllErrors || touched[name] ? errors[name] : undefined,
    onChange: (e: ChangeEvent<HTMLInputElement>) => dispatch({ type: 'contact', field: name, value: e.target.value }),
    onBlur: () => setTouched((t) => ({ ...t, [name]: true })),
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField
        {...field('nombre')}
        label="Nombre completo"
        icon={<User className="h-4 w-4" />}
        autoComplete="name"
        placeholder="Ana María Gómez"
        className="sm:col-span-2"
        maxLength={80}
      />
      <TextField
        {...field('empresa')}
        label="Empresa (opcional)"
        icon={<Building className="h-4 w-4" />}
        autoComplete="organization"
        placeholder="Déjalo vacío si no aplica"
        maxLength={100}
      />
      <TextField
        {...field('whatsapp')}
        label="WhatsApp"
        icon={<MessageCircle className="h-4 w-4" />}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="+57 300 123 4567"
        hint="Incluye el indicativo del país."
        maxLength={20}
      />
      <TextField
        {...field('correo')}
        label="Correo electrónico"
        icon={<Mail className="h-4 w-4" />}
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="ana@correo.com"
        className="sm:col-span-2"
        maxLength={120}
      />
      <div className="sm:col-span-2">
        <label className="group flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={consentimiento}
            onChange={(e) => dispatch({ type: 'consent', value: e.target.checked })}
            aria-invalid={showAllErrors && errors.consentimiento ? true : undefined}
            className="peer sr-only"
          />
          <span
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-400 ${
              consentimiento ? 'border-cyan-300 bg-cyan-300 text-black' : 'border-white/25 group-hover:border-white/50'
            }`}
            aria-hidden
          >
            {consentimiento && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
          </span>
          <span className="text-xs leading-relaxed text-white/60">
            Autorizo a JUALU a tratar mis datos personales para preparar mi diagnóstico y a contactarme por WhatsApp y
            correo con información sobre mi caso, conforme a la Ley 1581 de 2012. Puedo pedir que borren mis datos en
            cualquier momento.
          </span>
        </label>
        <FieldError message={showAllErrors ? errors.consentimiento : undefined} />
      </div>
    </div>
  );
}

/* ---------- Paso 2: objetivo ---------- */

const OBJECTIVE_ICONS: Record<ObjectiveId, ReactNode> = {
  leads_ventas: <TrendingUp className="h-5 w-5" />,
  posicionamiento_redes: <Megaphone className="h-5 w-5" />,
  web_ecommerce_automatizacion: <Globe className="h-5 w-5" />,
};

export function ObjectiveStep({
  value,
  error,
  dispatch,
}: {
  value: ObjectiveId | null;
  error?: string;
  dispatch: SurveyDispatch;
}) {
  return (
    <fieldset>
      <legend className="sr-only">Objetivo principal</legend>
      <div className="grid gap-3">
        {OBJECTIVES.map((objective) => (
          <ChoiceCard
            key={objective.id}
            type="radio"
            name="objetivo"
            value={objective.id}
            checked={value === objective.id}
            onChange={() => dispatch({ type: 'objective', value: objective.id })}
            label={objective.label}
            description={objective.description}
            icon={OBJECTIVE_ICONS[objective.id]}
          />
        ))}
      </div>
      <FieldError message={error} />
    </fieldset>
  );
}

/* ---------- Paso 3: diagnóstico condicional ---------- */

/** Opciones como "Ninguno" excluyen al resto en preguntas de selección múltiple. */
const isExclusive = (id: string) => id.startsWith('ningun');

export function DiagnosisStep({
  objetivo,
  answers,
  errors,
  showAllErrors,
  dispatch,
}: {
  objetivo: ObjectiveId | null;
  answers: DiagnosisAnswers;
  errors: StepErrors;
  showAllErrors: boolean;
  dispatch: SurveyDispatch;
}) {
  const objective = getObjective(objetivo);
  if (!objective) {
    return <p className="text-sm text-white/50">Primero selecciona un objetivo en el paso anterior.</p>;
  }

  return (
    <div className="space-y-7">
      <p className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-sm text-white/80">
        Preguntas para <span className="font-semibold text-cyan-300">{objective.label.toLowerCase()}</span>.
      </p>
      {objective.questions.map((question) => (
        <Question
          key={question.id}
          question={question}
          value={answers[question.id]}
          error={showAllErrors ? errors[question.id] : undefined}
          onChange={(value) => dispatch({ type: 'diagnosis', id: question.id, value })}
        />
      ))}
    </div>
  );
}

function Question({
  question,
  value,
  error,
  onChange,
}: {
  question: DiagnosisQuestion;
  value: string | string[] | undefined;
  error?: string;
  onChange: (value: string | string[] | undefined) => void;
}) {
  const id = useId();

  if (question.kind === 'text') {
    const text = typeof value === 'string' ? value : '';
    const max = question.maxLength ?? 500;
    return (
      <div>
        <label htmlFor={id} className="block text-[15px] font-medium text-white">
          {question.label}
          {!question.required && <span className="ml-1.5 text-xs font-normal text-white/40">(opcional)</span>}
        </label>
        {question.helper && <p className="mt-1 text-xs text-white/40">{question.helper}</p>}
        <textarea
          id={id}
          value={text}
          maxLength={max}
          rows={3}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          className="mt-3 w-full resize-y rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white outline-none transition placeholder:text-white/30 hover:border-white/25 focus:border-cyan-400/70 focus:bg-white/10 focus:ring-2 focus:ring-cyan-400/20 sm:text-sm"
          placeholder="Ej.: tengo una pastelería y quiero vender más por Instagram."
        />
        <p className="mt-1 text-right text-xs text-white/40" aria-live="polite">
          {text.length}/{max}
        </p>
        <FieldError message={error} />
      </div>
    );
  }

  const multi = question.kind === 'multi';
  const selected = multi ? (Array.isArray(value) ? value : []) : [];

  const toggle = (optionId: string, checked: boolean) => {
    if (!multi) return onChange(optionId);
    if (!checked) return onChange(selected.filter((v) => v !== optionId));
    if (isExclusive(optionId)) return onChange([optionId]);
    onChange([...selected.filter((v) => !isExclusive(v)), optionId]);
  };

  return (
    <fieldset aria-describedby={question.helper ? `${id}-help` : undefined}>
      <legend className="text-[15px] font-medium text-white">{question.label}</legend>
      {question.helper && (
        <p id={`${id}-help`} className="mt-1 text-xs text-white/40">
          {question.helper}
        </p>
      )}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {question.options?.map((option) => (
          <ChoiceCard
            key={option.id}
            size="sm"
            type={multi ? 'checkbox' : 'radio'}
            name={`${id}-${question.id}`}
            value={option.id}
            checked={multi ? selected.includes(option.id) : value === option.id}
            onChange={(checked) => toggle(option.id, checked)}
            label={option.label}
          />
        ))}
      </div>
      <FieldError message={error} />
    </fieldset>
  );
}

/* ---------- Paso 4: inversión ---------- */

export function BudgetStep({
  value,
  error,
  dispatch,
}: {
  value: BudgetId | null;
  error?: string;
  dispatch: SurveyDispatch;
}) {
  return (
    <fieldset>
      <legend className="mb-4 text-sm text-white/50">
        Inversión mensual aproximada en marketing y tecnología ({BUDGET_CURRENCY}). Nos ayuda a proponerte un plan
        realista.
      </legend>
      <div className="grid gap-3">
        {BUDGET_RANGES.map((range) => (
          <ChoiceCard
            key={range.id}
            type="radio"
            name="presupuesto"
            value={range.id}
            checked={value === range.id}
            onChange={() => dispatch({ type: 'budget', value: range.id })}
            label={range.label}
            description={range.caption}
            icon={<Wallet className="h-5 w-5" />}
          />
        ))}
      </div>
      <FieldError message={error} />
    </fieldset>
  );
}

/* ---------- Paso 5: urgencia ---------- */

const URGENCY_ICONS: Record<UrgencyId, ReactNode> = {
  inmediata: <Zap className="h-5 w-5" />,
  menos_1_mes: <CalendarClock className="h-5 w-5" />,
  evaluacion: <Hourglass className="h-5 w-5" />,
};

export function UrgencyStep({
  value,
  error,
  dispatch,
}: {
  value: UrgencyId | null;
  error?: string;
  dispatch: SurveyDispatch;
}) {
  return (
    <fieldset>
      <legend className="sr-only">Urgencia de implementación</legend>
      <div className="grid gap-3">
        {URGENCY_LEVELS.map((level) => (
          <ChoiceCard
            key={level.id}
            type="radio"
            name="urgencia"
            value={level.id}
            checked={value === level.id}
            onChange={() => dispatch({ type: 'urgency', value: level.id })}
            label={level.label}
            description={level.caption}
            icon={URGENCY_ICONS[level.id]}
          />
        ))}
      </div>
      <FieldError message={error} />
    </fieldset>
  );
}
