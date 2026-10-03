export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json({ service: 'computerstoreai-frontend', status: 'ok' });
}
