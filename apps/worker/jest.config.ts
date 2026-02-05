module.exports = {
  displayName: 'worker',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/worker',
  moduleNameMapper: {
    '^@reputation-manager/database$':
      '<rootDir>/../../libs/database/src/index.ts',
    '^@reputation-manager/shared-types$':
      '<rootDir>/../../libs/shared-types/src/index.ts',
    '^@reputation-manager/shared-utils$':
      '<rootDir>/../../libs/shared-utils/src/index.ts',
    '^@reputation-manager/integrations$':
      '<rootDir>/../../libs/integrations/src/index.ts',
  },
};
