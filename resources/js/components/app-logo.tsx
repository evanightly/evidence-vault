import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export default function AppLogo() {
    const { name } = usePage<SharedData>().props;
    return (
        <div className='flex aspect-auto h-full items-center justify-center py-4 text-sidebar-primary-foreground'>
            <img className='h-full' src='/logo.png' alt='App Logo' />
        </div>
    );
}
