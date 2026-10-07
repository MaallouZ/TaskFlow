const DAY_MS = 86400000;

// date du jour (AAAA-MM-JJ) dans un fuseau donné
export function todayInTimeZone(timeZone) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

// ajoute (ou retire) des jours à une date AAAA-MM-JJ
export function addDays(date, count) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + count * DAY_MS).toISOString().slice(0, 10);
}

// les 365 derniers jours, jusqu'à aujourd'hui
export function lastYearRange(timeZone) {
  const to = todayInTimeZone(timeZone);
  return { from: addDays(to, -364), to };
}

// 0 = lundi ... 6 = dimanche
function weekdayIndex(date) {
  return (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
}

// regroupe les jours par semaines de 7 cases (null = case vide)
export function buildWeeks(days) {
  const weeks = [];
  let week = new Array(weekdayIndex(days[0].date)).fill(null);
  for (const day of days) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

// niveau de couleur de 0 (rien) à 4 (très actif)
export function makeLevelFn(days) {
  const values = days.map((day) => day.total).filter((n) => n > 0).sort((a, b) => a - b);
  if (values.length === 0) return () => 0;
  if (values[values.length - 1] <= 4) return (total) => Math.min(total, 4);
  const at = (p) => values[Math.floor(p * (values.length - 1))];
  const [q1, q2, q3] = [at(0.25), at(0.5), at(0.75)];
  return (total) => (total === 0 ? 0 : total <= q1 ? 1 : total <= q2 ? 2 : total <= q3 ? 3 : 4);
}

// étiquettes de mois au-dessus des colonnes
export function monthLabels(weeks) {
  const labels = [];
  let lastMonth = '';
  weeks.forEach((week, index) => {
    const first = week.find(Boolean);
    const month = first.date.slice(0, 7);
    if (month !== lastMonth) {
      const text = new Intl.DateTimeFormat('fr-FR', { month: 'short', timeZone: 'UTC' }).format(new Date(`${first.date}T00:00:00Z`));
      labels.push({ index, text });
      lastMonth = month;
    }
  });
  if (labels.length > 1 && labels[1].index - labels[0].index < 3) labels.shift();
  return labels;
}

// "mercredi 7 octobre 2026"
export function formatDayLabel(date) {
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${date}T00:00:00Z`));
}