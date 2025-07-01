import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TradeModal({ open, onClose, token, type, onSuccess }) {
  const [amount, setAmount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleTrade = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`http://localhost:8000/api/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token_id: token.id, amount: Number(amount) })
      });
      if (!res.ok) throw new Error('Trade failed');
      const data = await res.json();
      setResult(data);
      onSuccess && onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
            <h2 className="text-xl font-bold mb-2">{type === 'buy' ? 'Buy' : 'Sell'} {token.name}</h2>
            <div className="mb-4">Price: <span className="font-mono">₹{token.price}</span></div>
            <input type="number" min={1} value={amount} onChange={e => setAmount(e.target.value)} className="w-full border rounded px-3 py-2 mb-4" />
            {error && <div className="text-red-600 mb-2">{error}</div>}
            {result && <div className="text-green-700 mb-2">Success! New price: ₹{result.new_price}</div>}
            <div className="flex gap-2">
              <button onClick={handleTrade} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex-1">{loading ? 'Processing...' : (type === 'buy' ? 'Buy' : 'Sell')}</button>
              <button onClick={onClose} className="bg-gray-300 px-4 py-2 rounded flex-1">Cancel</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 