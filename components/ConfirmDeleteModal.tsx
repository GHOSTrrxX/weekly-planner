import React, { useState, useEffect } from 'react';
import { Task } from '../types';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deleteAllRecurring: boolean) => void;
  task: Task | null;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ isOpen, onClose, onConfirm, task }) => {
  const [deleteAll, setDeleteAll] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDeleteAll(false);
    }
  }, [isOpen]);

  if (!isOpen || !task) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose} aria-modal="true" role="dialog">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm border border-gray-700" onClick={e => e.stopPropagation()}>
        <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-100" id="modal-title">
                    Delete Task
                </h3>
                <div className="mt-2">
                    <p className="text-sm text-gray-400">
                    Are you sure you want to delete this task?
                    </p>
                    <p className="text-sm font-semibold text-gray-200 mt-1 break-words">
                    "{task.task_detail}"
                    </p>
                    {task.recurrenceId && (
                      <div className="mt-4 bg-gray-900/50 p-3 rounded-md">
                        <label className="flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={deleteAll}
                            onChange={(e) => setDeleteAll(e.target.checked)}
                            className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="ml-3 text-sm text-gray-300">Delete all recurring instances</span>
                        </label>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                    This action cannot be undone.
                    </p>
                </div>
            </div>
        </div>
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            onClick={() => onConfirm(deleteAll)}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-700 text-base font-medium text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;