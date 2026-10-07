import { describe, it, expect, afterEach, vi } from 'vitest';
import { todayIn, countThisWeek, timeLeftToday } from './habits.js';

// on remet la vraie date après chaque test
afterEach(() => {
  vi.useRealTimers();
});

describe('todayIn', () => {
  it('donne la date du jour selon le fuseau', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-07T17:50:00Z')); // 19h50 à Paris

    expect(todayIn('Europe/Paris')).toBe('2026-10-07');
    // à Tokyo il est déjà 2h50 du matin le lendemain
    expect(todayIn('Asia/Tokyo')).toBe('2026-10-08');
  });
});

describe('countThisWeek', () => {
  // mercredi 7 octobre 2026 -> la semaine a commencé le lundi 5
  const today = '2026-10-07';

  it('compte les jours cochés depuis lundi', () => {
    const habit = { completedDates: ['2026-10-05', '2026-10-06', '2026-10-07'] };
    expect(countThisWeek(habit, today)).toBe(3);
  });

  it('ignore les jours de la semaine dernière', () => {
    const habit = { completedDates: ['2026-10-03', '2026-10-04', '2026-10-06'] };
    expect(countThisWeek(habit, today)).toBe(1);
  });

  it('donne 0 si rien n’est coché', () => {
    const habit = { completedDates: [] };
    expect(countThisWeek(habit, today)).toBe(0);
  });

  it('le lundi, seul le lundi compte', () => {
    const habit = { completedDates: ['2026-10-04', '2026-10-05'] };
    expect(countThisWeek(habit, '2026-10-05')).toBe(1);
  });
});

describe('timeLeftToday', () => {
  it('affiche les heures et les minutes restantes', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-07T17:50:00Z')); // 19h50 à Paris
    expect(timeLeftToday('Europe/Paris')).toBe('4 h 10 min');
  });

  it('affiche seulement les minutes s’il reste moins d’une heure', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-07T21:35:00Z')); // 23h35 à Paris
    expect(timeLeftToday('Europe/Paris')).toBe('25 min');
  });
});
