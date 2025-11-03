import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function InertiaMessenger() {
    const page = usePage();

    const flash = page.props.flash as Record<string, string> | undefined;
    const errors = page.props.errors;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (errors && Object.keys(errors).length > 0) {
            // Show each field error individually
            Object.entries(errors).forEach(([field, message]) => {
                if (typeof message === 'string') {
                    toast.error(`${field}: ${message}`);
                } else if (Array.isArray(message as any)) {
                    // Handle array of error messages for a field
                    message.forEach((msg: string) => {
                        toast.error(`${field}: ${msg}`);
                    });
                }
            });
        }
        if (flash?.info) {
            toast.info(flash.info);
        }
        if (flash?.warning) {
            toast.warning(flash.warning);
        }
    }, [errors, flash]);

    // Return null since we're using toast notifications instead of DOM elements
    return null;
}
