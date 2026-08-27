const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

test('SQL Safety: Controllers must not use raw string concatenated SQL queries', (t) => {
  const controllersDir = path.join(__dirname, '..', 'controllers');
  const files = fs.readdirSync(controllersDir).filter(f => f.endsWith('.js'));

  const unsafePatterns = [
    /db\.query\s*\(\s*`[^`]*\${(?!params|where|limitParam|offsetParam|filterClause)[^}]+}[^`]*`\s*\)/g,
    /client\.query\s*\(\s*`[^`]*\${(?!params|where|limitParam|offsetParam|filterClause)[^}]+}[^`]*`\s*\)/g
  ];

  for (const file of files) {
    const content = fs.readFileSync(path.join(controllersDir, file), 'utf8');
    
    for (const pattern of unsafePatterns) {
      const match = content.match(pattern);
      assert.strictEqual(
        match,
        null,
        `Potential unsafe SQL interpolation found in ${file}: ${match}`
      );
    }
  }
});
