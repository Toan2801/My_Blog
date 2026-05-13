/** Password policy used by both client validation and the signup API. */
import { z } from 'zod';

export const PASSWORD_MIN = 8;

const PASSWORD_RULES = [
  { re: /[A-Z]/, msg: 'Phải có ít nhất một chữ in hoa' },
  { re: /[a-z]/, msg: 'Phải có ít nhất một chữ thường' },
  { re: /[0-9]/, msg: 'Phải có ít nhất một chữ số' },
  { re: /[^A-Za-z0-9]/, msg: 'Phải có ít nhất một ký tự đặc biệt' },
] as const;

export function validatePassword(pw: string): string[] {
  const errs: string[] = [];
  if (pw.length < PASSWORD_MIN) errs.push(`Tối thiểu ${PASSWORD_MIN} ký tự`);
  for (const r of PASSWORD_RULES) if (!r.re.test(pw)) errs.push(r.msg);
  return errs;
}

export const SignupSchema = z
  .object({
    email: z.string().email('Email không hợp lệ').transform((s) => s.toLowerCase().trim()),
    password: z.string().refine((s) => validatePassword(s).length === 0, {
      message: 'Mật khẩu chưa đạt yêu cầu',
    }),
    confirm: z.string(),
    name: z.string().trim().optional(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Xác nhận mật khẩu không khớp',
    path: ['confirm'],
  });

export type SignupInput = z.infer<typeof SignupSchema>;
