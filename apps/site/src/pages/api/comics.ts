import type { APIRoute } from 'astro';
import { getAllComicsAdmin } from '@/lib/sanity';

export const GET: APIRoute = async () => {
  try {
    const comics = await getAllComicsAdmin(100);
    return new Response(JSON.stringify({ success: true, data: comics }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
