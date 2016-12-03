const nj = require('nunjucks');
const path = require('path');

// Get path to layouts and create NJ environment
const layoutsPath = path.join(hexo.theme.base, 'layouts');
const njEnv = nj.configure(layoutsPath);

function njRender(data, locals) {
  return njEnv.renderString(data.text, locals);
}

njRender.compile = function(data, locals) {
  let template = new nj.Template(data.text, njEnv, data.path);
  return template.render.bind(template);
};

// Register with hexo
hexo.extend.renderer.register('njk', 'html', njRender, true);