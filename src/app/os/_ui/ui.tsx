import Link from "next/link"
import type { CSSProperties, ReactNode } from "react"
import { Icon, type IconName } from "./icons"

export function PageHeader({ eyebrow, title, sub, actions, back }: {
  eyebrow?: ReactNode; title: ReactNode; sub?: ReactNode; actions?: ReactNode; back?: { href: string; label: string }
}) {
  return (
    <header className="hd">
      <div style={{ minWidth: 0 }}>
        {back && <Link className="crumb" href={back.href}><Icon name="back" size={14} />{back.label}</Link>}
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {sub && <p className="sub">{sub}</p>}
      </div>
      {actions && <div className="hd-actions">{actions}</div>}
    </header>
  )
}

export function Card({ title, icon, meta, children, className = "", style }: {
  title?: ReactNode; icon?: IconName; meta?: ReactNode; children: ReactNode; className?: string; style?: CSSProperties
}) {
  return (
    <section className={`card ${className}`} style={style}>
      {title && (
        <div className="ch">
          <h2>{icon && <Icon name={icon} />}{title}</h2>
          {meta && <div className="meta">{meta}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

export function Pill({ color, children, gray }: { color?: string; children: ReactNode; gray?: boolean }) {
  return <span className={`pill${gray ? " gray" : ""}`} style={color ? ({ "--c": color } as CSSProperties) : undefined}>{children}</span>
}

export function Empty({ icon = "sparkle", title, children }: { icon?: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <Icon name={icon} className="ic" />
      <strong>{title}</strong>
      {children && <p>{children}</p>}
    </div>
  )
}

export function Avatar({ name, lg }: { name: string; lg?: boolean }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]!.toUpperCase()).join("")
  return <span className={`av${lg ? " lg" : ""}`}>{initials || "?"}</span>
}

export function Seg({ items, active }: { items: { href: string; label: string; key: string }[]; active: string }) {
  return (
    <nav className="seg">
      {items.map(i => <Link key={i.key} href={i.href} className={i.key === active ? "on" : ""}>{i.label}</Link>)}
    </nav>
  )
}

export function AreaSelect({ areas, name = "area_id", value, placeholder = "No area" }: {
  areas: { id: string; name: string }[]; name?: string; value?: string | null; placeholder?: string
}) {
  return (
    <select className="in" name={name} defaultValue={value ?? ""}>
      <option value="">{placeholder}</option>
      {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
    </select>
  )
}
