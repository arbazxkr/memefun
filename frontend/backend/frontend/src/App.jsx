import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import LaunchToken from './pages/LaunchToken';
import TokenDetail from './pages/TokenDetail';

function Navbar() {
  return (
    <nav className="bg-gray-900 text-white px-4 py-3 flex justify-between items-center shadow">
      <Link to="/" className="text-2xl font-bold tracking-tight">MemeFun</Link>
      <div className="space-x-4">
        <Link to="/launch" className="hover:underline">Launch Token</Link>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <Navbar />
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/launch" element={<LaunchToken />} />
          <Route path="/token/:id" element={<TokenDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
