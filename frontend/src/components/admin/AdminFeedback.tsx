'use client';
import { useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/Toast';

interface AdminFeedbackProps {
  message?: string;
  error?: string;
}

export default function AdminFeedback({ message, error }: AdminFeedbackProps) {
  const toast = useToast();
  const prevMessage = useRef('');
  const prevError = useRef('');

  useEffect(() => {
    if (message && message !== prevMessage.current) {
      prevMessage.current = message;
      toast.success(message);
    }
    if (!message) prevMessage.current = '';
  }, [message, toast]);

  useEffect(() => {
    if (error && error !== prevError.current) {
      prevError.current = error;
      toast.error(error);
    }
    if (!error) prevError.current = '';
  }, [error, toast]);

  return null;
}
