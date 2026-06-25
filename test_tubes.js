const https = require('https');
https.get('https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log("createElement canvas:", d.includes('createElement("canvas"') || d.includes("createElement('canvas'"));
    console.log("getElementById:", d.includes("getElementById"));
    // check if it appends canvas
    const idx = d.indexOf(".appendChild(");
    if(idx > -1) {
      console.log("appendChild found at", idx);
      console.log(d.substring(idx-50, idx+50));
    }
  });
});
