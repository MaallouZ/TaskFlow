import { afterEach, describe, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { countDays, isValidDateString, listDays, todayInTimeZone } from '../src/utils/dates.js';
import { isValidTimeZone } from '../src/utils/timezone.js';

describe('isValidDateString', () => {
  test('accepte de vraies dates, y compris le 29 février d\'une année bissextile', () => {
    for (const value of ['2026-10-07', '2026-12-31', '2028-02-29']) {
      assert.equal(isValidDateString(value), true, value);
    }
  });

  test('refuse les dates qui n\'existent pas', () => {
    for (const value of ['2026-02-29', '2026-02-31', '2026-04-31', '2026-13-01', '2026-00-10', '2026-10-00']) {
      assert.equal(isValidDateString(value), false, value);
    }
  });

  test('refuse les mauvais formats', () => {
    for (const value of ['2026-1-7', '07/10/2026', '20261007', '2026-10-07T10:00:00Z', ' 2026-10-07', '', 'abc']) {
      assert.equal(isValidDateString(value), false, JSON.stringify(value));
    }
  });

  test('refuse ce qui n\'est pas du texte', () => {
    for (const value of [undefined, null, 20261007]) {
      assert.equal(isValidDateString(value), false, String(value));
    }
  });
});

describe('listDays', () => {
  test('retourne un seul jour quand from = to', () => {
    assert.deepEqual(listDays('2026-10-07', '2026-10-07'), ['2026-10-07']);
  });

  test('retourne tous les jours, bornes comprises', () => {
    assert.deepEqual(listDays('2026-10-05', '2026-10-08'), [
      '2026-10-05',
      '2026-10-06',
      '2026-10-07',
      '2026-10-08',
    ]);
  });

  test('traverse un changement de mois et d\'année', () => {
    assert.deepEqual(listDays('2026-12-30', '2027-01-02'), [
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
    ]);
  });

  test('contient le 29 février d\'une année bissextile', () => {
    assert.deepEqual(listDays('2028-02-28', '2028-03-01'), ['2028-02-28', '2028-02-29', '2028-03-01']);
  });

  test('ne saute et ne répète aucun jour au passage à l\'heure d\'été (29 mars 2026)', () => {
    assert.deepEqual(listDays('2026-03-28', '2026-03-30'), ['2026-03-28', '2026-03-29', '2026-03-30']);
  });

  test('ne saute et ne répète aucun jour au passage à l\'heure d\'hiver (25 octobre 2026)', () => {
    assert.deepEqual(listDays('2026-10-24', '2026-10-26'), ['2026-10-24', '2026-10-25', '2026-10-26']);
  });

  test('une année complète contient 365 jours (366 si bissextile), tous différents', () => {
    const year2026 = listDays('2026-01-01', '2026-12-31');
    const year2028 = listDays('2028-01-01', '2028-12-31');

    assert.equal(year2026.length, 365);
    assert.equal(year2028.length, 366);
    assert.equal(new Set(year2026).size, 365);
    assert.deepEqual(year2026, [...year2026].sort());
  });

  test('retourne une liste vide si from est après to', () => {
    assert.deepEqual(listDays('2026-10-08', '2026-10-07'), []);
  });
});

describe('countDays', () => {
  test('compte les bornes incluses', () => {
    assert.equal(countDays('2026-10-07', '2026-10-07'), 1);
    assert.equal(countDays('2026-10-24', '2026-10-26'), 3);
  });

  test('compte une année entière', () => {
    assert.equal(countDays('2026-01-01', '2026-12-31'), 365);
    assert.equal(countDays('2028-01-01', '2028-12-31'), 366);
  });

  test('donne le même résultat que listDays', () => {
    for (const [from, to] of [['2026-03-20', '2026-04-05'], ['2026-10-01', '2026-11-15'], ['2025-12-25', '2026-01-05']]) {
      assert.equal(countDays(from, to), listDays(from, to).length);
    }
  });
});

describe('todayInTimeZone', () => {
  afterEach(() => mock.timers.reset());

  test('retourne une date valide au format AAAA-MM-JJ', () => {
    assert.equal(isValidDateString(todayInTimeZone('Europe/Paris')), true);
  });

  test('le même instant donne des jours différents selon le fuseau', () => {
    mock.timers.enable({ apis: ['Date'], now: new Date('2026-10-07T22:30:00.000Z') });

    assert.equal(todayInTimeZone('UTC'), '2026-10-07');
    assert.equal(todayInTimeZone('America/Los_Angeles'), '2026-10-07');
    assert.equal(todayInTimeZone('Europe/Paris'), '2026-10-08');
    assert.equal(todayInTimeZone('Pacific/Kiritimati'), '2026-10-08');
  });

  test('tient compte de l\'heure d\'hiver et de l\'heure d\'été à Paris', () => {
    mock.timers.enable({ apis: ['Date'], now: new Date('2026-01-14T22:30:00.000Z') });
    assert.equal(todayInTimeZone('Europe/Paris'), '2026-01-14');

    mock.timers.reset();
    mock.timers.enable({ apis: ['Date'], now: new Date('2026-07-14T22:30:00.000Z') });
    assert.equal(todayInTimeZone('Europe/Paris'), '2026-07-15');
  });
});

describe('isValidTimeZone', () => {
  test('accepte des identifiants IANA', () => {
    for (const value of ['Europe/Paris', 'UTC', 'America/New_York', 'Asia/Kolkata', 'Pacific/Kiritimati']) {
      assert.equal(isValidTimeZone(value), true, value);
    }
  });

  test('refuse ce qui n\'est pas un fuseau', () => {
    for (const value of ['Paris', '', 'Europe/Nowhere', 'abc', 'null']) {
      assert.equal(isValidTimeZone(value), false, JSON.stringify(value));
    }
  });
});
