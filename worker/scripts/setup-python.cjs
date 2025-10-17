const fs = require('fs');
const path = require('path');

const parentPythonWrapper = path.join(__dirname, '..', '..', '.local', 'bin', 'python');

if (fs.existsSync(parentPythonWrapper)) {
  console.log('✓ Parent Python wrapper found');
  console.log('You can now install with: PATH="../.local/bin:$PATH" npm install');
} else {
  console.error('Error: Parent Python wrapper not found. Please run npm install in the root directory first.');
  process.exit(1);
}
