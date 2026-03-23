'use client';

import { useState, useEffect, useCallback } from 'react';

type Status = { type: 'success' | 'error'; message: string } | null;

function toSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sections, setSections] = useState<string[]>([]);

  const [section, setSection] = useState('');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');

  const [status, setStatus] = useState<Status>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_pw');
    if (saved) {
      setPassword(saved);
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch('/api/sections')
      .then(r => r.json())
      .then(data => setSections(data.sections ?? []));
  }, [isLoggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem('admin_pw', password);
    setIsLoggedIn(true);
  };

  const handleTitleChange = useCallback((value: string) => {
    setTitle(value);
    if (!slugManuallyEdited) {
      setSlug(toSlug(value));
    }
  }, [slugManuallyEdited]);

  const handleSlugChange = (value: string) => {
    setSlug(value);
    setSlugManuallyEdited(true);
  };

  const resetForm = () => {
    setSection('');
    setTitle('');
    setSlug('');
    setSlugManuallyEdited(false);
    setSummary('');
    setTags('');
    setContent('');
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishing(true);
    setStatus(null);

    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, section, slug, title, summary, tags, content }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ type: 'success', message: `Published! Vercel will deploy /${section}/${slug} in ~60 seconds.` });
        resetForm();
      } else {
        setStatus({ type: 'error', message: data.error ?? 'Unknown error' });
      }
    } catch {
      setStatus({ type: 'error', message: 'Network error — check your connection.' });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_pw');
    setPassword('');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="page-layout" style={{ maxWidth: 400, marginTop: '4rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem' }}>Admin</h1>
        <form onSubmit={handleLogin}>
          <div className="admin-field">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              required
              style={{ width: '100%', padding: '0.5rem 0.75rem' }}
            />
          </div>
          <button type="submit" className="admin-btn">
            Sign in
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="page-layout" style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>New note</h1>
        <button onClick={handleLogout} className="admin-btn-ghost">
          Sign out
        </button>
      </div>

      <form onSubmit={handlePublish}>
        <div className="admin-field">
          <label className="admin-label">Section</label>
          <select
            value={section}
            onChange={e => setSection(e.target.value)}
            required
            style={{ padding: '0.5rem 0.75rem', minWidth: 160 }}
          >
            <option value="">Select…</option>
            {sections.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="admin-field">
          <label className="admin-label">Title</label>
          <input
            type="text"
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem 0.75rem' }}
          />
        </div>

        <div className="admin-field">
          <label className="admin-label">
            Slug
            <span style={{ color: 'var(--muted)', fontWeight: 400, marginLeft: '0.5rem', fontSize: '0.8rem' }}>
              → /{section || 'section'}/{slug || 'slug'}
            </span>
          </label>
          <input
            type="text"
            value={slug}
            onChange={e => handleSlugChange(e.target.value)}
            required
            pattern="[a-z0-9-]+"
            title="Lowercase letters, numbers, and hyphens only"
            style={{ width: '100%', padding: '0.5rem 0.75rem', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: '0.9rem' }}
          />
        </div>

        <div className="admin-field">
          <label className="admin-label">Summary <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
          <input
            type="text"
            value={summary}
            onChange={e => setSummary(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.75rem' }}
          />
        </div>

        <div className="admin-field">
          <label className="admin-label">Tags <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional, comma-separated)</span></label>
          <input
            type="text"
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="e.g. philosophy, writing, ai"
            style={{ width: '100%', padding: '0.5rem 0.75rem' }}
          />
        </div>

        <div className="admin-field">
          <label className="admin-label">Content <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(MDX)</span></label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            required
            rows={22}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontFamily: 'var(--font-geist-mono, monospace)',
              fontSize: '0.88rem',
              lineHeight: 1.6,
              resize: 'vertical',
            }}
          />
        </div>

        {status && (
          <div style={{
            marginBottom: '1rem',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius)',
            border: `1px solid ${status.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            background: status.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: status.type === 'success' ? '#15803d' : '#dc2626',
            fontSize: '0.9rem',
          }}>
            {status.message}
          </div>
        )}

        <button type="submit" disabled={isPublishing} className="admin-btn">
          {isPublishing ? 'Publishing…' : 'Publish'}
        </button>
      </form>
    </div>
  );
}
