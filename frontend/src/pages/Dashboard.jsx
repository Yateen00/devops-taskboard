import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TaskItem from '../components/TaskItem';

const TASK_URL = 'http://localhost:3003';

export default function Dashboard({ userId, token }) {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');

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

  const handleCreateTask = async (e, parentTaskId = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const title = parentTaskId ? e : newTaskTitle; // If parentTaskId is set, 'e' is actually the title string
    if (!title) return;
    try {
      await axios.post(`${TASK_URL}/tasks`, { title, parentTaskId, assignees: [userId] }, { headers: { 'x-user-id': userId } });
      if (!parentTaskId) setNewTaskTitle('');
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

  const handleDeleteTask = async (id) => {
    try {
      await axios.delete(`${TASK_URL}/tasks/${id}`, { headers: { 'x-user-id': userId } });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (id, text) => {
    try {
      await axios.post(`${TASK_URL}/tasks/${id}/comments`, { text }, { headers: { 'x-user-id': userId } });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Sort Tasks
  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortBy === 'date_desc') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'date_asc') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === 'name') return a.title.localeCompare(b.title);
    return 0;
  });

  // 2. Extract Top Level Tasks
  const topLevelTasks = sortedTasks.filter(t => !t.parentTaskId);
  
  // 3. Separate Active and Completed
  const activeTasks = topLevelTasks.filter(t => t.status !== 'completed');
  const completedTasks = topLevelTasks.filter(t => t.status === 'completed');

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">My Tasks</h2>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Sort By:</span>
          <select 
            className="border rounded p-1"
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>
      
      <form onSubmit={handleCreateTask} className="mb-8 flex gap-2 shadow-sm">
        <input 
          className="border p-3 rounded flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500" 
          placeholder="What needs to be done?" 
          value={newTaskTitle} 
          onChange={(e) => setNewTaskTitle(e.target.value)} 
        />
        <button className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 transition">Add Root Task</button>
      </form>

      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4 text-gray-700 border-b pb-2">Active Tasks</h3>
        <div className="grid gap-2">
          {activeTasks.map(task => (
            <TaskItem 
              key={task._id} 
              task={task} 
              allTasks={sortedTasks}
              onComplete={handleCompleteTask}
              onCreateSubtask={(parentId, title) => handleCreateTask(title, parentId)}
              onAddComment={handleAddComment}
              onDelete={handleDeleteTask}
            />
          ))}
          {activeTasks.length === 0 && <p className="text-gray-500 italic">No active tasks.</p>}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-4 text-gray-400 border-b pb-2">Completed Tasks</h3>
        <div className="grid gap-2 opacity-75">
          {completedTasks.map(task => (
            <TaskItem 
              key={task._id} 
              task={task} 
              allTasks={sortedTasks}
              onComplete={handleCompleteTask}
              onCreateSubtask={(parentId, title) => handleCreateTask(title, parentId)}
              onAddComment={handleAddComment}
              onDelete={handleDeleteTask}
            />
          ))}
          {completedTasks.length === 0 && <p className="text-gray-400 italic">No completed tasks yet.</p>}
        </div>
      </div>
    </div>
  );
}
