
import React, { useState, useMemo, useEffect } from 'react';
import WeeklyPlanner from './components/WeeklyPlanner';
import MonthlyView from './components/MonthlyView';
import AddTaskModal from './components/AddTaskModal';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import EditNoteModal from './components/EditNoteModal';
import EditTaskModal from './components/EditTaskModal';
import AiTaskParserModal from './components/AiTaskParserModal';
import { PlannerData, Task, NewTaskData, EditableTaskData, PlannerCollection, ParsedTask, Day, UserData, User } from './types';
import { DotScreenShader } from './components/ui/dot-shader-background';
import { DragEndEvent } from '@dnd-kit/core';

const monthNames = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December"
];

const getInitialDateState = () => {
  const today = new Date();
  const year = today.getFullYear();
  const monthIndex = today.getMonth();
  const dayOfMonth = today.getDate();

  const monthName = monthNames[monthIndex];
  
  const weekIndex = Math.min(3, Math.floor((dayOfMonth - 1) / 7));

  return {
      year,
      monthKey: `${monthName} ${year}`,
      weekIndex
  };
};

const initialDateState = getInitialDateState();

const normalizeString = (str: string) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

const generatePlannerDataForUser = (): PlannerCollection => {
  const years = [2023, 2024, 2025];
  
  const daysTemplate: Day[] = [
    { day: "Lunes", focus: "Inicio de Semana", tasks: [] },
    { day: "Martes", focus: "Reuniones y Colaboración", tasks: [] },
    { day: "Miércoles", focus: "Desarrollo y Aprendizaje", tasks: [] },
    { day: "Jueves", focus: "Seguimiento", tasks: [] },
    { day: "Viernes", focus: "Cierre Semanal", tasks: [] },
    { day: "Sábado", focus: "Proyectos Personales", tasks: [] },
    { day: "Domingo", focus: "Descanso y Reflexión", tasks: [] }
  ];

  const plannerCollection: PlannerCollection = {};

  years.forEach(year => {
    monthNames.forEach(monthName => {
      const monthAndYear = `${monthName} ${year}`;
      plannerCollection[monthAndYear] = [];
      for (let i = 1; i <= 4; i++) {
        const startDay = (i - 1) * 7 + 1;
        const endDay = startDay + 6;
        
        const weekData: PlannerData = {
          week_title: `Planificación Semanal - Semana ${i}`,
          week_period: `${monthName} ${startDay} - ${endDay}, ${year}`,
          days: JSON.parse(JSON.stringify(daysTemplate)) // Deep copy
        };
        plannerCollection[monthAndYear].push(weekData);
      }
    });
  });
  return plannerCollection;
};

const generateInitialUsers = (): UserData => {
    const katherinePlanner = generatePlannerDataForUser();
    const dailyRoutine = [
        { time_slot: "06:50 - 17:15", task_detail: "Rutina Matinal, Transporte y Jornada Laboral", category: "Routine", status: "Pending", note: "El horario fijo de Katherine." },
        { time_slot: "17:15 - 18:45", task_detail: "Transición, Snack y 🏋️ Ejercicio (60 min)", category: "Health", status: "Pending", note: "Prioridad física." },
        { time_slot: "18:45 - 19:45", task_detail: "Cena y Autocuidado", category: "Personal", status: "Pending", note: "Cena nutritiva y ducha post-entrenamiento." },
        { time_slot: "19:45 - 20:45", task_detail: "📸 Bloque de Gestión de Contenido (60 min)", category: "Creación de Contenido", status: "Pending", note: "Tarea Diaria: Upload, Programación, Interacción (responder comentarios y DMs) y Estrategia de Divulgación." },
        { time_slot: "20:45 - 22:30", task_detail: "Tiempo Personal (Ocio y Social)", category: "Personal", status: "Pending", note: "Tiempo extra liberado: Más de hora y media de descanso y ocio." },
        { time_slot: "22:30 - 23:00", task_detail: "Rutina de Noche y Desconexión", category: "Routine", status: "Pending" },
        { time_slot: "23:00", task_detail: "Hora de Dormir", category: "Health", status: "Pending" },
    ];
    if (katherinePlanner["July 2024"] && katherinePlanner["July 2024"][0]) {
        for (let i = 0; i < 7; i++) {
            katherinePlanner["July 2024"][0].days[i].tasks.push(...JSON.parse(JSON.stringify(dailyRoutine)));
        }
    }

    const danielPlanner = generatePlannerDataForUser();
    danielPlanner["January 2024"][0].days[0].tasks.push({ time_slot: "09:00 - 10:00", task_detail: "Reunión de Kick-off Anual", category: "Meeting", status: "Completed" });
    danielPlanner["January 2024"][0].days[2].tasks.push({ time_slot: "14:00 - 16:00", task_detail: "Definir OKRs Q1", category: "Planning", status: "In Progress" });

    return {
        'user-1': {
            user: { id: 'user-1', name: 'Katherine', avatar: '👩‍💻' },
            plannerData: katherinePlanner,
        },
        'user-2': {
            user: { id: 'user-2', name: 'Daniel', avatar: '👨‍🚀' },
            plannerData: danielPlanner,
        }
    };
};

const loadStateFromLocalStorage = (): UserData => {
  try {
    const serializedState = localStorage.getItem('weeklyPlannerData');
    if (serializedState === null) {
      const initialState = generateInitialUsers();
      localStorage.setItem('weeklyPlannerData', JSON.stringify(initialState));
      return initialState;
    }
    return JSON.parse(serializedState);
  } catch (error) {
    console.error("Could not load or parse state from local storage", error);
    return generateInitialUsers();
  }
};

function App() {
  const [allUsersData, setAllUsersData] = useState<UserData>(loadStateFromLocalStorage);
  const [currentUserId, setCurrentUserId] = useState<string>('user-1');
  
  const [currentYear, setCurrentYear] = useState<number>(initialDateState.year);
  const [currentMonth, setCurrentMonth] = useState<string>(initialDateState.monthKey);
  const [currentWeekIndex, setCurrentWeekIndex] = useState<number>(initialDateState.weekIndex);
  
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [currentDayIndex, setCurrentDayIndex] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{ dayIndex: number; taskIndex: number; task: Task; } | null>(null);
  const [isEditNoteModalOpen, setIsEditNoteModalOpen] = useState(false);
  const [taskToEditNote, setTaskToEditNote] = useState<{ dayIndex: number; taskIndex: number; taskDetail: string; currentNote: string; } | null>(null);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<{ dayIndex: number; taskIndex: number; task: Task; } | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    try {
      localStorage.setItem('weeklyPlannerData', JSON.stringify(allUsersData));
    } catch (error) {
      console.error("Could not save state to local storage", error);
    }
  }, [allUsersData]);

  const currentUserPlannerData = allUsersData[currentUserId].plannerData;
  const currentUser = allUsersData[currentUserId].user;

  const monthKeys = useMemo(() => Object.keys(currentUserPlannerData), [currentUserPlannerData]);
  const availableYears = useMemo(() => [...new Set(monthKeys.map(key => parseInt(key.split(' ')[1])))].sort(), [monthKeys]);
  const monthKeysForCurrentYear = useMemo(() => 
    monthKeys.filter(key => key.endsWith(String(currentYear)))
  , [monthKeys, currentYear]);

  const currentPlannerWeekData = currentUserPlannerData[currentMonth]?.[currentWeekIndex];

  const handleUserSwitch = (userId: string) => {
    setCurrentUserId(userId);
    setIsUserMenuOpen(false);
  };
  
  const handlePreviousYear = () => {
    const currentYearIndex = availableYears.indexOf(currentYear);
    if (currentYearIndex > 0) {
      const newYear = availableYears[currentYearIndex - 1];
      setCurrentYear(newYear);
      setCurrentMonth(`January ${newYear}`);
      setCurrentWeekIndex(0);
    }
  };
  
  const handleNextYear = () => {
    const currentYearIndex = availableYears.indexOf(currentYear);
    if (currentYearIndex < availableYears.length - 1) {
      const newYear = availableYears[currentYearIndex + 1];
      setCurrentYear(newYear);
      setCurrentMonth(`January ${newYear}`);
      setCurrentWeekIndex(0);
    }
  };

  const handlePreviousMonth = () => {
    const currentMonthIndex = monthKeysForCurrentYear.indexOf(currentMonth);
    const newMonthIndex = (currentMonthIndex - 1 + monthKeysForCurrentYear.length) % monthKeysForCurrentYear.length;
    setCurrentMonth(monthKeysForCurrentYear[newMonthIndex]);
    setCurrentWeekIndex(0);
  };
  
  const handleNextMonth = () => {
    const currentMonthIndex = monthKeysForCurrentYear.indexOf(currentMonth);
    const newMonthIndex = (currentMonthIndex + 1) % monthKeysForCurrentYear.length;
    setCurrentMonth(monthKeysForCurrentYear[newMonthIndex]);
    setCurrentWeekIndex(0);
  };

  const handlePreviousWeek = () => {
    setCurrentWeekIndex(prev => (prev > 0 ? prev - 1 : (currentUserPlannerData[currentMonth]?.length ?? 1) - 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekIndex(prev => (prev < (currentUserPlannerData[currentMonth]?.length ?? 1) - 1 ? prev + 1 : 0));
  };

  const handleSelectDayAndSwitchToWeek = (weekIndex: number) => {
    setCurrentWeekIndex(weekIndex);
    setViewMode('weekly');
  };

  const handleToggleTaskStatus = (dayIndex: number, taskIndex: number) => {
    setAllUsersData(prevData => {
        const newAllUsersData = JSON.parse(JSON.stringify(prevData));
        const task = newAllUsersData[currentUserId].plannerData[currentMonth][currentWeekIndex].days[dayIndex].tasks[taskIndex];
        const newStatus = task.status === 'Completed' ? 'Pending' : (task.status === 'Pending' ? 'In Progress' : 'Completed');
        task.status = newStatus;
        return newAllUsersData;
    });
  };

  const handleOpenAddTaskModal = (dayIndex: number) => {
    setCurrentDayIndex(dayIndex);
    setIsAddTaskModalOpen(true);
  };

  const handleSaveNewTask = (newTaskData: NewTaskData) => {
    if (currentDayIndex === null) return;
    
    setAllUsersData(prevData => {
        const newAllUsersData = JSON.parse(JSON.stringify(prevData));
        const currentUserPlanner = newAllUsersData[currentUserId].plannerData;
        const weekTasks = currentUserPlanner[currentMonth][currentWeekIndex].days;

        const { recurrence, ...restOfTaskData } = newTaskData;

        const newTask: Task = {
          ...restOfTaskData,
          status: 'Pending',
        };
        
        if (recurrence !== 'none') {
            const recurrenceId = `${Date.now()}-${Math.random()}`;
            newTask.recurrence = recurrence;
            newTask.recurrenceId = recurrenceId;

            if (recurrence === 'daily') {
                for (let i = 0; i < weekTasks.length; i++) {
                    if (i !== currentDayIndex) {
                        weekTasks[i].tasks.push({ ...newTask });
                    }
                }
            }
            else if (recurrence === 'weekly') {
                currentUserPlanner[currentMonth].forEach((week: PlannerData, index: number) => {
                    if (index !== currentWeekIndex) {
                        week.days[currentDayIndex].tasks.push({ ...newTask });
                    }
                });
            }
            else if (recurrence === 'monthly') {
                 monthKeysForCurrentYear.forEach(monthKey => {
                    if (monthKey !== currentMonth) {
                        currentUserPlanner[monthKey].forEach((week: PlannerData) => {
                            if (week.days[currentDayIndex]) {
                                week.days[currentDayIndex].tasks.push({ ...newTask });
                            }
                        });
                    }
                 })
            }
        }
        
        weekTasks[currentDayIndex].tasks.push(newTask);
        return newAllUsersData;
    });

    setIsAddTaskModalOpen(false);
    setCurrentDayIndex(null);
  };

  const handleOpenDeleteModal = (dayIndex: number, taskIndex: number) => {
    const task = currentUserPlannerData[currentMonth][currentWeekIndex].days[dayIndex].tasks[taskIndex];
    setTaskToDelete({ dayIndex, taskIndex, task });
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = (deleteAllRecurring: boolean) => {
    if (!taskToDelete) return;
    const { dayIndex, taskIndex, task } = taskToDelete;

    setAllUsersData(prevData => {
        const newAllUsersData = JSON.parse(JSON.stringify(prevData));
        const currentUserPlanner = newAllUsersData[currentUserId].plannerData;
        
        if (deleteAllRecurring && task.recurrenceId) {
            Object.values(currentUserPlanner).forEach((month: any) => {
                month.forEach((week: PlannerData) => {
                    week.days.forEach(day => {
                        day.tasks = day.tasks.filter(t => t.recurrenceId !== task.recurrenceId);
                    });
                });
            });
        } else {
            currentUserPlanner[currentMonth][currentWeekIndex].days[dayIndex].tasks.splice(taskIndex, 1);
        }
        return newAllUsersData;
    });
    
    setIsDeleteModalOpen(false);
    setTaskToDelete(null);
  };

  const handleOpenEditNoteModal = (dayIndex: number, taskIndex: number) => {
    const task = currentUserPlannerData[currentMonth][currentWeekIndex].days[dayIndex].tasks[taskIndex];
    setTaskToEditNote({
      dayIndex,
      taskIndex,
      taskDetail: task.task_detail,
      currentNote: task.note || ''
    });
    setIsEditNoteModalOpen(true);
  };

  const handleSaveNote = (note: string) => {
    if (!taskToEditNote) return;
    const { dayIndex, taskIndex } = taskToEditNote;
    setAllUsersData(prevData => {
        const newAllUsersData = JSON.parse(JSON.stringify(prevData));
        newAllUsersData[currentUserId].plannerData[currentMonth][currentWeekIndex].days[dayIndex].tasks[taskIndex].note = note;
        return newAllUsersData;
    });
    setIsEditNoteModalOpen(false);
    setTaskToEditNote(null);
  };
  
  const handleOpenEditTaskModal = (dayIndex: number, taskIndex: number) => {
    const task = currentUserPlannerData[currentMonth][currentWeekIndex].days[dayIndex].tasks[taskIndex];
    setTaskToEdit({ dayIndex, taskIndex, task });
    setIsEditTaskModalOpen(true);
  };

  const handleSaveEditedTask = (editedTaskData: EditableTaskData) => {
    if (!taskToEdit) return;
    const { dayIndex, taskIndex } = taskToEdit;
    
    setAllUsersData(prevData => {
        const newAllUsersData = JSON.parse(JSON.stringify(prevData));
        const task = newAllUsersData[currentUserId].plannerData[currentMonth][currentWeekIndex].days[dayIndex].tasks[taskIndex];
        
        newAllUsersData[currentUserId].plannerData[currentMonth][currentWeekIndex].days[dayIndex].tasks[taskIndex] = {
          ...task,
          ...editedTaskData,
        };
        return newAllUsersData;
    });

    setIsEditTaskModalOpen(false);
    setTaskToEdit(null);
  };

  const handleOpenAiParser = () => {
    setIsAiModalOpen(true);
  };

  const handleSaveAiTasks = (tasksToSave: ParsedTask[]) => {
    if (tasksToSave.length === 0) {
      setIsAiModalOpen(false);
      return;
    }
    
    setAllUsersData(prevData => {
        const newAllUsersData = JSON.parse(JSON.stringify(prevData));
        const currentWeekDays = newAllUsersData[currentUserId].plannerData[currentMonth][currentWeekIndex].days;

        const dayNameToIndex: { [key: string]: number } = {};
        currentWeekDays.forEach((day: Day, index: number) => {
            dayNameToIndex[normalizeString(day.day)] = index;
        });

        tasksToSave.forEach(parsedTask => {
            const normalizedTaskDay = normalizeString(parsedTask.day);
            const dayIndex = dayNameToIndex[normalizedTaskDay];
            if (dayIndex !== undefined) {
                currentWeekDays[dayIndex].tasks.push({
                    time_slot: parsedTask.time_slot,
                    task_detail: parsedTask.task_detail,
                    category: parsedTask.category,
                    status: parsedTask.status || 'Pending',
                });
            }
        });
        return newAllUsersData;
    });

    setIsAiModalOpen(false);
  };

  const handleTaskDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }
    
    setAllUsersData(prevData => {
      const newAllUsersData = JSON.parse(JSON.stringify(prevData));
      const days = newAllUsersData[currentUserId].plannerData[currentMonth][currentWeekIndex].days;

      const sourceDayIndex = active.data.current?.dayIndex;
      const sourceTaskIndex = active.data.current?.taskIndex;

      const overId = String(over.id);
      let destDayIndex: number;
      let destTaskIndex: number;

      if (overId.startsWith('task-')) {
        destDayIndex = over.data.current?.dayIndex;
        destTaskIndex = over.data.current?.taskIndex;
      } else { // Dropping on a day card (container)
        destDayIndex = parseInt(overId.split('-')[1]);
        destTaskIndex = days[destDayIndex].tasks.length;
      }

      // Validate indexes
      if (sourceDayIndex === undefined || sourceTaskIndex === undefined || destDayIndex === undefined || destTaskIndex === undefined) {
        console.error("Drag and drop failed: missing index data.");
        return prevData;
      }

      // Perform the move
      const sourceDay = days[sourceDayIndex];
      const [movedTask] = sourceDay.tasks.splice(sourceTaskIndex, 1);
      
      const destDay = days[destDayIndex];
      destDay.tasks.splice(destTaskIndex, 0, movedTask);

      return newAllUsersData;
    });
  };

  if (!currentPlannerWeekData && viewMode === 'weekly') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        Loading planner data or invalid selection...
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans">
      <div className="fixed inset-0 -z-10">
        <DotScreenShader />
      </div>

      <header className="p-4 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-800">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white">Weekly Planner AI</h1>
            <div className="flex items-center gap-2">
              <button onClick={handlePreviousYear} className="p-1 text-gray-400 hover:text-white">&lt;&lt;</button>
              <span className="text-lg font-semibold text-white">{currentYear}</span>
              <button onClick={handleNextYear} className="p-1 text-gray-400 hover:text-white">&gt;&gt;</button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handlePreviousMonth} className="p-1 text-gray-400 hover:text-white">&lt;</button>
              <span className="text-lg font-semibold text-white">{currentMonth.split(' ')[0]}</span>
              <button onClick={handleNextMonth} className="p-1 text-gray-400 hover:text-white">&gt;</button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleOpenAiParser}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                 <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" /><path d="M5.5 4.5a2.5 2.5 0 015 0v6a2.5 2.5 0 01-5 0v-6zM10 15a4 4 0 004-4h-1.5a2.5 2.5 0 01-5 0H6a4 4 0 004 4z" />
               </svg>
              Add Tasks with AI
            </button>
            <div className="relative">
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <span className="text-xl">{currentUser.avatar}</span>
                <span>{currentUser.name}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-20">
                  {Object.values(allUsersData).map(({ user }) => (
                    <button 
                      key={user.id}
                      onClick={() => handleUserSwitch(user.id)}
                      className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                    >
                      <span className="text-xl">{user.avatar}</span>
                      <span>{user.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="container mx-auto flex justify-center items-center mt-4 gap-4">
            {viewMode === 'weekly' && (
              <>
                <button onClick={handlePreviousWeek} className="px-3 py-1 text-sm bg-gray-700 rounded-md hover:bg-gray-600 text-gray-200">Previous Week</button>
                <span className="text-md font-medium text-gray-300">Week {currentWeekIndex + 1}</span>
                <button onClick={handleNextWeek} className="px-3 py-1 text-sm bg-gray-700 rounded-md hover:bg-gray-600 text-gray-200">Next Week</button>
              </>
            )}
             <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg p-1">
                <button onClick={() => setViewMode('weekly')} className={`px-4 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === 'weekly' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:bg-gray-700'}`}>
                    Week
                </button>
                <button onClick={() => setViewMode('monthly')} className={`px-4 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === 'monthly' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:bg-gray-700'}`}>
                    Month
                </button>
            </div>
        </div>
      </header>

      <main>
        {viewMode === 'weekly' ? (
            <WeeklyPlanner
            plannerData={currentPlannerWeekData}
            onAddTask={handleOpenAddTaskModal}
            onToggleTaskStatus={handleToggleTaskStatus}
            onDeleteTask={handleOpenDeleteModal}
            onEditNote={handleOpenEditNoteModal}
            onEditTask={handleOpenEditTaskModal}
            onTaskDragEnd={handleTaskDragEnd}
            />
        ) : (
            <MonthlyView
                monthData={currentUserPlannerData[currentMonth] || []}
                monthName={currentMonth.split(' ')[0]}
                year={currentYear}
                onDayClick={handleSelectDayAndSwitchToWeek}
            />
        )}
      </main>
      
      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        onSave={handleSaveNewTask}
      />
      
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        task={taskToDelete?.task ?? null}
      />

      {taskToEditNote && (
        <EditNoteModal
          isOpen={isEditNoteModalOpen}
          onClose={() => setIsEditNoteModalOpen(false)}
          onSave={handleSaveNote}
          taskDetail={taskToEditNote.taskDetail}
          currentNote={taskToEditNote.currentNote}
        />
      )}

      {taskToEdit && (
        <EditTaskModal
          isOpen={isEditTaskModalOpen}
          onClose={() => setIsEditTaskModalOpen(false)}
          onSave={handleSaveEditedTask}
          task={taskToEdit.task}
        />
      )}

      <AiTaskParserModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSave={handleSaveAiTasks}
      />

    </div>
  );
}

export default App;
