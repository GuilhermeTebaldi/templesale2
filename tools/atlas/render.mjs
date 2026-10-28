const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const number = value => new Intl.NumberFormat('pt-BR').format(value);
export function render(atlas, changes, repository) {
  const index = new Map(atlas.files.map((f, i) => [f.path, `file-${i}`]));
  const symbols = new Map(atlas.symbols.map((s, i) => [s.id, { ...s, anchor: `definition-${i}` }]));
  const source = (file, line) => `https://github.com/${repository}/blob/${atlas.commit}/${file.split('/').map(encodeURIComponent).join('/')}${line ? '#L' + line : ''}`;
  const link = (label, url) => `<a href="${escape(url)}">${escape(label)}</a>`;
  const local = file => index.has(file) ? link(file, '#' + index.get(file)) : escape(file);
  const rows = (head, body) => `<div class="table"><table><thead><tr>${head.map(h => `<th>${escape(h)}</th>`).join('')}</tr></thead><tbody>${body.map(row => '<tr>' + row.map(c => `<td>${c}</td>`).join('') + '</tr>').join('')}</tbody></table></div>`;
  const paths = [
    'src/main.tsx', 'src/App.tsx', 'src/components/Header.tsx', 'src/components/MobileNavigation.tsx',
    'src/components/FeedView.tsx', 'src/components/CompanyProfile.tsx', 'src/components/ProductMap.tsx', 'src/components/NewPublication.tsx',
    'src/lib/api.ts', 'src/lib/discovery-location.ts', 'src/lib/app-scroll.ts', 'src/index.css',
    'server.ts', 'server/discovery.ts', 'server/local-feed.ts', 'server/publication-trash.ts',
  ].filter(p => index.has(p));
  const position = new Map(paths.map((p, i) => [p, { x: 15 + Math.floor(i / 4) * 290, y: 55 + (i % 4) * 125 }]));
  const graph = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1180 570" role="img" aria-label="Importações diretas entre módulos centrais">'];
  graph.push('<rect width="1180" height="570" fill="#fbfdfb"/>');
  for (const file of atlas.files.filter(f => position.has(f.path))) for (const target of file.imports.filter(p => position.has(p))) {
    const a = position.get(file.path), b = position.get(target);
    graph.push(`<path d="M ${a.x + 132} ${a.y + 35} C ${a.x + 285} ${a.y + 35} ${b.x - 12} ${b.y + 35} ${b.x} ${b.y + 35}" stroke="#bdcec4" fill="none" stroke-width="1"/>`);
  }
  for (const file of paths) {
    const { x, y } = position.get(file);
    graph.push(`<a href="#${index.get(file)}"><rect x="${x}" y="${y}" width="265" height="76" rx="9" fill="#eef7f3" stroke="#c9ded4"/><text x="${x + 12}" y="${y + 28}" font-size="14" font-family="sans-serif" fill="#182629">${escape(file.split('/').pop())}</text><text x="${x + 12}" y="${y + 50}" font-size="10" font-family="sans-serif" fill="#617174">${escape(file)}</text></a>`);
  }
  graph.push('</svg>');
  const categoryNames = { application: 'Interface e utilitários', server: 'Servidor', styles: 'CSS', tests: 'Testes', configuration: 'Configurações e entradas', tooling: 'Gerador do atlas' };
  const sections = [];
  sections.push(`<header id="top"><div class="brand">TempleSale <small>Atlas de manutenção</small></div><h1>Mapa, dependências e fluxos críticos</h1><p>Commit ${link(atlas.commit.slice(0, 12), `https://github.com/${repository}/commit/${atlas.commit}`)}. Conteúdo pré-renderizado, sem JavaScript, chamadas à API ou acesso ao banco.</p><nav>${[['map', 'Mapa'], ['flows', 'Fluxos críticos'], ['catalog', 'Arquivos e funções'], ['css', 'CSS'], ['routes', 'API'], ['changes', 'Mudanças']].map(([id, title]) => link(title, '#' + id)).join('')}</nav></header>`);
  sections.push(`<main><div class="stats">${[[atlas.stats.files, 'arquivos inventariados'], [atlas.stats.namedDefinitions, 'definições nomeadas, incluindo testes e ferramentas'], [atlas.stats.localImports, 'importações locais'], [atlas.stats.cssRules, 'regras CSS indexadas']].map(([value, title]) => `<article><b>${number(value)}</b><span>${escape(title)}</span></article>`).join('')}</div>`);
  sections.push(`<section id="map"><h2>Importações entre módulos centrais</h2><p>As linhas representam somente importações locais encontradas. Uma chamada HTTP não é uma importação. O desenho é um recorte; o catálogo abaixo contém o conjunto completo.</p><div class="diagram">${graph.join('')}</div><div class="mobile-links">${paths.map(local).join(' ')}</div></section>`);
  sections.push('<section id="flows"><h2>Fluxos críticos</h2><p>Roteiros editoriais ligados a trechos localizados no commit. Não são traces de execução. Âncoras ausentes ficam explícitas e fazem a verificação estrita falhar.</p>');
  for (const flow of atlas.flows) {
    sections.push(`<article class="card"><h3>${escape(flow.title)}</h3><p>${escape(flow.description)}</p><ol>${flow.steps.map(step => `<li><b>${escape(step.label)}</b><br>${step.status === 'located' ? link(`${step.file}:${step.line}`, source(step.file, step.line)) : `<strong class="warning">${escape(step.status)}: ${escape(step.file)}</strong>`}</li>`).join('')}</ol><h4>Testes relacionados</h4><ul>${flow.tests.map(test => `<li>${local(test.file)} - ${!test.present ? 'arquivo ausente' : test.listedInWorkflows.length ? 'citado em workflow: ' + test.listedInWorkflows.map(local).join(', ') : 'não citado literalmente nos workflows inventariados'}</li>`).join('')}</ul><p class="hint">Presença ou referência no CI não comprova que o teste foi executado ou passou. Nomes de cenários gerados dinamicamente podem não aparecer no índice.</p></article>`);
  }
  sections.push('</section><section id="catalog"><h2>Arquivos e definições</h2><p>Use a busca de texto do navegador/leitor para localizar nomes. Chamadas resolvidas omitem callbacks anônimos e relações dinâmicas. Não alcançar um arquivo pelas entradas conhecidas não prova que ele esteja inutilizado.</p>');
  for (const [category, label] of Object.entries(categoryNames)) {
    const files = atlas.files.filter(f => f.category === category);
    sections.push(`<h3>${label} (${files.length})</h3><div class="directory">${files.map(file => local(file.path)).join('')}</div>`);
  }
  for (const file of atlas.files) {
    const candidates = atlas.css.filter(rule => rule.candidates.includes(file.path));
    sections.push(`<article class="card" id="${index.get(file.path)}"><h3>${escape(file.path)}</h3><p>${escape(categoryNames[file.category])} - ${number(file.lines)} linhas físicas - ${file.symbols.length} definições nomeadas. ${link('Abrir código', source(file.path))}</p><h4>Importa</h4><p>${file.imports.map(local).join(' · ') || 'Nenhum arquivo local resolvido.'}</p><h4>É importado por</h4><p>${file.importedBy.map(local).join(' · ') || 'Nenhum importador local encontrado.'}</p><p class="hint">Entradas que alcançam este arquivo: ${file.reachableFrom.map(escape).join(', ') || 'nenhuma das entradas conhecidas'}.</p>`);
    if (file.transitiveImporters.length) sections.push(`<h4>Importadores transitivos</h4><p class="hint">Caminhos indiretos no grafo estático, não comprovação de impacto funcional.</p><p>${file.transitiveImporters.map(local).join(' · ')}</p>`);
    if (file.external.length) sections.push(`<p class="hint">Dependências externas: ${file.external.map(escape).join(', ')}.</p>`);
    if (file.states.length) sections.push('<h4>Estado React identificado</h4>' + rows(['Estado', 'Setter', 'Definição', 'Chamadas do setter'], file.states.map(s => [escape(s.name), escape(s.setter), link(String(s.line), source(file.path, s.line)), s.writes.map(w => link(String(w.line), source(w.file, w.line))).join(', ')])));
    if (file.events.length) sections.push('<h4>Eventos e temporizadores</h4>' + rows(['Ação', 'Alvo', 'Eventos / intervalo', 'Linha'], file.events.map(e => [escape(e.action), escape(e.target), e.delay !== undefined ? (e.delay === null ? 'intervalo não literal / não aplicável' : e.delay + ' ms') : escape(e.names.join(', ') || 'nome não resolvido'), link(String(e.line), source(file.path, e.line))])));
    if (candidates.length) sections.push(`<h4>Possíveis relações CSS</h4><p class="hint">Coincidência textual de classes/IDs em JSX. Não prova cascata, aplicação da regra ou presença simultânea dos elementos.</p><ul>${candidates.map(rule => `<li>${link(rule.selector, source(rule.file, rule.line))} (${escape(rule.file)}:${rule.line})</li>`).join('')}</ul>`);
    if (file.tests.length) sections.push('<h4>Cenários com nomes literais</h4><ul>' + file.tests.map(t => '<li>' + link(t.name, source(file.path, t.line)) + '</li>').join('') + '</ul>');
    if (file.symbols.length) sections.push('<h4>Funções e métodos</h4>' + rows(['Definição e escopo', 'Linhas', 'Chama', 'É chamada por'], file.symbols.map(id => {
      const s = symbols.get(id);
      const references = ids => ids.map(call => { const target = symbols.get(call); return link(target.name, '#' + target.anchor); }).join(', ');
      return [`<span id="${s.anchor}">${escape(s.scope ? s.scope + '.' + s.name : s.name)}</span>`, link(`${s.line}-${s.end}`, source(file.path, s.line)), references(s.calls), references(s.calledBy)];
    })));
    sections.push('<p class="back">' + link('Voltar ao catálogo', '#catalog') + '</p></article>');
  }
  sections.push('</section><section id="css"><h2>Regras CSS e contexto</h2><p>Índice lexical de seletores e contextos, incluindo media queries e regras aninhadas. Não expande @apply/Tailwind nem calcula estilos do navegador.</p>' + rows(['Seletor', 'Contexto', 'Origem', 'Candidatos em JSX'], atlas.css.map(rule => [escape(rule.selector), escape(rule.context.join(' / ') || 'global'), link(`${rule.file}:${rule.line}`, source(rule.file, rule.line)), rule.candidates.map(local).join(', ')])) + '</section>');
  sections.push('<section id="routes"><h2>Registros HTTP e montagens</h2><p>Declarações literais em app/router dos arquivos do servidor. Inclui aliases; não são necessariamente endpoints únicos, ativos ou testados.</p>' + rows(['Método', 'Caminho', 'Origem'], atlas.routes.map(r => [escape(r.method), escape(r.path), link(`${r.file}:${r.line}`, source(r.file, r.line))])) + '</section>');
  sections.push('<section id="changes"><h2>Comparação entre commits</h2>');
  if (changes) {
    sections.push(`<p>Base ${escape(changes.base.slice(0, 12))} → versão ${escape(changes.head.slice(0, 12))}. Definições são comparadas por caminho, escopo, nome e ordem de ocorrência; renomear ou mover aparece como remoção e adição. A alteração de uma função aninhada também pode alterar o hash da função que a contém.</p>`);
    for (const [key, label] of [['files', 'Arquivos'], ['definitions', 'Definições']]) for (const [status, title] of [['added', 'Adicionados'], ['removed', 'Removidos'], ['changed', 'Alterados']]) {
      sections.push(`<h3>${label}: ${title.toLowerCase()} (${changes[key][status].length})</h3><ul>${changes[key][status].map(value => '<li>' + escape(value) + '</li>').join('') || '<li>Nenhum.</li>'}</ul>`);
    }
  } else sections.push('<p>Nenhum commit de base fornecido. A ausência de comparação não significa ausência de mudanças.</p>');
  sections.push('</section><footer>Inventário somente de leitura. Exclui .env, bancos, backups, dependências instaladas, artefatos e projetos auxiliares. Configurações são inventariadas por metadados, sem publicar seus conteúdos. Linhas, importações e definições são estáticas; candidatos CSS e roteiros são indicados como tal. ' + link('Voltar ao início', '#top') + '</footer></main>');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TempleSale - Atlas ${atlas.commit.slice(0, 7)}</title><style>
*{box-sizing:border-box}body{margin:0;background:#f5f7f5;color:#182629;font:14px/1.6 system-ui,-apple-system,sans-serif}header,main{max-width:1300px;margin:auto;padding:26px}header{background:white;border-bottom:1px solid #dce5e3}.brand{font:28px Georgia,serif}.brand small{font:11px system-ui;color:#21745f;margin-left:12px}h1{font-size:24px}h2{margin-top:35px;font-size:22px}h3{font-size:17px;overflow-wrap:anywhere}h4{margin-bottom:6px}p,.hint{color:#617174}.hint,.back{font-size:12px}a{color:#21745f;overflow-wrap:anywhere}a:focus-visible{outline:3px solid #ab7f28}nav{display:flex;flex-wrap:wrap;gap:10px}nav a,.directory a{background:#eef7f3;border:1px solid #dce5e3;border-radius:7px;padding:8px 11px;text-decoration:none}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.stats article,.card{background:white;border:1px solid #dce5e3;border-radius:12px;padding:18px;margin:16px 0}.stats b{font-size:27px;display:block}.stats span{font-size:12px;color:#617174}.diagram{background:white;padding:12px;border:1px solid #dce5e3;border-radius:12px}svg{display:block;width:100%;height:auto}.mobile-links{display:none}.directory{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.directory a{font-size:12px}.table{overflow-x:auto}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border-bottom:1px solid #dce5e3;text-align:left;padding:9px 5px;vertical-align:top;overflow-wrap:anywhere}th{color:#617174}.warning{color:#9d3325}li{margin-bottom:8px}footer{margin-top:35px;padding-top:20px;border-top:1px solid #dce5e3;font-size:12px;color:#617174}@media(max-width:650px){header,main{padding:16px}.brand small{display:block;margin:0}.stats{grid-template-columns:repeat(2,1fr);gap:8px}.stats article{margin:8px 0;padding:12px}.directory{grid-template-columns:1fr}.card{padding:13px}.mobile-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.mobile-links a{font-size:11px}h1{font-size:21px}}@media print{.card{break-inside:avoid}header,main{padding:10px}a{color:#182629}}
</style></head><body>${sections.join('\n')}</body></html>`;
}
