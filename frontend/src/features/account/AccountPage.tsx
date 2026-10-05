import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { UserRound } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { api, errorMessage } from '../../services/api';
import Field from '../../components/common/Field';
export default function AccountPage() {
  const auth = useAuth();
  const { t, i18n } = useTranslation();
  const vi = i18n.language === 'vi';
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const schema = z.object({ name: z.string().trim().min(1, t('required')).max(120) });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: auth.user?.name || '' },
  });
  return (
    <>
      <div className="account-panel-heading">
        <span className="account-icon">
          <UserRound size={22} />
        </span>
        <div>
          <h2>{vi ? 'Thông tin cá nhân' : 'Personal information'}</h2>
          <p>
            {vi
              ? 'Tên hiển thị được dùng trong tài khoản và không gian quản trị.'
              : 'Your display name is used in your account and CMS workspace.'}
          </p>
        </div>
      </div>
      <form
        noValidate
        onSubmit={form.handleSubmit(async (values) => {
          setError('');
          setSaved(false);
          try {
            await api.put('/account/profile', values);
            await auth.sync();
            form.reset(values);
            setSaved(true);
          } catch (e) {
            setError(errorMessage(e));
          }
        })}
      >
        <Field id="profileName" label={t('name')} error={form.formState.errors.name?.message}>
          <input
            id="profileName"
            autoComplete="name"
            {...form.register('name')}
            aria-invalid={!!form.formState.errors.name}
            aria-describedby="profileName-error"
          />
        </Field>
        <Field id="profileEmail" label="Email">
          <input
            id="profileEmail"
            type="email"
            value={auth.user?.email || ''}
            readOnly
            autoComplete="email"
          />
          <small>
            {vi
              ? 'Email đăng nhập được giữ nguyên để bảo vệ tài khoản.'
              : 'Your sign-in email is kept unchanged to protect your account.'}
          </small>
        </Field>
        <dl className="account-facts">
          <div>
            <dt>{vi ? 'Trạng thái email' : 'Email status'}</dt>
            <dd>
              {auth.user?.verified
                ? vi
                  ? 'Đã xác thực'
                  : 'Verified'
                : vi
                  ? 'Chưa xác thực'
                  : 'Unverified'}
            </dd>
          </div>
          <div>
            <dt>{vi ? 'Vai trò' : 'Roles'}</dt>
            <dd>{auth.user?.roles.join(', ')}</dd>
          </div>
        </dl>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {saved && (
          <p className="success" role="status">
            {vi ? 'Đã cập nhật thông tin cá nhân.' : 'Personal information updated.'}
          </p>
        )}
        <button
          className="button"
          disabled={form.formState.isSubmitting || !form.formState.isDirty}
        >
          {form.formState.isSubmitting ? t('loading') : t('save')}
        </button>
      </form>
    </>
  );
}
