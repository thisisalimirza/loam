import { Icon } from "./icons"

export default function SearchField({ action, q, label, placeholder, hidden }: { action: string; q?: string; label: string; placeholder: string; hidden?: Record<string, string | undefined> }) {
  return (
    <form className="sfield" action={action} role="search">
      <Icon name="search" size={14} />
      {Object.entries(hidden ?? {}).map(([k, v]) => v ? <input key={k} type="hidden" name={k} value={v} /> : null)}
      <input type="search" name="q" defaultValue={q} placeholder={placeholder} aria-label={label} />
    </form>
  )
}
