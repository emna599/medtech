import { spawnSync } from 'node:child_process';

const apiOrigin = URL.parse(process.env.MEDTECH_IOS_API_ORIGIN ?? '');
if (!apiOrigin || apiOrigin.protocol !== 'https:' ||
    apiOrigin.username || apiOrigin.password ||
    apiOrigin.pathname !== '/' || apiOrigin.search || apiOrigin.hash ||
    apiOrigin.hostname === 'localhost') {
  console.error('Définissez MEDTECH_IOS_API_ORIGIN avec une origine HTTPS joignable depuis l’iPhone.');
  process.exit(1);
}

for (const [command, args] of [
  ['ng', ['build', '--configuration=production,ios', '--define', `MEDTECH_IOS_API_ORIGIN=${JSON.stringify(apiOrigin.origin)}`]],
  ['cap', ['sync', 'ios']],
]) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.error) console.error(result.error.message);
  if (result.status !== 0) process.exit(result.status ?? 1);
}
