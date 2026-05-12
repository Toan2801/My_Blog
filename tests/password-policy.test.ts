import { describe, it, expect } from 'vitest';
import { validatePassword, SignupSchema } from '@/lib/password-policy';

describe('password-policy', () => {
  it('rejects short passwords', () => {
    expect(validatePassword('Ab1!')).toContain('Tối thiểu 8 ký tự');
  });
  it('requires uppercase, lowercase, digit, special', () => {
    expect(validatePassword('alllowercase1!').length).toBeGreaterThan(0);
    expect(validatePassword('ALLUPPER1!').length).toBeGreaterThan(0);
    expect(validatePassword('NoDigits!!')).toContain('Phải có ít nhất một chữ số');
    expect(validatePassword('NoSpecial1A')).toContain('Phải có ít nhất một ký tự đặc biệt');
  });
  it('accepts a strong password', () => {
    expect(validatePassword('Admin1234!')).toEqual([]);
  });

  it('schema enforces confirm match', () => {
    const ok = SignupSchema.safeParse({
      email: 'a@b.com', password: 'Admin1234!', confirm: 'Admin1234!',
    });
    expect(ok.success).toBe(true);
    const fail = SignupSchema.safeParse({
      email: 'a@b.com', password: 'Admin1234!', confirm: 'mismatch',
    });
    expect(fail.success).toBe(false);
  });

  it('schema lowercases email', () => {
    const r = SignupSchema.safeParse({
      email: 'Foo@BAR.com', password: 'Admin1234!', confirm: 'Admin1234!',
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe('foo@bar.com');
  });
});
