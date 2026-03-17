/**
 * pyodide.js — Pyodide (Python-in-WebAssembly) adapter
 *
 * Loads Pyodide from CDN as a dynamic import (not bundled — ~8 MB).
 * Registers as the last entry in viz-registry.js so all other viz renders
 * complete before the heavy CDN load begins.
 *
 * Authoring convention:
 *   ::: {.pyodide-cell}
 *   ```python
 *   import numpy as np
 *   print(np.exp(-1.5))
 *   ```
 *   :::
 *
 * Constraints (platform gate):
 *   - numpy is pre-loaded; additional packages must call loadPackage() explicitly
 *   - no file I/O (WASM sandbox)
 *   - cells are independent — state does not persist between runs
 */

const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.mjs';

let pyodideInstance = null;

/**
 * initPyodide — load Pyodide and pre-install numpy.
 * Called once by core.js before any renderPyodideCell() calls.
 */
export async function initPyodide() {
  if (pyodideInstance) return;

  const { loadPyodide } = await import(/* @vite-ignore */ PYODIDE_CDN);
  const pyodide = await loadPyodide();
  await pyodide.loadPackage('numpy');
  pyodideInstance = pyodide;
}

/**
 * renderPyodideCell — transform a raw .pyodide-cell div into an interactive widget.
 *
 * @param {HTMLElement} el  A .pyodide-cell element containing <pre><code class="language-python">…</code></pre>
 */
export function renderPyodideCell(el) {
  const codeEl = el.querySelector('code');
  if (!codeEl) return;

  const source = codeEl.textContent;

  el.innerHTML = `
    <textarea class="pyodide-cell__editor" spellcheck="false" autocorrect="off" autocapitalize="off"></textarea>
    <div class="pyodide-cell__toolbar">
      <button class="pyodide-cell__run-btn btn btn-primary" type="button">Run</button>
      <span class="pyodide-cell__status"></span>
    </div>
    <div class="pyodide-cell__output" hidden></div>
  `;

  const editorEl  = el.querySelector('.pyodide-cell__editor');
  const runBtn    = el.querySelector('.pyodide-cell__run-btn');
  const statusEl  = el.querySelector('.pyodide-cell__status');
  const outputEl  = el.querySelector('.pyodide-cell__output');

  editorEl.value = source;

  // Auto-resize textarea to fit content
  editorEl.style.height = 'auto';
  editorEl.style.height = editorEl.scrollHeight + 'px';
  editorEl.addEventListener('input', () => {
    editorEl.style.height = 'auto';
    editorEl.style.height = editorEl.scrollHeight + 'px';
  });

  // Tab key inserts spaces instead of moving focus
  editorEl.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = editorEl.selectionStart;
      editorEl.value = editorEl.value.slice(0, s) + '    ' + editorEl.value.slice(editorEl.selectionEnd);
      editorEl.selectionStart = editorEl.selectionEnd = s + 4;
    }
  });

  runBtn.addEventListener('click', async () => {
    if (!pyodideInstance) {
      statusEl.textContent = 'Pyodide not ready';
      return;
    }

    runBtn.disabled = true;
    runBtn.textContent = 'Running…';
    statusEl.textContent = '';
    outputEl.hidden = true;
    outputEl.className = 'pyodide-cell__output';
    outputEl.textContent = '';

    const lines = [];

    pyodideInstance.setStdout({ batched: (line) => lines.push(line) });
    pyodideInstance.setStderr({ batched: (line) => lines.push(line) });

    try {
      await pyodideInstance.runPythonAsync(editorEl.value);
      outputEl.textContent = lines.join('\n');
    } catch (err) {
      outputEl.classList.add('pyodide-cell__output--error');
      outputEl.textContent = String(err);
    } finally {
      outputEl.hidden = false;
      runBtn.disabled = false;
      runBtn.textContent = 'Run';
    }
  });
}
