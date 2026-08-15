// Flat ESLint config.
//
// Next 16 removed `next lint`, and eslint-config-next 16 ships flat config
// objects that the eslintrc loader cannot read — the old .eslintrc.json failed
// with "Converting circular structure to JSON" before a single file was linted.
// The default export of eslint-config-next is the array to spread here.
import next from 'eslint-config-next';

export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'],
  },
  ...next,
  {
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
  {
    // Design conventions that a style guide cannot enforce.
    //
    // Each of these was fixed once and came back the next time the codebase
    // grew, because nothing checked for it. Theme-level rules defend
    // themselves; these three live in component code, so they need a linter.
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/100vh/]',
          message:
            'Use 100dvh. 100vh measures the viewport as if browser chrome were hidden, so full-height sections overflow by the address-bar height and jump when it collapses.',
        },
        {
          selector: "Property[key.name='transition'] > Literal[value=/^all[ 0-9]/]",
          message:
            "Name the properties instead of animating `all` — surfaceTransition() in theme/motion. `all` sweeps in width, height, padding and colour, at layout cost the compositor cannot absorb.",
        },
        {
          selector: "JSXAttribute[name.name='transition'] Property[key.name='duration']",
          message:
            'Use a spring from theme/motion (springs.entrance / springs.hover). A fixed-duration tween locks its target when it starts, so input arriving mid-flight is ignored or lands as a jump.',
        },
      ],
    },
  },
  {
    // theme/motion.ts is where the spring durations are legitimately defined.
    files: ['src/theme/motion.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
];



