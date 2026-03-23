import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { password, section, slug, title, summary, tags, content } = body;

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!section || !slug || !title || !content) {
    return NextResponse.json(
      { error: 'Missing required fields: section, slug, title, content' },
      { status: 400 }
    );
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH ?? 'main';

  if (!token || !repo) {
    return NextResponse.json(
      { error: 'Server not configured (missing GITHUB_TOKEN or GITHUB_REPO)' },
      { status: 500 }
    );
  }

  const date = new Date().toISOString().split('T')[0];
  const tagsArray: string[] = tags
    ? tags.split(',').map((t: string) => t.trim()).filter(Boolean)
    : [];

  const lines = [
    '---',
    `title: "${title.replace(/"/g, '\\"')}"`,
    `date: "${date}"`,
    ...(summary ? [`summary: "${summary.replace(/"/g, '\\"')}"`] : []),
    ...(tagsArray.length > 0 ? [`tags: [${tagsArray.map(t => `"${t}"`).join(', ')}]`] : []),
    'published: true',
    '---',
    '',
    content,
  ];

  const fileContent = lines.join('\n');
  const filePath = `content/${section}/${slug}.mdx`;
  const encodedContent = Buffer.from(fileContent).toString('base64');

  const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;
  const headers: Record<string, string> = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  // Reject if file already exists to avoid accidental overwrites
  const checkRes = await fetch(`${apiUrl}?ref=${branch}`, { headers });
  if (checkRes.ok) {
    return NextResponse.json(
      { error: `A file already exists at ${filePath}. Choose a different slug.` },
      { status: 409 }
    );
  }

  const res = await fetch(apiUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: `Add note: ${title}`,
      content: encodedContent,
      branch,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json(
      { error: err.message ?? 'GitHub API error' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, path: filePath });
}
