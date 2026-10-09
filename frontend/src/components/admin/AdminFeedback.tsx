interface AdminFeedbackProps {
  message?: string;
  error?: string;
  className?: string;
}

export default function AdminFeedback({ message, error, className }: AdminFeedbackProps) {
  if (!message && !error) return null;
  return (
    <div className={className}>
      {message && (
        <p role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
