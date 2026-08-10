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
];
