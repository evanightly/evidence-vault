import { usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

type ProgressPayload = {
    logbook_id: number;
    status: string;
    message: string;
    progress?: number;
    extra?: Record<string, unknown>;
};

export default function DriveProgressListener() {
    const page = usePage<{ auth?: { user?: { id?: number } } }>();
    const userId = page.props.auth?.user?.id;

    if (!userId) {
        return null;
    }

    return <DriveProgressChannelListener userId={userId} />;
}

function DriveProgressChannelListener({ userId }: { userId: number }) {
    const toastRefs = useRef(new Map<number, string>());

    const handleEvent = useCallback((event: ProgressPayload) => {
        const toastId = toastRefs.current.get(event.logbook_id) ?? `drive-upload-${event.logbook_id}`;
        const progressValue = typeof event.progress === 'number' ? Math.min(100, Math.max(0, event.progress)) : undefined;
        const inProgress = event.status !== 'completed' && event.status !== 'failed';
        const suffix = progressValue !== undefined && inProgress ? ` (${progressValue}%)` : '';
        const content = `${event.message}${suffix}`;
        console.log(event);
        switch (event.status) {
            case 'started':
            case 'progress':
                toast.loading(content, { id: toastId, duration: Infinity });
                toastRefs.current.set(event.logbook_id, toastId);
                break;
            case 'completed':
                toast.success(event.message, { id: toastId });
                toastRefs.current.delete(event.logbook_id);
                break;
            case 'failed':
                toast.error(event.message, { id: toastId });
                toastRefs.current.delete(event.logbook_id);
                break;
            default:
                toast.info(event.message, { id: toastId });
                toastRefs.current.set(event.logbook_id, toastId);
                break;
        }
    }, []);

    useEcho<ProgressPayload>(`logbook.drive-progress.${userId}`, 'LogbookDriveUploadProgress', handleEvent);

    useEffect(
        () => () => {
            toastRefs.current.forEach((toastId) => {
                toast.dismiss(toastId);
            });
            toastRefs.current.clear();
        },
        [],
    );

    return null;
}
