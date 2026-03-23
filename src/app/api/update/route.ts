import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { password, path, sha, title, date, summary, tags, content, published } = body;

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!path || !sha || !title || !content) {
    return NextResponse.json({ error: 'Missing required fields: path, sha, title, content' }, { status: 400 });
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH ?? 'main';

  if (!token || !repo) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }

  const tagsArray: string[] = tags
    ? tags.split(',').map((t: string) => t.trim()).filter(Boolean)
    : [];

  const today = new Date().toISOString().split('T')[0];

  const lines = [
    '---',
    `title: "${title.replace(/"/g, '\\"')}"`,
    `date: "${date || today}"`,
    `lastEdited: "${today}"`,
    ...(summary ? [`summary: "${summary.replace(/"/g, '\\"')}"`] : []),
    ...(tagsArray.length > 0 ? [`tags: [${tagsArray.map(t => `"${t}"`).join(', ')}]`] : []),
    `published: ${published !== false ? 'true' : 'false'}`,
    '---',
    '',
    content,
  ];

  const fileContent = lines.join('\n');
  const encodedContent = Buffer.from(fileContent).toString('base64');

  const headers: Record<string, string> = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: `Update: ${title}`,
      content: encodedContent,
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
