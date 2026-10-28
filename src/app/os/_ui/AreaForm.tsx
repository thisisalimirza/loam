import type { CSSProperties } from "react"
import { AREA_COLORS } from "@/lib/os/types"

export function Swatches({ value }: { value?: string }) {
  return (
    <div className="swatches" role="radiogroup" aria-label="Color">
      {AREA_COLORS.map((c, i) => (
        <label key={c}><input type="radio" name="color" value={c} defaultChecked={value ? value === c : i === 0} aria-label={c} /><span style={{ "--c": c } as CSSProperties} /></label>
      ))}
    </div>
  )
}
