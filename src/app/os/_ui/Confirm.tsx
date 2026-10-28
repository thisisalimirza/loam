"use client"
import { Icon } from "./icons"

export default function Confirm({ action, label, message }: { action: () => Promise<void>; label: string; message: string }) {
  return (
    <button type="button" className="btn sm danger" onClick={async () => { if (window.confirm(message)) await action() }}>
      <Icon name="trash" size={14} />{label}
    </button>
  )
}
