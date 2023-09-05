// Takes seconds in input and gives minutes and seconds in format(MM.SS)
export function formatTimeSpan(seconds: number): number {
    const minutes = Math.floor(seconds / 60);
    const actualSeconds = seconds - minutes * 60;
    const formattedValue = minutes.toString().padStart(2, '0') + '.' + actualSeconds.toString().padStart(2, '0');
    return Number(formattedValue);
}