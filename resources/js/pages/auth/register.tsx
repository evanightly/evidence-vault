import { login } from '@/routes';
import { store } from '@/routes/register';
import { Form, Head } from '@inertiajs/react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';

export default function Register() {
    return (
        <AuthLayout title='Create Your Account' description='Join us and start managing your radio technician logbook'>
            <Head title='Register' />
            <Form {...store.form()} resetOnSuccess={['password', 'password_confirmation']} disableWhileProcessing className='flex flex-col gap-6'>
                {({ processing, errors }) => (
                    <>
                        <div className='grid gap-5'>
                            <div className='grid gap-2'>
                                <Label htmlFor='name' className='font-medium'>
                                    Full Name
                                </Label>
                                <Input
                                    id='name'
                                    type='text'
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete='name'
                                    name='name'
                                    placeholder='John Doe'
                                    className='h-11'
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className='grid gap-2'>
                                <Label htmlFor='username' className='font-medium'>
                                    Username
                                </Label>
                                <Input
                                    id='username'
                                    type='text'
                                    required
                                    tabIndex={2}
                                    autoComplete='username'
                                    name='username'
                                    placeholder='johndoe'
                                    className='h-11'
                                />
                                <InputError message={errors.username} />
                            </div>

                            <div className='grid gap-2'>
                                <Label htmlFor='email' className='font-medium'>
                                    Email Address
                                </Label>
                                <Input
                                    id='email'
                                    type='email'
                                    required
                                    tabIndex={3}
                                    autoComplete='email'
                                    name='email'
                                    placeholder='john@example.com'
                                    className='h-11'
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className='grid gap-2'>
                                <Label htmlFor='password' className='font-medium'>
                                    Password
                                </Label>
                                <Input
                                    id='password'
                                    type='password'
                                    required
                                    tabIndex={4}
                                    autoComplete='new-password'
                                    name='password'
                                    placeholder='Create a strong password'
                                    className='h-11'
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className='grid gap-2'>
                                <Label htmlFor='password_confirmation' className='font-medium'>
                                    Confirm Password
                                </Label>
                                <Input
                                    id='password_confirmation'
                                    type='password'
                                    required
                                    tabIndex={5}
                                    autoComplete='new-password'
                                    name='password_confirmation'
                                    placeholder='Re-enter your password'
                                    className='h-11'
                                />
                                <InputError message={errors.password_confirmation} />
                            </div>

                            <Button
                                type='submit'
                                className='mt-2 h-11 w-full text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30'
                                tabIndex={6}
                                data-test='register-user-button'
                            >
                                {processing && <Spinner />}
                                Create Account
                            </Button>
                        </div>

                        <div className='text-center text-sm'>
                            <span className='text-muted-foreground'>Already have an account? </span>
                            <TextLink href={login()} className='font-semibold text-primary hover:text-primary/80' tabIndex={7}>
                                Sign In
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
