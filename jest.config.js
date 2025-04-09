
module.exports = {
 testEnvironment: 'node',
 coverageDirectory: 'coverage',
 collectCoverageFrom: [
   'src/**/*.js',
   '!src/preprompts/**',
   '!**/node_modules/**'
 ],
 coverageThreshold: {
   global: {
     branches: 70,
     functions: 70,
     lines: 70,
     statements: 70
   }
 },
 testMatch: ['**/*.test.js'],
 verbose: true
};