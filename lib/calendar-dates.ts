// The calendar works in the viewer's own dates; a site day "yyyy-MM-dd" is shown as that same calendar date.
export const toDate = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const toDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

// A site day written out, as the admin page's messages and pickers name it: "Friday, September 18, 2026".
export const longDate = (day: string, weekday = false) =>
  new Intl.DateTimeFormat("en-US", { weekday: weekday ? "long" : undefined, month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${day}T00:00:00Z`));
