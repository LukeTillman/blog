const gitRev = require('git-rev');

let revisionPromise = new Promise(resolve => gitRev.short(resolve));

// Use a template_locals filter so the revision info is available on all templates
hexo.extend.filter.register('template_locals', function(locals) {
  // Add git revision info to data
  return revisionPromise.then(shortRev => {
    locals.page.revision = shortRev;
    locals.page.revision_url = `${hexo.config.git.repo_url}/tree/${shortRev}`
    return locals;
  });
});