#!/usr/bin/env node
/**
 * build-writeups.js
 * Converts writeups/*.md (Obsidian) → writeups/*.html
 * Embeds images as base64, updates data.json route.
 *
 * Usage:  node tools/build-writeups.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT         = path.join(__dirname, '..');
const WRITEUPS_DIR = path.join(ROOT, 'writeups');
const DATA_JSON    = path.join(ROOT, 'data.json');

/* ─────────────────────────────────────────────────────────── helpers ── */

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '');
}

/** Recursively find all .md files under dir */
function findMd(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'attachments') {
      findMd(full, results);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      results.push(full);
    }
  }
  return results;
}

/** Find an image file in: same dir, attachments/ sibling, or any parent attachments/ */
function findImage(imgName, mdDir) {
  const candidates = [
    path.join(mdDir, imgName),
    path.join(mdDir, 'attachments', imgName),
    path.join(mdDir, '..', 'attachments', imgName),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

/** Read image file → base64 data URI */
function imgToDataURI(imgPath) {
  const ext  = path.extname(imgPath).slice(1).toLowerCase();
  const mime = ext === 'jpg' ? 'image/jpeg'
             : ext === 'svg' ? 'image/svg+xml'
             : `image/${ext}`;
  const data = fs.readFileSync(imgPath).toString('base64');
  return `data:${mime};base64,${data}`;
}

/* ─────────────────────────────────────────────────── frontmatter ── */

function parseFrontmatter(text) {
  const fm = { title: '', date: '', tags: [], body: text };
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return fm;

  fm.body = match[2];
  const yaml = match[1];

  const titleM = yaml.match(/^title:\s*(.+)$/m);
  if (titleM) fm.title = titleM[1].trim().replace(/^["']|["']$/g, '');

  const dateM = yaml.match(/^date:\s*(.+)$/m);
  if (dateM) fm.date = dateM[1].trim().replace(/^["']|["']$/g, '');

  // tags: [a, b] or tags:\n  - a\n  - b
  const tagsInline = yaml.match(/^tags:\s*\[(.+)\]/m);
  if (tagsInline) {
    fm.tags = tagsInline[1].split(',').map(t => t.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  } else {
    const tagsBlock = yaml.match(/^tags:\s*\r?\n((?:[ \t]*-[ \t]*.+\r?\n?)+)/m);
    if (tagsBlock) {
      fm.tags = tagsBlock[1].split('\n')
        .map(l => l.replace(/^\s*-\s*/, '').trim())
        .filter(Boolean);
    }
  }

  return fm;
}

/** Extract metadata from a .md file */
function parseMeta(text, filePath) {
  let fm = parseFrontmatter(text);

  // If no frontmatter date, check if first non-empty body line looks like a date
  if (!fm.date) {
    const firstLine = fm.body.split('\n').find(l => l.trim());
    if (firstLine && /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(firstLine.trim())) {
      fm.date = firstLine.trim();
      fm.body = fm.body.replace(firstLine, '');
    }
  }

  // Normalize date to YYYY-MM-DD if in DD/MM/YYYY
  if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/.test(fm.date)) {
    const [d, m, y] = fm.date.split(/[\/\-]/);
    fm.date = `${y}-${m}-${d}`;
  }

  // Title: from frontmatter, or from filename
  if (!fm.title) {
    fm.title = path.basename(filePath, '.md');
  }

  // Infer platform/difficulty from folder path
  const rel   = path.relative(WRITEUPS_DIR, filePath);
  const parts = rel.split(path.sep);
  fm.platform   = parts.length >= 2 ? parts[0] : '';
  fm.difficulty = parts.length >= 3 ? parts[1] : '';

  // Auto-add folder tags if not already present
  const autoTags = [fm.platform, fm.difficulty].filter(Boolean).map(t => t.toLowerCase());
  autoTags.forEach(t => { if (!fm.tags.includes(t)) fm.tags.push(t); });

  return fm;
}

/* ───────────────────────────────────────────── markdown parser ── */

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function inline(s, mdDir) {
  const codes = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\x00${codes.length-1}\x00`; });

  // Obsidian image:  ![[filename]]  or  ![[filename|alt]]
  s = s.replace(/!\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]/g, (_, name, alt) => {
    const imgPath = findImage(name.trim(), mdDir);
    if (imgPath) return `<img src="${imgToDataURI(imgPath)}" alt="${esc(alt || name.trim())}">`;
    return `<span class="img-missing">[image: ${esc(name.trim())}]</span>`;
  });

  // Standard image: ![alt](src)
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
    const imgPath = findImage(src.trim(), mdDir);
    if (imgPath) return `<img src="${imgToDataURI(imgPath)}" alt="${esc(alt)}">`;
    return `<img src="${esc(src)}" alt="${esc(alt)}">`;
  });

  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  s = s.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '<span class="wikilink">$2</span>');
  s = s.replace(/\[\[([^\]]+)\]\]/g,            '<span class="wikilink">$1</span>');
  s = s.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  s = s.replace(/\*\*(.+?)\*\*/g,     '<strong>$1</strong>');
  s = s.replace(/__(.+?)__/g,         '<strong>$1</strong>');
  s = s.replace(/\*(.+?)\*/g,         '<em>$1</em>');
  s = s.replace(/(?<![a-zA-Z\d])_(.+?)_(?![a-zA-Z\d])/g, '<em>$1</em>');
  s = s.replace(/~~(.+?)~~/g,         '<del>$1</del>');
  s = s.replace(/==(.+?)==/g,         '<mark>$1</mark>');
  s = s.replace(/\^(.+?)\^/g,         '<sup>$1</sup>');

  s = s.replace(/\x00(\d+)\x00/g, (_, i) => `<code>${esc(codes[+i])}</code>`);
  return s;
}

function parse(md, mdDir) {
  const lines = md.split('\n');
  let html = '';
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    /* fenced code block */
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim();
      let code = '';
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        code += esc(lines[i]) + '\n';
        i++;
      }
      html += `<pre><code${lang ? ` class="language-${lang}"` : ''}>${code.trimEnd()}</code></pre>\n`;
      i++;
      continue;
    }

    /* Obsidian callout  > [!type] Title */
    if (/^>\s*\[!(\w+)\]/.test(line)) {
      const type  = (line.match(/^>\s*\[!(\w+)\]/) || [])[1].toLowerCase();
      const title = (line.match(/^>\s*\[!\w+\]\s*(.+)/) || [])[1] || type;
      let body = '';
      i++;
      while (i < lines.length && /^>/.test(lines[i])) {
        body += inline(lines[i].replace(/^>\s?/, ''), mdDir) + '<br>';
        i++;
      }
      html += `<div class="callout" data-type="${type}"><div class="callout-title">${esc(title)}</div><div class="callout-body">${body}</div></div>\n`;
      continue;
    }

    /* blockquote */
    if (/^>/.test(line)) {
      let content = '';
      while (i < lines.length && /^>/.test(lines[i])) {
        content += inline(lines[i].replace(/^>\s?/, ''), mdDir) + ' ';
        i++;
      }
      html += `<blockquote><p>${content.trim()}</p></blockquote>\n`;
      continue;
    }

    /* headings */
    const hm = line.match(/^(#{1,6})\s+(.+)/);
    if (hm) {
      const lvl = hm[1].length;
      const id  = hm[2].toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,'');
      html += `<h${lvl} id="${id}">${inline(hm[2], mdDir)}</h${lvl}>\n`;
      i++;
      continue;
    }

    /* horizontal rule */
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      html += '<hr>\n';
      i++;
      continue;
    }

    /* unordered list (incl. task list) */
    if (/^[\-\*\+]\s/.test(line)) {
      html += '<ul>\n';
      while (i < lines.length && /^[\-\*\+]\s/.test(lines[i])) {
        const task = lines[i].match(/^[\-\*\+]\s+\[([ xX])\]\s+(.*)/);
        if (task) {
          const done = task[1].toLowerCase() === 'x';
          html += `<li><input type="checkbox" disabled${done ? ' checked' : ''}> ${inline(task[2], mdDir)}</li>\n`;
        } else {
          html += `<li>${inline(lines[i].replace(/^[\-\*\+]\s+/, ''), mdDir)}</li>\n`;
        }
        i++;
      }
      html += '</ul>\n';
      continue;
    }

    /* ordered list */
    if (/^\d+\.\s/.test(line)) {
      const start = (line.match(/^(\d+)\./) || [])[1];
      html += `<ol${start !== '1' ? ` start="${start}"` : ''}>\n`;
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        html += `<li>${inline(lines[i].replace(/^\d+\.\s+/, ''), mdDir)}</li>\n`;
        i++;
      }
      html += '</ol>\n';
      continue;
    }

    /* table */
    if (line.includes('|') && /^[\|\s\-:]+$/.test(lines[i+1] || '')) {
      const heads = line.split('|').slice(1, -1);
      html += '<table><thead><tr>';
      heads.forEach(h => { html += `<th>${inline(h.trim(), mdDir)}</th>`; });
      html += '</tr></thead><tbody>\n';
      i += 2;
      while (i < lines.length && lines[i].includes('|')) {
        const cells = lines[i].split('|').slice(1, -1);
        html += '<tr>';
        cells.forEach(c => { html += `<td>${inline(c.trim(), mdDir)}</td>`; });
        html += '</tr>\n';
        i++;
      }
      html += '</tbody></table>\n';
      continue;
    }

    /* blank */
    if (line.trim() === '') { i++; continue; }

    /* paragraph */
    const stopRe = /^(#{1,6}\s|[\-\*\+]\s|\d+\.\s|```|>|-{3,}|\*{3,}|_{3,}|\|)/;
    let para = '';
    while (i < lines.length && lines[i].trim() !== '' && !stopRe.test(lines[i])) {
      para += (para ? ' ' : '') + lines[i];
      i++;
    }
    if (para) html += `<p>${inline(para, mdDir)}</p>\n`;
  }

  return html;
}

/* ──────────────────────────────────────────── HTML template ── */

/**
 * Compute relative path from generated HTML file to repo root.
 * E.g. writeups/HTB/Easy/azer2.html  →  ../../..
 */
function rootRel(htmlPath) {
  const rel = path.relative(path.dirname(htmlPath), ROOT);
  return rel.split(path.sep).join('/');
}

function buildHTML(meta, bodyHTML, htmlPath) {
  const base   = rootRel(htmlPath);
  const title  = esc(meta.title);
  const date   = meta.date;
  const tags   = meta.tags;
  const platform   = meta.platform;
  const difficulty = meta.difficulty;

  const tagsHTML = tags.length
    ? `<div class="post-tags">${tags.map(t => `<span class="topic">${esc(t)}</span>`).join('')}</div>`
    : '';

  const infoHTML = (date || platform || difficulty)
    ? `<div class="post-info">
        ${date        ? `<time>${esc(date)}</time>` : ''}
        ${platform    ? `<span class="badge">${esc(platform)}</span>` : ''}
        ${difficulty  ? `<span class="badge diff-${difficulty.toLowerCase()}">${esc(difficulty)}</span>` : ''}
       </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @font-face {
      font-family: hack;
      src: url('${base}/resources/fonts/hack/Hack-Regular.ttf');
    }
    :root {
      --background: #080808;
      --text:       #00ff41;
      --text2:      #00cc33;
      --border:     rgba(0,255,65,0.12);
      --glow:       rgba(0,255,65,0.35);
      --subheader:  #0d1f0d;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { background: var(--background); }
    body {
      font-family: hack, monospace;
      background: var(--background);
      color: var(--text2);
      padding: 18px 22px 30px;
      font-size: .88rem;
      line-height: 1.7;
    }
    a { color: var(--text); text-decoration: none; }
    a:hover { text-shadow: 0 0 6px var(--glow); }

    /* ── post header ── */
    .post-header { margin-bottom: 1.2em; padding-bottom: .8em; border-bottom: 1px solid var(--border); }
    .post-title  { font-size: 1.35rem; color: var(--text); text-shadow: 0 0 10px var(--glow); margin-bottom: .35em; }
    .post-info   { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: .72rem; opacity: .55; margin-bottom: .4em; }
    .post-info time::before { content: '// '; }
    .badge { border: 1px solid var(--border); padding: 1px 7px; font-size: .68rem; opacity: .8; }
    .diff-easy   { border-color: rgba(0,255,65,.3); color: var(--text); }
    .diff-medium { border-color: rgba(255,165,0,.3); color: #ffa500; }
    .diff-hard   { border-color: rgba(255,68,68,.3); color: #ff4444; }
    .diff-insane { border-color: rgba(180,0,255,.3); color: #b400ff; }
    .post-tags   { display: flex; flex-wrap: wrap; gap: 5px; }
    .topic       { border: 1px solid var(--border); padding: 1px 8px; font-size: .68rem; opacity: .75; }

    /* ── body content ── */
    h1,h2,h3,h4,h5,h6 { color: var(--text); text-shadow: 0 0 8px var(--glow); margin: 1.3em 0 .4em; }
    h1 { font-size: 1.2rem; border-bottom: 1px solid var(--border); padding-bottom: .3em; }
    h2 { font-size: 1.05rem; }
    h3 { font-size: .95rem; }
    h4,h5,h6 { font-size: .88rem; opacity: .8; }
    p  { margin: .5em 0; }
    strong { color: var(--text); }
    em     { opacity: .85; }
    del    { opacity: .4; }
    mark   { background: rgba(0,255,65,.15); color: var(--text); padding: 0 2px; }
    sup    { font-size: .7em; }
    hr     { border: none; border-top: 1px solid var(--border); margin: 1.3em 0; }
    code {
      font-family: hack, monospace;
      background: rgba(0,255,65,.06);
      border: 1px solid var(--border);
      padding: 1px 5px;
      font-size: .82em;
    }
    pre {
      background: rgba(0,0,0,.55);
      border: 1px solid var(--border);
      padding: 13px 15px;
      overflow-x: auto;
      margin: .8em 0;
      font-size: .83rem;
      line-height: 1.5;
    }
    pre code { background: none; border: none; padding: 0; }
    blockquote { border-left: 2px solid var(--border); margin: .8em 0; padding: .2em 14px; opacity: .75; }
    ul,ol { margin: .5em 0; padding-left: 1.6em; }
    li    { margin: .2em 0; }
    input[type="checkbox"] { margin-right: 6px; accent-color: var(--text); }
    table { border-collapse: collapse; width: 100%; margin: .8em 0; font-size: .84rem; }
    th,td { border: 1px solid var(--border); padding: 5px 10px; }
    th    { background: var(--subheader); color: var(--text); }
    img   { max-width: 100%; height: auto; display: block; margin: .8em 0; border: 1px solid var(--border); }
    .img-missing { opacity: .4; font-size: .78rem; font-style: italic; }
    .wikilink    { opacity: .6; text-decoration: underline dotted; cursor: default; }
    .callout { border: 1px solid var(--border); margin: .8em 0; overflow: hidden; }
    .callout-title { padding: 5px 12px; background: var(--subheader); font-size: .76rem; text-transform: uppercase; letter-spacing: .08em; color: var(--text); }
    .callout-body  { padding: 10px 14px; }
    .callout[data-type="warning"] .callout-title,
    .callout[data-type="caution"] .callout-title  { color: #ffcc00; }
    .callout[data-type="danger"]  .callout-title,
    .callout[data-type="error"]   .callout-title  { color: #ff4444; }
    .callout[data-type="info"]    .callout-title,
    .callout[data-type="note"]    .callout-title  { color: #44aaff; }
    .callout[data-type="tip"]     .callout-title,
    .callout[data-type="success"] .callout-title  { color: var(--text); }
  </style>
</head>
<body>
  <div class="post-header">
    <h1 class="post-title">${title}</h1>
    ${infoHTML}
    ${tagsHTML}
  </div>
  <div class="post-body">
${bodyHTML}  </div>
</body>
</html>`;
}

/* ─────────────────────────────────── data.json route builder ── */

/**
 * From a list of relative HTML paths (relative to WRITEUPS_DIR),
 * build the nested route array for data.json.
 *
 * E.g. ["HTB/Easy/azer2.html", "HTB/Easy/friendly-2.html"]
 * →    ["writeups", ["HTB", ["Easy", "azer2.html", "friendly-2.html"]]]
 */
function buildRouteTree(relPaths) {
  const root = ['writeups'];

  for (const rp of relPaths) {
    const parts = rp.split('/');        // ["HTB", "Easy", "azer2.html"]
    let node = root;

    for (let depth = 0; depth < parts.length - 1; depth++) {
      const folderName = parts[depth];
      let child = node.find(n => Array.isArray(n) && n[0] === folderName);
      if (!child) {
        child = [folderName];
        node.push(child);
      }
      node = child;
    }
    node.push(parts[parts.length - 1]);   // filename
  }

  return root;
}

/* ───────────────────────────────────────────────────── main ── */

const mdFiles = findMd(WRITEUPS_DIR);
if (mdFiles.length === 0) {
  console.log('No .md files found in', WRITEUPS_DIR);
  process.exit(0);
}

const generatedRel = [];   // relative to WRITEUPS_DIR, forward slashes

for (const mdPath of mdFiles) {
  const text    = fs.readFileSync(mdPath, 'utf8');
  const mdDir   = path.dirname(mdPath);
  const meta    = parseMeta(text, mdPath);
  const bodyHTML = parse(meta.body, mdDir);
  const html    = buildHTML(meta, bodyHTML, mdPath);  // htmlPath same dir for rootRel

  // Output filename: slugified md name + .html, same directory
  const htmlName = slugify(path.basename(mdPath, '.md')) + '.html';
  const htmlPath = path.join(mdDir, htmlName);

  fs.writeFileSync(htmlPath, html, 'utf8');

  const rel = path.relative(WRITEUPS_DIR, htmlPath).split(path.sep).join('/');
  generatedRel.push(rel);
  console.log('✓', rel);
}

/* ── Update data.json ── */
const data = JSON.parse(fs.readFileSync(DATA_JSON, 'utf8'));

// Remove any existing writeups entry
data.route = data.route.filter(entry => {
  if (Array.isArray(entry) && entry[0] === 'writeups') return false;
  return true;
});

// Build and insert new writeups route (before contact.md)
const writeupRoute = buildRouteTree(generatedRel);
const contactIdx   = data.route.findIndex(e => e === 'contact.md' || (Array.isArray(e) && e[0] === 'contact'));
if (contactIdx !== -1) {
  data.route.splice(contactIdx, 0, writeupRoute);
} else {
  data.route.push(writeupRoute);
}

fs.writeFileSync(DATA_JSON, JSON.stringify(data, null, 4), 'utf8');
console.log('\n✓ data.json updated');
console.log('  route entry:', JSON.stringify(writeupRoute));
console.log(`\n${generatedRel.length} file(s) generated.`);
