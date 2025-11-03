import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
}

export default function Login({ status, canResetPassword, canRegister }: LoginProps) {
    return (
        <AuthLayout title='Welcome Back' description='Sign in to your account to continue'>
            <Head title='Log in' />

            {status && (
                <div className='mb-4 rounded-lg bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400'>
                    {status}
                </div>
            )}

            <Form {...store.form()} resetOnSuccess={['password']} className='flex flex-col gap-6'>
                {({ processing, errors }) => (
                    <>
                        <div className='grid gap-5'>
                            <div className='grid gap-2'>
                                <Label htmlFor='login' className='font-medium'>
                                    Email or username
                                </Label>
                                <Input
                                    id='login'
                                    type='text'
                                    name='login'
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete='username'
                                    placeholder='email@example.com or username'
                                    className='h-11'
                                />
                                <InputError message={errors.login} />
                            </div>

                            <div className='grid gap-2'>
                                <div className='flex items-center justify-between'>
                                    <Label htmlFor='password' className='font-medium'>
                                        Password
                                    </Label>
                                    {canResetPassword && (
                                        <TextLink href={request()} className='text-sm font-medium text-primary hover:text-primary/80' tabIndex={7}>
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>
                                <Input
                                    id='password'
                                    type='password'
                                    name='password'
                                    required
                                    tabIndex={2}
                                    autoComplete='current-password'
                                    placeholder='Enter your password'
                                    className='h-11'
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className='flex items-center space-x-3'>
                                <Checkbox id='remember' name='remember' tabIndex={3} />
                                <Label htmlFor='remember' className='cursor-pointer text-sm font-medium'>
                                    Remember me for 30 days
                                </Label>
                            </div>

                            <Button
                                type='button'
                                variant='outline'
                                className='mt-2 h-11 w-full border-2 text-base font-semibold transition-all hover:border-primary hover:bg-primary/5'
                                tabIndex={4}
                                asChild
                            >
                                <a
                                    href='https://drive.google.com/drive/u/7/folders/1h8QsYe_XF1MNRsJQeEp7wIC26cMxUAJX'
                                    target='_blank'
                                    rel='noopener noreferrer'
                                >
                                    Lihat Laporan
                                </a>
                            </Button>

                            <Button
                                type='submit'
                                className='h-11 w-full text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30'
                                tabIndex={5}
                                disabled={processing}
                                data-test='login-button'
                            >
                                {processing && <Spinner />}
                                Sign In
                            </Button>
                        </div>

                        {canRegister && (
                            <div className='text-center text-sm'>
                                <span className='text-muted-foreground'>Don't have an account? </span>
                                <TextLink href={register()} className='font-semibold text-primary hover:text-primary/80' tabIndex={6}>
                                    Create Account
                                </TextLink>
                            </div>
                        )}
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
