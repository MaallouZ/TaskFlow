import { describe, it, expect } from 'vitest';
import { isValidEmail } from './validation.js';

// tests de la fonction isValidEmail
describe('isValidEmail', () => {
  it('accepte un email correct', () => {
    expect(isValidEmail('amina@gmail.com')).toBe(true);
  });

  it('refuse un email sans @', () => {
    expect(isValidEmail('aminagmail.com')).toBe(false);
  });

  it('refuse un email sans point après le @', () => {
    expect(isValidEmail('amina@gmail')).toBe(false);
  });

  it('refuse un email vide', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('ignore les espaces autour', () => {
    expect(isValidEmail('  amina@gmail.com  ')).toBe(true);
  });
});
