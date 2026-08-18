// Static marketing site — no backend. The ticker below is illustrative,
// not live data; wire it to the app's rateService (see ../src/services/rateService.js)
// if this ever needs real numbers.

const MOCK_TICKER = [
  { sym: 'BTC', rate: '₦98,650,000', up: true },
  { sym: 'ETH', rate: '₦5,392,300', up: true },
  { sym: 'SOL', rate: '₦239,800', up: false },
  { sym: 'USDT', rate: '₦1,610', up: true },
  { sym: 'TRX', rate: '₦212', up: true },
  { sym: 'TON', rate: '₦11,050', up: false },
  { sym: 'SUI', rate: '₦5,490', up: true },
  { sym: 'XRP', rate: '₦982', up: false },
  { sym: 'ADA', rate: '₦740', up: true },
  { sym: 'AVAX', rate: '₦43,720', up: false },
];

function buildTicker() {
  const track = document.getElementById('tickerTrack');
  const items = [...MOCK_TICKER, ...MOCK_TICKER]; // duplicate for seamless loop
  track.innerHTML = items
    .map(
      (i) =>
        `<span><span class="sym">${i.sym}</span>${i.rate} <span class="${i.up ? 'up' : ''}">${i.up ? '▲' : '▼'}</span></span>`
    )
    .join('');
}

// Draws a simple chain of six links as an SVG path group. The middle two
// links are tagged break-left / break-right so CSS can snap them apart
// once the section scrolls into view — the same visual idea as the mark.
function buildChain() {
  const group = document.getElementById('chainGroup');
  const linkCount = 9;
  const spacing = 1200 / (linkCount + 1);
  const midpoint = Math.floor(linkCount / 2);

  for (let i = 0; i < linkCount; i++) {
    const cx = spacing * (i + 1);
    const isViolet = i > midpoint;
    const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    ellipse.setAttribute('cx', cx);
    ellipse.setAttribute('cy', 60);
    ellipse.setAttribute('rx', 26);
    ellipse.setAttribute('ry', 38);
    ellipse.setAttribute('class', 'chain-link' + (isViolet ? ' violet' : ''));
    if (i === midpoint) ellipse.classList.add('break-left');
    if (i === midpoint + 1) ellipse.classList.add('break-right');
    group.appendChild(ellipse);
  }
}

function observeChainBreak() {
  const section = document.getElementById('chainbreak');
  if (!('IntersectionObserver' in window)) {
    section.classList.add('is-broken');
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          section.classList.add('is-broken');
          observer.disconnect();
        }
      });
    },
    { threshold: 0.5 }
  );
  observer.observe(section);
}

function wireWaitlistForm() {
  const form = document.getElementById('waitlistForm');
  const note = document.getElementById('waitlistNote');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // No backend wired up yet — TODO(integration): POST to a waitlist
    // endpoint or a service like ConvertKit/Mailchimp.
    note.textContent = "You're on the list — we'll email you when it's your turn.";
    form.reset();
  });
}

buildTicker();
buildChain();
observeChainBreak();
wireWaitlistForm();
