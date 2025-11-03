import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __rootDirectory = dirname(dirname(__filename));
const __dirname = dirname(__filename);

export function typeScriptTransformerPlugin() {
    let watcherProcess = null;

    return {
        name: 'typescript-transformer-watcher',
        buildStart() {
            if (process.env.NODE_ENV !== 'production') {
                console.log('🚀 Starting TypeScript transformer watcher...');

                const watcherScript = join(__rootDirectory, 'scripts', 'typescript-watcher.js');
                watcherProcess = spawn('node', [watcherScript], {
                    stdio: 'inherit',
                    cwd: __dirname,
                });

                watcherProcess.on('error', (error) => {
                    console.error('❌ TypeScript watcher error:', error);
                });
            }
        },
        buildEnd() {
            if (watcherProcess) {
                console.log('🛑 Stopping TypeScript transformer watcher...');
                watcherProcess.kill();
                watcherProcess = null;
            }
        },
    };
}
