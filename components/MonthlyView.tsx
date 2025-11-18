import React from 'react';
import { PlannerData } from '../types';

interface MonthlyViewProps {
  monthData: PlannerData[];
  monthName: string;
  year: number;
  onDayClick: (weekIndex: number, dayIndex: number) => void;
}

const dayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const MonthlyView: React.FC<MonthlyViewProps> = ({ monthData, monthName, year, onDayClick }) => {
  if (!monthData || monthData.length === 0) {
    return (
      <div className="container mx-auto p-8 text-center text-gray-400">
        No data available for this month.
      </div>
    );
  }

  const allDays = monthData.flatMap((week, weekIndex) =>
    week.days.map((day, dayIndex) => ({
      ...day,
      dayNumber: weekIndex * 7 + dayIndex + 1,
      weekIndex,
      dayIndex,
    }))
  );

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-gray-200">
      <header className="text-center mb-8 md:mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 mb-2">
          {monthName} {year}
        </h1>
      </header>
      <div className="grid grid-cols-7 gap-1 bg-gray-900 border border-gray-700 rounded-lg p-1">
        {dayNames.map(name => (
          <div key={name} className="text-center font-semibold text-sm text-gray-400 py-2">
            {name}
          </div>
        ))}
        {allDays.map(day => (
          <button
            key={`${day.weekIndex}-${day.dayIndex}`}
            onClick={() => onDayClick(day.weekIndex, day.dayIndex)}
            className="h-36 bg-gray-800 rounded-md p-2 text-left flex flex-col hover:bg-gray-700 hover:border-indigo-500 border-2 border-transparent transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label={`View tasks for day ${day.dayNumber}`}
          >
            <span className="font-bold text-gray-200">{day.dayNumber}</span>
            {day.tasks.length > 0 && (
              <div className="mt-1 flex-grow overflow-y-auto space-y-1 pr-1 text-xs">
                {day.tasks.slice(0, 3).map((task, index) => (
                   <div key={index} className="text-gray-300 truncate bg-gray-900/50 p-1 rounded-sm">
                     {task.task_detail}
                   </div>
                ))}
                {day.tasks.length > 3 && (
                    <div className="text-gray-400 text-center font-medium mt-1">
                        + {day.tasks.length - 3} more
                    </div>
                )}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MonthlyView;
