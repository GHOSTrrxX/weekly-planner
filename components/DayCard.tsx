import React, { useState } from 'react';
import { Day, Task } from '../types';
import TaskItem from './TaskItem';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableTaskItemProps {
  task: Task;
  id: string;
  dayIndex: number;
  taskIndex: number;
  onToggleTaskStatus: (dayIndex: number, taskIndex: number) => void;
  onDeleteTask: (dayIndex: number, taskIndex: number) => void;
  onEditNote: (dayIndex: number, taskIndex: number) => void;
  onEditTask: (dayIndex: number, taskIndex: number) => void;
}

const SortableTaskItem: React.FC<SortableTaskItemProps> = (props) => {
    const { task, id, dayIndex, taskIndex, onToggleTaskStatus, onDeleteTask, onEditNote, onEditTask } = props;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, data: { task, dayIndex, taskIndex, type: 'task' } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <TaskItem 
            ref={setNodeRef}
            style={style}
            attributes={attributes}
            listeners={listeners}
            task={task}
            isDragging={isDragging}
            onToggleStatus={() => onToggleTaskStatus(dayIndex, taskIndex)}
            onDelete={() => onDeleteTask(dayIndex, taskIndex)}
            onEditNote={() => onEditNote(dayIndex, taskIndex)}
            onEdit={() => onEditTask(dayIndex, taskIndex)}
        />
    )
};


interface DayCardProps {
  dayData: Day;
  dayIndex: number;
  onToggleTaskStatus: (dayIndex: number, taskIndex: number) => void;
  onAddTask: (dayIndex: number) => void;
  onDeleteTask: (dayIndex: number, taskIndex: number) => void;
  onEditNote: (dayIndex: number, taskIndex: number) => void;
  onEditTask: (dayIndex: number, taskIndex: number) => void;
}

const DayCard: React.FC<DayCardProps> = ({ dayData, dayIndex, onToggleTaskStatus, onAddTask, onDeleteTask, onEditNote, onEditTask }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const { setNodeRef, isOver } = useDroppable({
    id: `day-${dayIndex}`,
    data: {
      dayIndex,
      type: 'day'
    }
  });

  const taskIds = dayData.tasks.map((_, taskIndex) => `task-${dayIndex}-${taskIndex}`);

  const cardStyle: React.CSSProperties = {
    transition: 'outline-color 0.2s ease-in-out',
    outline: isOver ? '2px solid #6366f1' : '2px solid transparent',
    outlineOffset: '4px',
  };

  return (
    <div ref={setNodeRef} style={cardStyle} className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-6 flex flex-col h-full transition-shadow hover:shadow-lg hover:shadow-indigo-500/10">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-indigo-400">{dayData.day}</h2>
          <p className="text-md text-gray-400 italic">Focus: {dayData.focus}</p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 text-gray-400 hover:text-indigo-400 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label={isExpanded ? 'Collapse tasks' : 'Expand tasks'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-6 w-6 transition-transform duration-300 ${isExpanded ? '' : 'rotate-180'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4 flex-grow flex flex-col">
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            <div className="flex-grow space-y-4">
              {dayData.tasks.map((task, taskIndex) => (
                <SortableTaskItem
                  key={`task-${dayIndex}-${taskIndex}`}
                  id={`task-${dayIndex}-${taskIndex}`}
                  task={task}
                  dayIndex={dayIndex}
                  taskIndex={taskIndex}
                  onToggleTaskStatus={onToggleTaskStatus}
                  onDeleteTask={onDeleteTask}
                  onEditNote={onEditNote}
                  onEditTask={onEditTask}
                />
              ))}
            </div>
          </SortableContext>
          <button
            onClick={() => onAddTask(dayIndex)}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2 px-4 border border-dashed border-gray-600 text-gray-400 rounded-lg hover:bg-gray-700 hover:text-indigo-400 hover:border-indigo-500 transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Task
          </button>
        </div>
      )}
    </div>
  );
};

export default DayCard;