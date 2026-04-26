import React, { useState } from 'react';
import axios from 'axios';

const AUTH_URL = 'http://localhost:3001'; // Assuming local dev

export default function Login({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isSignup ? '/signup' : '/login';
      const res = await axios.post(`${AUTH_URL}${endpoint}`, { username, password });
      if (isSignup) {
        alert('Signup successful, please login');
        setIsSignup(false);
      } else {
        onLogin(res.data.token, res.data.userId);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'An error occurred');
    }
  };

  return (
    <div className="flex items-center justify-center h-[80vh]">
      <div className="bg-white p-8 rounded shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">
          {isSignup ? 'Create Account' : 'Welcome Back'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full border p-2 rounded"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            className="w-full border p-2 rounded"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            {isSignup ? 'Sign Up' : 'Login'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <button className="text-blue-500 hover:underline" onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? 'Login' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}
