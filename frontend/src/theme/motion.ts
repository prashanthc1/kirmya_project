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
 * CSS transition for hover and state changes on a surface.
 *
 * Names its properties instead of using `all`. `all` sweeps in every animatable
 * property — width, height, padding, colour — so a hover that meant to move a
 * card also animates anything else that happens to change, at layout cost the
 * compositor cannot absorb. These four are what the hovers in this codebase
 * actually change.
 *
 * Do not include `transform` here on an element that Framer Motion already
 * animates; two systems driving one property is how GlassCard ended up running
 * a 200ms JS animation against a 300ms CSS one.
 */
export const surfaceTransition = (seconds = 0.25, props = SURFACE_PROPS): string =>
  props.map((p) => `${p} ${seconds}s ease`).join(', ');

const SURFACE_PROPS = ['transform', 'border-color', 'background-color', 'box-shadow'];

/** The same, minus transform — for elements whose transform belongs to Framer. */
export const surfaceTransitionNoTransform = (seconds = 0.25): string =>
  surfaceTransition(
    seconds,
    SURFACE_PROPS.filter((p) => p !== 'transform'),
  );

/**
 * Staggered entrance for a list. Keeps the spring and adds only the delay, so
 * items cascade rather than arriving as one block.
 */
export const stagger = (index: number, step = 0.06): Transition => ({
  ...springs.entrance,
  delay: index * step,
});
