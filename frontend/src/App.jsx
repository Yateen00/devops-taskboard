import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Teams from './pages/Teams';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userId, setUserId] = useState(localStorage.getItem('userId'));

  const handleLogin = (newToken, newUserId) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('userId', newUserId);
    setToken(newToken);
    setUserId(newUserId);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setToken(null);
    setUserId(null);
  };

  return (
    <Router>
      <div className="min-h-screen">
        {token && (
          <nav className="bg-blue-600 text-white p-4 flex justify-between shadow-md">
            <h1 className="text-xl font-bold">TaskFlow</h1>
            <div className="space-x-4">
              <a href="/" className="hover:underline">Dashboard</a>
              <a href="/teams" className="hover:underline">Teams</a>
              <button onClick={handleLogout} className="bg-red-500 px-3 py-1 rounded">Logout</button>
            </div>
          </nav>
        )}
        <div className="p-4 max-w-6xl mx-auto">
          <Routes>
            <Route path="/login" element={!token ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
            <Route path="/" element={token ? <Dashboard userId={userId} token={token} /> : <Navigate to="/login" />} />
            <Route path="/teams" element={token ? <Teams userId={userId} token={token} /> : <Navigate to="/login" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
