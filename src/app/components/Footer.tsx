import React from "react";

export default function Footer() {
  return (
    <footer style={{ marginTop: 40, color: "#aaa", fontSize: "0.95rem", textAlign: "center" }}>
      {/*
      <div style={{ marginBottom: 12 }}>
        <strong>🧭 Contact</strong><br />
        @thisisalimirza on pretty much all socials<br />
        Email: <a href="mailto:ali@braskgroup.com" style={{ color: "var(--accent)" }}>ali@braskgroup.com</a><br />
        Or just reply to any newsletter — I read every message.
      </div>
      */}
      <div style={{ marginBottom: 8 }}>
        &copy; {new Date().getFullYear()} Ali Mirza. All rights reserved.
      </div>
      <div>
        <a href="https://twitter.com/thisisalimirza" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", marginRight: 12 }}>Twitter</a>
        <a href="https://github.com/thisisalimirza" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>GitHub</a>
      </div>
    </footer>
  );
} 