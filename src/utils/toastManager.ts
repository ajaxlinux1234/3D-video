import { useState, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// Toast管理器
class ToastManager {
  private listeners: Set<(messages: ToastMessage[]) => void> = new Set();
  private messages: ToastMessage[] = [];

  subscribe(listener: (messages: ToastMessage[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(listener => listener([...this.messages]));
  }

  show(type: ToastType, message: string, duration?: number): string {
    const id = `toast-${Date.now()}-${Math.random()}`;
    this.messages.push({ id, type, message, duration });
    this.notify();
    return id;
  }

  success(message: string, duration?: number): string {
    return this.show('success', message, duration);
  }

  error(message: string, duration?: number): string {
    return this.show('error', message, duration);
  }

  warning(message: string, duration?: number): string {
    return this.show('warning', message, duration);
  }

  info(message: string, duration?: number): string {
    return this.show('info', message, duration);
  }

  remove(id: string): void {
    this.messages = this.messages.filter(m => m.id !== id);
    this.notify();
  }

  clear(): void {
    this.messages = [];
    this.notify();
  }
}

export const toastManager = new ToastManager();

// React Hook
export const useToast = () => {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  useEffect(() => {
    return toastManager.subscribe(setMessages);
  }, []);

  return {
    messages,
    removeToast: (id: string) => toastManager.remove(id)
  };
};
