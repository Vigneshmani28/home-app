/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/supabase/functions/'],
  moduleNameMapper: {
    '\\.css$': '<rootDir>/tests/mocks/style-mock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/app/**', '!**/*.d.ts'],
};
