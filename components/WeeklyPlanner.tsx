import React, { useState } from 'react';
import { PlannerData, Task } from '../types';
import DayCard from './DayCard';
import TaskItem from './TaskItem';
import { 
    DndContext, 
    PointerSensor, 
    KeyboardSensor, 
    useSensor, 
    useSensors, 
    closestCenter, 
    DragEndEvent,
    DragStartEvent,
    DragOverlay
} from '@dnd-kit/core';

interface WeeklyPlannerProps {
  plannerData: PlannerData;
  onToggleTaskStatus: (dayIndex: number, taskIndex: number) => void;
  onAddTask: (dayIndex: number) => void;
  onDeleteTask: (dayIndex: number, taskIndex: number) => void;
  onEditNote: (dayIndex: number, taskIndex: number) => void;
  onEditTask: (dayIndex: number, taskIndex: number) => void;
  onTaskDragEnd: (event: DragEndEvent) => void;
}

const WeeklyPlanner: React.FC<WeeklyPlannerProps> = ({ plannerData, onToggleTaskStatus, onAddTask, onDeleteTask, onEditNote, onEditTask, onTaskDragEnd }) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
      useSensor(PointerSensor, {
          activationConstraint: {
              distance: 8,
          },
      }),
      useSensor(KeyboardSensor)
  );

  function handleDragStart(event: DragStartEvent) {
      if (event.active.data.current?.task) {
          setActiveTask(event.active.data.current.task);
      }
  }

  function handleDragEnd(event: DragEndEvent) {
      onTaskDragEnd(event);
      setActiveTask(null);
  }

  return (
    <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
    >
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-gray-200">
            <header className="text-center mb-8 md:mb-12">
                <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 mb-2">
                {plannerData.week_title}
                </h1>
                <p className="text-lg md:text-xl text-gray-400">{plannerData.week_period}</p>
            </header>
            <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {plannerData.days.map((day, dayIndex) => (
                <DayCard 
                    key={day.day} 
                    dayData={day} 
                    dayIndex={dayIndex}
                    onToggleTaskStatus={onToggleTaskStatus}
                    onAddTask={onAddTask}
                    onDeleteTask={onDeleteTask}
                    onEditNote={onEditNote}
                    onEditTask={onEditTask}
                />
                ))}
            </main>
        </div>
        <DragOverlay>
            {activeTask ? (
                <TaskItem 
                    task={activeTask} 
                    isDragging={true}
                    onToggleStatus={() => {}} 
                    onDelete={() => {}} 
                    onEditNote={() => {}}
                    onEdit={() => {}}
                />
            ) : null}
        </DragOverlay>
    </DndContext>
  );
};

export default WeeklyPlanner;