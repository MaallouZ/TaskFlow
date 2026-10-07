import * as userService from '../services/userService.js';
import * as activityService from '../services/activityService.js';
import { countDays, isValidDateString } from '../utils/dates.js';
import { isValidTimeZone } from '../utils/timezone.js';

const SOURCES = ['all', 'tasks', 'habits'];
const MAX_DAYS = 366;

export async function getActivity(request, response) {
    const { from, to, tz, source = 'all' } = request.query;

    if (!isValidDateString(from) || !isValidDateString(to)) {
        return response.status(400).json({ message: "from et to sont obligatoires (format AAAA-MM-JJ)." });
    }
    if (from > to || countDays(from, to) > MAX_DAYS) {
        return response.status(400).json({ message: `La période doit être ordonnée et durer ${MAX_DAYS} jours maximum.` });
    }
    if (!SOURCES.includes(source)) {
        return response.status(400).json({ message: "source doit valoir all, tasks ou habits." });
    }
    if (tz !== undefined && !isValidTimeZone(tz)) {
        return response.status(400).json({ message: "Fuseau horaire invalide." });
    }

    const user = await userService.getUserById(request.userId);
    const timeZone = tz ?? user.timezone;
    const activity = await activityService.getActivity(request.userId, { from, to, timeZone, source });
    return response.status(200).json(activity);
}