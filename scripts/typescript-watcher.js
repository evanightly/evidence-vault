import { exec } from 'child_process';
import { readFileSync, watch } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Debounce function to avoid running transform too frequently
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Function to run TypeScript transform
const runTypeScriptTransform = debounce(() => {
    console.log('🔄 Running TypeScript transformer...');
    exec('php artisan typescript:custom-transform', { cwd: projectRoot }, (error, stdout, stderr) => {
        if (error) {
            console.error('❌ Custom TypeScript transform failed:', error.message);
            console.error('Error code:', error.code);
            console.error('Error signal:', error.signal);
            return;
        }
        if (stderr) {
            console.error('⚠️ Custom TypeScript transform stderr:', stderr);
        }
        console.log('✅ Custom TypeScript types generated successfully');
        if (stdout) {
            console.log(stdout);
        }
    });
}, 1000); // 1 second debounce

// Function to check if file contains TypeScript markers
function hasTypeScriptMarkers(filePath) {
    try {
        const content = readFileSync(filePath, 'utf8');
        return content.includes('#[TypeScript]') || content.includes('/** @typescript */') || content.includes('Enum');
    } catch (error) {
        return false;
    }
}

// Watch for file changes
const watchPaths = [join(projectRoot, 'app/Data'), join(projectRoot, 'app/Models'), join(projectRoot, 'app/Support')];

console.log('👁️ Watching for TypeScript transformer changes...');
console.log('Watching paths:', watchPaths);

watchPaths.forEach((watchPath) => {
    try {
        watch(watchPath, { recursive: true }, (eventType, filename) => {
            if (!filename || !filename.endsWith('.php')) return;

            const fullPath = join(watchPath, filename);

            if (eventType === 'change' && hasTypeScriptMarkers(fullPath)) {
                console.log(`📝 Detected change in: ${filename}`);
                runTypeScriptTransform();
            }
        });
    } catch (error) {
        console.warn(`⚠️ Could not watch ${watchPath}:`, error.message);
    }
});

// Initial run
console.log('🚀 Running initial TypeScript transform...');
runTypeScriptTransform();
