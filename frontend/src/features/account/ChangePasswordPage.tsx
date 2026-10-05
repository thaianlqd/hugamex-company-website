import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LockKeyhole } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { api, errorMessage } from '../../services/api';
import Field from '../../components/common/Field';
export default function ChangePasswordPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const vi = i18n.language === 'vi';
  const [error, setError] = useState('');
  const schema = z
    .object({
      currentPassword: z.string().min(1, t('required')).max(128),
      password: z
        .string()
        .min(12, vi ? 'Dùng ít nhất 12 ký tự.' : 'Use at least 12 characters.')
        .max(128),
      confirmPassword: z.string().min(1, t('required')),
    })
    .refine((v) => v.password === v.confirmPassword, {
      path: ['confirmPassword'],
      message: vi ? 'Mật khẩu xác nhận chưa khớp.' : 'The passwords do not match.',
    });
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  return (
    <>
      <div className="account-panel-heading">
        <span className="account-icon">
          <LockKeyhole size={22} />
        </span>
        <div>
          <h2>{vi ? 'Đổi mật khẩu' : 'Change password'}</h2>
          <p>
            {vi
              ? 'Sau khi đổi mật khẩu, các phiên hiện tại sẽ kết thúc. Bạn cần đăng nhập lại.'
              : 'Changing your password ends current sessions. Sign in again afterwards.'}
          </p>
        </div>
      </div>
      <form
        noValidate
        onSubmit={form.handleSubmit(async ({ currentPassword, password }) => {
          setError('');
          try {
            await api.post('/account/change-password', { currentPassword, password });
            await auth.logout();
            navigate('/dang-nhap', { replace: true });
          } catch (e) {
            setError(errorMessage(e));
          }
        })}
      >
        {(['currentPassword', 'password', 'confirmPassword'] as const).map((key, n) => (
          <Field
            key={key}
            id={key}
            label={
              (vi
                ? ['Mật khẩu hiện tại', 'Mật khẩu mới', 'Xác nhận mật khẩu mới']
                : ['Current password', 'New password', 'Confirm new password'])[n]
            }
            error={form.formState.errors[key]?.message}
          >
            <input
              id={key}
              type="password"
              autoComplete={n === 0 ? 'current-password' : 'new-password'}
              {...form.register(key)}
              aria-invalid={!!form.formState.errors[key]}
              aria-describedby={`${key}-error`}
            />
          </Field>
        ))}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="button" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? t('loading')
            : vi
              ? 'Cập nhật mật khẩu'
              : 'Update password'}
        </button>
      </form>
    </>
  );
}
