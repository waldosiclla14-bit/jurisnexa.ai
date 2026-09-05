'use client';

import { useReducedMotion } from 'framer-motion';
import { motion, AnimatePresence } from 'framer-motion';
import { LegalResponseData, SectionStatus, WarningItem } from '@/lib/response/types';

const EASE = [0.22, 1, 0.36, 1] as const;

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

function StatusDot({ status }: { status: SectionStatus }) {
  if (status !== 'streaming') return null;
  return (
    <motion.span
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      className="inline-block w-2 h-2 rounded-full bg-emerald-400 ml-2"
    />
  );
}

function CardShell({ title, status, children }: { title: string; status: SectionStatus; children: React.ReactNode }) {
  if (status === 'empty') return null;
  const prefersReduced = useReducedMotion();
  return (
    <motion.section
      variants={itemVariants}
      initial="hidden"
      animate="show"
      transition={prefersReduced ? { duration: 0 } : { staggerChildren: 0.07, delayChildren: 0.08 }}
      className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 mb-3 bg-white/80 dark:bg-neutral-900/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow"
      whileHover={prefersReduced ? {} : { borderColor: 'rgba(16,185,129,0.3)' }}
    >
      <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 flex items-center">
        {title}
        <StatusDot status={status} />
      </h3>
      <div className="mt-2 text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-100">{children}</div>
    </motion.section>
  );
}

function ConclusionCard({ text, status }: { text: string; status: SectionStatus }) {
  if (status === 'empty') return null;
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="show"
      transition={prefersReduced ? { duration: 0 } : { duration: 0.4, ease: EASE }}
      whileHover={prefersReduced ? {} : { scale: 1.01 }}
      className="rounded-xl border-l-4 border-emerald-500 bg-gradient-to-r from-emerald-50/80 to-white dark:from-emerald-950/30 dark:to-neutral-900/60 backdrop-blur-sm p-4 mb-4 shadow-sm"
    >
      <p className="text-[15px] leading-relaxed font-medium text-neutral-900 dark:text-neutral-50">
        {text}
        <StatusDot status={status} />
      </p>
    </motion.div>
  );
}

function ListCardSkeleton({ title }: { title: string }) {
  return (
    <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 mb-3 bg-neutral-50 dark:bg-neutral-900/40">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 flex items-center">
        {title}
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-2" />
      </h3>
      <div className="mt-3 space-y-2">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }}
            className="h-4 rounded bg-neutral-200 dark:bg-neutral-700"
            style={{ width: `${60 + Math.random() * 30}%` }}
          />
        ))}
      </div>
    </section>
  );
}

function LawSkeleton() {
  return (
    <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 mb-3 bg-neutral-50 dark:bg-neutral-900/40">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
        Normas aplicables
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-2" />
      </h3>
      <div className="mt-3 space-y-2">
        {[1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
            className="h-10 rounded-lg bg-neutral-200 dark:bg-neutral-700"
          />
        ))}
      </div>
    </section>
  );
}

function ListCard({ title, items, status, numbered = false }: { title: string; items: string[]; status: SectionStatus; numbered?: boolean }) {
  if (status === 'empty') return null;
  if (status === 'streaming' && items.length === 0) return <ListCardSkeleton title={title} />;
  const Tag = numbered ? 'ol' : 'ul';
  const prefersReduced = useReducedMotion();
  return (
    <motion.section
      variants={itemVariants}
      initial="hidden"
      animate="show"
      transition={prefersReduced ? { duration: 0 } : { staggerChildren: 0.07, delayChildren: 0.08 }}
      className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 mb-3 bg-white/80 dark:bg-neutral-900/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow"
      whileHover={prefersReduced ? {} : { borderColor: 'rgba(16,185,129,0.3)' }}
    >
      <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 flex items-center">
        {title}
        <StatusDot status={status} />
      </h3>
      <div className="mt-2">
        <Tag className={numbered ? 'list-decimal pl-5 space-y-1' : 'list-disc pl-5 space-y-1'}>
          {items.map((item, i) => (
            <motion.li
              key={i}
              initial={prefersReduced ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: prefersReduced ? 0 : 0.3, delay: i * 0.05, ease: EASE }}
              className="text-[15px] leading-[1.7] text-neutral-700 dark:text-neutral-200"
            >
              {item}
            </motion.li>
          ))}
        </Tag>
      </div>
    </motion.section>
  );
}

function LawCard({ laws, status }: { laws: { raw: string; code?: string; article?: string; jurisdiction?: string }[]; status: SectionStatus }) {
  if (status === 'empty') return null;
  if (status === 'streaming' && laws.length === 0) return <LawSkeleton />;
  const prefersReduced = useReducedMotion();
  return (
    <motion.section
      variants={itemVariants}
      initial="hidden"
      animate="show"
      transition={prefersReduced ? { duration: 0 } : { staggerChildren: 0.07, delayChildren: 0.08 }}
      className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 mb-3 bg-white/80 dark:bg-neutral-900/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow"
      whileHover={prefersReduced ? {} : { borderColor: 'rgba(16,185,129,0.3)' }}
    >
      <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 flex items-center">
        Normas aplicables
        <StatusDot status={status} />
      </h3>
      <div className="mt-3 flex flex-col gap-2">
        {laws.map((law, i) => (
          <motion.div
            key={i}
            initial={prefersReduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.3, delay: i * 0.06, ease: EASE }}
            whileHover={prefersReduced ? {} : { x: 4 }}
            className="flex items-start gap-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 transition-colors cursor-default"
          >
            {law.jurisdiction && (
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 shrink-0">{law.jurisdiction}</span>
            )}
            <span className="text-sm">{law.code ? `${law.code}${law.article ? ` — Art. ${law.article}` : ''}` : law.raw}</span>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

const STATUS_STYLE: Record<string, string> = {
  VERIFICADA: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  NO_ENCONTRADA: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  PENDIENTE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
};

function SourceList({ sources, status }: { sources: { title: string; url?: string; status: string }[]; status: SectionStatus }) {
  if (status === 'empty') return null;
  const prefersReduced = useReducedMotion();
  return (
    <motion.section
      variants={itemVariants}
      initial="hidden"
      animate="show"
      transition={prefersReduced ? { duration: 0 } : { staggerChildren: 0.07, delayChildren: 0.08 }}
      className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 mb-3 bg-white/80 dark:bg-neutral-900/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow"
      whileHover={prefersReduced ? {} : { borderColor: 'rgba(16,185,129,0.3)' }}
    >
      <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 flex items-center">
        Fuentes consultadas ({sources.length})
        <StatusDot status={status} />
      </h3>
      <div className="mt-3 flex flex-col gap-2">
        {sources.map((s, i) => (
          <motion.a
            key={i}
            href={s.url ?? undefined}
            target={s.url ? '_blank' : undefined}
            rel={s.url ? 'noopener noreferrer' : undefined}
            initial={prefersReduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.3, delay: i * 0.06, ease: EASE }}
            whileHover={prefersReduced ? {} : { x: 4 }}
            className="flex items-center justify-between gap-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 transition-colors"
          >
            <span className="text-sm truncate">{s.title}</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${STATUS_STYLE[s.status] || ''}`}>{s.status.replace('_', ' ')}</span>
          </motion.a>
        ))}
      </div>
    </motion.section>
  );
}

function DisclaimerBanner() {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="show"
      transition={prefersReduced ? { duration: 0 } : { duration: 0.4, ease: EASE }}
      className="mt-4 rounded-lg bg-gradient-to-r from-neutral-100 to-neutral-50 dark:from-neutral-800/60 dark:to-neutral-900/40 border border-neutral-200 dark:border-neutral-700 px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400 backdrop-blur-sm"
    >
      Esta información es de carácter general y no sustituye el asesoramiento de un abogado. El resultado no está garantizado y debe ser validado por un profesional habilitado.
    </motion.div>
  );
}

function WarningsCard({ warnings, status }: { warnings: { items: WarningItem[]; status: SectionStatus }; status: SectionStatus }) {
  if (status === 'empty') return null;
  const prefersReduced = useReducedMotion();
  return (
    <motion.section
      variants={itemVariants}
      initial="hidden"
      animate="show"
      transition={prefersReduced ? { duration: 0 } : { staggerChildren: 0.07, delayChildren: 0.08 }}
      className="rounded-xl border border-amber-200 dark:border-amber-800/40 p-4 mb-3 bg-amber-50/50 dark:bg-amber-950/20 backdrop-blur-sm"
    >
      <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 flex items-center">
        ⚠ Advertencias
        <StatusDot status={status} />
      </h3>
      <ul className="mt-2 list-disc pl-5 space-y-1">
        {warnings.items.map((w, i) => (
          <motion.li
            key={i}
            initial={prefersReduced ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.3, delay: i * 0.05, ease: EASE }}
            className="text-[15px] leading-[1.7] text-amber-800 dark:text-amber-200"
          >
            {w.text}
          </motion.li>
        ))}
      </ul>
    </motion.section>
  );
}

function DisclaimerSection({ disclaimer }: { disclaimer: { items: string[]; status: SectionStatus } }) {
  if (disclaimer.status === 'empty' || disclaimer.items.length === 0) return null;
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="show"
      transition={prefersReduced ? { duration: 0 } : { duration: 0.4, ease: EASE }}
      className="mt-4 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400"
    >
      {disclaimer.items.join(' ')}
    </motion.div>
  );
}

export function LegalResponse({ data }: { data: LegalResponseData }) {
  const hasContent = [data.conclusion.status, data.analysis.status, data.norms.status, data.risks.status, data.actions.status, data.deadlines.status, data.sources.status, data.warnings.status, data.disclaimer.status].some(s => s !== 'empty');
  if (!hasContent) return null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-1"
    >
      <AnimatePresence>
        <ConclusionCard text={data.conclusion.text} status={data.conclusion.status} />
        <ListCard title="Análisis jurídico" items={data.analysis.items} status={data.analysis.status} numbered />
        {data.norms.status !== 'empty' && <LawCard laws={data.norms.items} status={data.norms.status} />}
        <ListCard title="Riesgos" items={data.risks.items.map(r => r.title)} status={data.risks.status} />
        <ListCard title="Posibles acciones" items={data.actions.items} status={data.actions.status} numbered />
        <ListCard title="Plazos" items={data.deadlines.items} status={data.deadlines.status} />
        {data.sources.status !== 'empty' && <SourceList sources={data.sources.items} status={data.sources.status} />}
        <WarningsCard warnings={data.warnings} status={data.warnings.status} />
        <DisclaimerSection disclaimer={data.disclaimer} />
      </AnimatePresence>
      <DisclaimerBanner />
    </motion.div>
  );
}