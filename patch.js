const fs = require('fs');
function patch(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const p of pairs) {
    const n = s.split(p[0]).length - 1;
    if (n !== 1) { console.log('ABORT count ' + n + ' for: ' + p[0]); process.exit(1); }
  }
  for (const p of pairs) s = s.replace(p[0], function () { return p[1]; });
  fs.writeFileSync(file, s);
  console.log('patched ' + file);
}

patch('src/screens/swap/SwapScreen.js', [
  ["USDT: ['bsc', 'base'],",
   "USDT: ['solana', 'bsc', 'base'],"],
  ["USDT (BNB Chain or Base)",
   "USDT (Solana, BNB Chain or Base)"],
]);
