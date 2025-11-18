import React, { useState, useEffect } from 'react';

interface EditNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: string) => void;
  taskDetail: string;
  currentNote: string;
}

const EditNoteModal: React.FC<EditNoteModalProps> = ({ isOpen, onClose, onSave, taskDetail, currentNote }) => {
  const [note, setNote] = useState(currentNote);

  useEffect(() => {
    if (isOpen) {
      setNote(currentNote);
    }
  }, [isOpen, currentNote]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(note);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center" onClick={onClose} aria-modal="true" role="dialog">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-700" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-100">Add/Edit Note</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200" aria-label="Close modal">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300">Task</label>
              <p className="mt-1 text-gray-200 bg-gray-700 p-2 rounded-md">{taskDetail}</p>
            </div>
            <div>
              <label htmlFor="task_note" className="block text-sm font-medium text-gray-300">Note</label>
              <textarea
                id="task_note"
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={4}
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-100 placeholder-gray-400"
                placeholder="Add an optional note here..."
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
              Save Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditNoteModal;