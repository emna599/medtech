import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontend = fileURLToPath(new URL('../', import.meta.url));
const demo = resolve(frontend, '../demo4216');
const platform = process.argv[2] ?? 'ios';
if (!['ios', 'android'].includes(platform)) throw new Error('Plateforme mobile inconnue');
const apiVariable = platform === 'android' ? 'MEDTECH_DEMO_ANDROID_API_URL' : 'MEDTECH_DEMO_IOS_API_URL';
const api = URL.parse(process.env[apiVariable] ?? '');
if (!api || api.protocol !== 'https:' || api.username || api.password || api.search || api.hash) {
  console.error(`Définissez ${apiVariable} avec l’adresse HTTPS privée de la démo 4216.`);
  process.exit(1);
}

const scratchParent = resolve(frontend, 'tmp');
mkdirSync(scratchParent, { recursive: true });
const scratch = mkdtempSync(resolve(scratchParent, 'demo4216-'));
const integration = resolve(scratch, 'integration');
const personnel = resolve(scratch, 'personnel-v2');
const output = resolve(frontend, 'dist/frontend');
const browser = resolve(output, 'browser');

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} a échoué (${result.status}).`);
}

try {
  mkdirSync(integration);
  for (const path of ['angular.json', 'tsconfig.json', 'tsconfig.app.json', 'src', 'public']) {
    cpSync(resolve(frontend, path), resolve(integration, path), { recursive: true });
  }
  cpSync(resolve(demo, 'integration'), integration, { recursive: true });
  cpSync(resolve(demo, 'personnel-v2'), personnel, {
    recursive: true,
    filter: (source) => !['node_modules', 'dist', '.angular'].includes(source.split('/').at(-1)),
  });
  symlinkSync(resolve(frontend, 'node_modules'), resolve(personnel, 'node_modules'), 'dir');

  const define = `MEDTECH_DEMO_IOS_API_URL=${JSON.stringify(api.href.replace(/\/$/, ''))}`;
  const ng = resolve(frontend, 'node_modules/.bin/ng');
  run(ng, ['build', '--configuration', 'development', '--define', define], integration);
  run(ng, ['build', '--configuration', 'development', '--define', define, '--base-href', '/v2/'], personnel);

  const integrationBuild = resolve(integration, 'dist/frontend/browser');
  const personnelBuild = resolve(personnel, 'dist/frontend/browser');
  rmSync(output, { recursive: true, force: true });
  cpSync(integrationBuild, browser, { recursive: true });
  cpSync(personnelBuild, resolve(browser, 'v2'), { recursive: true });
  cpSync(resolve(personnelBuild, 'avatars'), resolve(browser, 'avatars'), { recursive: true });
  run(resolve(frontend, 'node_modules/.bin/cap'), ['sync', platform], frontend);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
