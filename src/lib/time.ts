import { endOfDay, startOfDay } from 'date-fns'

export function buildStartTimeRange(startDate?: string | null, endDate?: string | null) {
  const range: { gte?: Date; lte?: Date } = {}

  if (startDate) {
    range.gte = startOfDay(new Date(startDate))
  }

  if (endDate) {
    range.lte = endOfDay(new Date(endDate))
  }

  return Object.keys(range).length > 0 ? range : undefined
}

export function calculateBreakMinutes(
  breaks: Array<{ startTime: Date; endTime: Date | null }>,
  fallbackEnd = new Date(),
) {
  const totalBreakMs = breaks.reduce((sum, currentBreak) => {
    const end = currentBreak.endTime ?? fallbackEnd
    return sum + Math.max(0, end.getTime() - currentBreak.startTime.getTime())
  }, 0)

  return Math.floor(totalBreakMs / 60000)
}

export function calculateTrackedMinutes(
  startTime: Date,
  endTime: Date,
  totalBreakMinutes: number,
) {
  const durationMs = endTime.getTime() - startTime.getTime()
  return Math.max(0, Math.floor(durationMs / 60000) - totalBreakMinutes)
}
