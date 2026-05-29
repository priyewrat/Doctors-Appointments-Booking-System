import React from 'react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, variant = 'primary' }) => {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-[2px] px-4 transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all border border-gray-100">
        <div className="p-8 text-center">
          <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${isDanger ? 'bg-red-50' : 'bg-blue-50'} mb-4`}>
            <svg className={`h-6 w-6 ${isDanger ? 'text-red-600' : 'text-primary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isDanger ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-500 leading-relaxed whitespace-pre-line">{message}</p>
        </div>
        <div className="bg-gray-50/50 px-8 py-6 flex flex-col sm:flex-row-reverse gap-3">
          <button
            onClick={onConfirm}
            className={`w-full sm:w-auto inline-flex justify-center rounded-full border border-transparent shadow-md px-8 py-2.5 ${isDanger ? 'bg-red-600 focus:ring-red-600' : 'bg-primary focus:ring-primary'} text-base font-semibold text-white hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all active:scale-95`}
          >
            Confirm
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto inline-flex justify-center rounded-full border border-gray-200 shadow-sm px-8 py-2.5 bg-white text-base font-semibold text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all active:scale-95"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;