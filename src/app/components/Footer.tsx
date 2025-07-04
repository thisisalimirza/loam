import React from "react";

export default function Footer() {
  return (
    <footer style={{ marginTop: 40, color: "#aaa", fontSize: "0.95rem", textAlign: "center" }}>
      <div style={{ marginBottom: 8 }}>
        &copy; {new Date().getFullYear()} Ali Mirza. All rights reserved.
      </div>
      <div>
        <a href="mailto:ali@janusny.com" style={{ color: "var(--accent)", marginRight: 12 }}>Contact</a>
        <a href="https://twitter.com/thisisalimirza" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", marginRight: 12 }}>Twitter</a>
        <a href="https://github.com/thisisalimirza" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>GitHub</a>
      </div>
    </footer>
  );
} 