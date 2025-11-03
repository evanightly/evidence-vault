import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
};

function ConfirmationDialog({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  icon: Icon,
  duration = 5000,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  icon?: React.ComponentType<{ className?: string }>;
  duration?: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isDestructive = variant === 'destructive';
  const [timeRemaining, setTimeRemaining] = React.useState(duration);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const animationId = React.useId().replace(/:/g, '');

  React.useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeRemaining((previous) => {
        if (previous <= 1000) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }

          return 0;
        }

        return previous - 1000;
      });
    }, 1000);

    const style = document.createElement('style');
    style.textContent = `
      @keyframes borderProgress-${animationId} {
        0% {
          stroke-dashoffset: 0;
        }
        100% {
          stroke-dashoffset: 1000;
        }
      }

      @keyframes circleCountdown-${animationId} {
        0% {
          stroke-dashoffset: 0;
        }
        100% {
          stroke-dashoffset: 62.83;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, [animationId, duration]);

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="hover:shadow-3xl relative m-1 min-w-[380px] max-w-[480px] rounded-2xl border border-gray-200/20 bg-background/95 p-6 text-foreground shadow-2xl backdrop-blur-sm transition-all duration-300 dark:border-gray-700/20">
        <div className="mb-4 flex items-start gap-4">
          {Icon && (
            <div
              className={`relative flex-shrink-0 rounded-full p-3 ${
                isDestructive
                  ? 'bg-gradient-to-br from-red-500 to-pink-600 shadow-lg shadow-red-500/25'
                  : 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25'
              } transform transition-transform duration-300 hover:scale-110`}
            >
              <Icon className="h-6 w-6 text-white" />
              <div
                className={`absolute inset-0 rounded-full ${
                  isDestructive ? 'animate-ping bg-red-500/30' : 'animate-ping bg-blue-500/30'
                }`}
              />
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-xl font-bold text-transparent dark:from-white dark:to-gray-300">
                {title}
              </h4>
              <div className="flex items-center gap-2">
                <div className="relative h-8 w-8">
                  <svg className="h-8 w-8 -rotate-90 transform" viewBox="0 0 24 24" fill="none">
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray="62.83"
                      className={isDestructive ? 'text-red-500' : 'text-blue-500'}
                      style={{ animation: `circleCountdown-${animationId} ${duration}ms linear forwards` }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{Math.ceil(timeRemaining / 1000)}</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200/50 pt-4 dark:border-gray-700/50">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="relative border-gray-300/50 bg-white/80 px-6 py-2 backdrop-blur-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-lg dark:border-gray-600/50 dark:bg-gray-800/80 dark:hover:bg-gray-700"
          >
            <span className="relative z-10">{cancelText}</span>
          </Button>

          <Button
            variant={isDestructive ? 'destructive' : 'default'}
            size="sm"
            onClick={onConfirm}
            className={`relative px-6 py-2 font-semibold transition-all duration-300 hover:shadow-xl ${
              isDestructive
                ? 'bg-gradient-to-r from-red-500 to-pink-600 shadow-lg shadow-red-500/25 hover:from-red-600 hover:to-pink-700 hover:shadow-red-500/40'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-purple-700 hover:shadow-blue-500/40'
            }`}
          >
            <span className="relative z-10 text-white">{confirmText}</span>
            <div
              className={`absolute inset-0 rounded-md ${
                isDestructive
                  ? 'bg-gradient-to-r from-red-400/50 to-pink-500/50'
                  : 'bg-gradient-to-r from-blue-400/50 to-purple-500/50'
              } opacity-0 blur-md transition-opacity duration-300 hover:opacity-100`}
            />
          </Button>
        </div>
      </div>
    </div>
  );
}

function showConfirmation(message: string, onConfirm: () => void, options: ConfirmOptions = {}): void {
  const {
    title = 'Confirm Action',
    description = message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'default',
    duration: customDuration,
  } = options;
  const duration = customDuration ?? 5000;

  toast.custom(
    (toastInstance) => (
      <ConfirmationDialog
        title={title}
        message={description}
        confirmText={confirmText}
        cancelText={cancelText}
        variant={variant}
        icon={AlertTriangle}
        duration={duration}
        onConfirm={() => {
          onConfirm();
          toast.dismiss(toastInstance);
        }}
        onCancel={() => {
          toast.dismiss(toastInstance);
        }}
      />
    ),
    {
      duration,
      position: 'bottom-right',
    }
  );
}

export const confirm = Object.assign(
  (message: string, onConfirm: () => void, options: ConfirmOptions = {}): void => {
    showConfirmation(message, onConfirm, options);
  },
  {
    delete(message: string, onConfirm: () => void, title: string = 'Are you sure?'): void {
      const duration = 5000;
      toast.custom(
        (toastInstance) => (
          <ConfirmationDialog
            title={title}
            message={message}
            confirmText="Delete"
            cancelText="Cancel"
            variant="destructive"
            icon={Trash2}
            duration={duration}
            onConfirm={() => {
              onConfirm();
              toast.dismiss(toastInstance);
            }}
            onCancel={() => {
              toast.dismiss(toastInstance);
            }}
          />
        ),
        {
          duration,
          position: 'bottom-right',
        }
      );
    },
    reset(message: string, onConfirm: () => void, title: string = '🔄 Reset Confirmation'): void {
      const duration = 5000;
      toast.custom(
        (toastInstance) => (
          <ConfirmationDialog
            title={title}
            message={message}
            confirmText="🔄 Reset"
            cancelText="✖️ Cancel"
            variant="default"
            icon={RotateCcw}
            duration={duration}
            onConfirm={() => {
              onConfirm();
              toast.dismiss(toastInstance);
            }}
            onCancel={() => {
              toast.dismiss(toastInstance);
            }}
          />
        ),
        {
          duration,
          position: 'bottom-right',
        }
      );
    },
  }
);
