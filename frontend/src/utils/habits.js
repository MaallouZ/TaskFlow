// date du jour dans le fuseau de l'utilisateur (AAAA-MM-JJ)
export function todayIn(timeZone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timeZone || undefined,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

// nombre de jours cochés depuis lundi
export function countThisWeek(habit, today) {
  const d = new Date(`${today}T00:00:00Z`);
  const fromMonday = (d.getUTCDay() + 6) % 7; // 0 = lundi
  d.setUTCDate(d.getUTCDate() - fromMonday);
  const monday = d.toISOString().slice(0, 10);
  return habit.completedDates.filter((date) => date >= monday && date <= today).length;
}

// temps restant avant minuit dans le fuseau de l'utilisateur -> "4 h 10 min"
export function timeLeftToday(timeZone) {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: timeZone || undefined,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const hour = Number(parts.find((p) => p.type === 'hour').value);
  const minute = Number(parts.find((p) => p.type === 'minute').value);

  const left = 24 * 60 - (hour * 60 + minute); // minutes restantes
  const h = Math.floor(left / 60);
  const m = left % 60;
  return h > 0 ? `${h} h ${String(m).padStart(2, '0')} min` : `${m} min`;
}
