import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LaunchToken() {
  const [form, setForm] = useState({ name: '', symbol: '', description: '', image: '', supply: 1000000 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:8000/api/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          symbol: form.symbol,
          supply: Number(form.supply),
          image: form.image
        })
      });
      if (!res.ok) throw new Error('Failed to launch token');
      const data = await res.json();
      navigate(`/token/${data.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-8 bg-white p-6 rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Launch a New Memecoin</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Name</label>
          <input name="name" value={form.name} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block font-medium">Symbol</label>
          <input name="symbol" value={form.symbol} onChange={handleChange} required className="w-full border rounded px-3 py-2 uppercase" maxLength={8} />
        </div>
        <div>
          <label className="block font-medium">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block font-medium">Image URL</label>
          <input name="image" value={form.image} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block font-medium">Initial Supply</label>
          <input name="supply" type="number" value={form.supply} onChange={handleChange} min={1} className="w-full border rounded px-3 py-2" />
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" disabled={loading}>
          {loading ? 'Launching...' : 'Launch Token'}
        </button>
      </form>
    </div>
  );
} 