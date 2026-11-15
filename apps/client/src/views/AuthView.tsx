import { isAxiosError } from 'axios';
import { CircleCheck, MailCheck } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { MikotoLogo } from '@/components/icons';
import { Button, Field, Input, cx } from '@/design';
import { useErrorElement } from '@/hooks/useErrorElement';
import { authClient } from '@/store/authClient';

import styles from './AuthView.module.css';

/**
 * Auth requests fail for reasons the server explains best ("email already
 * registered"), and a 401 here means wrong credentials, not an expired session.
 */
function authError(e: unknown, unauthorized: string): unknown {
  if (!isAxiosError(e) || !e.response) return e;
  const data: unknown = e.response.data;
  if (
    typeof data === 'object' &&
    data !== null &&
    'message' in data &&
    typeof data.message === 'string' &&
    data.message.length > 0 &&
    data.message.length < 200
  ) {
    return data.message;
  }
  if (e.response.status === 401 || e.response.status === 403)
    return unauthorized;
  return e;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function AuthView({
  title,
  subtitle,
  footer,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <MikotoLogo className={styles.logo} size={40} title="Mikoto" />
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        {children}
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </main>
  );
}

function storeRefreshToken(token: string | null | undefined) {
  if (!token) return;
  try {
    localStorage.setItem('REFRESH_TOKEN', token);
  } catch {
    // Storage blocked: the session still works until the tab closes.
  }
}

interface LoginValues {
  email: string;
  password: string;
}

export function LoginView() {
  const { register, handleSubmit, formState } = useForm<LoginValues>();
  const error = useErrorElement();
  const { errors } = formState;

  return (
    <AuthView
      title="Log in"
      subtitle="Welcome back. Log in to pick up where you left off."
      footer={
        <>
          New to Mikoto?{' '}
          <Link className={styles.link} to="/register">
            Create an account
          </Link>
        </>
      }
    >
      <form
        className={styles.form}
        noValidate
        onSubmit={handleSubmit(async (form) => {
          error.setError(null);
          try {
            const tk = await authClient.login({
              email: form.email.trim(),
              password: form.password,
            });
            storeRefreshToken(tk.refreshToken);
            // Full reload so every client starts from the new session.
            window.location.href = '/';
          } catch (e) {
            error.setError(
              authError(
                e,
                "That email and password don't match. Check them and try again.",
              ),
            );
          }
        })}
      >
        {error.el}
        <Field label="Email" error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            autoFocus
            {...register('email', {
              required: 'Enter your email address.',
              pattern: {
                value: EMAIL,
                message: "That email doesn't look right.",
              },
            })}
          />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <Input
            type="password"
            autoComplete="current-password"
            {...register('password', { required: 'Enter your password.' })}
          />
        </Field>
        <div className={styles.labelRow}>
          <span />
          <Link
            className={cx(styles.link, styles.smallLink)}
            to="/forgotpassword"
          >
            Forgot your password?
          </Link>
        </div>
        <Button
          variant="primary"
          size="lg"
          block
          type="submit"
          loading={formState.isSubmitting}
        >
          Log in
        </Button>
      </form>
    </AuthView>
  );
}

interface RegisterValues {
  name: string;
  email: string;
  password: string;
}

export function RegisterView() {
  const { register, handleSubmit, formState } = useForm<RegisterValues>();
  const error = useErrorElement();
  const { errors } = formState;

  return (
    <AuthView
      title="Create an account"
      subtitle="Join communities, or start your own."
      footer={
        <>
          Already have an account?{' '}
          <Link className={styles.link} to="/login">
            Log in
          </Link>
        </>
      }
    >
      <form
        className={styles.form}
        noValidate
        onSubmit={handleSubmit(async (form) => {
          error.setError(null);
          try {
            const tk = await authClient.register({
              name: form.name.trim(),
              email: form.email.trim(),
              password: form.password,
            });
            storeRefreshToken(tk.refreshToken);
            window.location.href = '/';
          } catch (e) {
            error.setError(
              authError(e, "Couldn't create the account. Try again."),
            );
          }
        })}
      >
        {error.el}
        <Field label="Username" error={errors.name?.message}>
          <Input
            autoComplete="username"
            autoFocus
            {...register('name', {
              validate: (v) => v.trim().length > 0 || 'Choose a username.',
            })}
          />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            {...register('email', {
              required: 'Enter your email address.',
              pattern: {
                value: EMAIL,
                message: "That email doesn't look right.",
              },
            })}
          />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <Input
            type="password"
            autoComplete="new-password"
            {...register('password', { required: 'Choose a password.' })}
          />
        </Field>
        <Button
          variant="primary"
          size="lg"
          block
          type="submit"
          loading={formState.isSubmitting}
        >
          Create account
        </Button>
      </form>
    </AuthView>
  );
}

export function ResetPasswordView() {
  const { register, handleSubmit, formState } = useForm<{ email: string }>();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const error = useErrorElement();

  if (sentTo) {
    return (
      <AuthView
        title="Check your email"
        footer={
          <Link className={styles.link} to="/login">
            Back to log in
          </Link>
        }
      >
        <div className={styles.success} aria-hidden>
          <MailCheck size={20} />
        </div>
        <p className={styles.subtitle}>
          If an account exists for <strong>{sentTo}</strong>, we've sent it a
          link to reset the password. It can take a minute to arrive.
        </p>
      </AuthView>
    );
  }

  return (
    <AuthView
      title="Reset your password"
      subtitle="Enter the email you signed up with and we'll send you a reset link."
      footer={
        <>
          Remembered it?{' '}
          <Link className={styles.link} to="/login">
            Log in
          </Link>
        </>
      }
    >
      <form
        className={styles.form}
        noValidate
        onSubmit={handleSubmit(async (data) => {
          error.setError(null);
          try {
            const email = data.email.trim();
            await authClient.resetPassword({ email });
            setSentTo(email);
          } catch (e) {
            error.setError(
              authError(e, "Couldn't send the reset link. Try again."),
            );
          }
        })}
      >
        {error.el}
        <Field label="Email" error={formState.errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            autoFocus
            {...register('email', {
              required: 'Enter your email address.',
              pattern: {
                value: EMAIL,
                message: "That email doesn't look right.",
              },
            })}
          />
        </Field>
        <Button
          variant="primary"
          size="lg"
          block
          type="submit"
          loading={formState.isSubmitting}
        >
          Send reset link
        </Button>
      </form>
    </AuthView>
  );
}

interface NewPasswordValues {
  password: string;
  passwordConfirm: string;
}

export function ResetChangePasswordView() {
  const params = useParams<{ token: string }>();
  const { register, handleSubmit, getValues, formState } =
    useForm<NewPasswordValues>();
  const [done, setDone] = useState(false);
  const error = useErrorElement();
  const navigate = useNavigate();
  const { errors } = formState;
  const token = params.token;

  if (!token) {
    return (
      <AuthView
        title="This reset link is incomplete"
        subtitle="The link is missing its token. Open it again from the email, or request a new one."
        footer={
          <Link className={styles.link} to="/forgotpassword">
            Request a new link
          </Link>
        }
      >
        {null}
      </AuthView>
    );
  }

  if (done) {
    return (
      <AuthView title="Password changed">
        <div className={styles.success} aria-hidden>
          <CircleCheck size={20} />
        </div>
        <p className={styles.subtitle}>Taking you to log in…</p>
      </AuthView>
    );
  }

  return (
    <AuthView
      title="Choose a new password"
      footer={
        <Link className={styles.link} to="/login">
          Back to log in
        </Link>
      }
    >
      <form
        className={styles.form}
        noValidate
        onSubmit={handleSubmit(async (data) => {
          error.setError(null);
          try {
            await authClient.resetPasswordSubmit({
              token,
              password: data.password,
            });
            setDone(true);
            setTimeout(() => navigate('/login'), 1400);
          } catch (e) {
            error.setError(
              authError(
                e,
                'This reset link has expired or was already used. Request a new one.',
              ),
            );
          }
        })}
      >
        {error.el}
        <Field label="New password" error={errors.password?.message}>
          <Input
            type="password"
            autoComplete="new-password"
            autoFocus
            {...register('password', { required: 'Enter a new password.' })}
          />
        </Field>
        <Field
          label="Confirm new password"
          error={errors.passwordConfirm?.message}
        >
          <Input
            type="password"
            autoComplete="new-password"
            {...register('passwordConfirm', {
              required: 'Enter the new password again.',
              validate: (v) =>
                v === getValues('password') || "The passwords don't match.",
            })}
          />
        </Field>
        <Button
          variant="primary"
          size="lg"
          block
          type="submit"
          loading={formState.isSubmitting}
        >
          Change password
        </Button>
      </form>
    </AuthView>
  );
}
