const https = require('https');

https.get('https://m-trud.ru/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const scripts = (data.match(/<script/g) || []).length;
    const styles = (data.match(/<link[^>]*rel="stylesheet"/gi) || []).length;
    const inlineStyles = (data.match(/<style/g) || []).length;
    console.log(`HTML Size: ${(data.length / 1024).toFixed(2)} KB`);
    console.log(`Script tags: ${scripts}`);
    console.log(`Stylesheet links: ${styles}`);
    console.log(`Inline style tags: ${inlineStyles}`);
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
