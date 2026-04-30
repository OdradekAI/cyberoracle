import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE = 8 * 1024 * 1024; // 8MB
const MAX_DIMENSION = 1920;
const WEBP_QUALITY = 80;

const UPLOAD_DIR = join(process.cwd(), 'storage', 'uploads');

async function ensureUploadDir() {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const kind = formData.get('kind');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Missing "file" field' }, { status: 400 });
    }

    if (!kind || typeof kind !== 'string' || !['palm', 'face'].includes(kind)) {
      return NextResponse.json(
        { error: 'Invalid "kind" — must be "palm" or "face"' },
        { status: 400 },
      );
    }

    const mime = file.type;
    if (!ALLOWED_MIME.has(mime)) {
      return NextResponse.json(
        { error: `Unsupported type: ${mime}. Allowed: image/jpeg, image/png, image/webp` },
        { status: 415 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File exceeds 8MB limit' }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const id = nanoid();
    const webpPath = join(UPLOAD_DIR, `${id}.webp`);
    const metaPath = join(UPLOAD_DIR, `${id}.meta.json`);

    await ensureUploadDir();

    const processed = sharp(buffer)
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY });

    await processed.toFile(webpPath);

    const meta = {
      kind,
      originalName: file instanceof File ? file.name : 'unknown',
      size: file.size,
      mime,
      uploadedAt: new Date().toISOString(),
    };
    await writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

    return NextResponse.json({ id }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
