const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  globalTeardown: '<rootDir>/jest.teardown.global.js', // Clean teardown only
  testEnvironment: 'jest-environment-jsdom',
  maxWorkers: 1, // Keep sequential for database operations - but fast with clean-per-test! 
  testTimeout: 15000, // Slightly longer for database cleanup
  testMatch: [
    '<rootDir>/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)',
    '<rootDir>/src/**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)',
    '<rootDir>/src/**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
  },
  collectCoverageFrom: [
    'src/**/*.(js|jsx|ts|tsx)',
    '!src/**/*.d.ts',
    '!src/**/*.stories.(js|jsx|ts|tsx)',
    '!src/**/node_modules/**',
  ],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  preset: 'ts-jest',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['ts-jest', { 
      tsconfig: {
        jsx: 'react-jsx',
      },
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))',
  ],
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  // Add separate test environments for API and component tests
  projects: [
    {
      displayName: 'API Tests',
      testMatch: ['<rootDir>/__tests__/api/**/*.(test|spec).(js|jsx|ts|tsx)'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.api.js'],
      preset: 'ts-jest',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { 
          tsconfig: {
            jsx: 'react-jsx',
            module: 'commonjs'
          },
        }]
      }
    },
    {
      displayName: 'Component Tests',
      testMatch: ['<rootDir>/__tests__/components/**/*.(test|spec).(js|jsx|ts|tsx)'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      preset: 'ts-jest',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { 
          tsconfig: {
            jsx: 'react-jsx',
          },
        }]
      }
    },
    {
      displayName: 'Integration Tests',
      testMatch: ['<rootDir>/__tests__/integration/**/*.(test|spec).(js|jsx|ts|tsx)', '<rootDir>/tests/**/*.test.ts'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.api.js'],
      preset: 'ts-jest',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: {
            jsx: 'react-jsx',
            module: 'commonjs'
          },
        }]
      }
    },
    {
      displayName: 'Utility Tests',
      testMatch: ['<rootDir>/__tests__/utils/**/*.(test|spec).(js|jsx|ts|tsx)'],
      testEnvironment: 'node',
      preset: 'ts-jest',
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { 
          tsconfig: {
            jsx: 'react-jsx',
            module: 'commonjs'
          },
        }]
      }
    }
  ]
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
