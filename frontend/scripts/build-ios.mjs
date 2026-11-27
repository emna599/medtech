import { spawnSync } from 'node:child_process';

const apiOrigin = URL.parse(process.env.MEDTECH_IOS_API_ORIGIN ?? '');
if (!apiOrigin || apiOrigin.protocol !== 'https:' ||
    apiOrigin.username || apiOrigin.password ||
    apiOrigin.pathname !== '/' || apiOrigin.search || apiOrigin.hash ||
    apiOrigin.hostname === 'localhost') {
  console.error('Définissez MEDTECH_IOS_API_ORIGIN avec une origine HTTPS joignable depuis l’iPhone.');
  process.exit(1);
}

const braceletIssuer = process.env.MEDTECH_IOS_BRACELET_ORIGIN;
const braceletOrigin = braceletIssuer ? URL.parse(braceletIssuer) : null;
if (braceletIssuer && (!braceletOrigin ||
    (braceletOrigin.protocol !== 'https:' && braceletOrigin.origin !== 'http://localhost:4200') ||
    braceletOrigin.username || braceletOrigin.password ||
    braceletOrigin.pathname !== '/' || braceletOrigin.search || braceletOrigin.hash)) {
  console.error('Définissez MEDTECH_IOS_BRACELET_ORIGIN avec l’origine du site qui imprime les bracelets.');
  process.exit(1);
}

const definitions = [
  '--define', `MEDTECH_IOS_API_ORIGIN=${JSON.stringify(apiOrigin.origin)}`,
  '--define', `MEDTECH_IOS_BRACELET_ORIGIN=${JSON.stringify(braceletOrigin?.origin ?? '')}`,
];

for (const [command, args] of [
  ['ng', ['build', '--configuration=production,ios', ...definitions]],
  ['cap', ['sync', 'ios']],
]) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.error) console.error(result.error.message);
  if (result.status !== 0) process.exit(result.status ?? 1);
}
