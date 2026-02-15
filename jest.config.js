/** @type {import('jest').Config} */
const config = {
  preset: 'jest-expo',
  testMatch: ['**/?(*.)+(spec|test).ts'],
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: ['src/domain/**/*.ts', 'src/infrastructure/storage/**/*.ts'],
};

module.exports = config;
