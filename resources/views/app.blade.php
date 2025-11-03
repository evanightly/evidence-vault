<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';
                const storedTheme = localStorage.getItem('theme');

                // Priority: localStorage > server appearance > system preference
                let isDark = false;

                if (storedTheme === 'dark') {
                    isDark = true;
                } else if (storedTheme === 'light') {
                    isDark = false;
                } else if (appearance === 'dark') {
                    isDark = true;
                } else if (appearance === 'light') {
                    isDark = false;
                } else {
                    // Default to system preference
                    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                }

                if (isDark) {
                    document.documentElement.classList.add('dark');
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(0.98 0.008 240);
            }

            html.dark {
                background-color: oklch(0.18 0.015 240);
            }
        </style>

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
