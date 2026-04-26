import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TASK_URL = 'http://localhost:3003';

export default function Dashboard({ userId, token }) {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${TASK_URL}/tasks`, { headers: { 'x-user-id': userId } });
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [userId]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle) return;
    try {
      await axios.post(`${TASK_URL}/tasks`, { title: newTaskTitle, assignees: [userId] }, { headers: { 'x-user-id': userId } });
      setNewTaskTitle('');
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteTask = async (id, status) => {
    try {
      await axios.put(`${TASK_URL}/tasks/${id}`, { status }, { headers: { 'x-user-id': userId } });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">My Tasks</h2>
      
      <form onSubmit={handleCreateTask} className="mb-6 flex gap-2">
        <input 
          className="border p-2 rounded flex-1" 
          placeholder="New Task Title..." 
          value={newTaskTitle} 
          onChange={(e) => setNewTaskTitle(e.target.value)} 
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Add Task</button>
      </form>

      <div className="grid gap-4">
        {tasks.map(task => (
          <div key={task._id} className="bg-white p-4 rounded shadow border flex justify-between items-center">
            <div>
              <h3 className={`font-semibold ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>{task.title}</h3>
              <p className="text-sm text-gray-500">Status: {task.status}</p>
            </div>
            {task.status !== 'completed' && (
              <button 
                onClick={() => handleCompleteTask(task._id, 'completed')}
                className="bg-green-500 text-white px-3 py-1 rounded text-sm"
              >
                Complete
              </button>
            )}
          </div>
        ))}
        {tasks.length === 0 && <p className="text-gray-500">No tasks found. Create one!</p>}
      </div>
    </div>
  );
}
