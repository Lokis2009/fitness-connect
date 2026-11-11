module.exports = {
  displayName: 'identity',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  // The repository spec creates, migrates and seeds a real database.
  testTimeout: 30000,
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  // jose ships ESM only; let ts-jest compile it to CommonJS (pnpm nests packages under .pnpm).
  transformIgnorePatterns: ['/node_modules/(?!\\.pnpm/jose@|jose/)'],
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/backend/identity',
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.spec.ts', '!src/index.ts'],
  coverageThreshold: {
    global: { lines: 80, functions: 80, branches: 80, statements: 80 },
  },
};
