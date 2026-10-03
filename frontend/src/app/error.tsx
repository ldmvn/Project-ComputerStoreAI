'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <h2 className="text-2xl font-bold text-red-600">Đã có lỗi xảy ra</h2>
      <p className="mt-2 max-w-md text-center text-slate-600">
        {error.message || 'Vui lòng thử lại sau.'}
      </p>
      <button
        onClick={reset}
        className="ui-button ui-button--primary mt-6 rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
      >
        Thử lại
      </button>
    </div>
  );
}
