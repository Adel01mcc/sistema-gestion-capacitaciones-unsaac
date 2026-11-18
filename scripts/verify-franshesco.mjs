import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sha = data => createHash('sha256').update(data).digest('hex');
const gitSource = path => execFileSync('git', ['show', `punto-inicio-fran:${path}`], { cwd: root, encoding: 'utf8' }).replace(/\r\n/g, '\n');
let checked = 0;
let fragments = 0;
for (const phase of ['antes', 'despues']) {
  const manifest = JSON.parse(readFileSync(join(root, `docs/franshesco/evidencias/captura_${phase}.json`), 'utf8'));
  assert.equal(manifest.phase, phase);
  for (const entry of manifest.imagesAndSources) {
    const data = readFileSync(join(root, entry.path));
    assert.equal(sha(entry.path.endsWith('.txt') ? data.toString('utf8').replace(/\r\n/g, '\n') : data), entry.sha256, `Imagen/fragmento alterado: ${entry.path}`);
    checked++;
  }
  for (const view of manifest.sourceViews) {
    fragments++;
    const source = phase === 'antes' ? gitSource(view.sourcePath) : readFileSync(join(root, view.sourcePath), 'utf8').replace(/\r\n/g, '\n');
    assert.equal(sha(source), view.sourceSha256LF, `Fuente cambió: ${view.sourcePath}; regenerar evidencia.`);
    const selected = source.split('\n').slice(view.firstLine - 1, view.lastLine).map((line, index) => `${String(view.firstLine + index).padStart(3)}  ${line}`).join('\n') + '\n';
    assert.equal(readFileSync(join(root, `docs/franshesco/evidencias/${view.key}_${phase}.txt`), 'utf8').replace(/\r\n/g, '\n'), selected);
  }
  assert.equal(manifest.paginationMeasurement.selects, phase === 'antes' ? 302 : 4);
}
const comparisons = JSON.parse(readFileSync(join(root, 'docs/franshesco/evidencias/comparaciones_visuales.json'), 'utf8'));
for (const entry of comparisons.comparisons) {
  assert.equal(sha(readFileSync(join(root, 'docs/latex/imagenes/franshesco', entry.image))), entry.sha256, `Comparación alterada: ${entry.image}`);
  checked++;
  for (const source of entry.sources) {
    assert.equal(sha(readFileSync(join(root, source.path))), source.sha256, `Captura original cambió: ${source.image}`);
    checked++;
  }
}
const retained = JSON.parse(readFileSync(join(root, 'docs/franshesco/evidencias/visuales_conservadas.json'), 'utf8').replace(/^\uFEFF/, ''));
for (const image of retained) {
  assert.equal(sha(readFileSync(join(root, 'docs/latex/imagenes/franshesco', image.Name))).toUpperCase(), image.SHA256, `Comparación visual modificada: ${image.Name}`);
  checked++;
}
const codeComparisons = JSON.parse(readFileSync(join(root, 'docs/franshesco/evidencias/comparaciones_codigo.json'), 'utf8')).comparisons;
assert.deepEqual(readdirSync(join(root, 'docs/latex/imagenes/franshesco')).filter(name => name.endsWith('.png')).sort(),
  [...retained.map(image => image.Name), ...codeComparisons.map(image => image.image)].sort(), 'La carpeta final debe contener sólo las comparaciones seleccionadas.');
for (const comparison of codeComparisons) {
  assert.equal(sha(readFileSync(join(root, 'docs/latex/imagenes/franshesco', comparison.image))), comparison.sha256);
  checked++;
  for (const block of [...comparison.before, ...comparison.after]) {
    const source = block.phase === 'antes' ? gitSource(block.path) : readFileSync(join(root, block.path), 'utf8').replace(/\r\n/g, '\n');
    assert.equal(sha(source), block.sourceSha256LF, `Fuente de comparación cambió: ${block.path}`);
    const text = source.split('\n').slice(block.firstLine - 1, block.lastLine).map((line, index) => `${String(block.firstLine + index).padStart(3)}  ${line}`).join('\n') + '\n';
    assert.equal(text, block.text, `Fragmento comparativo alterado: ${block.path}`);
    fragments++;
  }
}
function verifyBefore(directory, prefix = '') {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const relative = prefix + entry.name;
    if (entry.isDirectory()) verifyBefore(join(directory, entry.name), relative + '/');
    else assert.equal(readFileSync(join(directory, entry.name), 'utf8').replace(/\r\n/g, '\n'), gitSource(relative), `Copia anterior no coincide: ${relative}`);
  }
}
verifyBefore(join(root, 'docs/franshesco/antes'));
for (const entry of readFileSync(join(root, 'docs/franshesco/FUENTES_SHA256.txt'), 'utf8').trim().split(/\r?\n/)) {
  const [expected, path] = entry.split('  ');
  const data = readFileSync(join(root, path));
  const normalized = /\.(js|mjs|tsx|sql|tex|md|txt|json)$/.test(path) ? data.toString('utf8').replace(/\r\n/g, '\n') : data;
  assert.equal(sha(normalized), expected, `Hash de entrega cambió: ${path}`);
  checked++;
}
console.log(`Evidencia correcta: ${checked} hashes y ${fragments} fragmentos literales. ${retained.length} visuales intactas, ${codeComparisons.length} comparaciones de código y siete fuentes anteriores coinciden.`);
