import {
  validateImageFile,
  type ApiResponse,
  type CreateComicBody,
  type PatchComicBody,
} from '@webcomic/shared';

interface Env {
  SANITY_PROJECT_ID: string;
  SANITY_DATASET: string;
  SANITY_WRITE_TOKEN: string;
  ADMIN_ORIGIN: string;
}

function corsHeaders(origin: string, adminOrigin: string): HeadersInit {
  const allowedOrigin = origin === adminOrigin ? adminOrigin : '';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResponse<T>(
  data: ApiResponse<T>,
  status: number,
  headers: HeadersInit = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

async function uploadImageToSanity(
  env: Env,
  imageBlob: Blob,
  filename: string
): Promise<{ _id: string }> {
  const url = `https://${env.SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/assets/images/${env.SANITY_DATASET}?filename=${encodeURIComponent(filename)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.SANITY_WRITE_TOKEN}`,
      'Content-Type': imageBlob.type,
    },
    body: imageBlob,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to upload image: ${response.status} ${text}`);
  }

  const result = (await response.json()) as { document: { _id: string } };
  return { _id: result.document._id };
}

async function createComicDocument(
  env: Env,
  data: CreateComicBody,
  imageAssetId: string
): Promise<{ _id: string }> {
  const url = `https://${env.SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/mutate/${env.SANITY_DATASET}`;

  const mutations = [
    {
      create: {
        _type: 'comicEpisode',
        title: data.title,
        slug: { _type: 'slug', current: data.slug },
        publishedAt: data.publishedAt || new Date().toISOString(),
        image: {
          _type: 'image',
          asset: { _type: 'reference', _ref: imageAssetId },
        },
        altText: data.altText || '',
        transcript: data.transcript || '',
      },
    },
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.SANITY_WRITE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mutations }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to create document: ${response.status} ${text}`);
  }

  const result = (await response.json()) as {
    results: Array<{ id: string }>;
  };
  return { _id: result.results[0].id };
}

async function patchComicDocument(
  env: Env,
  documentId: string,
  data: PatchComicBody,
  newImageAssetId?: string
): Promise<void> {
  const url = `https://${env.SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/mutate/${env.SANITY_DATASET}`;

  const set: Record<string, unknown> = {};
  if (data.title !== undefined) set.title = data.title;
  if (data.slug !== undefined) set.slug = { _type: 'slug', current: data.slug };
  if (data.publishedAt !== undefined) set.publishedAt = data.publishedAt;
  if (data.altText !== undefined) set.altText = data.altText;
  if (data.transcript !== undefined) set.transcript = data.transcript;
  if (newImageAssetId) {
    set.image = {
      _type: 'image',
      asset: { _type: 'reference', _ref: newImageAssetId },
    };
  }

  const mutations = [
    {
      patch: {
        id: documentId,
        set,
      },
    },
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.SANITY_WRITE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mutations }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to patch document: ${response.status} ${text}`);
  }
}

async function handleCreateComic(
  request: Request,
  env: Env,
  cors: HeadersInit
): Promise<Response> {
  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return jsonResponse(
      { success: false, error: 'Expected multipart/form-data' },
      400,
      cors
    );
  }

  const formData = await request.formData();
  const jsonStr = formData.get('json');
  const imageFile = formData.get('image');

  if (!jsonStr || typeof jsonStr !== 'string') {
    return jsonResponse(
      { success: false, error: 'Missing json field in form data' },
      400,
      cors
    );
  }

  if (!imageFile || typeof imageFile === 'string') {
    return jsonResponse(
      { success: false, error: 'Missing image file in form data' },
      400,
      cors
    );
  }

  const file = imageFile as unknown as { name: string; size: number; type: string; arrayBuffer(): Promise<ArrayBuffer> };

  // Validate image
  const imageError = validateImageFile(
    { size: file.size, type: file.type },
    'image'
  );
  if (imageError) {
    return jsonResponse({ success: false, error: imageError }, 400, cors);
  }

  let data: CreateComicBody;
  try {
    data = JSON.parse(jsonStr);
  } catch {
    return jsonResponse(
      { success: false, error: 'Invalid JSON in json field' },
      400,
      cors
    );
  }

  if (!data.title || !data.slug) {
    return jsonResponse(
      { success: false, error: 'title and slug are required' },
      400,
      cors
    );
  }

  try {
    // Upload image first
    const imageBlob = new Blob([await file.arrayBuffer()], { type: file.type });
    const asset = await uploadImageToSanity(env, imageBlob, file.name);

    // Create document
    const doc = await createComicDocument(env, data, asset._id);

    return jsonResponse({ success: true, data: doc }, 201, cors);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse(
      { success: false, error: 'Failed to create comic', details: message },
      500,
      cors
    );
  }
}

async function handlePatchComic(
  request: Request,
  env: Env,
  documentId: string,
  cors: HeadersInit
): Promise<Response> {
  const contentType = request.headers.get('Content-Type') || '';

  let data: PatchComicBody;
  type FileData = { name: string; size: number; type: string; arrayBuffer(): Promise<ArrayBuffer> };
  let imageFileData: FileData | null = null;

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const jsonStr = formData.get('json');
    const rawImageFile = formData.get('image');

    if (!jsonStr || typeof jsonStr !== 'string') {
      return jsonResponse(
        { success: false, error: 'Missing json field in form data' },
        400,
        cors
      );
    }

    try {
      data = JSON.parse(jsonStr);
    } catch {
      return jsonResponse(
        { success: false, error: 'Invalid JSON in json field' },
        400,
        cors
      );
    }

    if (rawImageFile && typeof rawImageFile !== 'string') {
      imageFileData = rawImageFile as unknown as FileData;
      const imageError = validateImageFile(
        { size: imageFileData!.size, type: imageFileData!.type },
        'image'
      );
      if (imageError) {
        return jsonResponse({ success: false, error: imageError }, 400, cors);
      }
    }
  } else if (contentType.includes('application/json')) {
    try {
      data = await request.json();
    } catch {
      return jsonResponse(
        { success: false, error: 'Invalid JSON body' },
        400,
        cors
      );
    }
  } else {
    return jsonResponse(
      { success: false, error: 'Expected multipart/form-data or application/json' },
      400,
      cors
    );
  }

  try {
    let newImageAssetId: string | undefined;
    if (imageFileData) {
      const imageBlob = new Blob([await imageFileData.arrayBuffer()], { type: imageFileData.type });
      const asset = await uploadImageToSanity(env, imageBlob, imageFileData.name);
      newImageAssetId = asset._id;
    }

    await patchComicDocument(env, documentId, data, newImageAssetId);

    return jsonResponse({ success: true, data: { _id: documentId } }, 200, cors);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse(
      { success: false, error: 'Failed to patch comic', details: message },
      500,
      cors
    );
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin, env.ADMIN_ORIGIN);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // Route: POST /api/comics
    if (url.pathname === '/api/comics' && request.method === 'POST') {
      return handleCreateComic(request, env, cors);
    }

    // Route: PATCH /api/comics/:id
    const patchMatch = url.pathname.match(/^\/api\/comics\/([^/]+)$/);
    if (patchMatch && request.method === 'PATCH') {
      return handlePatchComic(request, env, patchMatch[1], cors);
    }

    // Health check
    if (url.pathname === '/health') {
      return jsonResponse({ success: true, data: { status: 'ok' } }, 200, cors);
    }

    return jsonResponse({ success: false, error: 'Not found' }, 404, cors);
  },
};
