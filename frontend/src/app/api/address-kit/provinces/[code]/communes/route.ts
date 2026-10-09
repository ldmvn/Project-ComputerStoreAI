export const dynamic = 'force-dynamic';

const CAS_BASE = 'https://production.cas.so/address-kit/2025-07-01';

export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const { code } = params;
  try {
    const res = await fetch(`${CAS_BASE}/provinces/${encodeURIComponent(code)}/communes`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return Response.json({ error: 'Không thể tải danh sách phường/xã.' }, { status: 502 });
    const data = await res.json();
    return Response.json(data);
  } catch {
    return Response.json({ error: 'Lỗi kết nối đến dịch vụ địa chỉ.' }, { status: 503 });
  }
}
