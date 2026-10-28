import ts from 'typescript';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const slash = value => value.split(path.sep).join('/');
const digest = value => createHash('sha256').update(value).digest('hex');
export const git = (root, ...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
export function category(file) {
  if (/^tests\//.test(file)) return 'tests';
  if (/^tools\/atlas\//.test(file)) return 'tooling';
  if (file.endsWith('.css')) return 'styles';
  if (/^(server\/|server\.ts$|src\/server\.js$)/.test(file)) return 'server';
  if (/^src\//.test(file)) return 'application';
  return 'configuration';
}
export function included(file) {
  if (/(^|\/)(node_modules|dist|data|backups?|\.git)(\/|$)/i.test(file) || /(^|\/)\.env(?:\.|$)/.test(file)) return false;
  if (/^(src|server|tests|tools\/atlas)\//.test(file)) return /\.(?:[cm]?[jt]sx?|css|json|html|md)$/.test(file);
  return /^(?:server\.ts|index\.html|package\.json|tsconfig\.json|vite\.config\.[jt]s|vercel\.json|render\.ya?ml|public\/(?:startup\.js|site\.webmanifest)|\.github\/workflows\/[^/]+\.ya?ml)$/.test(file);
}

// Lexical selector index, not a browser CSS engine. Preserve line positions while
// skipping comments/quoted braces. Nested rules retain their enclosing context.
export function cssRules(file, text) {
  const clean = text.replace(/\/\*[\s\S]*?\*\//g, s => s.replace(/[^\n]/g, ' '));
  const rules = [], stack = [];
  let start = 0, quote = '', parens = 0;
  const line = pos => clean.slice(0, pos).split('\n').length;
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (quote) { if (c === '\\') i++; else if (c === quote) quote = ''; continue; }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === '(' || c === '[') parens++;
    if (c === ')' || c === ']') parens--;
    if (parens) continue;
    if (c === '{') {
      const raw = clean.slice(start, i), header = raw.trim(), pos = start + raw.indexOf(header);
      const context = stack.map(s => s.header);
      const frame = { header, line: line(pos), context };
      if (header && !header.startsWith('@') && !context.some(s => /^@(?:-\w+-)?keyframes\b/.test(s))) {
        frame.rule = { file, selector: header, line: frame.line, context, tokens: [...new Set(header.match(/[.#][A-Za-z_][\w-]*/g) || [])], candidates: [] };
        rules.push(frame.rule);
      }
      stack.push(frame); start = i + 1;
    } else if (c === '}') {
      const frame = stack.pop(); if (frame?.rule) frame.rule.end = line(i);
      start = i + 1;
    } else if (c === ';') start = i + 1;
  }
  return rules;
}

export function analyze(root, ref = 'HEAD') {
  const commit = git(root, 'rev-parse', '--verify', `${ref}^{commit}`).trim();
  const names = git(root, 'ls-tree', '-r', '--name-only', '-z', commit).split('\0').filter(included).sort();
  // Read Git blobs, never import application modules or consult its environment.
  const blobs = new Map(names.map(file => [file, git(root, 'show', `${commit}:${file}`)]));
  const files = names.map(file => ({ path: file, category: category(file), lines: blobs.get(file).split('\n').length, hash: digest(blobs.get(file)), imports: [], importedBy: [], external: [], symbols: [], css: [], events: [], states: [], tests: [], reachableFrom: [] }));
  const byFile = new Map(files.map(f => [f.path, f]));
  const sources = files.filter(f => /\.[cm]?[jt]sx?$/.test(f.path));
  const options = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX, allowJs: true, noEmit: true, skipLibCheck: true, allowImportingTsExtensions: true, baseUrl: root, paths: { '@/*': ['./*'] } };
  const compilerHost = ts.createCompilerHost(options);
  const originalRead = compilerHost.readFile, originalExists = compilerHost.fileExists;
  const rel = absolute => slash(path.relative(root, absolute));
  const inRepo = absolute => absolute.startsWith(root + path.sep) && !rel(absolute).startsWith('node_modules/');
  compilerHost.readFile = file => inRepo(file) ? blobs.get(rel(file)) : originalRead(file);
  compilerHost.fileExists = file => inRepo(file) ? blobs.has(rel(file)) : originalExists(file);
  const program = ts.createProgram(sources.map(f => path.join(root, f.path)), options, compilerHost);
  const checker = program.getTypeChecker();
  const symbols = [], nodes = new Map(), declarationIds = new Map(), routes = [], css = [];
  const nodeKey = node => `${rel(node.getSourceFile().fileName)}:${node.getStart()}`;
  const at = (sf, pos) => sf.getLineAndCharacterOfPosition(pos).line + 1;
  const functionName = node => {
    if (node.name && (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name))) return node.name.text;
    const p = node.parent;
    if (ts.isVariableDeclaration(p) && ts.isIdentifier(p.name)) return p.name.text;
    if (ts.isPropertyAssignment(p) && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name))) return p.name.text;
    if (ts.isCallExpression(p) && p.arguments[0] === node && /^(?:React\.)?(?:useCallback|memo|forwardRef)$/.test(p.expression.getText()) && ts.isVariableDeclaration(p.parent) && ts.isIdentifier(p.parent.name)) return p.parent.name.text;
    return undefined;
  };
  const scope = node => {
    const parts = [];
    for (let p = node.parent; p; p = p.parent) {
      if (ts.isFunctionLike(p)) { const name = functionName(p); if (name) parts.unshift(name); }
      else if (ts.isClassDeclaration(p) && p.name) parts.unshift(p.name.text);
    }
    return parts.join('.');
  };
  const lookup = node => {
    let symbol = checker.getSymbolAtLocation(node);
    if (symbol?.flags & ts.SymbolFlags.Alias) { try { symbol = checker.getAliasedSymbol(symbol); } catch { return []; } }
    return symbol?.declarations || [];
  };
  const literals = (node, depth = 0) => {
    if (!node || depth > 5) return [];
    if (ts.isStringLiteralLike(node)) return [node.text];
    if (ts.isArrayLiteralExpression(node)) return node.elements.flatMap(n => literals(n, depth + 1));
    return lookup(node).flatMap(decl => {
      if (ts.isVariableDeclaration(decl)) {
        if (decl.initializer) return literals(decl.initializer, depth + 1);
        if (ts.isVariableDeclarationList(decl.parent) && ts.isForOfStatement(decl.parent.parent)) return literals(decl.parent.parent.expression, depth + 1);
      }
      return [];
    });
  };
  const resolveLocal = (from, spec) => {
    const base = spec.startsWith('@/') ? spec.slice(2) : slash(path.normalize(path.join(path.dirname(from), spec)));
    const variants = [base, ...['.ts', '.tsx', '.js', '.mjs', '.css', '.json', '/index.ts', '/index.tsx', '/index.js'].map(ext => base + ext)];
    if (/\.js$/.test(base)) variants.push(base.slice(0, -3) + '.ts', base.slice(0, -3) + '.tsx');
    return variants.find(p => byFile.has(p));
  };
  const classTokens = new Map(), setterSymbols = new Map();
  const tokenHash = (sf, node) => {
    const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, sf.languageVariant, node.getText(sf));
    const tokens = [];
    while (scanner.scan() !== ts.SyntaxKind.EndOfFileToken) tokens.push(`${scanner.getToken()}:${scanner.getTokenText()}`);
    return digest(tokens.join('\n'));
  };
  for (const f of sources) {
    const sf = program.getSourceFile(path.join(root, f.path)); if (!sf) throw new Error(`Missing source: ${f.path}`);
    const imports = new Set(), external = new Set(), counts = new Map(), tokens = new Set();
    f.anonymous = 0;
    function visit(node) {
      let spec;
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) spec = node.moduleSpecifier.text;
      if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || node.expression.getText(sf) === 'require') && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) spec = node.arguments[0].text;
      if (spec) {
        if (spec.startsWith('.') || spec.startsWith('@/')) { const target = resolveLocal(f.path, spec); if (target) imports.add(target); }
        else external.add(spec);
      }
      if (ts.isFunctionLike(node) && node.body) {
        const name = functionName(node);
        if (name) {
          const qualified = [scope(node), name].filter(Boolean).join('.'), ordinal = (counts.get(qualified) || 0) + 1;
          counts.set(qualified, ordinal);
          const id = `${f.path}#${qualified}@${ordinal}`;
          const record = { id, file: f.path, name, scope: scope(node), line: at(sf, node.getStart()), end: at(sf, node.end), hash: tokenHash(sf, node), calls: [] };
          symbols.push(record); f.symbols.push(id); nodes.set(node, record);
          let decl = node;
          if (ts.isVariableDeclaration(node.parent) || ts.isPropertyAssignment(node.parent)) decl = node.parent;
          else if (ts.isCallExpression(node.parent) && ts.isVariableDeclaration(node.parent.parent)) decl = node.parent.parent;
          declarationIds.set(nodeKey(decl), id);
        } else f.anonymous++;
      }
      if (ts.isJsxAttribute(node) && node.initializer && ['id', 'className'].includes(node.name.getText(sf))) {
        const isId = node.name.getText(sf) === 'id';
        const collect = n => {
          if (ts.isStringLiteralLike(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) {
            for (const token of n.text.split(/\s+/)) if (/^[A-Za-z_][\w-]*$/.test(token)) tokens.add((isId ? '#' : '.') + token);
          }
          ts.forEachChild(n, collect);
        }; collect(node.initializer);
      }
      if (ts.isVariableDeclaration(node) && ts.isArrayBindingPattern(node.name) && node.initializer && ts.isCallExpression(node.initializer) && /^(?:React\.)?useState$/.test(node.initializer.expression.getText(sf))) {
        const [value, setter] = node.name.elements;
        if (value && setter && ts.isBindingElement(value) && ts.isBindingElement(setter) && ts.isIdentifier(value.name) && ts.isIdentifier(setter.name)) {
          const state = { name: value.name.text, setter: setter.name.text, line: at(sf, node.getStart()), writes: [] };
          f.states.push(state); const symbol = checker.getSymbolAtLocation(setter.name); if (symbol) setterSymbols.set(symbol, state);
        }
      }
      if (ts.isCallExpression(node)) {
        const exp = node.expression, method = ts.isPropertyAccessExpression(exp) ? exp.name.text : '';
        if (f.category === 'server' && ts.isPropertyAccessExpression(exp) && /^(?:app|router)$/.test(exp.expression.getText(sf)) && /^(get|post|put|patch|delete|options|head|all|use)$/.test(method)) {
          const arg = node.arguments[0], items = arg && ts.isArrayLiteralExpression(arg) ? arg.elements : [arg];
          for (const item of items) if (item && ts.isStringLiteral(item) && item.text.startsWith('/')) routes.push({ file: f.path, method: method.toUpperCase(), path: item.text, line: at(sf, node.getStart()) });
        }
        if (['addEventListener', 'removeEventListener', 'dispatchEvent'].includes(method)) {
          const arg = node.arguments[0];
          const eventNode = method === 'dispatchEvent' && arg && ts.isNewExpression(arg) ? arg.arguments?.[0] : arg;
          const names = [...new Set(literals(eventNode))];
          const rawTarget = exp.expression.getText(sf), target = /^[\w.$?]+$/.test(rawTarget) ? rawTarget : '(expressão dinâmica)';
          f.events.push({ action: method, target, names, unresolved: !names.length, line: at(sf, node.getStart()) });
        }
        if (['setInterval', 'setTimeout', 'requestAnimationFrame'].includes(method || exp.getText(sf))) {
          f.events.push({ action: method || exp.getText(sf), target: 'temporizador', names: [], delay: node.arguments[1] && ts.isNumericLiteral(node.arguments[1]) ? Number(node.arguments[1].text) : null, line: at(sf, node.getStart()) });
        }
        if (f.category === 'tests' && /^(?:test|it|describe)(?:\.(?:skip|only|todo))?$/.test(exp.getText(sf)) && node.arguments[0] && ts.isStringLiteralLike(node.arguments[0])) f.tests.push({ name: node.arguments[0].text, line: at(sf, node.getStart()) });
      }
      ts.forEachChild(node, visit);
    }
    visit(sf); f.imports = [...imports].sort(); f.external = [...external].sort(); classTokens.set(f.path, tokens);
  }
  // A second pass sees setters declared later in a file and resolves actual
  // lexical bindings, instead of matching same-spelled variables from other scopes.
  for (const f of sources) {
    const sf = program.getSourceFile(path.join(root, f.path));
    function visit(node) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        const state = setterSymbols.get(checker.getSymbolAtLocation(node.expression));
        if (state) state.writes.push({ file: f.path, line: at(sf, node.getStart()) });
      }
      ts.forEachChild(node, visit);
    } visit(sf);
  }
  for (const [node, record] of nodes) {
    const calls = new Set();
    function visit(n) {
      if (n !== node && ts.isFunctionLike(n)) return;
      if (ts.isCallExpression(n)) {
        const exp = ts.isPropertyAccessExpression(n.expression) ? n.expression.name : n.expression;
        for (const decl of lookup(exp)) { const id = declarationIds.get(nodeKey(decl)); if (id && id !== record.id) calls.add(id); }
      }
      ts.forEachChild(n, visit);
    } visit(node); record.calls = [...calls].sort();
  }
  const bySymbol = new Map(symbols.map(s => { s.calledBy = []; return [s.id, s]; }));
  for (const symbol of symbols) for (const callee of symbol.calls) bySymbol.get(callee).calledBy.push(symbol.id);
  for (const f of files) {
    if (f.category === 'styles') {
      const rules = cssRules(f.path, blobs.get(f.path));
      for (const rule of rules) {
        rule.candidates = sources.filter(s => s.category === 'application' && rule.tokens.some(token => classTokens.get(s.path).has(token))).map(s => s.path);
        f.css.push(css.length); css.push(rule);
      }
      const importPattern = /@import\s+['"]([^'"]+)['"]/g;
      for (const match of blobs.get(f.path).matchAll(importPattern)) { const target = resolveLocal(f.path, match[1]); if (target) f.imports.push(target); }
    }
    if (f.path.endsWith('.html')) {
      for (const match of blobs.get(f.path).matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
        const spec = match[1].replace(/^\//, './'), target = resolveLocal(f.path, spec);
        if (target && !f.imports.includes(target)) f.imports.push(target);
      }
    }
    for (const dependency of f.imports) byFile.get(dependency).importedBy.push(f.path);
    if (f.category === 'tests') f.listedInWorkflows = files.filter(w => w.path.startsWith('.github/workflows/') && blobs.get(w.path).includes(f.path)).map(w => w.path);
  }
  for (const entry of ['src/main.tsx', 'server.ts', 'src/server.js', 'public/startup.js']) {
    const visited = new Set();
    function walk(p) { if (visited.has(p) || !byFile.has(p)) return; visited.add(p); const f = byFile.get(p); f.reachableFrom.push(entry); f.imports.forEach(walk); }
    walk(entry);
  }
  for (const file of files) {
    const visited = new Set([file.path]);
    function walk(p) { for (const importer of byFile.get(p).importedBy) if (!visited.has(importer)) { visited.add(importer); walk(importer); } }
    walk(file.path); visited.delete(file.path); file.transitiveImporters = [...visited].sort();
  }
  const flowPath = 'tools/atlas/flows.json';
  const flowDefs = blobs.has(flowPath) ? JSON.parse(blobs.get(flowPath)) : [];
  const flows = flowDefs.map(flow => ({ ...flow, steps: flow.steps.map(step => {
    if (!blobs.has(step.file)) return { ...step, status: 'missing-file', line: null };
    const text = blobs.get(step.file), index = text.indexOf(step.anchor);
    return { ...step, status: index < 0 ? 'missing-anchor' : 'located', line: index < 0 ? null : text.slice(0, index).split('\n').length };
  }), tests: flow.tests.map(file => ({ file, present: byFile.has(file), listedInWorkflows: byFile.get(file)?.listedInWorkflows || [] })) }));
  const counts = Object.fromEntries([...new Set(files.map(f => f.category))].sort().map(c => [c, files.filter(f => f.category === c).length]));
  return { schemaVersion: 1, commit, files, symbols, routes, css, flows, stats: { files: files.length, categories: counts, namedDefinitions: symbols.length, localImports: files.reduce((n, f) => n + f.imports.length, 0), httpRegistrations: routes.filter(r => r.method !== 'USE').length, cssRules: css.length } };
}

export function compare(before, after) {
  const compareItems = (a, b, key) => {
    const left = new Map(a.map(item => [item[key], item])), right = new Map(b.map(item => [item[key], item]));
    return { added: b.filter(item => !left.has(item[key])).map(item => item[key]), removed: a.filter(item => !right.has(item[key])).map(item => item[key]), changed: b.filter(item => left.has(item[key]) && left.get(item[key]).hash !== item.hash).map(item => item[key]) };
  };
  return { base: before.commit, head: after.commit, files: compareItems(before.files, after.files, 'path'), definitions: compareItems(before.symbols, after.symbols, 'id') };
}
