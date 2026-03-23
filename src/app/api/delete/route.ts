import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { password, path, sha } = body;

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!path || !sha) {
    return NextResponse.json({ error: 'Missing required fields: path, sha' }, { status: 400 });
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH ?? 'main';

  if (!token || !repo) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }

  const headers: Record<string, string> = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({
      message: `Delete: ${path}`,
      sha,
      branch,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json({ error: err.message ?? 'GitHub API error' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
