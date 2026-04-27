import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import TaskItem from '../components/TaskItem';

const TASK_URL = 'http://localhost:3003';
const TEAM_URL = 'http://localhost:3002';

export default function Dashboard({ userId, username, token }) {
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]); // Needed for global tasks to display team name
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');

  const fetchData = async () => {
    try {
      const taskRes = await axios.get(`${TASK_URL}/tasks`, { headers: { 'x-user-id': userId, 'x-username': username } });
      const teamRes = await axios.get(`${TEAM_URL}/teams/user`, { headers: { 'x-user-id': userId, 'x-username': username } });
      setTasks(taskRes.data);
      setTeams(teamRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const handleCreatePersonalTask = async (e, parentTaskId = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const title = parentTaskId ? e : newTaskTitle;
    if (!title) return;
    
    const deadline = parentTaskId ? null : newTaskDeadline;
    
    try {
      await axios.post(`${TASK_URL}/tasks`, { title, parentTaskId, assignees: [userId], deadline }, { headers: { 'x-user-id': userId, 'x-username': username } });
      if (!parentTaskId) {
        setNewTaskTitle('');
        setNewTaskDeadline('');
      }
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteTask = async (id, status) => {
    try {
      await axios.put(`${TASK_URL}/tasks/${id}`, { status }, { headers: { 'x-user-id': userId, 'x-username': username } });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await axios.delete(`${TASK_URL}/tasks/${id}`, { headers: { 'x-user-id': userId, 'x-username': username } });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (id, text) => {
    try {
      await axios.post(`${TASK_URL}/tasks/${id}/comments`, { text }, { headers: { 'x-user-id': userId, 'x-username': username } });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTask = async (id, updates) => {
    try {
      await axios.put(`${TASK_URL}/tasks/${id}`, updates, { headers: { 'x-user-id': userId, 'x-username': username } });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const myGlobalTasks = tasks.filter(t => t.teamId && t.assignees.includes(userId) && t.status !== 'completed');
  const myPersonalTasks = tasks.filter(t => !t.teamId && !t.parentTaskId);
  const myPersonalActive = myPersonalTasks.filter(t => t.status !== 'completed');
  const myPersonalCompleted = myPersonalTasks.filter(t => t.status === 'completed');

  return (
    <div className="grid grid-cols-2 gap-8">
      
      {/* Left Column: Personal Tasks */}
      <div className="space-y-8">
        
        <div>
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">My Personal Board</h2>
          <form onSubmit={handleCreatePersonalTask} className="mb-6 shadow-sm border border-gray-200 rounded overflow-hidden">
            <div className="flex bg-white">
              <input 
                className="p-3 flex-1 outline-none" 
                placeholder="What needs to be done?" 
                value={newTaskTitle} 
                onChange={(e) => setNewTaskTitle(e.target.value)} 
              />
              <input 
                type="date"
                className="p-3 border-l outline-none text-gray-600 text-sm"
                value={newTaskDeadline}
                onChange={(e) => setNewTaskDeadline(e.target.value)}
              />
              <button className="bg-blue-600 text-white px-6 py-3 font-semibold hover:bg-blue-700 transition">Add</button>
            </div>
          </form>

          <div className="mb-8">
            <h3 className="text-lg font-bold mb-3 text-gray-700">Active Tasks</h3>
            <div className="grid gap-2">
              {myPersonalActive.map(task => (
                <TaskItem 
                  key={task._id} 
                  task={task} 
                  allTasks={tasks}
                  username={username}
                  userId={userId}
                  onComplete={handleCompleteTask}
                  onCreateSubtask={(parentId, title) => handleCreatePersonalTask(title, parentId)}
                  onAddComment={handleAddComment}
                  onDelete={handleDeleteTask}
                  onUpdateTask={handleUpdateTask}
                />
              ))}
              {myPersonalActive.length === 0 && <p className="text-gray-500 italic">No active personal tasks.</p>}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3 text-gray-400">Completed Tasks</h3>
            <div className="grid gap-2 opacity-75">
              {myPersonalCompleted.map(task => (
                <TaskItem 
                  key={task._id} 
                  task={task} 
                  allTasks={tasks}
                  username={username}
                  userId={userId}
                  onComplete={handleCompleteTask}
                  onCreateSubtask={(parentId, title) => handleCreatePersonalTask(title, parentId)}
                  onAddComment={handleAddComment}
                  onDelete={handleDeleteTask}
                  onUpdateTask={handleUpdateTask}
                />
              ))}
              {myPersonalCompleted.length === 0 && <p className="text-gray-400 italic">No completed tasks.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Global Team Tasks */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Global Assigned Tasks (From Teams)</h2>
        <div className="space-y-4">
          {myGlobalTasks.length === 0 ? (
            <p className="text-gray-500 italic">No team tasks assigned to you right now.</p>
          ) : (
            myGlobalTasks.map(task => {
              const team = teams.find(t => t._id === task.teamId);
              return (
                <div key={task._id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition">
                  <div>
                    <h4 className="font-semibold text-lg text-gray-800">{task.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      From Team: <span className="font-medium text-blue-600">{team ? team.name : 'Unknown Team'}</span>
                    </p>
                  </div>
                  <Link to={team ? `/teams/${team._id}` : `/`} className="bg-blue-50 text-blue-600 px-4 py-2 rounded text-sm hover:bg-blue-100 transition">
                    View Board →
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
