"use client"
import { Icon } from "./icons"
import { ask } from "./Toast"

/** A red delete button that asks first, in an in-app action sheet (only for things that can't be undone). */
export default function Confirm({ action, label, message }: { action: () => Promise<void>; label: string; message: string }) {
  return (
    <button type="button" className="btn sm danger" onClick={async () => { if (await ask({ message, confirm: label })) await action() }}>
      <Icon name="trash" size={14} />{label}
    </button>
  )
}
