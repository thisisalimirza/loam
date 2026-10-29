import Link from "next/link"
import { Icon } from "../../_ui/icons"
import { PageHeader } from "../../_ui/ui"
import { MORE } from "../../_ui/nav"

export const metadata = { title: "More" }
export default function More() {
  return (
    <>
      <PageHeader title="More" />
      <div className="ios-list"><section>
        <ul className="card ios-g">
          {MORE.map(l => <li key={l.href}><Link href={l.href} className="row"><Icon name={l.icon} /><span className="tt">{l.label}</span><Icon name="chev" className="i chev" /></Link></li>)}
        </ul>
      </section></div>
    </>
  )
}
