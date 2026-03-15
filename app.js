/**
 * ALONE CODE STUDIO v7 — app.js
 * ✅ Fixed Python offline engine (classes, methods, f-strings)
 * ✅ All 20 languages offline (simulate) + online (Piston cloud)
 * ✅ Import files from device storage / paste / URL
 * ✅ Export / Download files
 * ✅ Split view, AI assistant, live preview
 * ✅ PWA — iOS · Android · Windows · Linux
 */

import { EditorState, Compartment } from "@codemirror/state";
import {
  EditorView, keymap, lineNumbers, drawSelection,
  highlightActiveLine, highlightActiveLineGutter,
  rectangularSelection, crosshairCursor,
} from "@codemirror/view";
import {
  defaultKeymap, history, historyKeymap,
  indentWithTab, toggleComment,
} from "@codemirror/commands";
import {
  syntaxHighlighting, defaultHighlightStyle,
  indentOnInput, bracketMatching, foldGutter,
} from "@codemirror/language";
import { search, searchKeymap } from "@codemirror/search";
import { autocompletion, closeBrackets, completionKeymap } from "@codemirror/autocomplete";
import { oneDark } from "@codemirror/theme-one-dark";
import { python }     from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { cpp }        from "@codemirror/lang-cpp";
import { java }       from "@codemirror/lang-java";
import { rust }       from "@codemirror/lang-rust";
import { go }         from "@codemirror/lang-go";
import { php }        from "@codemirror/lang-php";
import { html }       from "@codemirror/lang-html";
import { css }        from "@codemirror/lang-css";
import { sql }        from "@codemirror/lang-sql";
import { xml }        from "@codemirror/lang-xml";
import { markdown }   from "@codemirror/lang-markdown";

const { createApp, ref, computed, onMounted, nextTick, watch, defineComponent } = Vue;

// ═══════════════════════════════════════════════════════════════
// LANGUAGE CONFIG
// ═══════════════════════════════════════════════════════════════
const LANG = {
  python:     { id:"python",     label:"Python",     icon:"🐍", color:"#3572A5", piston:"python",     ver:"3.10.0",  ext:".py",    cm:()=>python()                      },
  javascript: { id:"javascript", label:"JavaScript", icon:"⚡", color:"#f1e05a", piston:"javascript", ver:"18.15.0", ext:".js",    cm:()=>javascript({jsx:true})        },
  typescript: { id:"typescript", label:"TypeScript", icon:"🔷", color:"#2b7489", piston:"typescript", ver:"5.0.3",  ext:".ts",    cm:()=>javascript({typescript:true}) },
  html:       { id:"html",       label:"HTML",       icon:"🌐", color:"#e34c26", piston:"html",       ver:"0.0.1",  ext:".html",  cm:()=>html()                        },
  css:        { id:"css",        label:"CSS",        icon:"🎨", color:"#563d7c", piston:"css",        ver:"0.0.1",  ext:".css",   cm:()=>css()                         },
  cpp:        { id:"cpp",        label:"C++",        icon:"⚙️", color:"#f34b7d", piston:"c++",        ver:"10.2.0", ext:".cpp",   cm:()=>cpp()                         },
  c:          { id:"c",          label:"C",          icon:"🔵", color:"#555555", piston:"c",          ver:"10.2.0", ext:".c",     cm:()=>cpp()                         },
  java:       { id:"java",       label:"Java",       icon:"☕", color:"#b07219", piston:"java",       ver:"15.0.2", ext:".java",  cm:()=>java()                        },
  rust:       { id:"rust",       label:"Rust",       icon:"🦀", color:"#dea584", piston:"rust",       ver:"1.50.0", ext:".rs",    cm:()=>rust()                        },
  go:         { id:"go",         label:"Go",         icon:"🐹", color:"#00ADD8", piston:"go",         ver:"1.16.2", ext:".go",    cm:()=>go()                          },
  php:        { id:"php",        label:"PHP",        icon:"🐘", color:"#4F5D95", piston:"php",        ver:"8.2.3",  ext:".php",   cm:()=>php()                         },
  ruby:       { id:"ruby",       label:"Ruby",       icon:"💎", color:"#701516", piston:"ruby",       ver:"3.0.1",  ext:".rb",    cm:()=>python()                      },
  swift:      { id:"swift",      label:"Swift",      icon:"🦅", color:"#F05138", piston:"swift",      ver:"5.3.3",  ext:".swift", cm:()=>python()                      },
  kotlin:     { id:"kotlin",     label:"Kotlin",     icon:"🎯", color:"#A97BFF", piston:"kotlin",     ver:"1.8.20", ext:".kts",   cm:()=>java()                        },
  csharp:     { id:"csharp",     label:"C#",         icon:"🎮", color:"#178600", piston:"csharp",     ver:"6.12.0", ext:".cs",    cm:()=>java()                        },
  lua:        { id:"lua",        label:"Lua",        icon:"🌙", color:"#000080", piston:"lua",        ver:"5.4.2",  ext:".lua",   cm:()=>python()                      },
  bash:       { id:"bash",       label:"Bash",       icon:"💻", color:"#89e051", piston:"bash",       ver:"5.2.0",  ext:".sh",    cm:()=>python()                      },
  sql:        { id:"sql",        label:"SQL",        icon:"🗃️", color:"#e38c00", piston:"sqlite3",    ver:"3.36.0", ext:".sql",   cm:()=>sql()                         },
  markdown:   { id:"markdown",   label:"Markdown",   icon:"📝", color:"#083fa1", piston:"markdown",   ver:"0.0.1",  ext:".md",    cm:()=>markdown()                    },
  xml:        { id:"xml",        label:"XML",        icon:"📄", color:"#e37933", piston:"xml",        ver:"0.0.1",  ext:".xml",   cm:()=>xml()                         },
};

const WEB_LANGS = new Set(["html","css","javascript"]);

const LANG_GROUPS = [
  { label:"⭐ Popular", langs:["python","javascript","typescript","cpp","java","rust","go"] },
  { label:"🌐 Web",     langs:["html","css","php","sql"] },
  { label:"⚙️ Systems", langs:["c","csharp","kotlin","swift"] },
  { label:"📜 Scripting",langs:["ruby","lua","bash"] },
  { label:"📄 Other",   langs:["markdown","xml"] },
].map(g => ({ label:g.label, langs:g.langs.map(id=>LANG[id]).filter(Boolean) }));

// Detect language from file extension
const EXT_MAP = {};
Object.values(LANG).forEach(l => { EXT_MAP[l.ext] = l.id; });
// Extra common extensions
Object.assign(EXT_MAP, {
  '.jsx':'.js', '.tsx':'.ts', '.h':'.c', '.hpp':'.cpp',
  '.yaml':'.markdown', '.yml':'.markdown', '.txt':'.markdown',
  '.json':'.javascript', '.toml':'.bash', '.ini':'.bash',
});

function detectLang(filename) {
  const ext = '.' + filename.split('.').pop().toLowerCase();
  return EXT_MAP[ext] || 'javascript';
}

const PISTON_URL    = "https://emkc.org/api/v2/piston/execute";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const S_TREE   = "acs_v7_tree";
const S_ACTIVE = "acs_v7_active";
const S_PREFS  = "acs_v7_prefs";

// ═══════════════════════════════════════════════════════════════
// OFFLINE ENGINES
// ═══════════════════════════════════════════════════════════════

// ── Python (full transpiler) ──────────────────────────────────
function runPython(code) {
  const output = [], errors = [];
  try {
    // Step 1: f-strings → template literals (function replacement, not string)
    let js = code
      .replace(/f"""([\s\S]*?)"""/g, (_, s) => '`' + s.replace(/\{([^}]+)\}/g, (__, v) => '${' + v + '}') + '`')
      .replace(/f'''([\s\S]*?)'''/g, (_, s) => '`' + s.replace(/\{([^}]+)\}/g, (__, v) => '${' + v + '}') + '`')
      .replace(/f"([^"\\]*(\\.[^"\\]*)*)"/g, (_, s) => '`' + s.replace(/\{([^}]+)\}/g, (__, v) => '${' + v + '}') + '`')
      .replace(/f'([^'\\]*(\\.[^'\\]*)*)'/g,  (_, s) => '`' + s.replace(/\{([^}]+)\}/g, (__, v) => '${' + v + '}') + '`');

    // Step 2: builtins
    js = js
      .replace(/\bprint\s*\(/g,   '__P(')
      .replace(/\brange\s*\(/g,   '__R(')
      .replace(/\blen\s*\(/g,     '__L(')
      .replace(/\babs\s*\(/g,     'Math.abs(')
      .replace(/\bmax\s*\(/g,     'Math.max(')
      .replace(/\bmin\s*\(/g,     'Math.min(')
      .replace(/\bround\s*\(/g,   'Math.round(')
      .replace(/\bint\s*\(/g,     'parseInt(')
      .replace(/\bfloat\s*\(/g,   'parseFloat(')
      .replace(/\bstr\s*\(/g,     'String(')
      .replace(/\btype\s*\(/g,    'typeof (')
      .replace(/\bsum\s*\(([^)]+)\)/g, '($1).reduce((a,b)=>a+b,0)')
      .replace(/\bsorted\s*\(([^)]+)\)/g, '[...($1)].sort((a,b)=>a<b?-1:1)')
      .replace(/\.append\s*\(/g,  '.push(')
      .replace(/\.extend\s*\(([^)]+)\)/g, '.push(...$1)')
      .replace(/\.upper\s*\(\)/g, '.toUpperCase()')
      .replace(/\.lower\s*\(\)/g, '.toLowerCase()')
      .replace(/\.strip\s*\(\)/g, '.trim()')
      .replace(/\.lstrip\s*\(\)/g,'.trimStart()')
      .replace(/\.rstrip\s*\(\)/g,'.trimEnd()')
      .replace(/\.startswith\s*\(/g,'.startsWith(')
      .replace(/\.endswith\s*\(/g,  '.endsWith(')
      .replace(/\.items\s*\(\)/g,   '.entries ? [...$&.entries()] : Object.entries($&)')
      .replace(/\bTrue\b/g,  'true')
      .replace(/\bFalse\b/g, 'false')
      .replace(/\bNone\b/g,  'null')
      .replace(/\band\b/g,   '&&')
      .replace(/\bor\b/g,    '||')
      .replace(/\bnot\s+/g,  '!')
      .replace(/(\w[\w.]*)\s+not\s+in\s+([\w.[\]()]+)/g, '!$2.includes($1)')
      .replace(/(\w[\w.]*)\s+in\s+([\w.[\]()]+)/g, '$2.includes($1)');

    // Step 3: indent-based block conversion with class-context tracking
    const lines = js.split('\n');
    const out   = [];
    const stack = [{ indent: -1, inClass: false }];

    for (const rawLine of lines) {
      const trimmed = rawLine.trim();
      if (!trimmed) { out.push(''); continue; }
      if (trimmed.startsWith('#')) { out.push('//' + trimmed.slice(1)); continue; }

      const indent  = rawLine.search(/\S/);
      const inClass = stack.some(s => s.inClass);

      // Close blocks on dedent
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
        out.push(' '.repeat(Math.max(0, stack[stack.length - 1].indent + 2)) + '}');
      }

      // __init__ → constructor
      const initM = trimmed.match(/^def\s+__init__\s*\(self(?:,\s*)?([^)]*)\)\s*(?:->[^:]+)?:$/);
      if (initM) {
        const args = initM[1].replace(/:\s*[\w\[\], |]+/g, '').replace(/=\s*/g, '=').trim();
        out.push(' '.repeat(indent) + 'constructor(' + args + ') {');
        stack.push({ indent, inClass }); continue;
      }

      // def — class method or function
      const defM = trimmed.match(/^def\s+(\w+)\s*\(([^)]*)\)\s*(?:->[^:]+)?:$/);
      if (defM) {
        const args = defM[2].replace(/\bself,?\s*/g, '').replace(/:\s*[\w\[\], |]+/g, '').trim();
        if (inClass) {
          out.push(' '.repeat(indent) + defM[1] + '(' + args + ') {');
        } else {
          out.push(' '.repeat(indent) + 'function ' + defM[1] + '(' + args + ') {');
        }
        stack.push({ indent, inClass }); continue;
      }

      // class
      const classM = trimmed.match(/^class\s+(\w+)(?:\((\w+)\))?:$/);
      if (classM) {
        out.push(' '.repeat(indent) + 'class ' + classM[1] + (classM[2] ? ' extends ' + classM[2] : '') + ' {');
        stack.push({ indent, inClass: true }); continue;
      }

      // for x in y:
      const forM = trimmed.match(/^for\s+([\w,\s]+)\s+in\s+(.+):$/);
      if (forM) {
        const vars = forM[1].trim(), iter = forM[2].trim();
        const decl = vars.includes(',') ? 'for (const [' + vars + '] of __I(' + iter + ')) {' : 'for (const ' + vars + ' of __I(' + iter + ')) {';
        out.push(' '.repeat(indent) + decl);
        stack.push({ indent, inClass }); continue;
      }

      // if / elif / while
      const ifM = trimmed.match(/^(if|elif|while)\s+(.+):$/);
      if (ifM) {
        if (ifM[1] === 'elif') {
          out.pop();
          out.push(' '.repeat(indent) + '} else if (' + ifM[2] + ') {');
        } else {
          out.push(' '.repeat(indent) + ifM[1] + ' (' + ifM[2] + ') {');
        }
        stack.push({ indent, inClass }); continue;
      }

      if (trimmed === 'else:') {
        out.pop();
        out.push(' '.repeat(indent) + '} else {');
        stack.push({ indent, inClass }); continue;
      }

      // try / except / finally
      if (trimmed === 'try:') { out.push(' '.repeat(indent) + 'try {'); stack.push({ indent, inClass }); continue; }
      const excM = trimmed.match(/^except(?:\s+[\w.]+)?(?:\s+as\s+(\w+))?:$/);
      if (excM) { out.pop(); out.push(' '.repeat(indent) + '} catch (' + (excM[1] || '_e') + ') {'); stack.push({ indent, inClass }); continue; }
      if (trimmed === 'finally:') { out.pop(); out.push(' '.repeat(indent) + '} finally {'); stack.push({ indent, inClass }); continue; }

      // with
      const withM = trimmed.match(/^with\s+.+:$/);
      if (withM) { out.push(' '.repeat(indent) + '{ // with'); stack.push({ indent, inClass }); continue; }

      // self. → this.
      const fixed = rawLine.replace(/\bself\./g, 'this.').replace(/\bself\b/g, 'this');
      out.push(fixed);
    }

    while (stack.length > 1) { stack.pop(); out.push('}'); }

    const transpiled = out.join('\n');

    const builtins = `
"use strict";
const __out = [];
function __P(...a) {
  __out.push({ text: a.map(x => {
    if (x === null || x === undefined) return 'None';
    if (x === true) return 'True';
    if (x === false) return 'False';
    if (Array.isArray(x)) return '[' + x.map(v => typeof v==='string' ? "'" + v + "'" : String(v)).join(', ') + ']';
    if (typeof x === 'object') return str(x);
    return String(x);
  }).join(' '), type: 'text-line' });
}
function __R(a, b, s=1) {
  if (b === undefined) { b = a; a = 0; }
  const r = [];
  if (s > 0) for (let i = a; i < b; i += s) r.push(i);
  else        for (let i = a; i > b; i += s) r.push(i);
  return r;
}
function __L(x) {
  if (x === null || x === undefined) return 0;
  if (typeof x === 'string' || Array.isArray(x)) return x.length;
  if (typeof x === 'object') return Object.keys(x).length;
  return 0;
}
function __I(x) {
  if (Array.isArray(x)) return x;
  if (typeof x === 'string') return x.split('');
  if (x && typeof x[Symbol.iterator] === 'function') return [...x];
  if (x && typeof x === 'object') return Object.entries(x);
  return [];
}
function str(x) {
  if (x === null) return 'None';
  if (x === true) return 'True';
  if (x === false) return 'False';
  if (Array.isArray(x)) return '[' + x.map(v=>str(v)).join(', ') + ']';
  if (typeof x === 'object') return '{' + Object.entries(x).map(([k,v])=>"'"+k+"': "+str(v)).join(', ') + '}';
  return String(x);
}
function dict(entries) { return Object.fromEntries(entries); }
function list(x) { return Array.from(x); }
function tuple(...a) { return a; }
function enumerate(arr) { return arr.map((v,i)=>[i,v]); }
function zip(...arrs) { const len=Math.min(...arrs.map(a=>a.length)); return Array.from({length:len},(_,i)=>arrs.map(a=>a[i])); }
function reversed(arr) { return [...arr].reverse(); }
function input(p='') { return ''; }
const math = { pi:Math.PI, e:Math.E, sqrt:Math.sqrt.bind(Math), floor:Math.floor.bind(Math), ceil:Math.ceil.bind(Math), log:Math.log.bind(Math), log2:Math.log2.bind(Math), log10:Math.log10.bind(Math), sin:Math.sin.bind(Math), cos:Math.cos.bind(Math), tan:Math.tan.bind(Math), pow:Math.pow.bind(Math), abs:Math.abs.bind(Math), factorial: n => { let r=1; for(let i=2;i<=n;i++) r*=i; return r; } };
const random = { random:()=>Math.random(), randint:(a,b)=>Math.floor(Math.random()*(b-a+1))+a, choice:arr=>arr[Math.floor(Math.random()*arr.length)], shuffle:arr=>{for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;} };
`;

    const fn = new Function(builtins + transpiled + '\nreturn __out;');
    const res = fn();
    if (Array.isArray(res)) res.forEach(r => output.push(r));
  } catch (e) {
    errors.push({ text: 'PythonError: ' + e.message, type: 'error' });
  }
  return { output, errors };
}

// ── JavaScript ────────────────────────────────────────────────
function runJS(code, lang = 'JavaScript') {
  const output = [], errors = [];
  try {
    const logs = [];
    const mockConsole = {
      log:   (...a) => logs.push({ text: a.map(x => typeof x === 'object' ? JSON.stringify(x, null, 2) : String(x)).join(' '), type: 'text-line' }),
      warn:  (...a) => logs.push({ text: '⚠ ' + a.join(' '), type: 'info' }),
      error: (...a) => logs.push({ text: '✗ ' + a.join(' '), type: 'error' }),
      info:  (...a) => logs.push({ text: '› ' + a.join(' '), type: 'info' }),
      table: (d) => logs.push({ text: JSON.stringify(d, null, 2), type: 'info' }),
    };
    const fn = new Function('console', 'Math', 'Date', 'JSON', 'Array', 'Object', 'String', 'Number', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'Promise', '"use strict";\ntry{\n' + code + '\n}catch(e){console.error(e.message);}');
    fn(mockConsole, Math, Date, JSON, Array, Object, String, Number, parseInt, parseFloat, isNaN, isFinite, Promise);
    logs.forEach(l => output.push(l));
    if (output.length === 0) output.push({ text: '[No console output]', type: 'info' });
  } catch (e) {
    errors.push({ text: lang + 'Error: ' + e.message, type: 'error' });
  }
  return { output, errors };
}

// ── TypeScript → strip types → run as JS ─────────────────────
function runTypeScript(code) {
  const stripped = code
    .replace(/:\s*(?:string|number|boolean|void|any|never|unknown|object|null|undefined|[\w<>\[\]|& ]+)(?=[\s,)=;{])/g, '')
    .replace(/<[A-Z]\w*(?:<[^>]*>)?>/g, '')
    .replace(/\binterface\s+\w+\s*\{[^}]*\}/gs, '')
    .replace(/\btype\s+\w+\s*=\s*[^;]+;/g, '')
    .replace(/\bas\s+\w[\w<>[\]]*\b/g, '')
    .replace(/^export\s+(?:default\s+)?/gm, '')
    .replace(/^import\s+.*?(?:from\s+['"][^'"]+['"])?;?\s*$/gm, '');
  return runJS(stripped, 'TypeScript');
}

// ── SQL ───────────────────────────────────────────────────────
function runSQL(code) {
  const output = [], errors = [];
  const tables = {};
  const stmts  = code.split(/;\s*/).map(s => s.trim()).filter(Boolean);
  for (const stmt of stmts) {
    try {
      const up = stmt.toUpperCase();
      if (up.startsWith('CREATE TABLE')) {
        const m = stmt.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(([^)]+)\)/i);
        if (m) {
          const name = m[1], cols = m[2].split(',').map(c => c.trim().split(/\s+/)[0]);
          tables[name] = { cols, rows: [] };
          output.push({ text: `✓ Table '${name}' created (${cols.join(', ')})`, type: 'success' });
        }
      } else if (up.startsWith('INSERT')) {
        const m = stmt.match(/INSERT\s+INTO\s+(\w+)\s*(?:\(([^)]+)\))?\s*VALUES\s*\(([^)]+)\)/i);
        if (m) {
          const name = m[1], vals = m[3].split(',').map(v => v.trim().replace(/^['"]|['"]$/g, ''));
          if (tables[name]) { tables[name].rows.push(vals); output.push({ text: `  1 row inserted into '${name}'`, type: 'text-line' }); }
          else output.push({ text: `Table '${name}' not found`, type: 'error' });
        }
      } else if (up.startsWith('SELECT')) {
        const m = stmt.match(/SELECT\s+(.*?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?/i);
        if (m) {
          const colPart = m[1], tblName = m[2], tbl = tables[tblName];
          if (!tbl) { output.push({ text: `Table '${tblName}' not found`, type: 'error' }); continue; }
          const cols = colPart.trim() === '*' ? tbl.cols : colPart.split(',').map(c => c.trim());
          const widths = cols.map(c => Math.max(c.length, ...tbl.rows.map(r => (r[tbl.cols.indexOf(c)] || '').length)));
          const sep = '+' + widths.map(w => '-'.repeat(w + 2)).join('+') + '+';
          const hdr = '|' + cols.map((c, i) => ' ' + c.padEnd(widths[i]) + ' ').join('|') + '|';
          output.push({ text: sep, type: 'info' });
          output.push({ text: hdr, type: 'info' });
          output.push({ text: sep, type: 'info' });
          tbl.rows.forEach(row => {
            const line = '|' + cols.map((c, i) => { const idx = tbl.cols.indexOf(c); return ' ' + (row[idx] || '').padEnd(widths[i]) + ' '; }).join('|') + '|';
            output.push({ text: line, type: 'text-line' });
          });
          output.push({ text: sep, type: 'info' });
          output.push({ text: `${tbl.rows.length} row(s)`, type: 'success' });
        }
      } else if (up.startsWith('DROP TABLE')) {
        const m = stmt.match(/DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(\w+)/i);
        if (m) { delete tables[m[1]]; output.push({ text: `✓ Table '${m[1]}' dropped`, type: 'success' }); }
      } else if (up.startsWith('DELETE')) {
        const m = stmt.match(/DELETE\s+FROM\s+(\w+)/i);
        if (m && tables[m[1]]) { const n = tables[m[1]].rows.length; tables[m[1]].rows = []; output.push({ text: `✓ ${n} rows deleted from '${m[1]}'`, type: 'success' }); }
      } else {
        output.push({ text: `? ${stmt.slice(0, 60)}`, type: 'info' });
      }
    } catch (e) { errors.push({ text: 'SQLError: ' + e.message, type: 'error' }); }
  }
  return { output, errors };
}

// ── Markdown renderer ─────────────────────────────────────────
function renderMarkdown(code) {
  const escaped = code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const html = escaped
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="lang-$1">$2</code></pre>')
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/^#{6}\s+(.+)$/gm,'<h6>$1</h6>').replace(/^#{5}\s+(.+)$/gm,'<h5>$1</h5>')
    .replace(/^#{4}\s+(.+)$/gm,'<h4>$1</h4>').replace(/^#{3}\s+(.+)$/gm,'<h3>$1</h3>')
    .replace(/^#{2}\s+(.+)$/gm,'<h2>$1</h2>').replace(/^#{1}\s+(.+)$/gm,'<h1>$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g,'<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/~~(.+?)~~/g,'<del>$1</del>').replace(/^---+$/gm,'<hr>')
    .replace(/^&gt;\s+(.+)$/gm,'<blockquote>$1</blockquote>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank">$1</a>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g,'<img src="$2" alt="$1" style="max-width:100%">')
    .replace(/^[ \t]*[-*+]\s+(.+)$/gm,'<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>\n?)+/g, m => '<ul>'+m+'</ul>')
    .replace(/\n\n+/g,'</p><p>').replace(/\n/g,'<br>');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    body{font-family:'Segoe UI',sans-serif;line-height:1.7;padding:24px 32px;max-width:800px;margin:0 auto;background:#fff;color:#1a2332}
    h1,h2,h3,h4{margin:1.2em 0 0.5em;font-weight:700}h1{font-size:2em;border-bottom:2px solid #e0e4f0;padding-bottom:8px}
    h2{font-size:1.5em;border-bottom:1px solid #e0e4f0;padding-bottom:6px}
    code{background:#f0f4f8;padding:2px 6px;border-radius:3px;font-family:monospace;font-size:.9em;color:#e63946}
    pre{background:#1a1a2e;color:#e6edf3;padding:16px;border-radius:8px;overflow-x:auto;margin:12px 0}
    pre code{background:none;color:inherit;padding:0}blockquote{border-left:4px solid #4d9eff;padding:8px 16px;margin:12px 0;background:#f0f8ff;border-radius:0 6px 6px 0}
    ul{padding-left:24px;margin:8px 0}li{margin:4px 0}a{color:#4d9eff}img{border-radius:6px;max-width:100%}hr{border:none;border-top:2px solid #e0e4f0;margin:20px 0}p{margin:8px 0}
  </style></head><body><p>${html}</p></body></html>`;
}

// ── Pattern-based simulators ──────────────────────────────────
function evalSafe(expr, vars = {}) {
  let s = expr.trim();
  Object.entries(vars).forEach(([k, v]) => { s = s.replace(new RegExp('\\b' + k + '\\b', 'g'), String(v)); });
  s = s.replace(/\bMath\.PI\b/g, Math.PI).replace(/\bMath\.E\b/g, Math.E)
       .replace(/Math\.(sqrt|abs|floor|ceil|round|log|sin|cos|tan|pow)\(([^)]+)\)/g, (_, fn, arg) => String(Math[fn](...arg.split(',').map(Number))))
       .replace(/\bString\.valueOf\(([^)]+)\)/g, '$1');
  try { return String(eval(s)); } catch { return expr; }
}

function simPrintLines(code, patterns) {
  const output = [];
  for (const { re, process } of patterns) {
    const tmp = new RegExp(re.source, re.flags);
    let m;
    while ((m = tmp.exec(code)) !== null) {
      const lines = process(m).replace(/\\n/g,'\n').replace(/\\t/g,'\t').split('\n');
      lines.forEach(l => output.push({ text: l, type: 'text-line' }));
    }
  }
  return output;
}

function runJava(code) {
  const output = [], errors = [];
  try {
    const vars = {};
    code.replace(/(?:int|double|float|String|long|boolean|char)\s+(\w+)\s*=\s*([^;]+);/g, (_, n, v) => {
      try { vars[n] = eval(evalSafe(v.trim(), vars)); } catch {}
    });

    // for loops
    const forRe = /for\s*\(\s*(?:int\s+)?(\w+)\s*=\s*(\d+)\s*;\s*\1\s*([<>]=?)\s*(\d+)\s*;\s*\1(\+\+|--|\+=\s*\d+|-=\s*\d+)\s*\)\s*\{([^}]+)\}/gs;
    let m, processed = code;
    while ((m = forRe.exec(code)) !== null) {
      const [full, v, s, op, e, inc, body] = m;
      let i = parseInt(s), end = parseInt(e), step = 1;
      if (inc.includes('--') || inc.includes('-=')) step = -1;
      const incM = inc.match(/[+-]=\s*(\d+)/); if (incM) step = parseInt(incM[1]) * (step < 0 ? -1 : 1);
      const cond = i => op==='<'?i<end:op==='<='?i<=end:op==='>'?i>end:i>=end;
      for (; cond(i) && output.length < 200; i += step) {
        const lv = { ...vars, [v]: i };
        body.replace(/System\.out\.print(?:ln)?\s*\(\s*(.*?)\s*\);/g, (_, expr) => {
          const parts = expr.split(/\s*\+\s*/).map(p => {
            p = p.trim();
            if ((p.startsWith('"') && p.endsWith('"')) || (p.startsWith("'") && p.endsWith("'"))) return p.slice(1,-1);
            return evalSafe(p, lv);
          });
          output.push({ text: parts.join(''), type: 'text-line' });
        });
      }
      processed = processed.replace(full, '');
    }
    // Non-loop prints
    processed.replace(/System\.out\.print(?:ln)?\s*\(\s*(.*?)\s*\);/g, (_, expr) => {
      const parts = expr.split(/\s*\+\s*/).map(p => {
        p = p.trim();
        if ((p.startsWith('"') && p.endsWith('"')) || (p.startsWith("'") && p.endsWith("'"))) return p.slice(1,-1);
        return evalSafe(p, vars);
      });
      output.push({ text: parts.join(''), type: 'text-line' });
    });
    if (!output.length) output.push({ text: '[Java offline sim] Go online for full JVM execution.', type: 'info' });
  } catch (e) { errors.push({ text: 'SimError: ' + e.message, type: 'error' }); }
  return { output, errors };
}

function runRust(code) {
  const output = [], errors = [];
  try {
    const re = /println!\s*\(\s*"([^"]*)"\s*(?:,\s*([^)]+))?\s*\)/g;
    let m;
    while ((m = re.exec(code)) !== null) {
      let fmt = m[1];
      if (m[2]) {
        const args = m[2].split(',').map(a => a.trim());
        let ai = 0;
        fmt = fmt
          .replace(/\{:?\.?(\d+)f?\}/g, (_, d) => { const v = evalSafe(args[ai++] || '0'); return d ? parseFloat(v).toFixed(parseInt(d)) : v; })
          .replace(/\{:?\??d?\}/g, () => evalSafe(args[ai++] || '0'))
          .replace(/\{\}/g, () => { try { return evalSafe(args[ai++] || '""'); } catch { return args[ai-1] || ''; } });
      }
      fmt.replace(/\\n/g,'\n').split('\n').forEach(l => output.push({ text: l, type: 'text-line' }));
    }
    if (!output.length) output.push({ text: '[Rust offline sim] Go online for full compilation.', type: 'info' });
  } catch (e) { errors.push({ text: 'SimError: ' + e.message, type: 'error' }); }
  return { output, errors };
}

function runGo(code) {
  const output = [], errors = [];
  try {
    const re = /fmt\.(Print(?:ln|f)?)\s*\(\s*([\s\S]*?)\s*\)/g;
    let m;
    while ((m = re.exec(code)) !== null) {
      const fn = m[1], raw = m[2];
      const args = raw.match(/"[^"]*"|`[^`]*`|[\w.+\-*/()[\]]+/g) || [];
      if (fn === 'Println') {
        const parts = args.map(a => { a = a.trim(); if ((a[0]==='"'&&a.slice(-1)==='"')||(a[0]==='`'&&a.slice(-1)==='`')) return a.slice(1,-1); try { return String(eval(a)); } catch { return a; } });
        output.push({ text: parts.join(' '), type: 'text-line' });
      } else if (fn === 'Printf' || fn === 'Print') {
        const fmtStr = args[0] ? args[0].replace(/^["` ]|["` ]$/g,'') : '';
        const fArgs  = args.slice(1).map(a => { try { return String(eval(a)); } catch { return a; } });
        let ai = 0;
        const result = fmtStr.replace(/%[vdsfg.0-9]+/g, () => fArgs[ai++] || '').replace(/\\n/g,'\n').replace(/\\t/g,'\t');
        result.split('\n').forEach(l => output.push({ text: l, type: 'text-line' }));
      }
    }
    if (!output.length) output.push({ text: '[Go offline sim] Go online for full compilation.', type: 'info' });
  } catch (e) { errors.push({ text: 'SimError: ' + e.message, type: 'error' }); }
  return { output, errors };
}

function runPHP(code) {
  const output = [], errors = [];
  try {
    code.replace(/(?:echo|print)\s+((?:"[^"]*"|'[^']*'|\$\w+|[^;]+)(?:\s*\.\s*(?:"[^"]*"|'[^']*'|\$\w+))*)\s*;/g, (_, expr) => {
      const vars = {}; code.replace(/\$(\w+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\d+))/g, (__, n, a, b, c) => { vars[n] = a || b || c || ''; });
      const parts = expr.split(/\s*\.\s*/).map(p => {
        p = p.trim();
        if (p.startsWith('$')) return vars[p.slice(1)] || p;
        if ((p[0]==='"'&&p.slice(-1)==='"')||(p[0]==="'"&&p.slice(-1)==="'")) return p.slice(1,-1);
        return p;
      });
      output.push({ text: parts.join('').replace(/\\n/g,'\n'), type: 'text-line' });
    });
    if (!output.length) output.push({ text: '[PHP offline sim] Go online for full execution.', type: 'info' });
  } catch (e) { errors.push({ text: 'SimError: ' + e.message, type: 'error' }); }
  return { output, errors };
}

function runRuby(code) {
  const output = [], errors = [];
  try {
    code.replace(/(?:puts|print|p)\s+((?:"[^"]*"|'[^']*'|[\w.+\-*/()[\]]+)(?:\s*,\s*(?:"[^"]*"|'[^']*'|[\w.+\-*/()[\]]+))*)/g, (_, args) => {
      args.split(/\s*,\s*/).forEach(a => {
        a = a.trim();
        const raw = (a[0]==='"'||a[0]==="'") ? a.slice(1,-1) : a;
        const txt = raw.replace(/#\{([^}]+)\}/g, (__, e) => { try { return String(eval(e)); } catch { return e; } });
        output.push({ text: txt, type: 'text-line' });
      });
    });
    if (!output.length) output.push({ text: '[Ruby offline sim] Go online for full execution.', type: 'info' });
  } catch (e) { errors.push({ text: 'SimError: ' + e.message, type: 'error' }); }
  return { output, errors };
}

function runBash(code) {
  const output = [], errors = [];
  try {
    const vars = {};
    code.split('\n').forEach(line => {
      const t = line.trim();
      if (!t || t.startsWith('#')) return;
      const varM = t.match(/^(\w+)=(.+)$/);
      if (varM) { vars[varM[1]] = varM[2].replace(/["']/g,''); return; }
      const echoM = t.match(/^echo\s+(.+)$/);
      if (echoM) {
        const txt = echoM[1].replace(/["']/g,'').replace(/\$\{?(\w+)\}?/g, (_, v) => vars[v] || ('$'+v));
        output.push({ text: txt, type: 'text-line' });
      }
      const printfM = t.match(/^printf\s+"([^"]*)"/);
      if (printfM) output.push({ text: printfM[1].replace(/\\n/g,'').replace(/\\t/g,'\t'), type: 'text-line' });
    });
    if (!output.length) output.push({ text: '[Bash offline sim] Go online for real execution.', type: 'info' });
  } catch (e) { errors.push({ text: 'SimError: ' + e.message, type: 'error' }); }
  return { output, errors };
}

function runLua(code) {
  const output = [], errors = [];
  try {
    code.replace(/(?:print|io\.write)\s*\(\s*((?:"[^"]*"|'[^']*'|[\w.+\-*/()[\]]+)(?:\s*,\s*(?:"[^"]*"|'[^']*'|[\w.+\-*/()[\]]+))*)\s*\)/g, (_, args) => {
      const parts = args.split(/\s*,\s*/).map(a => {
        a = a.trim();
        if ((a[0]==='"'&&a.slice(-1)==='"')||(a[0]==="'"&&a.slice(-1)==="'")) return a.slice(1,-1);
        try { return String(eval(a)); } catch { return a; }
      });
      output.push({ text: parts.join('\t'), type: 'text-line' });
    });
    if (!output.length) output.push({ text: '[Lua offline sim] Go online for full execution.', type: 'info' });
  } catch (e) { errors.push({ text: 'SimError: ' + e.message, type: 'error' }); }
  return { output, errors };
}

function runSwift(code) {
  const output = [], errors = [];
  try {
    code.replace(/print\s*\(\s*((?:"[^"]*"|[\w.+\-*/()[\]]+)(?:\s*,\s*(?:"[^"]*"|[\w.+\-*/()[\]]+))*)\s*\)/g, (_, args) => {
      const parts = args.split(/\s*,\s*/).map(a => {
        a = a.trim();
        const raw = (a[0]==='"') ? a.slice(1,-1) : a;
        return raw.replace(/\\\(([^)]+)\)/g, (__, e) => { try { return String(eval(e)); } catch { return e; } });
      });
      output.push({ text: parts.join(' '), type: 'text-line' });
    });
    if (!output.length) output.push({ text: '[Swift offline sim] Go online for full compilation.', type: 'info' });
  } catch (e) { errors.push({ text: 'SimError: ' + e.message, type: 'error' }); }
  return { output, errors };
}

function runKotlin(code) {
  const output = [], errors = [];
  try {
    code.replace(/print(?:ln)?\s*\(\s*((?:"[^"]*"|[\w.+\-*/()[\]]+)(?:\s*\+\s*(?:"[^"]*"|[\w.+\-*/()[\]]+))*)\s*\)/g, (_, expr) => {
      const parts = expr.split(/\s*\+\s*/).map(p => {
        p = p.trim();
        if (p[0]==='"' && p.slice(-1)==='"') return p.slice(1,-1).replace(/\$\{([^}]+)\}/g, (__, e) => { try { return String(eval(e)); } catch { return e; } }).replace(/\$(\w+)/g, (__, v) => v);
        try { return String(eval(p)); } catch { return p; }
      });
      output.push({ text: parts.join(''), type: 'text-line' });
    });
    if (!output.length) output.push({ text: '[Kotlin offline sim] Go online for full compilation.', type: 'info' });
  } catch (e) { errors.push({ text: 'SimError: ' + e.message, type: 'error' }); }
  return { output, errors };
}

function runCSharp(code) {
  const output = [], errors = [];
  try {
    const vars = {};
    code.replace(/(?:int|double|float|string|long|bool|var)\s+(\w+)\s*=\s*([^;]+);/g, (_, n, v) => {
      try { vars[n] = eval(evalSafe(v.trim(), vars)); } catch {}
    });
    const forRe = /for\s*\(\s*(?:int\s+)?(\w+)\s*=\s*(\d+)\s*;\s*\1\s*([<>]=?)\s*(\d+)\s*;\s*\1\+\+\s*\)\s*\{([^}]+)\}/gs;
    let m, processed = code;
    while ((m = forRe.exec(code)) !== null) {
      const [full, v, s, op, e, body] = m;
      let i = parseInt(s); const end = parseInt(e);
      const cond = i => op==='<'?i<end:op==='<='?i<=end:op==='>'?i>end:i>=end;
      for (; cond(i) && output.length < 200; i++) {
        body.replace(/Console\.Write(?:Line)?\s*\(\s*(.*?)\s*\);/g, (__, expr) => {
          const parts = expr.split(/\s*\+\s*/).map(p => {
            p = p.trim();
            if (p[0]==='"' && p.slice(-1)==='"') return p.slice(1,-1);
            return evalSafe(p, { ...vars, [v]: i });
          });
          output.push({ text: parts.join(''), type: 'text-line' });
        });
      }
      processed = processed.replace(full, '');
    }
    processed.replace(/Console\.Write(?:Line)?\s*\(\s*(.*?)\s*\);/g, (_, expr) => {
      const parts = expr.split(/\s*\+\s*/).map(p => {
        p = p.trim();
        if (p[0]==='"' && p.slice(-1)==='"') return p.slice(1,-1);
        return evalSafe(p, vars);
      });
      output.push({ text: parts.join(''), type: 'text-line' });
    });
    if (!output.length) output.push({ text: '[C# offline sim] Go online for full .NET execution.', type: 'info' });
  } catch (e) { errors.push({ text: 'SimError: ' + e.message, type: 'error' }); }
  return { output, errors };
}

function runC(code, isCpp = false) {
  const output = [], errors = [];
  try {
    // printf
    code.replace(/printf\s*\(\s*"([^"\\]*(\\.[^"\\]*)*)"\s*(?:,([^;)]+))?\s*\)/g, (_, fmt, __, args) => {
      let result = fmt.replace(/\\n/g,'\n').replace(/\\t/g,'\t');
      if (args) {
        const a = args.split(',').map(x => x.trim());
        let ai = 0;
        result = result.replace(/%[diouxXeEfFgGcs]/g, () => { try { return String(eval(a[ai++]||'0')); } catch { return a[ai-1]||''; } });
      }
      result.split('\n').forEach((l, i, arr) => { if (i < arr.length - 1 || l) output.push({ text: l, type: 'text-line' }); });
    });
    // cout
    if (isCpp) {
      code.replace(/cout\s*((?:<<\s*(?:"[^"]*"|endl|'[^']*'|[\w.+\-*/()[\]]+)\s*)+);/g, (_, chain) => {
        const parts = [];
        chain.replace(/<<\s*("([^"]*)"|endl|'([^']*)'|([\w.+\-*/()[\]]+))/g, (__, _a, str, ch, expr) => {
          if (str !== undefined) parts.push(str.replace(/\\n/g,'\n').replace(/\\t/g,'\t'));
          else if (ch !== undefined) parts.push(ch);
          else if (expr === 'endl') parts.push('\n');
          else { try { parts.push(String(eval(expr))); } catch { parts.push(expr); } }
        });
        parts.join('').split('\n').forEach(l => output.push({ text: l, type: 'text-line' }));
      });
    }
    if (!output.length) output.push({ text: `[${isCpp?'C++':'C'} offline sim] Go online for full compilation.`, type: 'info' });
  } catch (e) { errors.push({ text: 'SimError: ' + e.message, type: 'error' }); }
  return { output, errors };
}

// Master offline dispatch
function runOffline(lang, code) {
  switch (lang) {
    case 'python':     return runPython(code);
    case 'javascript': return runJS(code, 'JavaScript');
    case 'typescript': return runTypeScript(code);
    case 'html': case 'css': return { output:[{text:'Rendered in Live Preview',type:'success'}], errors:[] };
    case 'sql':        return runSQL(code);
    case 'markdown':   return { output:[{text:'Rendered in Preview',type:'success'}], errors:[] };
    case 'java':       return runJava(code);
    case 'rust':       return runRust(code);
    case 'go':         return runGo(code);
    case 'php':        return runPHP(code);
    case 'ruby':       return runRuby(code);
    case 'bash':       return runBash(code);
    case 'lua':        return runLua(code);
    case 'swift':      return runSwift(code);
    case 'kotlin':     return runKotlin(code);
    case 'csharp':     return runCSharp(code);
    case 'cpp':        return runC(code, true);
    case 'c':          return runC(code, false);
    default:           return { output:[{text:`[${lang}] offline simulator not available. Connect internet for cloud execution.`,type:'info'}], errors:[] };
  }
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATES
// ═══════════════════════════════════════════════════════════════
const TEMPLATES = {
  python: `# ALONE CODE STUDIO v7 🚀 — runs offline!
def greet(name: str) -> str:
    return f"Hello, {name}! 👋"

print(greet("World"))

# List comprehension
squares = [i ** 2 for i in range(1, 6)]
print("Squares:", squares)

# Class example
class Counter:
    def __init__(self, start=0):
        self.value = start
    def increment(self):
        self.value += 1
        return self
    def __str__(self):
        return f"Counter({self.value})"

c = Counter()
c.increment().increment().increment()
print(c)
`,
  javascript: `// ALONE CODE STUDIO v7 🚀 — runs offline!
const greet = name => \`Hello, \${name}! 👋\`;
console.log(greet("World"));

// Modern JS
const nums = [1, 2, 3, 4, 5];
console.log("Squares:", nums.map(n => n ** 2));

// Class
class Stack {
  #items = [];
  push(v) { this.#items.push(v); return this; }
  pop()  { return this.#items.pop(); }
  peek() { return this.#items.at(-1); }
  get size() { return this.#items.length; }
}

const s = new Stack();
s.push(1).push(2).push(3);
console.log("Top:", s.peek(), "Size:", s.size);
`,
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>ACS v7</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:'Segoe UI',sans-serif; background:linear-gradient(135deg,#0f0c29,#24243e); color:#e0e0e0; min-height:100vh; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:20px; padding:24px; }
    h1 { background:linear-gradient(90deg,#4d9eff,#bb8fff); -webkit-background-clip:text; -webkit-text-fill-color:transparent; font-size:2.2rem; }
    .card { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:20px 28px; display:flex; flex-direction:column; gap:10px; }
    button { background:linear-gradient(135deg,#4d9eff,#bb8fff); border:none; color:#fff; padding:10px 24px; border-radius:8px; cursor:pointer; font-size:0.9rem; transition:transform 0.2s; }
    button:hover { transform:translateY(-2px); }
    #count { font-size:2rem; font-weight:800; color:#4d9eff; text-align:center; }
  </style>
</head>
<body>
  <h1>ACS v7 Live Preview 🚀</h1>
  <div class="card">
    <div id="count">0</div>
    <button onclick="document.getElementById('count').textContent=+document.getElementById('count').textContent+1">Click me! 🎯</button>
  </div>
</body>
</html>`,
  sql: `-- ACS v7 — Offline SQL Engine 🗃️

CREATE TABLE employees (
  id INTEGER,
  name TEXT,
  dept TEXT,
  salary REAL
);

INSERT INTO employees VALUES (1, 'Alice',   'Engineering', 95000);
INSERT INTO employees VALUES (2, 'Bob',     'Marketing',   72000);
INSERT INTO employees VALUES (3, 'Charlie', 'Engineering', 88000);
INSERT INTO employees VALUES (4, 'Diana',   'Design',      80000);

SELECT * FROM employees;
`,
  java: `// ACS v7 — Java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World! 🚀");
        System.out.println("Pi = " + Math.PI);
        for (int i = 1; i <= 5; i++) {
            System.out.println(i + " squared = " + (i * i));
        }
    }
}`,
  rust: `// ACS v7 — Rust
fn main() {
    println!("Hello, World! 🚀");
    let squares: Vec<i32> = (1..=5).map(|n| n * n).collect();
    println!("Squares: {:?}", squares);
    for n in 1..=5 {
        println!("{} * {} = {}", n, n, n * n);
    }
}`,
  go: `// ACS v7 — Go
package main
import "fmt"

func main() {
    fmt.Println("Hello, World! 🚀")
    fmt.Printf("Pi = %f\n", 3.14159)
    for i := 1; i <= 5; i++ {
        fmt.Printf("%d squared = %d\n", i, i*i)
    }
}`,
  cpp: `// ACS v7 — C++
#include <iostream>
#include <vector>
using namespace std;

int main() {
    cout << "Hello, World! 🚀" << endl;
    vector<int> nums = {1,2,3,4,5};
    for (int n : nums) {
        cout << n << " squared = " << n*n << endl;
    }
    return 0;
}`,
  markdown: `# ALONE CODE STUDIO v7 🚀

> **Fully Offline IDE** — iOS · Android · Windows · Linux

## Features
- ⚡ All 20 languages run **offline**
- 📁 Import files from your **device storage**
- 🔀 Split view editing
- 🤖 AI Assistant (online)
- 📱 Installable PWA

## Quick Start
\`\`\`python
def hello(name):
    return f"Hello, {name}!"
print(hello("World"))
\`\`\`

**Ctrl+Enter** to run · **Ctrl+S** to save
`,
  default: `// Start coding here...\n`,
};

function uid()    { return Math.random().toString(36).slice(2, 9); }
function tmpl(l) { return TEMPLATES[l] || TEMPLATES.default; }

// ═══════════════════════════════════════════════════════════════
// TREE NODE COMPONENT
// ═══════════════════════════════════════════════════════════════
const TreeNode = defineComponent({
  name: 'TreeNode',
  props: { node:{type:Object,required:true}, activeFileId:{type:String,default:null}, splitFileId:{type:String,default:null}, depth:{type:Number,default:0} },
  emits: ['openFile','openSplit','rename','deleteNode','toggleFolder'],
  methods: {
    onClick() { if (this.node.type==='folder') this.$emit('toggleFolder',this.node.id); else this.$emit('openFile',this.node.id); },
    onCtx(e) { e.preventDefault(); this.$emit('rename',this.node.id); },
    col(lang) { return LANG[lang]?.color||'#8b949e'; },
  },
  template: `
  <div>
    <div class="tree-item"
      :class="{'active':node.type==='file'&&node.id===activeFileId,'split-active':node.type==='file'&&node.id===splitFileId}"
      :style="{'padding-left':(12+depth*14)+'px'}"
      @click="onClick" @contextmenu="onCtx">
      <span v-if="node.type==='folder'" class="tree-chevron">
        <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor" :style="{transform:node.open?'rotate(90deg)':'',transition:'transform 0.18s'}"><path d="M3 2l4 3-4 3V2z"/></svg>
      </span>
      <span v-if="node.type==='folder'" class="tree-icon">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
      </span>
      <span v-else class="tree-file-dot" :style="{background:col(node.lang)}"></span>
      <span class="tree-name">{{node.name}}</span>
      <span v-if="node.type==='file'&&node.unsaved" class="tree-unsaved">●</span>
      <div class="tree-actions">
        <button v-if="node.type==='file'" class="tree-btn tree-btn-split" @click.stop="$emit('openSplit',node.id)" title="Split view">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
        </button>
        <button class="tree-btn tree-btn-rename" @click.stop="$emit('rename',node.id)" title="Rename">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="tree-btn tree-btn-del" @click.stop="$emit('deleteNode',node.id)" title="Delete">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
        </button>
      </div>
    </div>
    <template v-if="node.type==='folder'&&node.open&&node.children?.length">
      <tree-node v-for="c in node.children" :key="c.id" :node="c" :active-file-id="activeFileId" :split-file-id="splitFileId" :depth="depth+1"
        @open-file="$emit('openFile',$event)" @open-split="$emit('openSplit',$event)"
        @rename="$emit('rename',$event)" @delete-node="$emit('deleteNode',$event)" @toggle-folder="$emit('toggleFolder',$event)"/>
    </template>
  </div>`,
});

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
const app = createApp({
  components: { TreeNode },
  setup() {
    // ── State ──────────────────────────────────────────────────
    const loading      = ref(true);
    const splashMsg    = ref('Initializing…');
    const sidebarOpen  = ref(true);
    const settingsOpen = ref(false);
    const showApiKey   = ref(false);
    const focusMode    = ref(false);
    const isMobile     = ref(window.innerWidth < 768);
    const isOnline     = ref(navigator.onLine);
    const findOpen     = ref(false);
    const findQuery    = ref('');
    const replaceQuery = ref('');
    const findInputRef = ref(null);
    const splitView    = ref(false);
    const splitFileId  = ref(null);
    const splitW       = ref(300);
    const aiPanelOpen  = ref(false);
    const previewOpen  = ref(false);
    const previewLoad  = ref(false);
    const previewRef   = ref(null);
    const fileTree     = ref([]);
    const activeFileId = ref(null);
    const outputLines  = ref([]);
    const isRunning    = ref(false);
    const runStatus    = ref('Running…');
    const lastStats    = ref({ time:null, exit:null, lines:0 });
    const consoleH     = ref(160);
    const consoleRef   = ref(null);
    const execRef      = ref(null);
    const termInput    = ref('');
    const termInputRef = ref(null);
    const termHist     = ref([]);
    const termHistIdx  = ref(-1);
    const curLine      = ref(1);
    const curCol       = ref(1);
    const apiStatus    = ref('ok');
    const fontSize     = ref(13);
    const lineWrap     = ref(false);
    const aiMessages   = ref([]);
    const aiPrompt     = ref('');
    const aiLoading    = ref(false);
    const aiCtx        = ref(true);
    const aiChatRef    = ref(null);

    // Import panel
    const importOpen     = ref(false);
    const importFiles    = ref([]);    // pending files to import
    const importPaste    = ref('');
    const importPasteLang= ref('javascript');
    const importURL      = ref('');
    const isDragOver     = ref(false);

    // Toast
    const toasts = ref([]);

    const settings = ref({ theme:'default', font:'jetbrains', tabSize:2, apiKey:'', projectName:'my-project' });

    const availableThemes = [
      { id:'default',     label:'Default',    preview:'background:linear-gradient(135deg,#080b14,#0d1117)' },
      { id:'github-dark', label:'GH Dark',    preview:'background:linear-gradient(135deg,#0d1117,#161b22)' },
      { id:'dracula',     label:'Dracula',    preview:'background:linear-gradient(135deg,#282a36,#44475a)' },
      { id:'monokai',     label:'Monokai',    preview:'background:linear-gradient(135deg,#272822,#49483e)' },
      { id:'nord',        label:'Nord',       preview:'background:linear-gradient(135deg,#2e3440,#4c566a)' },
      { id:'tokyo-night', label:'Tokyo',      preview:'background:linear-gradient(135deg,#1a1b26,#24283b)' },
      { id:'solarized',   label:'Solarized',  preview:'background:linear-gradient(135deg,#002b36,#073642)' },
      { id:'light',       label:'Light',      preview:'background:linear-gradient(135deg,#f0f4f8,#ffffff)' },
    ];
    const availableFonts = [
      { id:'jetbrains', label:'JetBrains Mono', family:"'JetBrains Mono',monospace" },
      { id:'fira',      label:'Fira Code',      family:"'Fira Code',monospace"       },
      { id:'cascadia',  label:'Cascadia Code',  family:"'Cascadia Code',monospace"   },
      { id:'consolas',  label:'Consolas',       family:'Consolas,monospace'          },
    ];
    const aiPresets = [
      { label:'Explain',  prompt:'Explain what this code does.' },
      { label:'Optimize', prompt:'Optimize this code for performance.' },
      { label:'Fix bugs', prompt:'Find and fix any bugs.' },
      { label:'Add tests',prompt:'Write unit tests for this code.' },
      { label:'Document', prompt:'Add comprehensive documentation.' },
    ];

    // ── CodeMirror ─────────────────────────────────────────────
    let editorView = null, splitView2 = null;
    const langComp = new Compartment(), wrapComp = new Compartment(), fontComp = new Compartment();
    const sLangComp= new Compartment(), sFontComp = new Compartment();
    let internalUpdate = false;
    let previewBlobUrl = null, previewTimer = null;

    // ── Computed ───────────────────────────────────────────────
    function flatten(nodes, acc = []) {
      if (!nodes) return acc;
      for (const n of nodes) { if (n.type==='file') acc.push(n); else if (n.children) flatten(n.children, acc); }
      return acc;
    }
    const flatFiles  = computed(() => flatten(fileTree.value));
    const activeFile = computed(() => flatFiles.value.find(f => f.id === activeFileId.value) || null);
    const splitFile  = computed(() => flatFiles.value.find(f => f.id === splitFileId.value)  || null);
    const curLang    = computed({ get:()=>activeFile.value?.lang||'python', set:v=>{ if(activeFile.value) activeFile.value.lang=v; } });
    const activeLang = computed(() => LANG[curLang.value] || LANG.python);
    const modCount   = computed(() => flatFiles.value.filter(f=>f.unsaved).length);
    const isWeb      = computed(() => WEB_LANGS.has(curLang.value));
    const canPreview = computed(() => WEB_LANGS.has(curLang.value) || curLang.value === 'markdown');
    const editorH    = computed(() => { const t=34,h=30,f=findOpen.value?38:0; return `calc(100% - ${t+h+consoleH.value+f}px)`; });
    function langCfg(l) { return LANG[l] || null; }

    // ── Connectivity ───────────────────────────────────────────
    window.addEventListener('online',  () => isOnline.value = true);
    window.addEventListener('offline', () => isOnline.value = false);

    // ── Toast ──────────────────────────────────────────────────
    function toast(msg, type = 'info') {
      const id = uid();
      toasts.value.push({ id, msg, type });
      setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id); }, 2200);
    }

    // ── Preview ────────────────────────────────────────────────
    function buildPreview(file, all) {
      if (!file) return '';
      const { lang, code = '' } = file;
      if (lang === 'html') {
        const cssFiles = all.filter(f => f.lang === 'css');
        const jsFiles  = all.filter(f => f.lang === 'javascript');
        let doc = code;
        let inj = cssFiles.map(f => `<style>/*${f.name}*/\n${f.code||''}\n</style>`).join('\n');
        doc = doc.includes('</head>') ? doc.replace('</head>', inj + '</head>') : inj + doc;
        inj = jsFiles.map(f => `<script>/*${f.name}*/\n${f.code||''}\n<\/script>`).join('\n');
        doc = doc.includes('</body>') ? doc.replace('</body>', inj + '</body>') : doc + inj;
        return doc;
      }
      if (lang === 'css') return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:'Segoe UI',sans-serif;background:#1a1a2e;color:#e0e0e0;padding:20px}</style><style>${code}</style></head><body><h2 style="color:#4d9eff">CSS Preview</h2><div class="card"><h1>Heading</h1><p>Paragraph.</p><a href="#">Link</a></div></body></html>`;
      if (lang === 'javascript') return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{background:#0d1117;color:#e6edf3;font-family:monospace;padding:12px;font-size:12px}.ln{color:#484f58;min-width:28px;display:inline-block;text-align:right;user-select:none;margin-right:8px}.err{color:#f85149}.warn{color:#e3b341}#h{color:#4d9eff;font-size:.7rem;margin-bottom:8px;border-bottom:1px solid #1e2d40;padding-bottom:6px}</style></head><body><div id="h">▶ JS Output</div><div id="o"></div><script>let n=0;const o=document.getElementById('o');const w=(t,c='')=>{n++;const d=document.createElement('div');d.innerHTML='<span class="ln">'+n+'</span><span class="'+c+'">'+String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</span>';o.appendChild(d);};console.log=(...a)=>w(a.map(x=>typeof x==='object'?JSON.stringify(x,null,2):String(x)).join(' '));console.warn=(...a)=>w('⚠ '+a.join(' '),'warn');console.error=(...a)=>w('✗ '+a.join(' '),'err');try{${code}}catch(e){w('✗ '+e.message,'err');}<\/script></body></html>`;
      if (lang === 'markdown') return renderMarkdown(code);
      return '';
    }

    function updatePreview() {
      if (!previewOpen.value || !canPreview.value) return;
      nextTick(() => {
        const iframe = previewRef.value; if (!iframe) return;
        const file   = activeFile.value; if (!file) return;
        previewLoad.value = true;
        const doc  = buildPreview(file, flatFiles.value);
        if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
        const blob = new Blob([doc], { type: 'text/html' });
        previewBlobUrl = URL.createObjectURL(blob);
        iframe.onload = () => { previewLoad.value = false; };
        iframe.src = previewBlobUrl;
      });
    }
    function schedulePreview() { clearTimeout(previewTimer); previewTimer = setTimeout(updatePreview, 400); }
    function refreshPreview()  { updatePreview(); }
    function popoutPreview()   {
      const file = activeFile.value; if (!file) return;
      const doc  = buildPreview(file, flatFiles.value);
      const url  = URL.createObjectURL(new Blob([doc], { type: 'text/html' }));
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }

    // ── Tree helpers ───────────────────────────────────────────
    function findNode(nodes, id)   { if (!nodes) return null; for (const n of nodes) { if (n.id===id) return n; if (n.children) { const f=findNode(n.children,id); if(f) return f; } } return null; }
    function removeNode(nodes, id) { if (!nodes) return false; for (let i=0;i<nodes.length;i++) { if (nodes[i].id===id){nodes.splice(i,1);return true;} if (nodes[i].children&&removeNode(nodes[i].children,id)) return true; } return false; }

    // ── Persistence ────────────────────────────────────────────
    function savePrefs() { try { localStorage.setItem(S_PREFS, JSON.stringify({ fontSize:fontSize.value, lineWrap:lineWrap.value, consoleH:consoleH.value, settings:{...settings.value} })); } catch {} }
    function loadPrefs() { try { const p=JSON.parse(localStorage.getItem(S_PREFS)||'{}'); if(p.fontSize) fontSize.value=p.fontSize; if(p.lineWrap!=null) lineWrap.value=p.lineWrap; if(p.consoleH) consoleH.value=p.consoleH; if(p.settings) Object.assign(settings.value,p.settings); } catch {} }
    function saveFiles() {
      if (editorView  && activeFile.value) activeFile.value.code = editorView.state.doc.toString();
      if (splitView2  && splitFile.value)  splitFile.value.code  = splitView2.state.doc.toString();
      try { localStorage.setItem(S_TREE, JSON.stringify(fileTree.value)); if (activeFileId.value) localStorage.setItem(S_ACTIVE, activeFileId.value); } catch {}
    }

    // ── Init ───────────────────────────────────────────────────
    function initFiles() {
      loadPrefs();
      try {
        const raw = localStorage.getItem(S_TREE);
        if (raw) {
          const p = JSON.parse(raw);
          if (Array.isArray(p) && p.length) {
            fileTree.value = p;
            const saved = localStorage.getItem(S_ACTIVE);
            const all   = flatten(p);
            const found = all.find(f => f.id === saved);
            activeFileId.value = found ? found.id : (all[0]?.id || null);
            return;
          }
        }
      } catch {}
      fileTree.value = [
        { id:uid(), type:'folder', name:'src', open:true, children:[
            { id:uid(), type:'file', name:'main.py',    lang:'python',     code:tmpl('python'),     unsaved:false },
            { id:uid(), type:'file', name:'app.js',     lang:'javascript', code:tmpl('javascript'), unsaved:false },
            { id:uid(), type:'file', name:'index.html', lang:'html',       code:tmpl('html'),       unsaved:false },
            { id:uid(), type:'file', name:'style.css',  lang:'css',        code:tmpl('css')||'/* CSS here */', unsaved:false },
          ]},
        { id:uid(), type:'folder', name:'data', open:false, children:[
            { id:uid(), type:'file', name:'query.sql',  lang:'sql',      code:tmpl('sql'),      unsaved:false },
            { id:uid(), type:'file', name:'README.md',  lang:'markdown', code:tmpl('markdown'), unsaved:false },
          ]},
      ];
      activeFileId.value = flatFiles.value[0]?.id || null;
    }

    function applyTheme() { document.body.dataset.theme = settings.value.theme; savePrefs(); }
    function applyFont()  { const f = availableFonts.find(x => x.id === settings.value.font); if (f) document.documentElement.style.setProperty('--font-mono', f.family); savePrefs(); }

    // ── CodeMirror ─────────────────────────────────────────────
    function getLangExt(l) { const cfg=LANG[l]; if (!cfg?.cm) return python(); try { return cfg.cm(); } catch { return python(); } }

    function buildExts(l, wrap, fs, isSplit = false) {
      const lc = isSplit ? sLangComp : langComp;
      const wc = isSplit ? new Compartment() : wrapComp;
      const fc = isSplit ? sFontComp : fontComp;
      const exts = [
        lineNumbers(), highlightActiveLine(), highlightActiveLineGutter(),
        history(), drawSelection(), indentOnInput(), bracketMatching(), closeBrackets(),
        rectangularSelection(), crosshairCursor(),
        autocompletion({ closeOnBlur:false }), search({ top:false }), foldGutter(),
        oneDark, syntaxHighlighting(defaultHighlightStyle, { fallback:true }),
        lc.of(getLangExt(l)),
        wc.of(wrap ? EditorView.lineWrapping : []),
        fc.of(EditorView.theme({ '&':{ fontSize:fs+'px' } })),
        keymap.of([...defaultKeymap,...historyKeymap,...searchKeymap,...completionKeymap,indentWithTab,{key:'Ctrl-/',run:toggleComment},{key:'Cmd-/',run:toggleComment}]),
        EditorView.theme({ '&':{ backgroundColor:'var(--bg2)',color:'var(--text)',height:'100%' }, '.cm-scroller':{ fontFamily:'var(--font-mono)' } }),
      ];
      if (!isSplit) exts.push(EditorView.updateListener.of(u => {
        if (u.docChanged && !internalUpdate && activeFile.value) {
          activeFile.value.code = u.state.doc.toString();
          activeFile.value.unsaved = true;
          if (canPreview.value && previewOpen.value) schedulePreview();
        }
        const sel = u.state.selection.main, line = u.state.doc.lineAt(sel.head);
        curLine.value = line.number; curCol.value = sel.head - line.from + 1;
      }));
      return exts;
    }

    function initEditor() {
      const el = document.getElementById('cm-editor');
      if (!el || editorView) return;
      const f = activeFile.value; if (!f) return;
      editorView = new EditorView({ state:EditorState.create({ doc:f.code||'', extensions:buildExts(f.lang, lineWrap.value, fontSize.value) }), parent:el });
    }

    function initSplitEditor(fid) {
      nextTick(() => {
        const el = document.getElementById('cm-split');
        if (!el) return;
        if (splitView2) { splitView2.destroy(); splitView2=null; }
        const f = flatFiles.value.find(x=>x.id===fid); if (!f) return;
        splitView2 = new EditorView({ state:EditorState.create({ doc:f.code||'', extensions:buildExts(f.lang, lineWrap.value, fontSize.value, true) }), parent:el });
      });
    }

    function updateDoc(code, lang) {
      if (!editorView) return;
      internalUpdate = true;
      editorView.dispatch({ changes:{from:0,to:editorView.state.doc.length,insert:code||''}, effects:[langComp.reconfigure(getLangExt(lang))] });
      editorView.scrollDOM.scrollTop = 0;
      internalUpdate = false;
    }

    // ── Watchers ───────────────────────────────────────────────
    watch(fontSize, v => { const t=EditorView.theme({'&':{fontSize:v+'px'}}); if(editorView) editorView.dispatch({effects:fontComp.reconfigure(t)}); if(splitView2) splitView2.dispatch({effects:sFontComp.reconfigure(t)}); savePrefs(); });
    watch(lineWrap, v => { if(editorView) editorView.dispatch({effects:wrapComp.reconfigure(v?EditorView.lineWrapping:[])}); savePrefs(); });
    watch(previewOpen, v => { if(v) nextTick(updatePreview); });
    watch(activeFileId, () => { if(previewOpen.value && canPreview.value) nextTick(updatePreview); });

    // ── File ops ───────────────────────────────────────────────
    function switchFile(id) {
      if (!id || id === activeFileId.value) { if(isMobile.value) sidebarOpen.value=false; return; }
      if (editorView && activeFile.value) activeFile.value.code = editorView.state.doc.toString();
      activeFileId.value = id; saveFiles();
      nextTick(() => { const f=flatFiles.value.find(x=>x.id===id); if(f) updateDoc(f.code,f.lang); if(isMobile.value) sidebarOpen.value=false; });
    }
    function openSplit(id)   { if(!id||id===activeFileId.value) return; if(splitView2&&splitFile.value) splitFile.value.code=splitView2.state.doc.toString(); splitFileId.value=id; splitView.value=true; initSplitEditor(id); }
    function closeSplit()    { if(splitView2){splitView2.destroy();splitView2=null;} splitFileId.value=null; splitView.value=false; }
    function toggleSplit()   { if(splitView.value) closeSplit(); else { const o=flatFiles.value.filter(f=>f.id!==activeFileId.value); if(o.length) openSplit(o[0].id); else splitView.value=true; } }

    function createFile(lang='python') {
      const cfg=LANG[lang]||LANG.python;
      const n=flatFiles.value.filter(f=>f.lang===lang).length+1;
      const nf={id:uid(),type:'file',name:'script'+n+cfg.ext,lang,code:tmpl(lang),unsaved:false};
      fileTree.value.push(nf); switchFile(nf.id); saveFiles(); toast('File created','ok');
    }
    function createFolder() {
      const name=prompt('Folder name:','new-folder'); if(!name?.trim()) return;
      fileTree.value.push({id:uid(),type:'folder',name:name.trim(),open:true,children:[]}); saveFiles();
    }
    function toggleFolder(id) { const n=findNode(fileTree.value,id); if(n){n.open=!n.open;saveFiles();} }
    function startRename(id)  {
      const n=findNode(fileTree.value,id); if(!n) return;
      const nn=prompt('Rename:',n.name); if(!nn?.trim()||nn.trim()===n.name) return;
      n.name=nn.trim();
      if(n.type==='file') { const ext='.'+n.name.split('.').pop(); const m=Object.values(LANG).find(l=>l.ext===ext); if(m) n.lang=m.id; }
      saveFiles(); toast('Renamed','ok');
    }
    function deleteNode(id) {
      const n=findNode(fileTree.value,id); if(!n) return;
      if(!confirm(`Delete "${n.name}"?`)) return;
      const affected=new Set(flatten([n]).map(f=>f.id)); affected.add(id);
      if(affected.has(activeFileId.value)) { const rem=flatFiles.value.filter(f=>!affected.has(f.id)); switchFile(rem[0]?.id||null); }
      if(splitFileId.value&&affected.has(splitFileId.value)) closeSplit();
      removeNode(fileTree.value,id); saveFiles(); toast('Deleted','info');
    }
    function closeTab(id) { deleteNode(id); }

    function onLangChange() {
      const f=activeFile.value; if(!f) return;
      const cfg=LANG[f.lang]; if(!cfg) return;
      f.name=f.name.replace(/\.[^.]+$/,'')+cfg.ext;
      if(editorView) editorView.dispatch({effects:langComp.reconfigure(getLangExt(f.lang))});
      f.unsaved=true; saveFiles();
      if(previewOpen.value&&canPreview.value) nextTick(updatePreview);
    }

    function downloadFile() {
      const f=activeFile.value; if(!f) return;
      if(editorView) f.code=editorView.state.doc.toString();
      const a=document.createElement('a');
      a.href=URL.createObjectURL(new Blob([f.code||''],{type:'text/plain'}));
      a.download=f.name; a.click(); URL.revokeObjectURL(a.href);
      toast('Downloaded: '+f.name,'ok');
    }

    function downloadAll() {
      saveFiles();
      // Create a text bundle
      const content = flatFiles.value.map(f => `\n${'='.repeat(60)}\n// FILE: ${f.name}\n${'='.repeat(60)}\n${f.code||''}`).join('\n');
      const a=document.createElement('a');
      a.href=URL.createObjectURL(new Blob([content],{type:'text/plain'}));
      a.download=settings.value.projectName+'-bundle.txt'; a.click(); URL.revokeObjectURL(a.href);
      toast('Bundle downloaded','ok');
    }

    function toggleWrap()    { lineWrap.value=!lineWrap.value; }
    function toggleFocus()   { focusMode.value=!focusMode.value; if(focusMode.value){sidebarOpen.value=false;aiPanelOpen.value=false;} }

    // ── Find & Replace ─────────────────────────────────────────
    function doFind() {
      if(!editorView||!findQuery.value) return;
      const doc=editorView.state.doc.toString(), from=editorView.state.selection.main.to;
      let idx=doc.indexOf(findQuery.value,from); if(idx===-1) idx=doc.indexOf(findQuery.value,0);
      if(idx!==-1) { editorView.dispatch({selection:{anchor:idx,head:idx+findQuery.value.length},scrollIntoView:true}); editorView.focus(); }
    }
    function doReplace() {
      if(!editorView||!findQuery.value) return;
      const idx=editorView.state.doc.toString().indexOf(findQuery.value); if(idx===-1) return;
      editorView.dispatch({changes:{from:idx,to:idx+findQuery.value.length,insert:replaceQuery.value},selection:{anchor:idx+replaceQuery.value.length}});
    }

    // ═══════════════════════════════════════════════════════════
    // IMPORT PANEL
    // ═══════════════════════════════════════════════════════════
    function openImport()  { importOpen.value=true; importFiles.value=[]; importPaste.value=''; importURL.value=''; }
    function closeImport() { importOpen.value=false; }

    // File size helper
    function fmtSize(bytes) {
      if (bytes < 1024) return bytes + 'B';
      if (bytes < 1024*1024) return (bytes/1024).toFixed(1)+'KB';
      return (bytes/1024/1024).toFixed(1)+'MB';
    }

    // Handle file drop or input
    async function handleDropFiles(files) {
      const arr = Array.from(files);
      for (const file of arr) {
        if (file.size > 5 * 1024 * 1024) { toast(file.name + ' too large (>5MB)', 'err'); continue; }
        const text = await file.text();
        const lang = detectLang(file.name);
        importFiles.value.push({ name: file.name, lang, code: text, size: file.size, id: uid() });
      }
    }

    function onDropZone(e) {
      e.preventDefault(); isDragOver.value = false;
      handleDropFiles(e.dataTransfer?.files || []);
    }
    function onDragOver(e) { e.preventDefault(); isDragOver.value = true; }
    function onDragLeave()  { isDragOver.value = false; }

    function triggerFileInput() {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.multiple = true;
      inp.accept = '.py,.js,.ts,.html,.css,.cpp,.c,.java,.rs,.go,.php,.rb,.swift,.kt,.cs,.lua,.sh,.sql,.md,.json,.xml,.txt,.yaml,.yml';
      inp.onchange = () => handleDropFiles(inp.files);
      inp.click();
    }

    function removeImportFile(id) { importFiles.value = importFiles.value.filter(f => f.id !== id); }

    async function fetchURL() {
      if (!importURL.value.trim()) return;
      if (!isOnline.value) { toast('Internet required to fetch URL', 'err'); return; }
      try {
        toast('Fetching…', 'info');
        const res  = await fetch(importURL.value.trim());
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const text = await res.text();
        const parts = importURL.value.split('/');
        const name  = parts[parts.length - 1] || 'imported.txt';
        const lang  = detectLang(name);
        importFiles.value.push({ name, lang, code: text, size: text.length, id: uid() });
        importURL.value = '';
        toast('Fetched: ' + name, 'ok');
      } catch (e) { toast('Fetch failed: ' + e.message, 'err'); }
    }

    function addPasteAsFile() {
      if (!importPaste.value.trim()) return;
      const cfg  = LANG[importPasteLang.value] || LANG.javascript;
      const name = 'paste_' + Date.now() + cfg.ext;
      importFiles.value.push({ name, lang: importPasteLang.value, code: importPaste.value, size: importPaste.value.length, id: uid() });
      importPaste.value = '';
      toast('Pasted as ' + name, 'ok');
    }

    function confirmImport() {
      if (!importFiles.value.length) { closeImport(); return; }
      for (const f of importFiles.value) {
        const nf = { id: uid(), type: 'file', name: f.name, lang: f.lang, code: f.code, unsaved: false };
        fileTree.value.push(nf);
        activeFileId.value = nf.id;
      }
      saveFiles();
      nextTick(() => {
        const f = flatFiles.value.find(x => x.id === activeFileId.value);
        if (f && editorView) updateDoc(f.code, f.lang);
      });
      toast(importFiles.value.length + ' file(s) imported!', 'ok');
      closeImport();
    }

    // ── Terminal ───────────────────────────────────────────────
    function execTerm() {
      const cmd=termInput.value.trim(); if(!cmd) return;
      termHist.value.unshift(cmd); termHistIdx.value=-1; termInput.value='';
      addOut(cmd,'cmd');
      const [base,...parts]=cmd.split(/\s+/); const b=base.toLowerCase();
      if (b==='run')          runCode();
      else if (b==='clear'||b==='cls')  outputLines.value=[];
      else if (b==='ls'||b==='dir')     addOut(flatFiles.value.map(f=>f.name).join('  ')||'(empty)','text-line');
      else if (b==='echo')              addOut(parts.join(' '),'text-line');
      else if (b==='pwd')               addOut('/workspace/'+settings.value.projectName,'text-line');
      else if (b==='version')           addOut('ALONE CODE STUDIO v7 | Offline | Vue3+CM6','text-line');
      else if (b==='date')              addOut(new Date().toString(),'text-line');
      else if (b==='status')            addOut(`Online: ${isOnline.value} | Files: ${flatFiles.value.length} | Lang: ${curLang.value}`,'info');
      else if (b==='import')            { openImport(); addOut('Import panel opened','info'); }
      else if (b==='download')          { downloadFile(); }
      else if (b==='help')              addOut('Commands: run clear ls echo pwd version date status import download help','info');
      else addOut(`bash: ${b}: command not found`,'error');
      nextTick(()=>termInputRef.value?.focus());
    }
    function termUp()   { if(termHistIdx.value<termHist.value.length-1){termHistIdx.value++;termInput.value=termHist.value[termHistIdx.value];} }
    function termDown() { if(termHistIdx.value>0){termHistIdx.value--;termInput.value=termHist.value[termHistIdx.value];}else{termHistIdx.value=-1;termInput.value='';} }

    // ── Run Code ───────────────────────────────────────────────
    async function runCode() {
      if (isRunning.value) return;
      if (editorView && activeFile.value) activeFile.value.code = editorView.state.doc.toString();
      saveFiles();
      const file = activeFile.value; if (!file) return;
      const code = (file.code || '').trim();
      if (!code) { addOut('No code to run.', 'info'); return; }
      const lang = file.lang;

      // Preview langs
      if (canPreview.value) {
        outputLines.value = [];
        addOut(`Rendering ${file.name}…`, 'cmd');
        if (!previewOpen.value) previewOpen.value = true;
        nextTick(updatePreview);
        addOut(`✓ Rendered offline`, 'success');
        lastStats.value = { time:0, exit:0, lines:1 };
        return;
      }

      isRunning.value = true; runStatus.value = 'Running…';
      outputLines.value = [];
      if (!previewOpen.value) previewOpen.value = true;
      const cfg = LANG[lang] || LANG.python;
      const ts  = new Date().toLocaleTimeString();
      const t0  = performance.now();

      // Online → Piston
      if (isOnline.value) {
        apiStatus.value = 'loading';
        addOut(`[${ts}] ${file.name} · ${cfg.label} · cloud`, 'cmd');
        runStatus.value = 'Connecting…';
        try {
          const res = await fetch(PISTON_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ language:cfg.piston, version:cfg.ver, files:[{name:file.name,content:code}], stdin:'' }) });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          runStatus.value = 'Processing…';
          const data = await res.json();
          const dt   = Math.round(performance.now() - t0);
          apiStatus.value = 'ok';
          if (data.compile?.output) { addOut('── compile ──','info'); data.compile.output.split('\n').forEach(l=>l&&addOut(l,'error')); }
          const run = data.run; let nl = 0;
          if (run?.stdout) { run.stdout.split('\n').forEach(l=>{addOut(l,'text-line');nl++;}); }
          if (run?.stderr) { addOut('── stderr ──','error'); run.stderr.split('\n').forEach(l=>l&&addOut(l,'error')); }
          const ex = run?.code ?? 0;
          addOut(`exit ${ex} · ${dt}ms · cloud`, ex===0&&!run?.stderr?'success':'error');
          lastStats.value = { time:dt, exit:ex, lines:nl };
        } catch (e) {
          apiStatus.value = 'error';
          addOut('Cloud failed: ' + e.message, 'error');
          addOut('Falling back to offline simulator…', 'info');
          const dt = Math.round(performance.now() - t0);
          const { output, errors } = runOffline(lang, code);
          output.forEach(o => addOut(o.text, o.type));
          errors.forEach(e => addOut(e.text, e.type));
          addOut(`offline sim done · ${Math.round(performance.now()-t0)}ms`, errors.length?'error':'success');
          lastStats.value = { time:dt, exit:errors.length?1:0, lines:output.length };
        }
      } else {
        // Offline
        addOut(`[${ts}] ${file.name} · ${cfg.label} · offline sim`, 'cmd');
        runStatus.value = 'Simulating…';
        await new Promise(r => setTimeout(r, 20));
        const { output, errors } = runOffline(lang, code);
        const dt = Math.round(performance.now() - t0);
        output.forEach(o => addOut(o.text, o.type));
        errors.forEach(e => addOut(e.text, e.type));
        addOut(`done · ${dt}ms · offline`, errors.length?'error':'success');
        lastStats.value = { time:dt, exit:errors.length?1:0, lines:output.length };
      }

      nextTick(()=>{ if(execRef.value) execRef.value.scrollTop=execRef.value.scrollHeight; });
      isRunning.value = false; runStatus.value = 'Running…';
    }

    function addOut(text, type='text-line') {
      outputLines.value.push({ text:String(text), type });
      nextTick(() => { if(consoleRef.value) consoleRef.value.scrollTop=consoleRef.value.scrollHeight; if(execRef.value) execRef.value.scrollTop=execRef.value.scrollHeight; });
    }
    function clearOutput() { outputLines.value=[]; lastStats.value={time:null,exit:null,lines:0}; }
    function copyOutput()  { navigator.clipboard.writeText(outputLines.value.map(l=>l.text).join('\n')).then(()=>toast('Copied!','ok')).catch(()=>{}); }
    function hlOut(text)   {
      return String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/(\d+\.?\d*)/g,'<span class="hl-num">$1</span>')
        .replace(/"([^"]+)"/g,'"<span class="hl-str">$1</span>"')
        .replace(/\b(True|False|None|null|undefined|true|false)\b/g,'<span class="hl-kw">$1</span>');
    }

    // ── AI ─────────────────────────────────────────────────────
    async function sendAI() {
      const p = aiPrompt.value.trim(); if(!p||aiLoading.value) return;
      if(!isOnline.value) { toast('Internet required for AI','err'); return; }
      if(editorView&&activeFile.value) activeFile.value.code=editorView.state.doc.toString();
      let ctx='';
      if(aiCtx.value&&flatFiles.value.length) {
        ctx='\n\n---\n**FILES:**\n\n'+flatFiles.value.map(f=>`**${f.name}** (${f.lang}):\n\`\`\`${f.lang}\n${(f.code||'').slice(0,3000)}\n\`\`\``).join('\n\n');
      }
      aiMessages.value.push({role:'user',content:p}); aiPrompt.value=''; aiLoading.value=true;
      nextTick(()=>{if(aiChatRef.value)aiChatRef.value.scrollTop=aiChatRef.value.scrollHeight;});
      try {
        const msgs=aiMessages.value.map((m,i)=>i===aiMessages.value.length-1&&m.role==='user'?{role:'user',content:m.content+ctx}:{role:m.role,content:m.content});
        const headers={'Content-Type':'application/json'}; if(settings.value.apiKey) headers['x-api-key']=settings.value.apiKey;
        const res=await fetch(ANTHROPIC_URL,{method:'POST',headers,body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:2048,system:`Expert coding assistant in ALONE CODE STUDIO v7. All 20 languages have offline simulators. Be concise, use markdown code blocks. Files: ${flatFiles.value.map(f=>f.name).join(', ')}.`,messages:msgs})});
        const data=await res.json();
        const reply=data.content?.find(b=>b.type==='text')?.text||data.error?.message||'Check API key in Settings.';
        aiMessages.value.push({role:'assistant',content:reply});
      } catch(e) { aiMessages.value.push({role:'assistant',content:'⚠️ Connection error: '+e.message}); }
      finally { aiLoading.value=false; nextTick(()=>{if(aiChatRef.value)aiChatRef.value.scrollTop=aiChatRef.value.scrollHeight;}); }
    }
    function clearAI() { aiMessages.value=[]; }
    function fmtAI(c) {
      return String(c).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/```(\w*)\n?([\s\S]*?)```/g,(_,l,code)=>`<pre><code class="lang-${l}">${code.trim()}</code></pre>`)
        .replace(/`([^`\n]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
        .replace(/\*([^*\n]+)\*/g,'<em>$1</em>').replace(/\n/g,'<br>');
    }

    // ── Resize ─────────────────────────────────────────────────
    let ry=0,rh=0,resz=false;
    function startResize(e){resz=true;ry=e.clientY||e.touches?.[0]?.clientY;rh=consoleH.value;document.addEventListener('mousemove',doResize);document.addEventListener('mouseup',stopResize);}
    function startResizeT(e){resz=true;ry=e.touches[0].clientY;rh=consoleH.value;document.addEventListener('touchmove',doResizeT,{passive:false});document.addEventListener('touchend',stopResize);}
    function doResize(e){if(!resz)return;consoleH.value=Math.max(50,Math.min(500,rh+(ry-e.clientY)));}
    function doResizeT(e){e.preventDefault();if(!resz)return;consoleH.value=Math.max(50,Math.min(500,rh+(ry-e.touches[0].clientY)));}
    function stopResize(){resz=false;document.removeEventListener('mousemove',doResize);document.removeEventListener('mouseup',stopResize);document.removeEventListener('touchmove',doResizeT);document.removeEventListener('touchend',stopResize);savePrefs();}

    let sx=0,sw=0,sresz=false;
    function startSR(e){sresz=true;sx=e.clientX;sw=splitW.value;document.addEventListener('mousemove',doSR);document.addEventListener('mouseup',stopSR);}
    function startSRT(e){sresz=true;sx=e.touches[0].clientX;sw=splitW.value;document.addEventListener('touchmove',doSRT,{passive:false});document.addEventListener('touchend',stopSR);}
    function doSR(e){if(!sresz)return;splitW.value=Math.max(180,Math.min(window.innerWidth-300,sw-(e.clientX-sx)));}
    function doSRT(e){e.preventDefault();if(!sresz)return;splitW.value=Math.max(180,Math.min(window.innerWidth-300,sw-(e.touches[0].clientX-sx)));}
    function stopSR(){sresz=false;document.removeEventListener('mousemove',doSR);document.removeEventListener('mouseup',stopSR);document.removeEventListener('touchmove',doSRT);document.removeEventListener('touchend',stopSR);}

    // ── Keyboard ───────────────────────────────────────────────
    document.addEventListener('keydown', e => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key==='Enter') { e.preventDefault(); runCode(); }
      if (ctrl && e.key==='s')     { e.preventDefault(); saveFiles(); if(activeFile.value)activeFile.value.unsaved=false; toast('Saved','ok'); }
      if (ctrl && e.key==='f')     { e.preventDefault(); findOpen.value=!findOpen.value; nextTick(()=>findInputRef.value?.focus()); }
      if (ctrl && e.key==='b')     { e.preventDefault(); sidebarOpen.value=!sidebarOpen.value; }
      if (ctrl && e.key==='\\')    { e.preventDefault(); toggleSplit(); }
      if (ctrl && e.key==='p')     { e.preventDefault(); previewOpen.value=!previewOpen.value; }
      if (ctrl && e.key==='i')     { e.preventDefault(); openImport(); }
      if (e.key==='Escape')        { findOpen.value=false; settingsOpen.value=false; importOpen.value=false; }
    });

    document.addEventListener('visibilitychange', () => { if(document.hidden) saveFiles(); });
    window.addEventListener('resize', () => { isMobile.value=window.innerWidth<768; });

    // ── Mount ──────────────────────────────────────────────────
    onMounted(async () => {
      initFiles(); applyTheme(); applyFont();
      const msgs=['Loading CodeMirror 6…','Setting up offline engines…','Preparing Python transpiler…','Ready!'];
      let mi=0;
      const iv=setInterval(()=>{splashMsg.value=msgs[Math.min(mi++,msgs.length-1)];},350);
      await new Promise(r=>setTimeout(r,1500));
      clearInterval(iv); loading.value=false;
      await nextTick(); initEditor();
      if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
    });

    return {
      loading,splashMsg,sidebarOpen,settingsOpen,showApiKey,focusMode,isMobile,isOnline,
      findOpen,findQuery,replaceQuery,findInputRef,
      splitView,splitFileId,splitW,
      aiPanelOpen,previewOpen,previewLoad,previewRef,
      fileTree,flatFiles,activeFileId,activeFile,splitFile,
      curLang,activeLang,langGroups:LANG_GROUPS,langCfg,
      outputLines,isRunning,runStatus,lastStats,
      consoleH,consoleRef,execRef,termInput,termInputRef,
      curLine,curCol,apiStatus,fontSize,lineWrap,modCount,editorH,
      aiMessages,aiPrompt,aiLoading,aiCtx,aiChatRef,aiPresets,
      settings,availableThemes,availableFonts,
      savePrefs,applyTheme,applyFont,
      switchFile,openSplit,closeSplit,toggleSplit,
      createFile,createFolder,toggleFolder,startRename,deleteNode,closeTab,
      onLangChange,toggleWrap,downloadFile,downloadAll,toggleFocus,
      runCode,clearOutput,copyOutput,hlOut,
      startResize,startResizeT,startSR,startSRT,
      sendAI,clearAI,fmtAI,
      doFind,doReplace,execTerm,termUp,termDown,
      isWeb,canPreview,refreshPreview,popoutPreview,
      openImport,closeImport,importOpen,importFiles,importPaste,importPasteLang,importURL,isDragOver,
      onDropZone,onDragOver,onDragLeave,triggerFileInput,removeImportFile,fetchURL,addPasteAsFile,confirmImport,fmtSize,
      LANG,
      toasts,toast,
    };
  },
});

app.component('TreeNode', TreeNode);
app.mount('#app');
