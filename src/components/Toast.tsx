import React, { useEffect, useState } from 'react';
import type { ToastMessage } from '../utils/toastManager';
import './Toast.css';

interface ToastProps {
  message: ToastMessage;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = message.duration || 3000;
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(message.id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [message, onClose]);

  const getIcon = () => {
    switch (message.type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
    }
  };

  return (
    <div className={`toast toast-${message.type} ${isExiting ? 'toast-exit' : ''}`}>
      <div className="toast-icon">{getIcon()}</div>
      <div className="toast-message">{message.message}</div>
      <button 
        className="toast-close" 
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onClose(message.id), 300);
        }}
      >
        ×
      </button>
    </div>
  );
};

interface ToastContainerProps {
  messages: ToastMessage[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ messages, onClose }) => {
  return (
    <div className="toast-container">
      {messages.map(message => (
        <Toast key={message.id} message={message} onClose={onClose} />
      ))}
    </div>
  );
};
