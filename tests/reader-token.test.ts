import { describe, it, expect } from 'vitest';
import {
  issueUserReaderToken,
  issueTrialReaderToken,
  verifyReaderToken,
  tokenAllowsPage,
  TRIAL_MAX_PAGES,
} from '@/lib/reader-token';

describe('reader-token', () => {
  it('issues + verifies a user token', () => {
    const { token } = issueUserReaderToken('u1', 'slug-a');
    const info = verifyReaderToken('slug-a', token);
    expect(info).not.toBeNull();
    expect(info?.kind).toBe('user');
    expect(info?.subject).toBe('u1');
  });

  it('rejects a token issued for a different slug', () => {
    const { token } = issueUserReaderToken('u1', 'slug-a');
    expect(verifyReaderToken('slug-b', token)).toBeNull();
  });

  it('issues + verifies a trial token, capped to first 5 pages', () => {
    const { token } = issueTrialReaderToken('anon-sess', 'slug-x');
    const info = verifyReaderToken('slug-x', token);
    expect(info?.kind).toBe('trial');
    expect(tokenAllowsPage(info!, 1)).toBe(true);
    expect(tokenAllowsPage(info!, TRIAL_MAX_PAGES)).toBe(true);
    expect(tokenAllowsPage(info!, TRIAL_MAX_PAGES + 1)).toBe(false);
  });

  it('user tokens allow every page', () => {
    const { token } = issueUserReaderToken('u1', 'slug-y');
    const info = verifyReaderToken('slug-y', token)!;
    expect(tokenAllowsPage(info, 1)).toBe(true);
    expect(tokenAllowsPage(info, 500)).toBe(true);
  });

  it('rejects malformed tokens', () => {
    expect(verifyReaderToken('slug-z', null)).toBeNull();
    expect(verifyReaderToken('slug-z', '')).toBeNull();
    expect(verifyReaderToken('slug-z', 'garbage')).toBeNull();
    expect(verifyReaderToken('slug-z', 'user:u1.1.AAAA')).toBeNull();
  });
});
