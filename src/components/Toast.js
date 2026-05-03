"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { CheckCircle, AlertCircle, X } from "lucide-react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "success") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type} glass`}>
            {toast.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span className="toast-message">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="toast-close">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <style jsx global>{`
        .toast-container {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          z-index: 9999;
        }
        .toast {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          border-radius: 12px;
          min-width: 300px;
          animation: slideIn 0.3s ease-out forwards;
          border: 1px solid rgba(0,0,0,0.1);
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .toast-success {
          border-left: 4px solid #10b981;
          color: #065f46;
          background: rgba(255, 255, 255, 0.95);
        }
        .toast-error {
          border-left: 4px solid #ef4444;
          color: #991b1b;
          background: rgba(255, 255, 255, 0.95);
        }
        .toast-message {
          font-size: 0.875rem;
          font-weight: 600;
          flex: 1;
        }
        .toast-close {
          background: transparent;
          border: none;
          cursor: pointer;
          opacity: 0.5;
          transition: opacity 0.2s;
          display: flex;
        }
        .toast-close:hover {
          opacity: 1;
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
