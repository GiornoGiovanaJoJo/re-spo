const fs = require('fs');

try {
  const data = JSON.parse(fs.readFileSync('lighthouse.json', 'utf8'));
  const categories = data.categories;

  console.log('--- Lighthouse Scores ---');
  if (categories.performance) console.log(`Performance: ${categories.performance.score * 100}`);
  if (categories.accessibility) console.log(`Accessibility: ${categories.accessibility.score * 100}`);
  if (categories['best-practices']) console.log(`Best Practices: ${categories['best-practices'].score * 100}`);
  if (categories.seo) console.log(`SEO: ${categories.seo.score * 100}`);

  console.log('\n--- Performance Audits (Score < 1.0) ---');
  const audits = data.audits;
  for (const key in audits) {
    if (audits[key].score !== null && audits[key].score < 1.0 && audits[key].scoreDisplayMode !== 'notApplicable') {
      console.log(`- ${audits[key].title} (Score: ${Math.round(audits[key].score * 100)}%): ${audits[key].displayValue || 'Potential improvement'}`);
    }
  }

  console.log('\n--- Diagnostics ---');
  if (audits['diagnostics'] && audits['diagnostics'].details) {
    console.log(`DOM Size: ${audits['dom-size'].numericValue} elements`);
    console.log(`Main thread tasks: ${audits['mainthread-work-breakdown'].numericValue} ms`);
  }
} catch (e) {
  console.log('Error parsing lighthouse.json: ' + e.message);
}
