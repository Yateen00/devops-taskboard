import React, { useState } from 'react';

export default function TaskItem({ task, allTasks, onComplete, onCreateSubtask, onAddComment, onDelete }) {
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentText, setCommentText] = useState('');

  // Find subtasks recursively
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

  return (
    <div className={`bg-white p-4 rounded shadow border ${task.parentTaskId ? 'ml-6 mt-2 border-l-4 border-blue-400' : 'mb-4'}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className={`font-semibold text-lg ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
            {task.title}
          </h3>
          <p className="text-sm text-gray-500">Status: <span className="font-medium">{task.status}</span></p>
          <p className="text-xs text-gray-400 mt-1">Created: {new Date(task.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="space-x-2">
          {task.status !== 'completed' && (
            <button 
              onClick={() => onComplete(task._id, 'completed')}
              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition"
            >
              Complete
            </button>
          )}
          <button 
            onClick={() => onDelete(task._id)}
            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mt-3 flex gap-3 text-sm">
        <button onClick={() => setShowSubtaskForm(!showSubtaskForm)} className="text-blue-600 hover:underline">
          + Add Subtask
        </button>
        <button onClick={() => setShowCommentForm(!showCommentForm)} className="text-blue-600 hover:underline">
          💬 Comments ({task.comments?.length || 0})
        </button>
      </div>

      {showSubtaskForm && (
        <form onSubmit={handleAddSubtask} className="mt-2 flex gap-2">
          <input 
            className="border p-1 rounded flex-1 text-sm" 
            placeholder="Subtask Title..." 
            value={subtaskTitle} 
            onChange={(e) => setSubtaskTitle(e.target.value)} 
          />
          <button type="submit" className="bg-blue-500 text-white px-2 py-1 rounded text-sm">Add</button>
        </form>
      )}

      {showCommentForm && (
        <div className="mt-3 bg-gray-50 p-3 rounded">
          <h4 className="text-sm font-semibold mb-2">Comments</h4>
          {task.comments?.length === 0 && <p className="text-xs text-gray-500">No comments yet.</p>}
          <div className="space-y-2 mb-2 max-h-32 overflow-y-auto">
            {task.comments?.map((c, i) => (
              <div key={i} className="text-sm border-b pb-1">
                <span className="font-semibold text-gray-700">{c.createdBy}: </span>
                <span className="text-gray-600">{c.text}</span>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input 
              className="border p-1 rounded flex-1 text-sm" 
              placeholder="Write a comment..." 
              value={commentText} 
              onChange={(e) => setCommentText(e.target.value)} 
            />
            <button type="submit" className="bg-gray-800 text-white px-2 py-1 rounded text-sm">Post</button>
          </form>
        </div>
      )}

      {/* Render Subtasks Recursively */}
      {childTasks.length > 0 && (
        <div className="mt-4 border-l pl-4 border-gray-200">
          <h4 className="text-xs uppercase font-bold text-gray-500 mb-2 tracking-wider">Subtasks</h4>
          {childTasks.map(child => (
            <TaskItem 
              key={child._id} 
              task={child} 
              allTasks={allTasks} 
              onComplete={onComplete} 
              onCreateSubtask={onCreateSubtask} 
              onAddComment={onAddComment}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
