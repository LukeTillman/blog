
// Add step after post rendering to generate linked data necessary for Google
hexo.extend.filter.register('after_post_render', function(data) {
  // Author / publisher info (see https://schema.org/Person)
  let author = {
    "@type": "Person",
    "name": hexo.config.author
  };

  // Attach linked data for blog post (see https://developers.google.com/search/docs/data-types/articles)
  data.ld = {
    "@context": "http://schema.org",
    "@type": "BlogPosting",
    "mainEntityOfPage": data.permalink,
    "author": author,
    "publisher": author,
    "headline": data.title,
    "keywords": data.tags ? data.tags.data.map(t => t.name).join(',') : "",
    "description": data.excerpt,
    "dateModified": data.updated.toISOString(),
    "datePublished": data.date.toISOString()
  };

  return data;
}, 11);