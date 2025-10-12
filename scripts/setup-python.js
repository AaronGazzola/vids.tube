const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const binDir = path.join(__dirname, '..', '.local', 'bin');
const pythonWrapper = path.join(binDir, 'python');

function checkPython() {
  try {
    execSync('python --version', { stdio: 'ignore' });
    return 'python';
  } catch {
    try {
      execSync('python3 --version', { stdio: 'ignore' });
      return 'python3';
    } catch {
      console.error('Error: Python is not installed. Please install Python 2.7+ or Python 3.5+');
      process.exit(1);
    }
  }
}

function setupPythonWrapper() {
  const pythonCmd = checkPython();

  if (pythonCmd === 'python') {
    console.log('✓ Python command already available');
    return;
  }

  console.log('Setting up Python wrapper for yt-dlp-exec...');

  fs.mkdirSync(binDir, { recursive: true });

  const wrapperScript = `#!/bin/sh\nexec ${pythonCmd} "$@"\n`;
  fs.writeFileSync(pythonWrapper, wrapperScript, { mode: 0o755 });

  console.log('✓ Python wrapper created at .local/bin/python');

  const pathEnv = process.env.PATH || '';
  const absoluteBinDir = path.resolve(binDir);

  if (!pathEnv.includes(absoluteBinDir)) {
    process.env.PATH = `${absoluteBinDir}:${pathEnv}`;
  }

  console.log('Installing yt-dlp binary...');
  try {
    execSync('npm rebuild yt-dlp-exec', {
      stdio: 'inherit',
      env: { ...process.env, PATH: `${absoluteBinDir}:${pathEnv}` }
    });
    console.log('✓ yt-dlp-exec setup complete');
  } catch (error) {
    console.error('Warning: Failed to install yt-dlp binary. Run `npm rebuild yt-dlp-exec` manually.');
  }
}

setupPythonWrapper();
