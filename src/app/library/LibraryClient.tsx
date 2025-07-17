"use client";
import { useState, useMemo, useEffect } from "react";
import FlexSearch from "flexsearch";
import Link from "next/link";
import type { ContentItem } from "@/types";

const sections = ["essays", "memos", "vignettes", "projects", "meditations"];

type Props = {
  allContent: ContentItem[];
};

export default function LibraryClient({ allContent }: Props) {
  const [sectionFilter, setSectionFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<ContentItem[]>(allContent);

  // Get all unique tags
  const allTags = useMemo(() => Array.from(
    new Set(
      allContent.flatMap(item => Array.isArray(item.tags) ? item.tags : [])
    )
  ), [allContent]);

  // Flexsearch Document index
  const index = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const idx = new FlexSearch.Document<any, true>({
      tokenize: "forward",
      cache: true,
      document: {
        id: "url",
        index: ["title", "summary", "tags", "section"]
      }
    });
    allContent.forEach(item => idx.add(item));
    return idx;
  }, [allContent]);

  // Filtered content before search
  const filtered = useMemo(() => {
    let items = allContent;
    if (sectionFilter) items = items.filter(item => item.section === sectionFilter);
    if (tagFilter) items = items.filter(item => Array.isArray(item.tags) && item.tags.includes(tagFilter));
    return items;
  }, [allContent, sectionFilter, tagFilter]);

  useEffect(() => {
    let active = true;
    if (!search.trim()) {
      setSearchResults(filtered);
      return;
    }
    (async () => {
      // Search each field and merge results
      const results = await Promise.all([
        index.searchAsync(search, { field: "title", limit: 100 }),
        index.searchAsync(search, { field: "summary", limit: 100 }),
        index.searchAsync(search, { field: "tags", limit: 100 }),
        index.searchAsync(search, { field: "section", limit: 100 })
      ]);
      // Each result is an array of objects with a 'result' array of URLs
      const urlSet = new Set<string>();
      for (const arr of results) {
        if (Array.isArray(arr)) {
          for (const res of arr) {
            if (res && Array.isArray(res.result)) {
              for (const url of res.result) {
                if (typeof url === "string") {
                  urlSet.add(url);
                }
              }
            }
          }
        }
      }
      // Now filter the original allContent array by these URLs, and also apply section/tag filters
      const finalResults = allContent.filter(item =>
        urlSet.has(item.url) &&
        (!sectionFilter || item.section === sectionFilter) &&
        (!tagFilter || (Array.isArray(item.tags) && item.tags.includes(tagFilter)))
      );
      if (active) setSearchResults(finalResults);
    })();
    return () => { active = false; };
  }, [search, filtered, index, sectionFilter, tagFilter, allContent]);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1rem", fontFamily: "Georgia, serif" }}>
      <h1 style={{ fontWeight: 700, fontSize: "2rem", marginBottom: 12 }}>Library</h1>
      <div style={{ marginBottom: 24 }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title, summary, tag, section..."
          style={{
            width: "100%",
            maxWidth: 400,
            padding: "8px 12px",
            fontSize: "1rem",
            border: "1px solid #ddd",
            borderRadius: 6,
            marginBottom: 16
          }}
        />
      </div>
      <div style={{ marginBottom: 24, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <label>
          Section:
          <select value={sectionFilter || ""} onChange={e => setSectionFilter(e.target.value || null)} style={{ marginLeft: 8 }}>
            <option value="">All</option>
            {sections.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </label>
        <label>
          Tag:
          <select value={tagFilter || ""} onChange={e => setTagFilter(e.target.value || null)} style={{ marginLeft: 8 }}>
            <option value="">All</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </label>
      </div>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {searchResults.map(item => (
          <li key={item.url} style={{ marginBottom: 36, borderBottom: "1px solid #eee", paddingBottom: 18 }}>
            <h2 style={{ fontSize: "1.2rem", marginBottom: 4 }}>
              <Link href={item.url}>{item.title}</Link>
            </h2>
            <div style={{ color: "#888", fontSize: "0.98rem", marginBottom: 4 }}>
              {item.section.charAt(0).toUpperCase() + item.section.slice(1)}
              {item.date && <> · {item.date}</>}
              {item.readTime && <> · {item.readTime}</>}
            </div>
            {item.summary && <p style={{ color: "#444", marginBottom: 4 }}>{item.summary}</p>}
            {item.tags && Array.isArray(item.tags) && (
              <div style={{ color: "#aaa", fontSize: "0.95rem" }}>
                {item.tags.map((tag: string) => (
                  <span key={tag} style={{ marginRight: 8 }}>#{tag}</span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
      {searchResults.length === 0 && <div style={{ color: "#888", marginTop: 32 }}>No content found for this filter or search.</div>}
    </div>
  );
} 