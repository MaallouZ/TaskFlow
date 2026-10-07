import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatShortDate, todayString, isLate, isDueToday } from './dates.js';

// on fait comme si on était le 7 octobre 2026 à midi
// (sinon les tests changeraient de résultat chaque jour)
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 7, 12, 0)); // mois 9 = octobre (on compte à partir de 0)
});

afterEach(() => {
  vi.useRealTimers();
});

describe('todayString', () => {
  it('donne la date du jour au format AAAA-MM-JJ', () => {
    expect(todayString()).toBe('2026-10-07');
  });
});

describe('formatShortDate', () => {
  it('affiche une date courte en français', () => {
    expect(formatShortDate('2026-10-20T00:00:00.000Z')).toBe('20 oct. 2026');
  });
});

describe('isLate', () => {
  it('une tâche d’hier pas terminée est en retard', () => {
    const task = { status: 'todo', deadline: '2026-10-06T00:00:00.000Z' };
    expect(isLate(task)).toBe(true);
  });

  it('une tâche d’hier terminée n’est pas en retard', () => {
    const task = { status: 'done', deadline: '2026-10-06T00:00:00.000Z' };
    expect(isLate(task)).toBe(false);
  });

  it('une tâche pour aujourd’hui n’est pas en retard', () => {
    const task = { status: 'doing', deadline: '2026-10-07T00:00:00.000Z' };
    expect(isLate(task)).toBe(false);
  });

  it('une tâche sans échéance n’est pas en retard', () => {
    const task = { status: 'todo' };
    expect(isLate(task)).toBe(false);
  });
});

describe('isDueToday', () => {
  it('une tâche pour aujourd’hui est à rendre aujourd’hui', () => {
    const task = { status: 'todo', deadline: '2026-10-07T00:00:00.000Z' };
    expect(isDueToday(task)).toBe(true);
  });

  it('une tâche pour demain n’est pas à rendre aujourd’hui', () => {
    const task = { status: 'todo', deadline: '2026-10-08T00:00:00.000Z' };
    expect(isDueToday(task)).toBe(false);
  });

  it('une tâche terminée n’est plus à rendre', () => {
    const task = { status: 'done', deadline: '2026-10-07T00:00:00.000Z' };
    expect(isDueToday(task)).toBe(false);
  });
});
