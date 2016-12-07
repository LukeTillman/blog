const marked = require('marked');
const highlightJs = require('highlight.js');

// Use hljs class prefix so stylesheets work
highlightJs.configure({ classPrefix: 'hljs-' });

// Override some of the default rendering
const renderer = new marked.Renderer();

// Add highlight.js syntax highlighting if a language is specified
renderer.code = function(code, language) {
  if (language) {
    return `<pre><code class="hljs">${highlightJs.highlight(language, code).value}</pre></code>`; 
  }
  return `<pre><code class="hljs">${code}</code></pre>`;
};

// Open external links in a new window
renderer.link = function(href, title, text) {
  let titleAttr = title ? ` title="${title}"` : '';
  let targetAttr = href.startsWith('http') ? ` target="_blank"` : '';
  return `<a href="${href}"${titleAttr}${targetAttr}>${text}</a>`;
};

// Set default options for markdown rendering
marked.setOptions({
  gfm: true,
  renderer
});

// The renderer for hexo
function renderMarkdown(data, locals) {
  let html = marked(data.text); 
  return html;
}

// Add renderer to hexo
hexo.extend.renderer.register('md', 'html', renderMarkdown, true);