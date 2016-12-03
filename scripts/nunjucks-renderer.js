const nj = require('nunjucks');
const path = require('path');

// Don't use a cache when doing serve for local development
let noCache = hexo.env.args._[0] === 'serve' ? true : false;

// Get path to layouts and create NJ environment
const layoutsPath = path.join(hexo.theme.base, 'layout');
const njEnv = nj.configure(layoutsPath, { noCache });

// Add a custom filter for debugging
njEnv.addFilter('debug', function(obj) {
  debugger;
});

function njRender(data, locals) {
  return njEnv.renderString(data.text, locals);
}

njRender.compile = function(data, locals) {
  let template = new nj.Template(data.text, njEnv, data.path);
  return template.render.bind(template);
};

// Register with hexo
hexo.extend.renderer.register('njk', 'html', njRender, true);