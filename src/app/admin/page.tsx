'use client';

import { useState, useEffect, useCallback } from 'react';

type Status = { type: 'success' | 'error'; message: string } | null;
type ContentFile = { path: string; section: string; slug: string };
type EditingFile = ContentFile & { sha: string };
type ParsedFrontmatter = {
  title: string; date: string; summary: string; tags: string; published: boolean; body: string;
};

function toSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parseFrontmatter(raw: string): ParsedFrontmatter {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { title: '', date: '', summary: '', tags: '', published: true, body: raw };

  const fm = match[1];
  const body = match[2].replace(/^\n/, '');

  const get = (key: string) => {
    const m = fm.match(new RegExp(`^${key}:\\s*"([^"]*)"`, 'm'));
    return m ? m[1] : '';
  };

  const tagsMatch = fm.match(/^tags:\s*\[([^\]]*)\]/m);
  const tags = tagsMatch
    ? tagsMatch[1].split(',').map(t => t.trim().replace(/^"|"$/g, '')).filter(Boolean).join(', ')
    : '';

  const publishedMatch = fm.match(/^published:\s*(true|false)/m);
  const published = publishedMatch ? publishedMatch[1] === 'true' : true;

  return { title: get('title'), date: get('date'), summary: get('summary'), tags, published, body };
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tab, setTab] = useState<'new' | 'browse'>('new');

  // New form
  const [sections, setSections] = useState<string[]>([]);
  const [section, setSection] = useState('');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [newStatus, setNewStatus] = useState<Status>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Browse & Edit
  const [files, setFiles] = useState<ContentFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [editingFile, setEditingFile] = useState<EditingFile | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editPublished, setEditPublished] = useState(true);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editStatus, setEditStatus] = useState<Status>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_pw');
    if (saved) { setPassword(saved); setIsLoggedIn(true); }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch('/api/sections').then(r => r.json()).then(d => setSections(d.sections ?? []));
  }, [isLoggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem('admin_pw', password);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_pw');
    setPassword(''); setIsLoggedIn(false);
  };

  const handleTitleChange = useCallback((value: string) => {
    setTitle(value);
    if (!slugManuallyEdited) setSlug(toSlug(value));
  }, [slugManuallyEdited]);

  const resetNewForm = () => {
    setSection(''); setTitle(''); setSlug(''); setSlugManuallyEdited(false);
    setSummary(''); setTags(''); setContent('');
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishing(true); setNewStatus(null);
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, section, slug, title, summary, tags, content }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewStatus({ type: 'success', message: `Published! Vercel will deploy /${section}/${slug} in ~60 seconds.` });
        resetNewForm();
      } else {
        setNewStatus({ type: 'error', message: data.error ?? 'Unknown error' });
      }
    } catch {
      setNewStatus({ type: 'error', message: 'Network error — check your connection.' });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleBrowseTab = async () => {
    setTab('browse');
    setEditingFile(null);
    setEditStatus(null);
    if (files.length === 0) {
      setIsLoadingFiles(true);
      try {
        const res = await fetch('/api/content');
        const data = await res.json();
        setFiles(data.files ?? []);
      } finally {
        setIsLoadingFiles(false);
      }
    }
  };

  const handleSelectFile = async (file: ContentFile) => {
    setIsLoadingFile(true);
    setEditingFile(null);
    setEditStatus(null);
    try {
      const res = await fetch(`/api/content?path=${encodeURIComponent(file.path)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const parsed = parseFrontmatter(data.content);
      setEditingFile({ ...file, sha: data.sha });
      setEditTitle(parsed.title);
      setEditDate(parsed.date);
      setEditSummary(parsed.summary);
      setEditTags(parsed.tags);
      setEditPublished(parsed.published);
      setEditContent(parsed.body);
    } catch (err) {
      setEditStatus({ type: 'error', message: String(err) });
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFile) return;
    setIsSaving(true); setEditStatus(null);
    try {
      const res = await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password, path: editingFile.path, sha: editingFile.sha,
          title: editTitle, date: editDate, summary: editSummary,
          tags: editTags, content: editContent, published: editPublished,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditStatus({ type: 'success', message: 'Saved! Vercel will redeploy in ~60 seconds.' });
        // Refresh SHA by reloading the file
        const fresh = await fetch(`/api/content?path=${encodeURIComponent(editingFile.path)}`);
        const freshData = await fresh.json();
        if (fresh.ok) setEditingFile(f => f ? { ...f, sha: freshData.sha } : f);
      } else {
        setEditStatus({ type: 'error', message: data.error ?? 'Unknown error' });
      }
    } catch {
      setEditStatus({ type: 'error', message: 'Network error.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingFile) return;
    if (!confirm(`Delete ${editingFile.path}? This cannot be undone.`)) return;
    setIsDeleting(true); setEditStatus(null);
    try {
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, path: editingFile.path, sha: editingFile.sha }),
      });
      const data = await res.json();
      if (res.ok) {
        setFiles(f => f.filter(x => x.path !== editingFile.path));
        setEditingFile(null);
        setEditStatus(null);
      } else {
        setEditStatus({ type: 'error', message: data.error ?? 'Unknown error' });
      }
    } catch {
      setEditStatus({ type: 'error', message: 'Network error.' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="page-layout" style={{ maxWidth: 400, marginTop: '4rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem' }}>Admin</h1>
        <form onSubmit={handleLogin}>
          <div className="admin-field">
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Password" autoFocus required
              style={{ width: '100%', padding: '0.5rem 0.75rem' }}
            />
          </div>
          <button type="submit" className="admin-btn">Sign in</button>
        </form>
      </div>
    );
  }

  // Grouped files for browse view
  const grouped = files.reduce<Record<string, ContentFile[]>>((acc, f) => {
    (acc[f.section] ??= []).push(f);
    return acc;
  }, {});

  return (
    <div className="page-layout" style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <button
            onClick={() => setTab('new')}
            className={tab === 'new' ? 'admin-tab-active' : 'admin-tab'}
          >
            New note
          </button>
          <button
            onClick={handleBrowseTab}
            className={tab === 'browse' ? 'admin-tab-active' : 'admin-tab'}
          >
            Browse &amp; edit
          </button>
        </div>
        <button onClick={handleLogout} className="admin-btn-ghost">Sign out</button>
      </div>

      {tab === 'new' && (
        <form onSubmit={handlePublish}>
          <div className="admin-field">
            <label className="admin-label">Section</label>
            <select value={section} onChange={e => setSection(e.target.value)} required
              style={{ padding: '0.5rem 0.75rem', minWidth: 160 }}>
              <option value="">Select…</option>
              {sections.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="admin-field">
            <label className="admin-label">Title</label>
            <input type="text" value={title} onChange={e => handleTitleChange(e.target.value)}
              required style={{ width: '100%', padding: '0.5rem 0.75rem' }} />
          </div>

          <div className="admin-field">
            <label className="admin-label">
              Slug
              <span style={{ color: 'var(--muted)', fontWeight: 400, marginLeft: '0.5rem', fontSize: '0.8rem' }}>
                → /{section || 'section'}/{slug || 'slug'}
              </span>
            </label>
            <input type="text" value={slug} onChange={e => { setSlug(e.target.value); setSlugManuallyEdited(true); }}
              required pattern="[a-z0-9-]+" title="Lowercase letters, numbers, and hyphens only"
              style={{ width: '100%', padding: '0.5rem 0.75rem', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: '0.9rem' }} />
          </div>

          <div className="admin-field">
            <label className="admin-label">Summary <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
            <input type="text" value={summary} onChange={e => setSummary(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.75rem' }} />
          </div>

          <div className="admin-field">
            <label className="admin-label">Tags <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional, comma-separated)</span></label>
            <input type="text" value={tags} onChange={e => setTags(e.target.value)}
              placeholder="e.g. philosophy, writing, ai"
              style={{ width: '100%', padding: '0.5rem 0.75rem' }} />
          </div>

          <div className="admin-field">
            <label className="admin-label">Content <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(MDX)</span></label>
            <textarea value={content} onChange={e => setContent(e.target.value)} required rows={22}
              style={{ width: '100%', padding: '0.75rem', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: '0.88rem', lineHeight: 1.6, resize: 'vertical' }} />
          </div>

          {newStatus && <StatusBanner status={newStatus} />}

          <button type="submit" disabled={isPublishing} className="admin-btn">
            {isPublishing ? 'Publishing…' : 'Publish'}
          </button>
        </form>
      )}

      {tab === 'browse' && !editingFile && !isLoadingFile && (
        <div>
          {isLoadingFiles ? (
            <p style={{ color: 'var(--muted)' }}>Loading…</p>
          ) : files.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>No content files found.</p>
          ) : (
            Object.entries(grouped).map(([sec, items]) => (
              <div key={sec} style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                  {sec}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  {items.map(f => (
                    <button key={f.path} onClick={() => handleSelectFile(f)}
                      style={{ textAlign: 'left', background: 'none', border: 'none', padding: '0.3rem 0', cursor: 'pointer', color: 'var(--fg)', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: '0.88rem' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent, #0070f3)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--fg)')}>
                      {f.slug}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'browse' && isLoadingFile && (
        <p style={{ color: 'var(--muted)' }}>Loading file…</p>
      )}

      {tab === 'browse' && editingFile && !isLoadingFile && (
        <div>
          <button onClick={() => { setEditingFile(null); setEditStatus(null); }}
            className="admin-btn-ghost" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            ← Back
          </button>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontFamily: 'var(--font-geist-mono, monospace)', marginBottom: '1.25rem' }}>
            {editingFile.path}
          </div>

          <form onSubmit={handleSave}>
            <div className="admin-field">
              <label className="admin-label">Title</label>
              <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                required style={{ width: '100%', padding: '0.5rem 0.75rem' }} />
            </div>

            <div className="admin-field">
              <label className="admin-label">Date</label>
              <input type="text" value={editDate} onChange={e => setEditDate(e.target.value)}
                placeholder="YYYY-MM-DD"
                style={{ padding: '0.5rem 0.75rem', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: '0.9rem' }} />
            </div>

            <div className="admin-field">
              <label className="admin-label">Summary <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
              <input type="text" value={editSummary} onChange={e => setEditSummary(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem' }} />
            </div>

            <div className="admin-field">
              <label className="admin-label">Tags <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(comma-separated)</span></label>
              <input type="text" value={editTags} onChange={e => setEditTags(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem' }} />
            </div>

            <div className="admin-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem' }}>
              <label className="admin-label" style={{ margin: 0 }}>Published</label>
              <input type="checkbox" checked={editPublished} onChange={e => setEditPublished(e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }} />
            </div>

            <div className="admin-field">
              <label className="admin-label">Content <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(MDX)</span></label>
              <textarea value={editContent} onChange={e => setEditContent(e.target.value)} required rows={22}
                style={{ width: '100%', padding: '0.75rem', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: '0.88rem', lineHeight: 1.6, resize: 'vertical' }} />
            </div>

            {editStatus && <StatusBanner status={editStatus} />}

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button type="submit" disabled={isSaving || isDeleting} className="admin-btn">
                {isSaving ? 'Saving…' : 'Save changes'}
              </button>
              <button type="button" onClick={handleDelete} disabled={isSaving || isDeleting}
                className="admin-btn-ghost"
                style={{ color: '#dc2626', borderColor: '#fecaca' }}>
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function StatusBanner({ status }: { status: NonNullable<Status> }) {
  return (
    <div style={{
      marginBottom: '1rem', padding: '0.65rem 0.85rem',
      borderRadius: 'var(--radius)',
      border: `1px solid ${status.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
      background: status.type === 'success' ? '#f0fdf4' : '#fef2f2',
      color: status.type === 'success' ? '#15803d' : '#dc2626',
      fontSize: '0.9rem',
    }}>
      {status.message}
    </div>
  );
}
