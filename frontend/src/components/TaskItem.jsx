import React, { useState } from 'react';

export default function TaskItem({ task, allTasks, teamMembers, username, userId, onComplete, onCreateSubtask, onAddComment, onDelete, onUpdateTask }) {
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentText, setCommentText] = useState('');

  const childTasks = allTasks.filter(t => t.parentTaskId === task._id);

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!subtaskTitle) return;
    onCreateSubtask(task._id, subtaskTitle);
    setSubtaskTitle('');
    setShowSubtaskForm(false);
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentText) return;
    onAddComment(task._id, commentText);
    setCommentText('');
    setShowCommentForm(false);
  };

  const daysLeft = task.deadline ? Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className={`bg-gray-800 p-4 rounded shadow border border-gray-700 ${task.parentTaskId ? 'ml-6 mt-2 border-l-4 border-l-blue-500' : 'mb-4'}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className={`font-semibold text-lg ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-100'}`}>
            {task.title}
          </h3>

          <div className="flex gap-4 mt-1">
            <p className="text-xs text-gray-400">Created: {new Date(task.createdAt).toLocaleDateString()}</p>
            <div className="flex items-center gap-1 text-xs">
              <span className={`font-semibold ${daysLeft < 0 ? 'text-red-500' : daysLeft <= 2 ? 'text-orange-500' : 'text-green-600'}`}>
                {task.deadline ? (daysLeft < 0 ? 'Overdue!' : `${daysLeft} days left`) : 'No deadline'}
              </span>
              {task.status !== 'completed' && onUpdateTask && (
                <input
                  type="date"
                  className="ml-2 border border-gray-600 bg-gray-700 rounded px-1 py-0.5 text-gray-300 cursor-pointer focus:outline-none"
                  value={task.deadline ? task.deadline.split('T')[0] : ''}
                  onChange={(e) => onUpdateTask(task._id, { deadline: e.target.value || null })}
                  title="Change deadline"
                />
              )}
            </div>
          </div>

          <div className="mt-2 text-sm text-gray-400 flex flex-col gap-1">
            <span className="font-semibold text-gray-300">Assigned To:</span>
            {task.status !== 'completed' && teamMembers && onUpdateTask ? (
              <div className="flex flex-wrap gap-3 mt-1 bg-gray-700/50 p-2 rounded border border-gray-600">
                {teamMembers.map(m => (
                  <label key={m.userId} className="flex items-center gap-1 cursor-pointer hover:text-gray-200">
                    <input
                      type="checkbox"
                      className="accent-blue-600"
                      checked={task.assignees.includes(m.userId)}
                      onChange={(e) => {
                        const newAssignees = e.target.checked
                          ? [...task.assignees, m.userId]
                          : task.assignees.filter(id => id !== m.userId);
                        onUpdateTask(task._id, { assignees: newAssignees });
                      }}
                    />
                    <span className="text-xs">{m.username || (m.userId === userId ? username : m.userId)}</span>
                  </label>
                ))}
              </div>
            ) : (
              <span className="font-medium text-gray-800">
                {task.assignees.length > 0
                  ? task.assignees.map(a => {
                    if (teamMembers) {
                      const member = teamMembers.find(m => m.userId === a);
                      if (member && member.username) return member.username;
                    }
                    // Fallback for legacy DB records or personal tasks
                    return a === userId ? username : a;
                  }).join(', ')
                  : <span className="italic text-gray-400">Unassigned</span>}
              </span>
            )}
          </div>
        </div>

        <div className="space-x-2 flex items-center">
          {task.status !== 'completed' && (
            <button onClick={() => onComplete(task._id, 'completed')} className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition">
              ✓
            </button>
          )}
          <button onClick={() => onDelete(task._id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition">
            🗑️
          </button>
        </div>
      </div>

      <div className="mt-3 flex gap-4 text-sm font-medium">
        <button onClick={() => setShowSubtaskForm(!showSubtaskForm)} className="text-blue-400 hover:text-blue-300 transition">
          + Add Subtask
        </button>
        <button onClick={() => setShowCommentForm(!showCommentForm)} className="text-blue-400 hover:text-blue-300 transition">
          💬 Comments ({task.comments?.length || 0})
        </button>
      </div>

      {showSubtaskForm && (
        <form onSubmit={handleAddSubtask} className="mt-2 flex gap-2 border-t pt-2 border-gray-700">
          <input
            className="border border-gray-600 p-2 rounded flex-1 text-sm bg-gray-700 text-gray-100 focus:outline-none focus:border-blue-500 placeholder-gray-400"
            placeholder="Subtask Title..."
            value={subtaskTitle}
            onChange={(e) => setSubtaskTitle(e.target.value)}
          />
          <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Add</button>
        </form>
      )}

      {showCommentForm && (
        <div className="mt-3 bg-gray-700/30 p-3 rounded border border-gray-700">
          <h4 className="text-sm font-semibold mb-2 text-gray-200">Comments</h4>
          {task.comments?.length === 0 && <p className="text-xs text-gray-500 italic mb-2">No comments yet.</p>}
          <div className="space-y-2 mb-3 max-h-40 overflow-y-auto pr-2">
            {task.comments?.map((c, i) => (
              <div key={i} className="text-sm border-b border-gray-700 pb-2">
                <div className="flex justify-between items-end mb-1">
                  <span className="font-bold text-gray-200">{c.createdBy}</span>
                  <span className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-gray-300">{c.text}</p>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              className="border border-gray-600 bg-gray-700 p-2 rounded flex-1 text-sm text-gray-100 focus:outline-none focus:border-blue-500 placeholder-gray-400"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button type="submit" className="bg-gray-600 text-white px-4 py-1 rounded text-sm hover:bg-gray-500 transition">Post</button>
          </form>
        </div>
      )}

      {/* Render Subtasks Recursively */}
      {childTasks.length > 0 && (
        <div className="mt-4 border-l-2 pl-4 border-gray-200">
          {childTasks.map(child => (
            <TaskItem
              key={child._id}
              task={child}
              allTasks={allTasks}
              teamMembers={teamMembers}
              username={username}
              userId={userId}
              onComplete={onComplete}
              onCreateSubtask={onCreateSubtask}
              onAddComment={onAddComment}
              onDelete={onDelete}
              onUpdateTask={onUpdateTask}
            />
          ))}
        </div>
      )}
    </div>
  );
}
