const fs = require('hexo-fs');
const path = require('path');

const fontAwesomePath = path.join(hexo.base_dir, 'node_modules/font-awesome/fonts')

let fontFilesPromise = null;

// Add generator to grab font awesome fonts
hexo.extend.generator.register('font-awesome', function (locals) {
  if (fontFilesPromise !== null) return fontFilesPromise;

  fontFilesPromise = fs.listDir(fontAwesomePath)
    .map(file => {
      return {
        path: `fonts/${file}`,
        data: function() {
          return fs.createReadStream(path.join(fontAwesomePath, file));
        }
      };
    });

  return fontFilesPromise;
});