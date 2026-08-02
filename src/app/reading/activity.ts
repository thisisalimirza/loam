const DAY = 24 * 60 * 60 * 1000

export interface ActivityDay {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

export interface ActivityWeek {
  days: ActivityDay[]
  /** Month label to print above this column, if the month starts here. */
  label: string | null
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const key = (date: Date) => date.toISOString().slice(0, 10)

function levelFor(count: number): ActivityDay["level"] {
  if (count === 0) return 0
  if (count <= 2) return 1
  if (count <= 5) return 2
  if (count <= 12) return 3
  return 4
}

/**
 * Lays a year of highlight counts out as calendar columns, one column per week
 * running Sunday to Saturday and ending on the week of `endDate`.
 */
export function buildActivityWeeks(
  activity: Record<string, number>,
  endDate: Date,
  weekCount = 53,
): ActivityWeek[] {
  const end = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()))
  // Wind back to the Sunday of the first column.
  const start = new Date(end.getTime() - (weekCount - 1) * 7 * DAY - end.getUTCDay() * DAY)

  const weeks: ActivityWeek[] = []
  let previousMonth = -1
  let lastLabelledWeek = -3

  for (let week = 0; week < weekCount; week += 1) {
    const days: ActivityDay[] = []
    let label: string | null = null

    for (let day = 0; day < 7; day += 1) {
      const date = new Date(start.getTime() + (week * 7 + day) * DAY)
      if (date > end) break

      const count = activity[key(date)] ?? 0
      days.push({ date: key(date), count, level: levelFor(count) })

      // Label a column with the month its first days belong to, leaving room
      // for the label to overflow rather than crowd its neighbour.
      if (day === 0 && date.getUTCMonth() !== previousMonth) {
        previousMonth = date.getUTCMonth()
        if (week - lastLabelledWeek >= 3) {
          label = MONTHS[previousMonth]
          lastLabelledWeek = week
        }
      }
    }

    if (days.length) weeks.push({ days, label })
  }

  return weeks
}

export function totalIn(activity: Record<string, number>): { highlights: number; days: number } {
  const values = Object.values(activity)
  return {
    highlights: values.reduce((sum, count) => sum + count, 0),
    days: values.length,
  }
}
