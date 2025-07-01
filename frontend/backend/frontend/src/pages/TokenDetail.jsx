import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TradeModal from '../components/TradeModal';
import PriceChart from '../components/PriceChart';

export default function TokenDetail() {
  const { id } = useParams();
  const [token, setToken] = useState(null);
  const [trust, setTrust] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // 'buy' | 'sell' | null
  const [trades, setTrades] = useState([]);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch(`http://localhost:8000/api/token/${id}`).then(r => r.json()),
      fetch(`http://localhost:8000/api/trustscore/${id}`).then(r => r.json()),
      fetch(`http://localhost:8000/api/trades/${id}`).then(r => r.json())
    ]).then(([tokenData, trustData, tradesData]) => {
      setToken(tokenData);
      setTrust(trustData.trust_score);
      setTrades(tradesData.reverse()); // oldest first for chart
      setLoading(false);
    }).catch(() => {
      setError('Token not found');
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [id]);

  if (loading) return <div className="text-center mt-8">Loading...</div>;
  if (error) return <div className="text-center text-red-600 mt-8">{error}</div>;
  if (!token) return null;

  return (
    <div className="max-w-2xl mx-auto mt-8 bg-white p-6 rounded shadow">
      <div className="flex items-center gap-4 mb-4">
        {token.image && <img src={token.image} alt={token.symbol} className="w-16 h-16 rounded-full object-cover" />}
        <div>
          <div className="text-2xl font-bold">{token.name} <span className="text-gray-400">({token.symbol})</span></div>
          <div className="text-sm text-gray-500">Launched: {new Date(token.launched_at).toLocaleString()}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="font-mono text-xl">₹{token.price}</div>
          <div className="text-xs text-gray-400">Vol: {token.volume}</div>
        </div>
      </div>
      <div className="flex gap-6 mb-4">
        <div><span className="font-semibold">Supply:</span> {token.supply}</div>
        <div><span className="font-semibold">Holders:</span> {token.holders}</div>
        <div><span className="font-semibold">Trust Score:</span> <span className="font-mono">{trust ?? '--'}</span></div>
      </div>
      <div className="mb-4">
        <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mr-2" onClick={() => setModal('buy')}>Buy</button>
        <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700" onClick={() => setModal('sell')}>Sell</button>
      </div>
      <div className="mb-4">
        <div className="mb-2 font-semibold">Price Chart</div>
        <PriceChart trades={trades} />
      </div>
      <div className="mb-4">
        <div className="mb-2 font-semibold">Recent Trades</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1 text-left">Type</th>
                <th className="px-2 py-1 text-left">Amount</th>
                <th className="px-2 py-1 text-left">Price</th>
                <th className="px-2 py-1 text-left">Time</th>
              </tr>
            </thead>
            <tbody>
              {trades.length === 0 ? (
                <tr><td colSpan={4} className="text-center text-gray-400 py-2">No trades yet</td></tr>
              ) : trades.slice().reverse().map((t, i) => (
                <tr key={i}>
                  <td className={t.type === 'buy' ? 'text-green-600' : 'text-red-600'}>{t.type}</td>
                  <td>{t.amount}</td>
                  <td>₹{t.price}</td>
                  <td>{new Date(t.timestamp).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <TradeModal open={!!modal} onClose={() => setModal(null)} token={token} type={modal} onSuccess={fetchData} />
    </div>
  );
} 