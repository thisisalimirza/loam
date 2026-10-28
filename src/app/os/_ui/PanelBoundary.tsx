"use client"
import { Component, type ReactNode } from "react"

/** Keeps one broken panel from taking down the whole app. */
export default class PanelBoundary extends Component<{ children: ReactNode; onClose?: () => void }, { err: boolean }> {
  state = { err: false }
  static getDerivedStateFromError() { return { err: true } }
  componentDidCatch(e: unknown) { console.error("panel error", e) }
  render() {
    if (!this.state.err) return this.props.children
    return (
      <aside className="drawer" role="alertdialog" aria-label="Task couldn’t open">
        <div style={{ padding: 20, display: "grid", gap: 12 }}>
          <strong>This task couldn’t be shown.</strong>
          <span className="quiet-line" style={{ margin: 0 }}>Your data is safe. Close this and try again.</span>
          <div className="inline">
            <button className="btn sm" onClick={() => this.setState({ err: false })}>Try again</button>
            {this.props.onClose && <button className="btn ghost sm" onClick={() => { this.setState({ err: false }); this.props.onClose!() }}>Close</button>}
          </div>
        </div>
      </aside>
    )
  }
}
