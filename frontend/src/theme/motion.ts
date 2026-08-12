import type { Transition } from 'framer-motion';

/**
 * Shared motion vocabulary.
 *
 * Every transition here is a spring rather than a fixed-duration tween. A tween
 * locks its target the moment it starts, so input arriving mid-flight is either
 * ignored or lands as a jump; a spring re-targets from wherever the element
 * currently is, at whatever velocity it currently has, which is what makes a
 * moving thing grabbable.
 *
 * `duration` on a spring is not a runtime — it is Apple's "response", how
 * quickly the value reaches the target. `bounce` is the inverse of the damping
 * ratio: 0 is critically damped and settles without overshoot.
 *
 * Overshoot is reserved for motion that follows a real gesture. Nothing in this
 * app currently does — these are mount reveals and hover states — so everything
 * below is critically damped. `momentum` exists for when drag or flick lands.
 */
export const springs = {
  /** Mount and scroll reveals. The default; reach for this first. */
  entrance: { type: 'spring', bounce: 0, duration: 0.4 } as Transition,

  /** Hover and other pointer-driven state changes. Snappier, still no overshoot. */
  hover: { type: 'spring', bounce: 0, duration: 0.25 } as Transition,

  /** Only after a gesture carried momentum — a flick, a throw, a drag release. */
  momentum: { type: 'spring', bounce: 0.2, duration: 0.4 } as Transition,
};

/**
 * Staggered entrance for a list. Keeps the spring and adds only the delay, so
 * items cascade rather than arriving as one block.
 */
export const stagger = (index: number, step = 0.06): Transition => ({
  ...springs.entrance,
  delay: index * step,
});
