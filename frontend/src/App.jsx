import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Teams from './pages/Teams';
import Sidebar from './components/Sidebar';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  const [username, setUsername] = useState(localStorage.getItem('username'));

  const handleLogin = (newToken, newUserId, newUsername) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('userId', newUserId);
    localStorage.setItem('username', newUsername);
    setToken(newToken);
    setUserId(newUserId);
    setUsername(newUsername);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    setToken(null);
    setUserId(null);
    setUsername(null);
  };

  return (
    <Router>
      <div className="flex min-h-screen bg-gray-50">
        {token && <Sidebar userId={userId} token={token} username={username} />}
        
        <div className={`flex-1 ${token ? 'ml-64' : ''}`}>
          {token && (
            <div className="bg-white p-4 border-b flex justify-between items-center shadow-sm">
              <h2 className="text-gray-600 font-medium">Welcome, {username}</h2>
              <button onClick={handleLogout} className="text-sm bg-red-50 text-red-600 px-4 py-2 rounded-full hover:bg-red-100 transition">Log Out</button>
            </div>
          )}
          
          <div className="p-8 max-w-7xl mx-auto">
            <Routes>
              <Route path="/login" element={!token ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
              <Route path="/" element={token ? <Dashboard userId={userId} username={username} token={token} /> : <Navigate to="/login" />} />
              <Route path="/teams/:teamId" element={token ? <Teams userId={userId} username={username} token={token} /> : <Navigate to="/login" />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
