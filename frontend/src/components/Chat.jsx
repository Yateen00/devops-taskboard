import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const CHAT_URL = 'http://localhost:3004';
let socket;

export default function Chat({ teamId, userId, teamMembers }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    socket = io(CHAT_URL);
    socket.emit('join_team', teamId);

    // Fetch history
    axios.get(`${CHAT_URL}/messages/${teamId}`, { headers: { 'x-user-id': userId } })
      .then(res => setMessages(res.data))
      .catch(console.error);

    socket.on('receive_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, [teamId, userId]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text) return;

    socket.emit('send_message', { teamId, senderId: userId, text });
    setText('');
  };

  return (
    <div className="bg-gray-800 p-4 rounded border border-gray-700 shadow flex flex-col h-[60vh] text-gray-200">
      <h3 className="font-bold border-b border-gray-700 pb-2 mb-2">Team Chat</h3>
      
      <div className="flex-1 overflow-y-auto space-y-2 mb-4 p-2">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.senderId === userId ? 'items-end' : 'items-start'}`}>
            <span className="text-xs text-gray-400 font-medium mb-1">
              {m.senderId === userId ? 'You' : (teamMembers?.find(mem => mem.userId === m.senderId)?.username || m.senderId)}
            </span>
            <div className={`p-2 rounded max-w-[80%] ${m.senderId === userId ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input 
          className="border border-gray-600 bg-gray-700 text-gray-100 p-2 rounded flex-1 focus:outline-none focus:border-blue-500" 
          placeholder="Type a message..." 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Send</button>
      </form>
    </div>
  );
}
