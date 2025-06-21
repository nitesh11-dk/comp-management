import dayjs from "dayjs"

export const roundTimeToNextHour = (timestamp: string | Date) => {
  const time = dayjs(timestamp)

  // If minutes > 0, round up to next hour, otherwise keep current hour
  const displayTime = time.minute() > 0 ? time.add(1, "hour").startOf("hour") : time.startOf("hour")

  return {
    realTime: time.toISOString(),
    displayTime: displayTime.toISOString(),
    realTimeFormatted: time.format("HH:mm"),
    displayTimeFormatted: displayTime.format("HH:mm"),
  }
}

export const formatTime = (timestamp: string | Date, format = "HH:mm") => {
  return dayjs(timestamp).format(format)
}

export const formatDate = (timestamp: string | Date, format = "DD/MM/YYYY") => {
  return dayjs(timestamp).format(format)
}

export const isToday = (timestamp: string | Date) => {
  return dayjs(timestamp).isSame(dayjs(), "day")
}

export const calculateHours = (inTime: string | Date, outTime: string | Date) => {
  const start = dayjs(inTime)
  const end = dayjs(outTime)
  const hours = end.diff(start, "hour", true)
  return Math.round(hours * 100) / 100
}
