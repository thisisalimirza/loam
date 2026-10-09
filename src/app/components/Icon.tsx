type IconName = "external" | "right" | "down" | "up" | "left" | "pin"

const paths: Record<IconName, string> = {
  external: "M4 12 L12 4 M6.5 4 H12 V9.5",
  right: "M3.5 8 H12.5 M9 4.5 L12.5 8 L9 11.5",
  down: "M8 3.5 V12.5 M4.5 9 L8 12.5 L11.5 9",
  up: "M8 12.5 V3.5 M4.5 7 L8 3.5 L11.5 7",
  left: "M12.5 8 H3.5 M7 4.5 L3.5 8 L7 11.5",
  pin: "M8 14.5 C8 14.5 3.5 10.2 3.5 7.2 A4.5 4.5 0 0 1 12.5 7.2 C12.5 10.2 8 14.5 8 14.5 Z M8 9 A1.8 1.8 0 1 0 8 5.4 A1.8 1.8 0 0 0 8 9 Z",
}

export default function Icon({
  name,
  className,
}: {
  name: IconName
  className?: string
}) {
  const isPin = name === "pin"

  return (
    <svg
      className={`ui-icon${className ? ` ${className}` : ""}`}
      viewBox="0 0 16 16"
      width="1em"
      height="1em"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={paths[name]}
        fill={isPin ? "none" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
