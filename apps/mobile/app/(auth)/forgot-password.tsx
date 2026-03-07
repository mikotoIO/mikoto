import { Link } from 'expo-router';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authClient } from '../../src/lib/auth';
import { colors, borderRadius, fontSize, spacing } from '../../src/theme';

interface ForgotPasswordForm {
  email: string;
}

export default function ForgotPasswordScreen() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<ForgotPasswordForm>();

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      setError(null);
      await authClient.resetPassword({
        email: data.email,
        captcha: null as any,
      });
      setSent(true);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to send reset email.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {sent ? (
          <View style={styles.form}>
            <Text style={styles.heading}>Check your inbox</Text>
            <Text style={styles.description}>
              We've sent password reset instructions to your email address.
            </Text>
            <Link href="/(auth)/login" style={styles.link}>
              <Text style={styles.linkText}>Return to Login</Text>
            </Link>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.heading}>Reset Password</Text>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <Controller
                control={control}
                name="email"
                rules={{ required: true }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChange}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.N500}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    selectionColor={colors.B500}
                  />
                )}
              />
            </View>

            <Pressable
              style={[styles.button, formState.isSubmitting && styles.buttonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={formState.isSubmitting}
            >
              {formState.isSubmitting ? (
                <ActivityIndicator color={colors.N0} />
              ) : (
                <Text style={styles.buttonText}>Send Reset Email</Text>
              )}
            </Pressable>

            <Link href="/(auth)/login" style={styles.link}>
              <Text style={styles.linkText}>Back to Login</Text>
            </Link>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.N1000,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  form: {
    gap: spacing.md,
  },
  heading: {
    color: colors.N0,
    fontSize: fontSize.xl,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  description: {
    color: colors.N300,
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  errorBox: {
    backgroundColor: colors.R800,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
  },
  errorText: {
    color: colors.N0,
    fontSize: fontSize.sm,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    color: colors.N300,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.N800,
    color: colors.N0,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    borderWidth: 1,
    borderColor: colors.N600,
  },
  button: {
    backgroundColor: colors.B700,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.N0,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  link: {
    alignSelf: 'center',
    marginTop: spacing.xs,
  },
  linkText: {
    color: colors.B500,
    fontSize: fontSize.sm,
  },
});
