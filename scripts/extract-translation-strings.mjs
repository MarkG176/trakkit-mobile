/**
 * Extracts user-facing strings from the TraKKiT mobile app into a translation CSV.
 * Run: node scripts/extract-translation-strings.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_PATH = path.join(ROOT, 'docs', 'translation-guide.csv');

const SKIP_DIRS = new Set(['ui', 'node_modules', 'integrations']);
const SCAN_ROOTS = [
  path.join(ROOT, 'src', 'pages'),
  path.join(ROOT, 'src', 'components'),
  path.join(ROOT, 'src', 'hooks'),
  path.join(ROOT, 'src', 'services'),
];

/** Files not in the catalog path list but tied to a CRM component */
const FILE_COMPONENT_OVERRIDES = {
  'src/components/profile/HelpFAQDialog.tsx': 'CRM-0109',
  'src/components/profile/ProfileHeader.tsx': 'CRM-0090',
  'src/components/profile/DailySummaryCard.tsx': 'CRM-0063',
  'src/components/profile/WeeklySummaryCard.tsx': 'CRM-0064',
  'src/components/onboarding/WorkspaceOnboarding.tsx': 'CRM-0090',
  'src/components/onboarding/TourOverlay.tsx': 'CRM-0089',
};

// --- Parse mobile component catalog ---
function loadComponentCatalog() {
  const catalogPath = path.join(ROOT, 'src', 'data', 'mobileComponentsCatalog.ts');
  const content = fs.readFileSync(catalogPath, 'utf8');
  const components = [];
  const re =
    /\{\s*code:\s*'([^']+)',\s*name:\s*'([^']+)',\s*path:\s*'([^']+)',\s*group:\s*'([^']+)',\s*description:\s*'([^']*)'\s*\}/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    components.push({
      code: m[1],
      name: m[2],
      path: m[3].replace(/\\/g, '/'),
      group: m[4],
      description: m[5],
    });
  }
  return components;
}

function resolveComponent(filePath, catalog) {
  const normalized = filePath.replace(/\\/g, '/').replace(/^.*\/src\//, 'src/');
  const overrideCode = FILE_COMPONENT_OVERRIDES[normalized];
  if (overrideCode) {
    const hit = catalog.find((c) => c.code === overrideCode);
    if (hit) return hit;
  }
  let best = null;
  for (const c of catalog) {
    if (normalized === c.path || normalized.endsWith('/' + path.basename(c.path))) {
      if (!best || c.path.length > best.path.length) best = c;
    }
  }
  if (!best) {
    for (const c of catalog) {
      if (normalized.includes(path.basename(c.path, '.tsx'))) {
        if (!best || c.path.length > best.path.length) best = c;
      }
    }
  }
  return best;
}

// --- Parse useLanguage translations ---
function loadTranslations() {
  const langPath = path.join(ROOT, 'src', 'hooks', 'useLanguage.tsx');
  const content = fs.readFileSync(langPath, 'utf8');
  const map = new Map();
  const re = /"([^"]+)":\s*\{\s*en:\s*"([^"]*)",\s*sw:\s*"([^"]*)"\s*\}/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    map.set(m[1], { en: m[2], sw: m[3] });
  }
  return map;
}

// --- String filters ---
function isNoise(text) {
  if (!text || text.length < 2) return true;
  if (/^[\d\s.,:;!?%$#@&*()\-+=\[\]{}|\\/<>]+$/.test(text)) return true;
  if (/^(true|false|null|undefined|void|const|let|var|return|import|export)$/.test(text)) return true;
  if (/^(className|onClick|variant|size|type|id|key|value|name|htmlFor|disabled|checked)$/.test(text)) return true;
  if (/^https?:\/\//.test(text)) return true;
  if (/^#[0-9a-fA-F]{3,8}$/.test(text)) return true;
  if (/^src\/|^@\//.test(text)) return true;
  if (/\.(tsx?|jsx?|css|png|jpg|svg|json)$/.test(text)) return true;
  if (/^CRM-\d+/.test(text)) return true;
  if (/^M\d|^L\d|^H\d|^v\d|^path d=/.test(text)) return true;
  if (text.includes('${') || text.includes('{{')) return true;
  if (/^[a-z]+-[a-z]/.test(text) && !/\s/.test(text) && text.length < 30) return true; // tailwind-like
  if (/^flex |^grid |^text-|^bg-|^border-|^w-|^h-|^p-|^m-/.test(text)) return true;
  if (/^[a-z_]+$/.test(text) && text.length < 20 && !/\s/.test(text)) return true; // snake_case keys
  return false;
}

function classifyContext(before, propName) {
  if (propName === 'title' && /toast\s*\(\s*\{/.test(before.slice(-80))) return 'toast_title';
  if (propName === 'description' && /toast\s*\(\s*\{/.test(before.slice(-120))) return 'toast_description';
  if (propName === 'title') return 'title';
  if (propName === 'description') return 'description';
  if (propName === 'placeholder') return 'placeholder';
  if (propName === 'label') return 'label';
  if (propName === 'alt') return 'alt';
  if (propName === 'question') return 'faq_question';
  if (propName === 'answer') return 'faq_answer';
  if (propName === 'name') return 'name';
  return 'sentence';
}

function extractFromFile(filePath, catalog) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const component = resolveComponent(relPath, catalog);
  const rows = [];

  const addRow = (text, textType, translationKey = '', lineNum = 0) => {
    const trimmed = text.replace(/\s+/g, ' ').trim();
    if (isNoise(trimmed)) return;
    rows.push({
      component_code: component?.code ?? '',
      component_name: component?.name ?? '',
      file_path: relPath,
      line: lineNum,
      text_type: textType,
      translation_key: translationKey,
      english: trimmed,
    });
  };

  const lines = content.split('\n');

  // Prop-based strings: title, description, placeholder, label, alt, question, answer
  const propRe =
    /(title|description|placeholder|label|alt|question|answer|name)\s*[:=]\s*(["'`])((?:\\.|(?!\2).)*)\2/g;
  let match;
  while ((match = propRe.exec(content)) !== null) {
    const prop = match[1];
    const text = match[3].replace(/\\n/g, ' ').replace(/\\'/g, "'");
    const lineNum = content.slice(0, match.index).split('\n').length;
    const before = content.slice(Math.max(0, match.index - 150), match.index);
    addRow(text, classifyContext(before, prop), '', lineNum);
  }

  // throw new Error('...')
  const errorRe = /throw new Error\(\s*(["'`])((?:\\.|(?!\1).)*)\1/g;
  while ((match = errorRe.exec(content)) !== null) {
    const text = match[2];
    const lineNum = content.slice(0, match.index).split('\n').length;
    addRow(text, 'error', '', lineNum);
  }

  // JSX text nodes: >Text<  (single line, no nested tags)
  const jsxTextRe = />([^<>{}\n]+)</g;
  while ((match = jsxTextRe.exec(content)) !== null) {
    const text = match[1].trim();
    if (!text || text.startsWith('{') || text.endsWith('}')) continue;
    const lineNum = content.slice(0, match.index).split('\n').length;
    addRow(text, 'label', '', lineNum);
  }

  // String literals in arrays like { label: "Record Sale", ... } already caught
  // Dialog/button text in template: `Something ${var}` - skip

  // t("key") usage
  const tRe = /\bt\s*\(\s*["']([^"']+)["']\s*\)/g;
  while ((match = tRe.exec(content)) !== null) {
    const key = match[1];
    const lineNum = content.slice(0, match.index).split('\n').length;
    rows.push({
      component_code: component?.code ?? '',
      component_name: component?.name ?? '',
      file_path: relPath,
      line: lineNum,
      text_type: 'translation_key_ref',
      translation_key: key,
      english: `__KEY__:${key}`,
      _isKeyRef: true,
    });
  }

  // Button children on own line: common pattern
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const btnMatch = line.match(/^\s*(?:<Button[^>]*>|<button[^>]*>)\s*([^<{]+)\s*<\/(?:Button|button)>/i);
    if (btnMatch) addRow(btnMatch[1], 'button', '', i + 1);

    const hMatch = line.match(/<h[1-6][^>]*>([^<{]+)<\/h[1-6]>/i);
    if (hMatch) addRow(hMatch[1], 'heading', '', i + 1);
  }

  return rows;
}

function walkDir(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walkDir(full, files);
    } else if (/\.(tsx|ts)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      files.push(full);
    }
  }
  return files;
}

function csvEscape(value) {
  const s = String(value ?? '');
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function dedupeKey(row) {
  return `${row.file_path}|${row.text_type}|${row.english}|${row.translation_key}`;
}

function main() {
  const catalog = loadComponentCatalog();
  const translations = loadTranslations();

  const allRows = [];

  // Catalog descriptions as rows
  for (const c of catalog) {
    allRows.push({
      component_code: c.code,
      component_name: c.name,
      file_path: c.path,
      line: 0,
      text_type: 'component_description',
      translation_key: '',
      english: c.description,
    });
    allRows.push({
      component_code: c.code,
      component_name: c.name,
      file_path: c.path,
      line: 0,
      text_type: 'component_name',
      translation_key: '',
      english: c.name,
    });
  }

  // useLanguage entries
  for (const [key, { en, sw }] of translations) {
    allRows.push({
      component_code: 'CRM-0090',
      component_name: 'Profile',
      file_path: 'src/hooks/useLanguage.tsx',
      line: 0,
      text_type: 'translation_key',
      translation_key: key,
      english: en,
      kiswahili: sw,
      translated: 'yes',
    });
  }

  const files = SCAN_ROOTS.flatMap((d) => walkDir(d));
  for (const file of files.sort()) {
    try {
      allRows.push(...extractFromFile(file, catalog));
    } catch (err) {
      console.warn(`Skip ${file}: ${err.message}`);
    }
  }

  // Resolve translation key refs and merge kiswahili
  const seen = new Set();
  const finalRows = [];

  for (const row of allRows) {
    if (row._isKeyRef) {
      const t = translations.get(row.translation_key);
      if (t) {
        const resolved = {
          ...row,
          english: t.en,
          kiswahili: t.sw,
          translated: 'yes',
          text_type: 'label',
        };
        delete resolved._isKeyRef;
        const key = dedupeKey(resolved);
        if (!seen.has(key)) {
          seen.add(key);
          finalRows.push(resolved);
        }
      }
      continue;
    }

    const key = dedupeKey(row);
    if (seen.has(key)) continue;
    seen.add(key);

    const t = row.translation_key ? translations.get(row.translation_key) : null;
    if (t) {
      row.kiswahili = t.sw;
      row.translated = 'yes';
    } else if (row.kiswahili) {
      row.translated = row.translated ?? 'yes';
    } else {
      row.kiswahili = '';
      row.translated = 'no';
    }

    finalRows.push(row);
  }

  finalRows.sort((a, b) => {
    const cn = (a.component_name || 'zzz').localeCompare(b.component_name || 'zzz');
    if (cn !== 0) return cn;
    return a.file_path.localeCompare(b.file_path) || a.english.localeCompare(b.english);
  });

  const header = [
    'component_code',
    'component_name',
    'file_path',
    'line',
    'text_type',
    'translation_key',
    'english',
    'kiswahili',
    'translated',
  ];

  const csvLines = [
    header.join(','),
    ...finalRows.map((r) =>
      header.map((h) => csvEscape(r[h] ?? '')).join(',')
    ),
  ];

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, csvLines.join('\n'), 'utf8');

  console.log(`Wrote ${finalRows.length} rows to ${path.relative(ROOT, OUT_PATH)}`);
  console.log(`Translated: ${finalRows.filter((r) => r.translated === 'yes').length}`);
  console.log(`Untranslated: ${finalRows.filter((r) => r.translated === 'no').length}`);
}

main();
