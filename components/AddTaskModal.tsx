import React, { useState, useEffect } from 'react';
import { NewTaskData, RecurrenceType } from '../types';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: NewTaskData) => void;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onSave }) => {
  const [taskDetail, setTaskDetail] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceType | 'none'>('none');

  useEffect(() => {
    if (isOpen) {
      setTaskDetail('');
      setTimeSlot('');
      setCategory('');
      setNote('');
      setRecurrence('none');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskDetail.trim()) {
      alert('Task detail is required.');
      return;
    }
    onSave({
      task_detail: taskDetail,
      time_slot: timeSlot || 'N/A',
      category: category || 'General',
      note: note,
      recurrence: recurrence,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center" onClick={onClose} aria-modal="true" role="dialog">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-700" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-100">Add New Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200" aria-label="Close modal">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="task_detail" className="block text-sm font-medium text-gray-300">Task Detail</label>
              <input
                type="text"
                id="task_detail"
                value={taskDetail}
                onChange={e => setTaskDetail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-100 placeholder-gray-400"
                required
                aria-required="true"
              />
            </div>
            <div>
              <label htmlFor="time_slot" className="block text-sm font-medium text-gray-300">Time Slot</label>
              <input
                type="text"
                id="time_slot"
                placeholder="e.g., 10:00 - 11:00"
                value={timeSlot}
                onChange={e => setTimeSlot(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-100 placeholder-gray-400"
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-300">Category</label>
              <input
                type="text"
                id="category"
                placeholder="e.g., Work, Personal"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-100 placeholder-gray-400"
              />
            </div>
            <div>
                <label htmlFor="recurrence" className="block text-sm font-medium text-gray-300">Recurrence</label>
                <select
                    id="recurrence"
                    value={recurrence}
                    onChange={e => setRecurrence(e.target.value as RecurrenceType | 'none')}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-gray-100"
                >
                    <option value="none">None</option>
                    <option value="daily">Daily (for this week)</option>
                    <option value="weekly">Weekly (for this month)</option>
                    <option value="monthly">Monthly (for this year)</option>
                </select>
            </div>
            <div>
              <label htmlFor="task_note_add" className="block text-sm font-medium text-gray-300">Note (Optional)</label>
              <textarea
                id="task_note_add"
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-100 placeholder-gray-400"
                placeholder="Add any extra details here..."
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-gray-200 rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
            >
              Save Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;