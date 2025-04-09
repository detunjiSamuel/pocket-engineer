
module.exports = {
 env: {
   node: true,
   es2021: true,
   jest: true
 },
 extends: [
   'eslint:recommended',
   'plugin:node/recommended',
   'plugin:jest/recommended',
   'prettier'
 ],
 parserOptions: {
   ecmaVersion: 2021
 },
 rules: {
   'no-console': 'off', // Allow console for CLI application
   'node/no-unsupported-features/es-syntax': ['error', {
     version: '>=14.0.0',
     ignores: []
   }],
   'node/no-unpublished-require': ['error', {
     allowModules: ['dotenv']
   }],
   'no-unused-vars': ['error', {
     argsIgnorePattern: '^_',
     varsIgnorePattern: '^_'
   }],
   'jest/no-disabled-tests': 'warn',
   'jest/no-focused-tests': 'error',
   'jest/prefer-to-have-length': 'warn',
   'jest/valid-expect': 'error',

   'no-useless-escape': 'off',
   'node/no-deprecated-api': 'warn'
 }
};