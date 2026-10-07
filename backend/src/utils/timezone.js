export function isValidTimeZone(timeZone) {
    try {
        Intl.DateTimeFormat('en-US', { timeZone });
        return true;
    } catch (error) {
        return false;
    }
}