export default {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'body-min-lines': (parsed, _when, value) => {
          const body = parsed.body || '';
          const lines = body.split('\n').filter((l) => l.trim() !== '');
          return [
            lines.length >= value,
            `body must have at least ${value} non-empty lines (found ${lines.length})`,
          ];
        },
      },
    },
  ],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'chore',
        'docs',
        'refactor',
        'test',
        'style',
        'perf',
        'build',
        'ci',
        'revert',
        'init',
      ],
    ],
    'subject-case': [0],
    'subject-empty': [2, 'never'],
    'body-empty': [2, 'never'],
    'body-leading-blank': [2, 'always'],
    'body-min-lines': [2, 'always', 2],
  },
};
