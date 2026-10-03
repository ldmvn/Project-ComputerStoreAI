import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <h1 className="text-7xl font-bold text-primary-600">404</h1>
      <h2 className="mt-4 text-2xl font-semibold">Không tìm thấy trang</h2>
      <p className="mt-2 text-slate-600">
        Trang bạn tìm kiếm không tồn tại hoặc đã bị xóa.
      </p>
      <Link
        href="/"
        className="ui-button ui-button--primary mt-6 rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
      >
        Về trang chủ
      </Link>
    </div>
  );
}
