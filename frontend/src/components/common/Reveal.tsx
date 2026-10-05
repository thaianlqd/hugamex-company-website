import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
const item = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, amount: 0.18 }}
      variants={item}
      transition={{ duration: 0.55, delay: reduced ? 0 : delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
export function RevealGroup({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, amount: 0.18 }}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: reduced ? 0 : 0.08 } } }}
    >
      {children}
    </motion.div>
  );
}
export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={item} transition={{ duration: 0.55 }}>
      {children}
    </motion.div>
  );
}
export function FadeIn({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}
export function ImageReveal({ children, className }: { children: ReactNode; className?: string }) {
  return <Reveal className={className}>{children}</Reveal>;
}
