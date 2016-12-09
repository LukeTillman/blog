const striptags = require('striptags');
const ent = require('ent');

// Add a custom filter to generate the excerpt for a post
hexo.extend.filter.register('after_post_render', function(data) {
  if (data.excerpt !== '') return data;

  // Strip tags, get up to 250 characters, replace line breaks, and decode HTML entities
  let excerpt = striptags(data.content).substr(0, 250);
  excerpt = excerpt.substr(0, Math.min(excerpt.length, excerpt.lastIndexOf(' ')));
  excerpt = excerpt.replace(/\r|\n/g, ' ');
  data.excerpt = ent.decode(excerpt);
  return data;
}, 10);