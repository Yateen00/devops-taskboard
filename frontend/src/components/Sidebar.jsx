import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';

const TEAM_URL = 'http://localhost:3002';

export default function Sidebar({ userId, token, username }) {
  const [teams, setTeams] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const location = useLocation();

  const fetchTeams = async () => {
    try {
      const res = await axios.get(`${TEAM_URL}/teams/user`, { 
        headers: { 'x-user-id': userId, 'x-username': username } 
      });
      setTeams(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (userId) fetchTeams();
  }, [userId, location.pathname]); // Re-fetch occasionally

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    if (!joinCode) return;
    try {
      await axios.post(`${TEAM_URL}/teams/join/${joinCode}`, {}, { headers: { 'x-user-id': userId, 'x-username': username } });
      setJoinCode('');
      fetchTeams();
      // Reload page to refresh dashboard state
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.error || 'Error joining team');
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName) return;
    try {
      await axios.post(`${TEAM_URL}/teams`, { name: newTeamName }, { headers: { 'x-user-id': userId, 'x-username': username } });
      setNewTeamName('');
      fetchTeams();
      window.location.reload();
    } catch (err) {
      alert('Error creating team');
    }
  };

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col min-h-screen fixed left-0 top-0">
      <div className="p-4 font-bold text-2xl border-b border-gray-700 tracking-wider">
        TaskFlow
      </div>
      
      <div className="p-4">
        <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2">Global Hub</h3>
        <Link to="/" className={`block py-2 px-3 rounded ${location.pathname === '/' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}>
          🏠 Dashboard
        </Link>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2 flex justify-between items-center">
          My Teams
        </h3>
        
        {teams.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No teams yet.</p>
        ) : (
          <ul className="space-y-1">
            {teams.map(team => (
              <li key={team._id}>
                <Link 
                  to={`/teams/${team._id}`} 
                  className={`block py-2 px-3 rounded truncate ${location.pathname === `/teams/${team._id}` ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
                >
                  <span className="opacity-75 mr-2">#</span> {team.name}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 border-t border-gray-800 pt-4">
          <form onSubmit={handleJoinTeam} className="flex gap-1 mb-2">
            <input 
              className="bg-gray-800 border-none p-1.5 rounded flex-1 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500" 
              placeholder="Paste Join Code..." 
              value={joinCode} 
              onChange={(e) => setJoinCode(e.target.value)} 
            />
            <button className="bg-blue-600 px-3 py-1.5 rounded text-xs font-semibold hover:bg-blue-500 transition">Join</button>
          </form>
          <form onSubmit={handleCreateTeam} className="flex gap-1">
            <input 
              className="bg-gray-800 border-none p-1.5 rounded flex-1 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500" 
              placeholder="New Team Name..." 
              value={newTeamName} 
              onChange={(e) => setNewTeamName(e.target.value)} 
            />
            <button className="bg-blue-600 px-3 py-1.5 rounded text-xs font-semibold hover:bg-blue-500 transition">Add</button>
          </form>
        </div>
      </div>

      <div className="p-4 border-t border-gray-700 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-sm">
          {username?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1 truncate">
          <p className="text-sm font-semibold">{username}</p>
          <p className="text-xs text-gray-400">Online</p>
        </div>
      </div>
    </div>
  );
}
