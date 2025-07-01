import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function TrendingTags({ tokens }) {
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    if (!tokens.length) return;
    Promise.all(
      tokens.map(token =>
        fetch(`http://localhost:8000/api/trades/${token.id}`)
          .then(res => res.json())
          .then(trades => ({
            id: token.id,
            symbol: token.symbol,
            name: token.name,
            count: trades.filter(t => Date.now() - new Date(t.timestamp).getTime() < 24*60*60*1000).length
          }))
      )
    ).then(results => {
      setTrending(results.sort((a, b) => b.count - a.count).slice(0, 3));
    });
  }, [tokens]);

  if (!trending.length) return <div className="mb-4 text-sm text-gray-500">No trending tokens yet</div>;
  return (
    <div className="mb-4 flex gap-2 flex-wrap">
      {trending.map(t => (
        <Link key={t.id} to={`/token/${t.id}`} className="bg-yellow-200 text-yellow-900 px-3 py-1 rounded-full text-xs font-semibold hover:bg-yellow-300 transition">
          🔥 {t.name} ({t.symbol})
        </Link>
      ))}
    </div>
  );
}

export default function Home() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/tokens')
      .then(res => res.json())
      .then(data => {
        setTokens(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">Trending Memecoins</h1>
      <TrendingTags tokens={tokens} />
      {loading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <div className="grid gap-4">
          {tokens.map(token => (
            <Link
              to={`/token/${token.id}`}
              key={token.id}
              className="block bg-white rounded-lg shadow p-4 hover:bg-gray-50 transition border border-gray-200"
            >
              <div className="flex items-center gap-4">
                {token.image && <img src={token.image} alt={token.symbol} className="w-12 h-12 rounded-full object-cover" />}
                <div>
                  <div className="font-semibold text-lg">{token.name} <span className="text-gray-400">({token.symbol})</span></div>
                  <div className="text-sm text-gray-500">Launched: {new Date(token.launched_at).toLocaleString()}</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="font-mono">₹{token.price}</div>
                  <div className="text-xs text-gray-400">Vol: {token.volume}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 