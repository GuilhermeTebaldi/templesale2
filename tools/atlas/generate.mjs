import { mkdirSync, writeFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyze, compare, git } from './analyze.mjs';
import { render } from './render.mjs';

export function generate({ root, ref = 'HEAD', base, out, repository = 'GuilhermeTebaldi/templesale2', strict = false }) {
  root = realpathSync(root);
  out = path.resolve(out || path.join(root, 'atlas-output'));
  const relative = path.relative(root, out);
  // Outputs may be external or in this dedicated directory, never in src/server.
  if (!relative.startsWith('..' + path.sep) && relative !== '..' && relative !== 'atlas-output' && !relative.startsWith('atlas-output' + path.sep)) throw new Error('Use atlas-output/ or an output directory outside the repository.');
  const atlas = analyze(root, ref);
  const changes = base ? compare(analyze(root, base), atlas) : null;
  const missing = atlas.flows.flatMap(flow => [...flow.steps.filter(s => s.status !== 'located').map(s => `${flow.id}: ${s.file} (${s.status})`), ...flow.tests.filter(t => !t.present).map(t => `${flow.id}: missing test ${t.file}`)]);
  if (strict && missing.length) throw new Error('Flow references need review:\n' + missing.join('\n'));
  mkdirSync(out, { recursive: true });
  writeFileSync(path.join(out, 'atlas.json'), JSON.stringify(atlas, null, 2) + '\n');
  writeFileSync(path.join(out, 'changes.json'), JSON.stringify(changes, null, 2) + '\n');
  writeFileSync(path.join(out, 'index.html'), render(atlas, changes, repository));
  const summary = `# TempleSale - atlas de manutenção\n\nCommit: ${atlas.commit}\n\n- Arquivos: ${atlas.stats.files}\n- Definições nomeadas (incluindo testes e ferramentas): ${atlas.stats.namedDefinitions}\n- Regras CSS: ${atlas.stats.cssRules}\n- Registros HTTP, com aliases: ${atlas.stats.httpRegistrations}\n- Categorias: ${Object.entries(atlas.stats.categories).map(([name, count]) => `${name}=${count}`).join(', ')}\n- Referências de fluxos não localizadas: ${missing.length}\n\n${changes ? `Base da comparação: ${changes.base}\n\nArquivos: +${changes.files.added.length}, -${changes.files.removed.length}, alterados ${changes.files.changed.length}.\nDefinições: +${changes.definitions.added.length}, -${changes.definitions.removed.length}, alteradas ${changes.definitions.changed.length}.` : 'Sem comparação: nenhum commit de base foi fornecido.'}\n\nAbra index.html para o mapa, catálogo, estado, eventos, CSS e testes relacionados. Ele não depende de JavaScript. JSON contém o índice legível por ferramentas. O atlas não executa o aplicativo, não mede desempenho nem comprova segurança ou ausência de falhas.\n`;
  writeFileSync(path.join(out, 'summary.md'), summary);
  return { atlas, changes, missing, out };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--strict') options.strict = true;
    else if (['--root', '--ref', '--base', '--out', '--repository'].includes(args[i]) && args[i + 1]) options[args[i++].slice(2)] = args[i];
    else throw new Error(`Unknown or incomplete argument: ${args[i]}`);
  }
  options.root ||= git(process.cwd(), 'rev-parse', '--show-toplevel').trim();
  if (!/^[\w.-]+\/[\w.-]+$/.test(options.repository || 'GuilhermeTebaldi/templesale2')) throw new Error('Repository must use owner/name.');
  const result = generate(options);
  console.log(JSON.stringify({ commit: result.atlas.commit, stats: result.atlas.stats, missingReferences: result.missing, output: result.out }, null, 2));
}
