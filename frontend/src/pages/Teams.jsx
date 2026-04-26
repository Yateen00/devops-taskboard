import React, { useState } from 'react';
import axios from 'axios';
import Chat from '../components/Chat';

const TEAM_URL = 'http://localhost:3002';

export default function Teams({ userId, token }) {
  const [teamName, setTeamName] = useState('');
  const [activeTeamId, setActiveTeamId] = useState(null);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${TEAM_URL}/teams`, { name: teamName }, { headers: { 'x-user-id': userId } });
      setTeamName('');
      setActiveTeamId(res.data._id);
      alert(`Team ${res.data.name} created!`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-1 bg-white p-4 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Create Team</h2>
        <form onSubmit={handleCreateTeam} className="space-y-2">
          <input 
            className="w-full border p-2 rounded" 
            placeholder="Team Name" 
            value={teamName} 
            onChange={(e) => setTeamName(e.target.value)} 
            required 
          />
          <button className="w-full bg-blue-600 text-white p-2 rounded">Create</button>
        </form>

        <div className="mt-8">
          <h3 className="font-semibold text-gray-600 mb-2">Simulate Active Team</h3>
          <input 
            className="w-full border p-2 rounded mb-2 text-sm" 
            placeholder="Paste Team ID here to chat..." 
            value={activeTeamId || ''} 
            onChange={(e) => setActiveTeamId(e.target.value)} 
          />
        </div>
      </div>

      <div className="col-span-2">
        {activeTeamId ? (
          <Chat teamId={activeTeamId} userId={userId} />
        ) : (
          <div className="bg-white p-8 rounded shadow text-center text-gray-500">
            Create or select a team to start chatting and managing members.
          </div>
        )}
      </div>
    </div>
  );
}
