interface LogifyLogoProps {
    className?: string;
}

export default function LogifyLogo({ className = '' }: LogifyLogoProps) {
    return <img src='/auth-logo.png' />;
}
