
const {
 parseCodeFromChat,
 validateFilePath
} = require('../src/core/workflow/parser');

describe('Parser Utilities', () => {
 describe('parseCodeFromChat', () => {
   test('should extract files from chat content', () => {
     const chatContent = `
This is a README content.

app.js
\`\`\`javascript
const express = require('express');
const app = express();
\`\`\`

package.json
\`\`\`json
{
 "name": "test-app",
 "version": "1.0.0"
}
\`\`\`
`;

     const files = parseCodeFromChat(chatContent);
     
     expect(files).toHaveLength(3); // README + 2 files
     expect(files[0][0]).toBe('app.js');
     expect(files[0][1]).toContain('const express = require');
     expect(files[1][0]).toBe('package.json');
     expect(files[1][1]).toContain('"name": "test-app"');
     expect(files[2][0]).toBe('README.md');
     expect(files[2][1]).toContain('This is a README content.');
   });

   test('should handle filenames with special characters', () => {
     const chatContent = `
[some-file.js]:
\`\`\`javascript
console.log('test');
\`\`\`
`;

     const files = parseCodeFromChat(chatContent);
     
     expect(files).toHaveLength(2); // File + README
     expect(files[0][0]).toBe('some-file.js');
     expect(files[0][1]).toContain("console.log('test')");
   });

   test('should throw error for invalid input', () => {
     expect(() => parseCodeFromChat(null)).toThrow('Invalid chat content');
     expect(() => parseCodeFromChat(123)).toThrow('Invalid chat content');
   });
 });

 describe('validateFilePath', () => {
   test('should validate and normalize paths', () => {
     expect(validateFilePath('test.js')).toBe('test.js');
     expect(validateFilePath('src/test.js')).toBe('src/test.js');
     expect(validateFilePath('src//test.js')).toBe('src/test.js');
   });

   test('should reject invalid paths', () => {
     expect(() => validateFilePath(null)).toThrow('Invalid file path');
     expect(() => validateFilePath('')).toThrow('Invalid file path');
     expect(() => validateFilePath(123)).toThrow('Invalid file path');
   });
 });
});