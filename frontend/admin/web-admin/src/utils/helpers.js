export function formatDateTime(date) {
    const optionsDate = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    const optionsTime = { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false };
    const dateStr = date.toLocaleDateString(undefined, optionsDate);
    const timeStr = date.toLocaleTimeString(undefined, optionsTime);
    return `${dateStr} • ${timeStr}`;
}
