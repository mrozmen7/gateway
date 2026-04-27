import { useEffect, useState } from 'react';
import { createRoute, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight } from 'lucide-react';
import { publicLayoutRoute } from '@app/routes/_public';
import { Button } from '@shared/ui/Button';
import { Input, Field } from '@shared/ui/Input';
import { services } from '@services/index';
import { useSession } from '@app/session.store';
import type { MfaChallenge } from '@entities/identity/model';
import { track } from '@shared/lib/telemetry';
import { env } from '@shared/config/env';
import { beginOidcLogin, completeOidcLogin } from '@services/http/oidc';

const loginSchema = z.object({
  email: z.string().min(1, 'Enter your username.'),
  password: z.string().min(4, 'At least 4 characters.'),
});

const mfaSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code.'),
});

type LoginValues = z.infer<typeof loginSchema>;
type MfaValues = z.infer<typeof mfaSchema>;

const LoginPage = () => {
  const navigate = useNavigate();
  const setSession = useSession((s) => s.setSession);
  const [challenge, setChallenge] = useState<MfaChallenge | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const mfaForm = useForm<MfaValues>({
    resolver: zodResolver(mfaSchema),
    defaultValues: { code: '' },
  });

  const onLogin = loginForm.handleSubmit(async (values) => {
    setSubmitError(null);
    track({ type: 'auth.login.submitted', email: values.email });
    const r = await services.identity.login(values);
    if (!r.ok) {
      setSubmitError(r.error.message);
      track({ type: 'auth.login.failed', reason: r.error.kind });
      return;
    }
    if (r.value.status === 'mfa_required') {
      setChallenge(r.value.challenge);
      return;
    }
    setSession(r.value.session);
    track({ type: 'auth.login.succeeded', userId: r.value.session.userId });
    await navigate({ to: r.value.session.persona === 'operator' ? '/ops' : '/' });
  });

  const onMfa = mfaForm.handleSubmit(async (values) => {
    if (!challenge) return;
    setSubmitError(null);
    track({ type: 'auth.mfa.submitted' });
    const r = await services.identity.verifyMfa({
      challengeId: challenge.challengeId,
      code: values.code,
    });
    if (!r.ok) {
      setSubmitError(r.error.message);
      return;
    }
    setSession(r.value);
    track({ type: 'auth.login.succeeded', userId: r.value.userId });
    await navigate({ to: '/' });
  });

  const useOidc = !env.useMocks && env.authMode === 'oidc';

  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_1.1fr]">
      {/* Editorial left panel */}
      <aside
        className="hidden lg:flex flex-col justify-between p-12 text-[var(--color-on-accent)]"
        style={{ background: 'var(--color-accent)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="h-7 w-7 rounded-sm flex items-center justify-center text-xs font-semibold"
            style={{ background: 'var(--color-on-accent)', color: 'var(--color-accent)' }}
          >
            H
          </div>
          <span className="text-sm font-semibold tracking-tight">Helvetiq Bank</span>
        </div>

        <div className="max-w-md">
          <div className="text-[11px] uppercase tracking-[0.18em] opacity-60 mb-6">
            Private Digital Banking · Est. Zürich
          </div>
          <h2 className="text-3xl font-semibold tracking-tight leading-tight mb-4">
            Your wealth,<br />
            <span className="opacity-60">composed with precision.</span>
          </h2>
          <p className="text-sm opacity-75 leading-relaxed max-w-sm">
            A private banking workspace built around the principles of Swiss
            craftsmanship — quiet typography, considered restraint, and
            architecture you can see through.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-8 text-[11px] uppercase tracking-[0.14em] opacity-60">
          <div>
            <div className="tabular text-base font-semibold opacity-100 normal-case tracking-tight mb-0.5">
              FINMA
            </div>
            <div>Licensed</div>
          </div>
          <div>
            <div className="tabular text-base font-semibold opacity-100 normal-case tracking-tight mb-0.5">
              CHF 100k
            </div>
            <div>Depositor guarantee</div>
          </div>
          <div>
            <div className="tabular text-base font-semibold opacity-100 normal-case tracking-tight mb-0.5">
              ISO 27001
            </div>
            <div>Certified</div>
          </div>
        </div>
      </aside>

      {/* Form right panel */}
      <section className="flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-sm">
          {!challenge ? (
            <>
              <div className="text-2xs uppercase tracking-[0.14em] text-ink-subtle mb-3">
                Client area
              </div>
              <h1 className="text-xl font-semibold text-ink tracking-tight mb-1.5">
                Sign in
              </h1>
              <p className="text-sm text-ink-muted mb-8">
                Access your private banking workspace.
              </p>

              <form onSubmit={(e) => void onLogin(e)} className="space-y-5">
                {useOidc ? (
                  <>
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => void beginOidcLogin()}
                    >
                      Continue with Helvetiq SSO
                      <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                    </Button>

                    <div className="text-xs text-ink-subtle rule-t pt-4 leading-relaxed">
                      <strong className="text-ink-muted font-medium">OIDC:</strong>{' '}
                      sign in via Keycloak with <code className="font-mono text-ink">yavuz</code>{' '}
                      / <code className="font-mono text-ink">gateway!</code>,{' '}
                      <code className="font-mono text-ink">fatih</code> /{' '}
                      <code className="font-mono text-ink">gateway123!</code>, or{' '}
                      <code className="font-mono text-ink">marc.steiner</code> /{' '}
                      <code className="font-mono text-ink">OpsPass123</code>.
                    </div>
                  </>
                ) : (
                  <>
                <Field
                  label="Email"
                  htmlFor="email"
                  error={loginForm.formState.errors.email?.message}
                >
                  <Input
                    id="email"
                    type="text"
                    autoComplete="username"
                    placeholder={env.useMocks ? 'you@helvetiq.example' : 'yavuz'}
                    invalid={Boolean(loginForm.formState.errors.email)}
                    {...loginForm.register('email')}
                  />
                </Field>

                <Field
                  label="Password"
                  htmlFor="password"
                  error={loginForm.formState.errors.password?.message}
                >
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    invalid={Boolean(loginForm.formState.errors.password)}
                    {...loginForm.register('password')}
                  />
                </Field>

                {submitError ? (
                  <div className="text-xs text-[var(--color-debit)] rule-t pt-3">
                    {submitError}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  className="w-full"
                  loading={loginForm.formState.isSubmitting}
                >
                  Continue
                  <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                </Button>

                <div className="text-xs text-ink-subtle rule-t pt-4 leading-relaxed">
                  <strong className="text-ink-muted font-medium">Demo:</strong>{' '}
                  {env.useMocks ? (
                    <>
                      any email and password (min. 4 chars). Use an address starting
                      with <code className="font-mono text-ink">ops@</code> to sign in
                      as an operator (skips MFA).
                    </>
                  ) : (
                    <>
                      use real backend users like <code className="font-mono text-ink">yavuz</code>{' '}
                      / <code className="font-mono text-ink">gateway!</code>,{' '}
                      <code className="font-mono text-ink">fatih</code> /{' '}
                      <code className="font-mono text-ink">gateway123!</code>, or{' '}
                      <code className="font-mono text-ink">marc.steiner</code> /{' '}
                      <code className="font-mono text-ink">OpsPass123</code>.
                    </>
                  )}
                </div>
                  </>
                )}
              </form>
            </>
          ) : (
            <>
              <div className="text-2xs uppercase tracking-[0.14em] text-ink-subtle mb-3">
                Two-step verification
              </div>
              <h1 className="text-xl font-semibold text-ink tracking-tight mb-1.5">
                Enter your code
              </h1>
              <p className="text-sm text-ink-muted mb-8">
                We sent a 6-digit code to{' '}
                <span className="font-mono text-ink">{challenge.maskedTarget}</span>.
              </p>

              <form onSubmit={(e) => void onMfa(e)} className="space-y-5">
                <Field
                  label="Verification code"
                  htmlFor="mfa-code"
                  hint="Any 6 digits work in demo. Try 000000 to see the failure state."
                  error={mfaForm.formState.errors.code?.message}
                >
                  <Input
                    id="mfa-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="• • •  • • •"
                    className="tracking-[0.5em] font-mono text-base text-center"
                    invalid={Boolean(mfaForm.formState.errors.code)}
                    {...mfaForm.register('code')}
                  />
                </Field>

                {submitError ? (
                  <div className="text-xs text-[var(--color-debit)] rule-t pt-3">
                    {submitError}
                  </div>
                ) : null}

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => {
                      setChallenge(null);
                      setSubmitError(null);
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    loading={mfaForm.formState.isSubmitting}
                  >
                    Verify
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

const OidcCallbackPage = () => {
  const navigate = useNavigate();
  const setSession = useSession((s) => s.setSession);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        if (!code || !state) throw new Error('OIDC callback is missing code or state.');

        const session = await completeOidcLogin(code, state);
        setSession(session);
        await navigate({ to: session.persona === 'operator' ? '/ops' : '/' });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'OIDC callback failed.');
      }
    };

    void run();
  }, [navigate, setSession]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="text-2xs uppercase tracking-[0.14em] text-ink-subtle mb-3">
          OpenID Connect
        </div>
        <h1 className="text-xl font-semibold text-ink tracking-tight mb-1.5">
          Completing sign in
        </h1>
        <p className="text-sm text-ink-muted">
          {error ?? 'Validating authorization code and establishing your session.'}
        </p>
      </div>
    </div>
  );
};

export const loginRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: '/login',
  component: LoginPage,
});

export const oidcCallbackRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: '/auth/callback',
  component: OidcCallbackPage,
});
