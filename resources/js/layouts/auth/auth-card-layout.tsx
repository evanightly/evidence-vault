import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type PropsWithChildren } from 'react';

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    return (
        <div className='relative flex min-h-svh flex-col items-center justify-center gap-8 bg-gradient-to-br from-background via-background to-muted p-6 md:p-10'>
            {/* Theme toggler in top right corner */}
            <div className='absolute top-6 right-6'>
                <AnimatedThemeToggler
                    className={buttonVariants({
                        size: 'icon',
                        variant: 'outline',
                    })}
                />
            </div>

            {/* Decorative background elements */}
            <div className='pointer-events-none absolute inset-0 overflow-hidden'>
                <div className='absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl' />
                <div className='absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl' />
            </div>

            <div className='relative z-10 flex w-full max-w-md flex-col gap-8'>
                {/* Logo */}
                {/* <Link href={home()} className='flex items-center justify-center transition-transform hover:scale-105'>
                    <LogifyLogo className='h-auto w-full max-w-[280px]' />
                </Link> */}

                {/* Auth Card */}
                <div className='flex flex-col gap-6'>
                    <Card className='rounded-2xl border-2 shadow-xl'>
                        <CardHeader className='px-10 pt-8 pb-0 text-center'>
                            <CardTitle className='text-2xl font-bold'>{title}</CardTitle>
                            <CardDescription className='text-base'>{description}</CardDescription>
                        </CardHeader>
                        <CardContent className='px-10 py-8'>{children}</CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
