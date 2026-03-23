import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH ?? 'main';

  if (!token || !repo) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }

  const headers: Record<string, string> = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
  };

  if (path) {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`,
      { headers }
    );
    if (!res.ok) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    const data = await res.json();
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return NextResponse.json({ content, sha: data.sha });
  }

  // List all content MDX files via recursive tree
  const branchRes = await fetch(
    `https://api.github.com/repos/${repo}/branches/${branch}`,
    { headers }
  );
  if (!branchRes.ok) {
    return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
  }
  const branchData = await branchRes.json();
  const treeSha = branchData.commit.commit.tree.sha;

  const treeRes = await fetch(
    `https://api.github.com/repos/${repo}/git/trees/${treeSha}?recursive=1`,
    { headers }
  );
  if (!treeRes.ok) {
    return NextResponse.json({ error: 'Failed to fetch file tree' }, { status: 500 });
  }
  const treeData = await treeRes.json();

  const files = (treeData.tree as Array<{ path: string; type: string }>)
    .filter(
      item =>
        item.type === 'blob' &&
        item.path.startsWith('content/') &&
        item.path.endsWith('.mdx') &&
        item.path.split('/').length === 3
    )
    .map(item => {
      const parts = item.path.split('/');
      return { path: item.path, section: parts[1], slug: parts[2].replace('.mdx', '') };
    })
    .sort((a, b) => a.section.localeCompare(b.section) || a.slug.localeCompare(b.slug));

  return NextResponse.json({ files });
}
