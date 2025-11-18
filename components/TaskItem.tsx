import React from 'react';
import { Task, RecurrenceType } from '../types';

interface TaskItemProps {
  task: Task;
  onToggleStatus: () => void;
  onDelete: () => void;
  onEditNote: () => void;
  onEdit: () => void;
  isDragging?: boolean;
}

const getCategoryColor = (category: string) => {
  switch (category.toLowerCase()) {
    case 'work': return 'bg-blue-500/20 text-blue-300';
    case 'development': return 'bg-purple-500/20 text-purple-300';
    case 'learning': return 'bg-yellow-500/20 text-yellow-300';
    case 'personal': return 'bg-green-500/20 text-green-300';
    case 'meeting': return 'bg-indigo-500/20 text-indigo-300';
    case 'design': return 'bg-pink-500/20 text-pink-300';
    case 'planning': return 'bg-gray-500/20 text-gray-300';
    case 'administrativo': return 'bg-teal-500/20 text-teal-300';
    case 'productividad': return 'bg-cyan-500/20 text-cyan-300';
    case 'creación de contenido': return 'bg-orange-500/20 text-orange-300';
    case 'post-producción': return 'bg-red-500/20 text-red-300';
    case 'routine': return 'bg-slate-500/20 text-slate-300';
    case 'health': return 'bg-emerald-500/20 text-emerald-300';
    default: return 'bg-gray-500/20 text-gray-300';
  }
};

const StatusIndicator = ({ status }: { status: string }) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return (
        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-green-500 rounded-full animate-scale-in" title="Completed">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path className="animate-draw-check" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
      );
    case 'in progress':
       return (
        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center" title="In Progress">
            <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
        </div>
      );
    case 'pending':
    default:
      return (
        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center" title="Pending">
          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
        </div>
      );
  }
};

const RecurrenceIcon = ({ recurrenceType }: { recurrenceType: RecurrenceType }) => {
    const title = `Recurring task: ${recurrenceType.charAt(0).toUpperCase() + recurrenceType.slice(1)}`;
    return (
        <span title={title} className="ml-2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
        </span>
    )
}

const TaskItem = React.forwardRef<
  HTMLDivElement, 
  TaskItemProps & { style?: React.CSSProperties; attributes?: any; listeners?: any; }
>(({ task, onToggleStatus, onDelete, onEditNote, onEdit, isDragging, style, attributes, listeners }, ref) => {
  return (
    <div 
        ref={ref} 
        style={style}
        className={`group p-3 rounded-lg bg-gray-900 border border-gray-700 transition-shadow ${task.status.toLowerCase() === 'completed' ? 'opacity-70' : ''} ${isDragging ? 'shadow-2xl shadow-indigo-500/30' : ''}`}
    >
      <div className="flex items-start gap-3" {...attributes} {...listeners}>
        <button 
          onClick={onToggleStatus} 
          className="mt-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
          aria-label={`Toggle status for ${task.task_detail}. Current status: ${task.status}`}
        >
          <StatusIndicator status={task.status} />
        </button>
        <div className="flex-grow">
          <div className="flex items-center">
            <p className={`font-medium transition-colors duration-300 ${task.status.toLowerCase() === 'completed' ? 'line-through text-gray-400' : 'text-gray-100'}`}>{task.task_detail}</p>
            {task.recurrence && <RecurrenceIcon recurrenceType={task.recurrence} />}
          </div>
          {task.note && (
            <p className="text-sm italic text-gray-400 mt-1">{task.note}</p>
          )}
          <div className="flex justify-between items-center text-sm mt-2">
            <span className={`px-3 py-1 rounded-full font-semibold text-xs ${getCategoryColor(task.category)}`}>
              {task.category}
            </span>
            <p className="text-gray-400 font-mono text-xs">{task.time_slot}</p>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center self-start mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={onEdit}
              className="p-1 text-gray-400 hover:text-blue-400 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={`Edit task: ${task.task_detail}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <button
              onClick={onEditNote}
              className="p-1 text-gray-400 hover:text-indigo-400 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label={task.note ? `Edit note for task: ${task.task_detail}` : `Add note for task: ${task.task_detail}`}
            >
              {task.note ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                  <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <button 
              onClick={onDelete} 
              className="p-1 text-gray-400 hover:text-red-500 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label={`Delete task: ${task.task_detail}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                </svg>
            </button>
        </div>
      </div>
    </div>
  );
});

export default TaskItem;