import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Chat from '../components/Chat';
import TaskItem from '../components/TaskItem';

const TASK_URL = 'http://localhost:3003';
const TEAM_URL = 'http://localhost:3002';

export default function Teams({ userId, username, token }) {
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [newTaskAssignees, setNewTaskAssignees] = useState([]);
  const [sortBy, setSortBy] = useState('date_desc');

  const fetchWorkspaceData = async () => {
    try {
      const teamRes = await axios.get(`${TEAM_URL}/teams/${teamId}`, { headers: { 'x-user-id': userId, 'x-username': username } });
      const taskRes = await axios.get(`${TASK_URL}/tasks`, { headers: { 'x-user-id': userId, 'x-username': username } });
      setTeam(teamRes.data);
      setTasks(taskRes.data.filter(t => t.teamId === teamId));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [teamId, userId]);

  const handleCreateTask = async (e, parentTaskId = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const title = parentTaskId ? e : newTaskTitle;
    if (!title) return;
    
    const deadline = parentTaskId ? null : newTaskDeadline;
    const assignees = parentTaskId ? [userId] : (newTaskAssignees.length > 0 ? newTaskAssignees : [userId]);

    try {
      await axios.post(`${TASK_URL}/tasks`, { title, parentTaskId, teamId, assignees, deadline }, { headers: { 'x-user-id': userId, 'x-username': username } });
      if (!parentTaskId) {
        setNewTaskTitle('');
        setNewTaskDeadline('');
        setNewTaskAssignees([]);
      }
      fetchWorkspaceData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteTask = async (id, status) => {
    try {
      await axios.put(`${TASK_URL}/tasks/${id}`, { status }, { headers: { 'x-user-id': userId, 'x-username': username } });
      fetchWorkspaceData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await axios.delete(`${TASK_URL}/tasks/${id}`, { headers: { 'x-user-id': userId, 'x-username': username } });
      fetchWorkspaceData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (id, text) => {
    try {
      await axios.post(`${TASK_URL}/tasks/${id}/comments`, { text }, { headers: { 'x-user-id': userId, 'x-username': username } });
      fetchWorkspaceData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTask = async (id, updates) => {
    try {
      await axios.put(`${TASK_URL}/tasks/${id}`, updates, { headers: { 'x-user-id': userId, 'x-username': username } });
      fetchWorkspaceData();
    } catch (err) {
      console.error(err);
    }
  };

  // Sort & Filter
  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortBy === 'date_desc') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'date_asc') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === 'name') return a.title.localeCompare(b.title);
    return 0;
  });

  const topLevelTasks = sortedTasks.filter(t => !t.parentTaskId);
  const activeTasks = topLevelTasks.filter(t => t.status !== 'completed');
  const completedTasks = topLevelTasks.filter(t => t.status === 'completed');

  if (!team) return <div className="p-8 text-center text-gray-500">Loading Workspace...</div>;

  return (
    <div className="grid grid-cols-3 gap-8">
      {/* Left Column: Taskboard */}
      <div className="col-span-2">
        <div className="flex justify-between items-end mb-6 border-b pb-4 border-gray-200">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">{team.name}</h2>
            <p className="text-sm text-gray-500 mt-1">Join Code: <span className="font-mono bg-gray-100 p-1 rounded select-all">{team._id}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 text-sm">Sort By:</span>
            <select className="border rounded p-1 text-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        <form onSubmit={handleCreateTask} className="mb-6 shadow-sm border border-gray-200 rounded bg-white p-4">
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input 
                className="p-2 border rounded flex-1 outline-none focus:ring-1 focus:ring-blue-500" 
                placeholder="What needs to be done for this team?" 
                value={newTaskTitle} 
                onChange={(e) => setNewTaskTitle(e.target.value)} 
              />
              <input 
                type="date"
                className="p-2 border rounded outline-none text-gray-600 text-sm focus:ring-1 focus:ring-blue-500"
                value={newTaskDeadline}
                onChange={(e) => setNewTaskDeadline(e.target.value)}
              />
              <button className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 transition">Add Task</button>
            </div>
            
            <div className="bg-gray-50 p-2 rounded border border-gray-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Assign To Members:</span>
              <div className="flex flex-wrap gap-4">
                {team.members.map(m => (
                  <label key={m.userId} className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox"
                      className="accent-blue-600 w-4 h-4"
                      checked={newTaskAssignees.includes(m.userId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewTaskAssignees([...newTaskAssignees, m.userId]);
                        } else {
                          setNewTaskAssignees(newTaskAssignees.filter(id => id !== m.userId));
                        }
                      }}
                    />
                    <span className="text-sm font-medium text-gray-700">{m.username || (m.userId === userId ? username : m.userId)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </form>

        <div className="mb-8">
          <h3 className="text-lg font-bold mb-3 text-gray-700">Active Tasks</h3>
          <div className="grid gap-2">
            {activeTasks.map(task => (
              <TaskItem 
                key={task._id} 
                task={task} 
                allTasks={sortedTasks}
                teamMembers={team.members} // Passed to allow assignments
                username={username}
                userId={userId}
                onComplete={handleCompleteTask}
                onCreateSubtask={(parentId, title) => handleCreateTask(title, parentId)}
                onAddComment={handleAddComment}
                onDelete={handleDeleteTask}
                onUpdateTask={handleUpdateTask}
              />
            ))}
            {activeTasks.length === 0 && <p className="text-gray-500 italic">No active tasks.</p>}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-3 text-gray-400">Completed Tasks</h3>
          <div className="grid gap-2 opacity-75">
            {completedTasks.map(task => (
              <TaskItem 
                key={task._id} 
                task={task} 
                allTasks={sortedTasks}
                teamMembers={team.members}
                username={username}
                userId={userId}
                onComplete={handleCompleteTask}
                onCreateSubtask={(parentId, title) => handleCreateTask(title, parentId)}
                onAddComment={handleAddComment}
                onDelete={handleDeleteTask}
                onUpdateTask={handleUpdateTask}
              />
            ))}
            {completedTasks.length === 0 && <p className="text-gray-400 italic">No completed tasks.</p>}
          </div>
        </div>
      </div>

      {/* Right Column: Chat & Members */}
      <div className="col-span-1 space-y-6">
        <Chat teamId={teamId} userId={userId} username={username} teamMembers={team.members} />
        
        <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
          <h3 className="font-bold border-b pb-2 mb-2 text-gray-800">Team Members</h3>
          <ul className="space-y-2 max-h-40 overflow-y-auto">
            {team.members.map(m => (
              <li key={m.userId} className="flex justify-between items-center text-sm">
                <span className="font-semibold text-gray-700">{m.username}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{m.jobTitle}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
