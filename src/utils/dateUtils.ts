/**
 * Peru-specific Date Utilities (America/Lima)
 */

const PERU_TZ = 'America/Lima';

/**
 * Returns the current date in Peru format (YYYY-MM-DD)
 */
export function getPeruDateString(date: Date = new Date()): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: PERU_TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    return formatter.format(date); // Format: YYYY-MM-DD
}

/**
 * Returns a new Date object adjusted to Peru timezone
 */
export function getPeruNow(): Date {
    const now = new Date();
    const peruTime = now.toLocaleString('en-US', { timeZone: PERU_TZ });
    return new Date(peruTime);
}

/**
 * Safely converts Firestore Timestamps or generic dates to Peru JS Date
 */
export function ensurePeruDate(date: any): Date {
    if (!date) return new Date();

    let jsDate: Date;
    if (date.toDate && typeof date.toDate === 'function') {
        jsDate = date.toDate();
    } else if (date instanceof Date) {
        jsDate = date;
    } else {
        jsDate = new Date(date);
    }

    // Shift to Peru time
    const peruTime = jsDate.toLocaleString('en-US', { timeZone: PERU_TZ });
    return new Date(peruTime);
}

/**
 * Formats a date for display in Peru
 */
export function formatPeruDisplay(date: Date, options: Intl.DateTimeFormatOptions = {}): string {
    return new Intl.DateTimeFormat('es-PE', {
        timeZone: PERU_TZ,
        ...options
    }).format(date);
}
