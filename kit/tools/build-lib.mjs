/*
 * Blyth Play build library: the part of tools/build.mjs that turns game code into ONE self-contained HTML.
 * Shared by the local CLI (tools/build.mjs) and the Blyth MCP server (publish_playable game_js), so a game
 * published from game/main.js is byte-for-byte the build you verified locally.
 * No imports: the caller passes its own esbuild.
 */

export const PLAYABLE_LIMIT_BYTES = 5 * 1024 * 1024;

export const PLAYABLE_CSP = "default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' data: blob:; style-src 'unsafe-inline' data:; img-src data: blob:; media-src data: blob:; font-src data: blob:; connect-src data: blob:; worker-src blob:; frame-src 'none'; form-action 'none'; base-uri 'none'";
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** The title the CLI uses: `title: '…'` in main.js, else "Playable". */
export function playableTitleFromSource(source) {
  const m = /title:\s*['"]([^'"]{1,80})['"]/.exec(String(source || ''));
  return m ? m[1] : 'Playable';
}

/**
 * Bundles a game (entry file or code) with the kernel into a minified IIFE, escaped for an inline <script>.
 * entry: { file } or { code, sourcefile?, resolveDir }. plugins run before the kernel alias.
 */
export async function bundleGame({ esbuild, entry, kernelPath, nodePaths = [], orientation = null, plugins = [], absWorkingDir }) {
  const kernelAlias = {
    name: 'kernel-alias',
    setup(b) { b.onResolve({ filter: /^blyth-play-kernel$/ }, () => ({ path: kernelPath })); },
  };
  const result = await esbuild.build({
    ...(entry.file ? { entryPoints: [entry.file] } : { stdin: { contents: entry.code, sourcefile: entry.sourcefile || 'main.js', resolveDir: entry.resolveDir, loader: 'js' } }),
    bundle: true,
    format: 'iife',
    minify: true,
    target: ['es2020'],
    write: false,
    // license notices (the kernel's and three.js's) go to the end of the file: every game carries them
    legalComments: 'eof',
    // Game code is written as ES modules, so it is strict: say so explicitly, whatever tsconfig.json sits around
    // the folder, so every build (repo, sandbox, Blyth server) is the same bytes.
    tsconfigRaw: { compilerOptions: { alwaysStrict: true } },
    plugins: [...plugins, kernelAlias],
    define: orientation ? { __ORIENTATION__: JSON.stringify(orientation) } : { __ORIENTATION__: 'undefined' },
    logLevel: plugins.length ? 'silent' : 'warning',
    nodePaths,
    ...(absWorkingDir ? { absWorkingDir } : {}),
  });
  return result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
}

/** The page around the bundle: CSP, viewport, instant loading screen, window.__ASSETS__, the game. */
export function playableHtml({ title = 'Playable', js, assets = { img: {}, snd: {}, models: {}, json: {} } }) {
  const CSP = PLAYABLE_CSP;
  const BOOT = `<div id="pk-boot" role="progressbar" aria-label="Loading"><div class="pkb-t">${esc(title)}</div><div class="pkb-b"><i></i></div><div class="pkb-l">LOADING</div></div>`
    + '<style>#pk-boot{position:fixed;inset:0;z-index:2147483000;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;'
    + 'background:radial-gradient(ellipse at 50% 38%,#2b2346 0%,#14121f 55%,#0b0b10 100%);color:#fff;transition:opacity .35s ease;'
    + 'font:800 20px/1.05 "Arial Rounded MT Bold","Avenir Next",system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.5px;-webkit-user-select:none;user-select:none}'
    + '#pk-boot .pkb-t{font-size:clamp(28px,9vw,46px);text-align:center;padding:0 28px;text-transform:uppercase;text-shadow:0 4px 0 #1c1a2e,0 0 28px rgba(255,91,34,.35)}'
    + '#pk-boot .pkb-b{width:min(58vw,230px);height:10px;border-radius:99px;background:rgba(255,255,255,.12);overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,.4)}'
    + '#pk-boot .pkb-b i{display:block;height:100%;width:42%;border-radius:99px;background:linear-gradient(90deg,#ff5b22,#ffd23f);animation:pkb 1.05s ease-in-out infinite}'
    + '#pk-boot .pkb-l{font-size:11px;opacity:.55;letter-spacing:4px}@keyframes pkb{0%{transform:translateX(-110%)}100%{transform:translateX(250%)}}</style>';
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="generator" content="blyth-play-kernel/0.4">
<title>${title.replace(/</g, '&lt;')}</title>
</head><body>${BOOT}<canvas id="pk-canvas"></canvas>
<script>window.__ASSETS__=${JSON.stringify(assets)};</script>
<script>window.__pkMain=function(){${js}};(function(){var go=function(){var m=window.__pkMain;if(m){window.__pkMain=null;m();}};if(window.requestAnimationFrame)requestAnimationFrame(function(){requestAnimationFrame(go);});setTimeout(go,160);})();</script>
</body></html>
`;
  return html;
}
