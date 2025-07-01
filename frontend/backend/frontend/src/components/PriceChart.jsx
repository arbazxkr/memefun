export default function PriceChart({ trades }) {
  if (!trades || trades.length === 0) {
    return <div className="text-gray-400">No price data</div>;
  }
  // Sort trades by timestamp ascending
  const sorted = [...trades].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const prices = sorted.map(t => t.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const w = 320, h = 80, pad = 10;
  const points = prices.map((p, i) => {
    const x = pad + (w - 2 * pad) * (i / (prices.length - 1 || 1));
    const y = h - pad - ((p - min) / (max - min || 1)) * (h - 2 * pad);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} className="bg-gray-100 rounded">
      <polyline
        fill="none"
        stroke="#2563eb"
        strokeWidth="2"
        points={points}
      />
      {/* Axes */}
      <text x={pad} y={pad + 10} fontSize="10" fill="#888">₹{max}</text>
      <text x={pad} y={h - pad} fontSize="10" fill="#888">₹{min}</text>
    </svg>
  );
} 