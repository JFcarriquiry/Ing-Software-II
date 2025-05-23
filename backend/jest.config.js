module.exports = {
  // preset: 'ts-jest', // Removed/commented out
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  transform: {
    '^.+\\.tsx?$': 'babel-jest', // Use babel-jest
  },
};