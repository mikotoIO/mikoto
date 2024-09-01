import {
  Link as Anchor,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  chakra,
} from '@chakra-ui/react';
import styled from '@emotion/styled';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Turnstile } from '@marsidev/react-turnstile';
import { useState } from 'react';
import { Control, useController, useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { faMikoto } from '@/components/icons';
import { env } from '@/env';
import { useErrorElement } from '@/hooks/useErrorElement';
import { authClient } from '@/store/authClient';

function Logo() {
  return (
    <Flex
      align="center"
      justify="center"
      bg="gray.900"
      w="64px"
      h="64px"
      rounded={16}
      mx="auto"
      mb={0}
    >
      <FontAwesomeIcon icon={faMikoto} color="#59e6ff" fontSize="36px" />
    </Flex>
  );
}

// not always a real captcha
function Captcha({ name, control }: { name: string; control: Control }) {
  const { field } = useController({ name, control, defaultValue: null });

  return (
    <Turnstile
      siteKey={env.PUBLIC_CAPTCHA_KEY}
      onSuccess={(token) => {
        field.onChange(token);
      }}
    />
  );
}

const Art = styled.div`
  width: 600px;
  display: none;
  @media screen and (min-width: 1000px) {
    display: block;
  }
  background: url('/images/artworks/2.jpg') no-repeat center center;
  background-size: cover;
`;

export function AuthView({ children }: { children: React.ReactNode }) {
  return (
    <Flex h="100%" align="center" justify="center" bg="gray.900">
      <Flex rounded="lg" overflow="hidden">
        <Box p={8} bg="gray.700">
          <Flex align="center" justify="center" direction="column" h="100%">
            <Logo />
            {children}
          </Flex>
        </Box>
        <Art />
      </Flex>
    </Flex>
  );
}

const AuthForm = chakra('form', {
  baseStyle: {
    w: '360px',
    display: 'flex',
    flexDir: 'column',
    gap: 2,
  },
});

export function LoginView() {
  const { register, handleSubmit, formState, control } = useForm();
  const error = useErrorElement();

  return (
    <AuthView>
      <AuthForm
        onSubmit={handleSubmit(async (form) => {
          try {
            const tk = await authClient.login(
              form.email,
              form.password,
              form.captcha,
            );
            if (tk.refreshToken) {
              localStorage.setItem('REFRESH_TOKEN', tk.refreshToken);
            }
            // Screw SPAs, why not just force an actual reload at this point?
            window.location.href = '/';
          } catch (e) {
            error.setError((e as any)?.response?.data);
          }
        })}
      >
        <Heading size="lg">Log In</Heading>
        {error.el}
        <FormControl>
          <FormLabel>Email</FormLabel>
          <Input {...register('email')} />
        </FormControl>
        <FormControl>
          <FormLabel>Password</FormLabel>
          <Input type="password" {...register('password')} />
        </FormControl>

        <Captcha name="captcha" control={control} />
        <Button
          variant="primary"
          type="submit"
          isLoading={formState.isSubmitting}
        >
          Log In
        </Button>
        <Anchor to="/register" as={Link}>
          Register
        </Anchor>
        <Anchor to="/forgotpassword" as={Link}>
          Forgot Password?
        </Anchor>
      </AuthForm>
    </AuthView>
  );
}

export function RegisterView() {
  const { register, handleSubmit, formState, control } = useForm();
  const error = useErrorElement();

  return (
    <AuthView>
      <AuthForm
        onSubmit={handleSubmit(async (form) => {
          try {
            const tk = await authClient.register(
              form.name,
              form.email,
              form.password,
              form.captcha,
            );
            if (tk.refreshToken) {
              localStorage.setItem('REFRESH_TOKEN', tk.refreshToken);
            }
            window.location.href = '/';
          } catch (e) {
            error.setError((e as any)?.response?.data);
          }
        })}
      >
        <Heading size="lg">Register</Heading>
        {error.el}
        <FormControl>
          <FormLabel>Username</FormLabel>
          <Input {...register('name')} />
        </FormControl>

        <FormControl>
          <FormLabel>Email</FormLabel>
          <Input {...register('email')} />
        </FormControl>

        <FormControl>
          <FormLabel>Password</FormLabel>
          <Input type="password" {...register('password')} />
        </FormControl>
        <Captcha name="captcha" control={control} />

        <Button
          variant="primary"
          type="submit"
          isLoading={formState.isSubmitting}
        >
          Register
        </Button>
        <Anchor to="/login" as={Link}>
          Log In
        </Anchor>
      </AuthForm>
    </AuthView>
  );
}

export function ResetPasswordView() {
  const { register, handleSubmit, control } = useForm();
  const [sent, setSent] = useState(false);

  return (
    <AuthView>
      <AuthForm
        onSubmit={handleSubmit(async (data) => {
          await authClient.resetPassword(data.email);
          setSent(true);
        })}
      >
        {sent ? (
          <div>
            <Heading size="lg">Instructions sent</Heading>
            <p>Check your inbox for instructions to reset your password.</p>
          </div>
        ) : (
          <>
            <Heading size="lg">Reset Password</Heading>
            <FormControl>
              <FormLabel>Email</FormLabel>
              <Input {...register('email')} />
            </FormControl>
            <Button variant="primary" type="submit">
              Send Password Reset Email
            </Button>
            <Captcha name="captcha" control={control} />
          </>
        )}
      </AuthForm>
    </AuthView>
  );
}

export function ResetChangePasswordView() {
  const params = useParams<{ token: string }>();
  const { register, handleSubmit } = useForm();
  const [sent, setSent] = useState(false);
  const error = useErrorElement();
  const navigate = useNavigate();

  // TODO better error screen
  if (!params.token) return <div>Invalid token</div>;

  return (
    <AuthView>
      {error.el}
      <AuthForm
        onSubmit={handleSubmit(async (data) => {
          if (data.password !== data.passwordConfirm) {
            // TODO checkother password conditions
            error.setError({
              name: 'ValidatePasswordsMatch',
              message: 'Passwords do not match',
            });
            return;
          }
          setSent(true);
          let timeout: NodeJS.Timeout | undefined;
          try {
            timeout = setTimeout(() => {
              navigate('/login');
            }, 1400);
            authClient.resetPasswordSubmit(data.password, params.token!); // TODO error handling
          } catch (e) {
            if (timeout) clearTimeout(timeout);
            error.setError((e as any)?.response?.data);
            setSent(false);
          }
        })}
      >
        {sent ? (
          <div>
            <Heading size="lg">Password changed successfully!</Heading>
            <p>Returning to login page...</p>
          </div>
        ) : (
          <>
            <Heading size="lg">Reset Password</Heading>
            <FormControl>
              <FormLabel>New Password</FormLabel>
              <Input type="password" {...register('password')} />
            </FormControl>

            <FormControl>
              <FormLabel>Confirm New Password</FormLabel>
              <Input type="password" {...register('passwordConfirm')} />
            </FormControl>

            <Button variant="primary" type="submit">
              Confirm new password
            </Button>
          </>
        )}
      </AuthForm>
    </AuthView>
  );
}
