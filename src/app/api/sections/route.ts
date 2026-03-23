import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const contentDir = path.join(process.cwd(), 'content');
  const entries = fs.readdirSync(contentDir, { withFileTypes: true });
  const sections = entries
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort();
  return NextResponse.json({ sections });
}
