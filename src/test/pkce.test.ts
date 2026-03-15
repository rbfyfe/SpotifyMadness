import { describe, it, expect } from 'vitest';
import { generateRandomString, generateCodeChallenge } from '../utils/pkce';

describe('PKCE utilities', () => {
  describe('generateRandomString', () => {
    it('generates a string of the requested length', () => {
      const result = generateRandomString(128);
      expect(result).toHaveLength(128);
    });

    it('generates different strings each time', () => {
      const a = generateRandomString(64);
      const b = generateRandomString(64);
      expect(a).not.toBe(b);
    });

    it('uses only valid characters', () => {
      const result = generateRandomString(1000);
      const validChars = /^[A-Za-z0-9\-._~]+$/;
      expect(result).toMatch(validChars);
    });
  });

  describe('generateCodeChallenge', () => {
    it('produces a base64url-encoded string', async () => {
      const challenge = await generateCodeChallenge('test_verifier');
      // base64url should only contain these characters
      expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('is deterministic for the same input', async () => {
      const a = await generateCodeChallenge('same_input');
      const b = await generateCodeChallenge('same_input');
      expect(a).toBe(b);
    });

    it('produces different outputs for different inputs', async () => {
      const a = await generateCodeChallenge('input_a');
      const b = await generateCodeChallenge('input_b');
      expect(a).not.toBe(b);
    });

    it('produces a 43-character output (SHA-256 in base64url)', async () => {
      const challenge = await generateCodeChallenge('any_verifier');
      expect(challenge).toHaveLength(43);
    });
  });
});
