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

type EvidenceProgressPayload = {
    upload_id: string;
    type: string;
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
    const toastRefs = useRef(new Map<string, string>());

    const handleEvent = useCallback((event: ProgressPayload) => {
        const key = `logbook-${event.logbook_id}`;
        const toastId = toastRefs.current.get(key) ?? `drive-upload-${event.logbook_id}`;
        const progressValue = typeof event.progress === 'number' ? Math.min(100, Math.max(0, event.progress)) : undefined;
        const inProgress = event.status !== 'completed' && event.status !== 'failed';
        const suffix = progressValue !== undefined && inProgress ? ` (${progressValue}%)` : '';
        const content = `${event.message}${suffix}`;
        switch (event.status) {
            case 'started':
            case 'progress':
                toast.loading(content, { id: toastId, duration: Infinity });
                toastRefs.current.set(key, toastId);
                break;
            case 'completed':
                toast.success(event.message, { id: toastId });
                toastRefs.current.delete(key);
                break;
            case 'failed':
                toast.error(event.message, { id: toastId });
                toastRefs.current.delete(key);
                break;
            default:
                toast.info(event.message, { id: toastId });
                toastRefs.current.set(key, toastId);
                break;
        }
    }, []);

    const handleEvidenceEvent = useCallback((event: EvidenceProgressPayload) => {
        const key = `evidence-${event.upload_id}`;
        const toastId = toastRefs.current.get(key) ?? `drive-upload-${event.upload_id}`;
        const progressValue = typeof event.progress === 'number' ? Math.min(100, Math.max(0, event.progress)) : undefined;
        const inProgress = event.status !== 'completed' && event.status !== 'failed';
        const suffix = progressValue !== undefined && inProgress ? ` (${progressValue}%)` : '';
        const content = `${event.message}${suffix}`;

        switch (event.status) {
            case 'queued':
            case 'started':
            case 'progress':
                toast.loading(content, { id: toastId, duration: Infinity });
                toastRefs.current.set(key, toastId);
                break;
            case 'completed':
                toast.success(event.message, { id: toastId });
                toastRefs.current.delete(key);

                if (Array.isArray(event.extra?.results)) {
                    event.extra?.results.forEach((result) => {
                        window.dispatchEvent(new CustomEvent('evidence-upload:completed', { detail: result }));
                    });
                } else if (event.extra?.result) {
                    window.dispatchEvent(new CustomEvent('evidence-upload:completed', { detail: event.extra.result }));
                }
                break;
            case 'failed':
                toast.error(event.message, { id: toastId });
                toastRefs.current.delete(key);

                if (event.extra?.error) {
                    window.dispatchEvent(new CustomEvent('evidence-upload:failed', { detail: event.extra }));
                }
                break;
            default:
                toast.info(event.message, { id: toastId });
                toastRefs.current.set(key, toastId);
                break;
        }
    }, []);

    useEcho<ProgressPayload>(`logbook.drive-progress.${userId}`, 'LogbookDriveUploadProgress', handleEvent);
    useEcho<EvidenceProgressPayload>(`evidence.drive-progress.${userId}`, 'EvidenceDriveUploadProgress', handleEvidenceEvent);

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
