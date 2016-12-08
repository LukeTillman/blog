const excerptHtml = require('excerpt-html');

// Add a custom filter to generate the excerpt for a post
hexo.extend.filter.register('after_post_render', function(data) {
  if (data.excerpt !== '') return data;

  // Use first paragraph or everything up to <-- more -->
  let excerpt = excerptHtml(data.content, { stripTags: true, pruneLength: 250, pruneString: '...', pruneSeperator: ' ' });
  data.excerpt = excerpt;
  return data;
}, 10);