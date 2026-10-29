import type { CSSProperties } from "react"
import { AREA_COLORS } from "@/lib/os/types"

const NAMES = ["Indigo", "Blue", "Green", "Orange", "Red", "Purple", "Sky", "Gold", "Slate"]

export function Swatches({ value }: { value?: string }) {
  return (
    <div className="fld sw-fld"><span>Color</span><div className="swatches" role="radiogroup" aria-label="Color">
      {AREA_COLORS.map((c, i) => (
        <label key={c} title={NAMES[i]}><input type="radio" name="color" value={c} defaultChecked={value ? value === c : i === 0} aria-label={NAMES[i]} /><span style={{ "--c": c } as CSSProperties} /></label>
      ))}
    </div></div>
  )
}
