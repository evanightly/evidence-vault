#!/usr/bin/env node

/**
 * Build-time script to extract theme information from themes.css
 * This keeps the theme system synchronized automatically
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const THEMES_CSS_PATH = path.join(__dirname, '../resources/css/themes.css');
const OUTPUT_PATH = path.join(__dirname, '../resources/js/utils/generated-themes.ts');

function extractThemesFromCSS() {
    try {
        const cssContent = fs.readFileSync(THEMES_CSS_PATH, 'utf8');

        // Extract theme names and their primary colors
        const themeData = extractThemeDataFromCSS(cssContent);
        const allThemes = [
            'default',
            ...Object.keys(themeData)
                .filter((t) => t !== 'default')
                .sort(),
        ];

        console.log('Extracted themes:', allThemes);

        // Generate TypeScript content
        const tsContent = generateTypeScriptContent(allThemes, themeData);

        // Write to output file
        fs.writeFileSync(OUTPUT_PATH, tsContent, 'utf8');
        console.log(`Generated themes file: ${OUTPUT_PATH}`);
    } catch (error) {
        console.error('Error extracting themes:', error);
        process.exit(1);
    }
}

function extractThemeDataFromCSS(cssContent) {
    const themeData = {};

    // Default theme primary color (from :root section)
    const defaultPrimaryMatch = cssContent.match(/:root\s*{[^}]*--primary:\s*([^;]+);/);
    if (defaultPrimaryMatch) {
        themeData['default'] = convertOklchToTailwind(defaultPrimaryMatch[1].trim());
    } else {
        themeData['default'] = 'bg-slate-500'; // fallback
    }

    // Extract themed primary colors
    const themeBlocks = cssContent.match(/\[data-theme=['"]([^'"]+)['"]\](?!\.dark)\s*{[^}]*}/g) || [];

    for (const block of themeBlocks) {
        const themeNameMatch = block.match(/\[data-theme=['"]([^'"]+)['"]\]/);
        const primaryMatch = block.match(/--primary:\s*([^;]+);/);

        if (themeNameMatch && primaryMatch) {
            const themeName = themeNameMatch[1];
            const primaryColor = primaryMatch[1].trim();
            themeData[themeName] = convertOklchToTailwind(primaryColor);
        }
    }

    return themeData;
}

function convertOklchToTailwind(oklchValue) {
    // Parse OKLCH values and convert to appropriate Tailwind class
    const oklchMatch = oklchValue.match(/oklch\(\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s*\)/);

    if (!oklchMatch) {
        return 'bg-gray-400'; // fallback for invalid values
    }

    const [, lightness, chroma, hue] = oklchMatch.map(Number);

    // Convert hue to color family
    if (chroma < 0.05) {
        // Low chroma = grayscale
        if (lightness > 0.8) return 'bg-gray-200';
        if (lightness > 0.6) return 'bg-gray-400';
        if (lightness > 0.4) return 'bg-gray-600';
        return 'bg-gray-800';
    }

    // Determine color family based on hue
    if (hue >= 345 || hue < 25) {
        // Red family (345-360, 0-25)
        if (lightness > 0.7) return 'bg-red-300';
        if (lightness > 0.6) return 'bg-red-400';
        if (lightness > 0.5) return 'bg-red-500';
        if (lightness > 0.4) return 'bg-red-600';
        return 'bg-red-700';
    } else if (hue >= 25 && hue < 65) {
        // Orange/Yellow family
        if (lightness > 0.6) return 'bg-orange-400';
        if (lightness > 0.5) return 'bg-orange-500';
        return 'bg-orange-600';
    } else if (hue >= 65 && hue < 165) {
        // Green family
        if (lightness > 0.6) return 'bg-green-400';
        if (lightness > 0.5) return 'bg-green-500';
        if (lightness > 0.4) return 'bg-green-600';
        return 'bg-green-700';
    } else if (hue >= 165 && hue < 195) {
        // Cyan family
        if (lightness > 0.6) return 'bg-cyan-400';
        if (lightness > 0.5) return 'bg-cyan-500';
        return 'bg-cyan-600';
    } else if (hue >= 195 && hue < 265) {
        // Blue family
        if (lightness > 0.6) return 'bg-blue-400';
        if (lightness > 0.5) return 'bg-blue-500';
        if (lightness > 0.4) return 'bg-blue-600';
        return 'bg-blue-700';
    } else if (hue >= 265 && hue < 315) {
        // Purple/Violet family
        if (lightness > 0.6) return 'bg-purple-400';
        if (lightness > 0.5) return 'bg-purple-500';
        if (lightness > 0.4) return 'bg-purple-600';
        return 'bg-purple-700';
    } else {
        // Pink family (315-345)
        if (lightness > 0.6) return 'bg-pink-300';
        if (lightness > 0.5) return 'bg-pink-400';
        return 'bg-pink-500';
    }
}

function generateTypeScriptContent(themes, themeData) {
    const themeType = themes.map((theme) => `    | '${theme}'`).join('\n');

    const themeLabels = themes
        .map((theme) => {
            const label = formatThemeName(theme);
            return `    '${theme}': '${label}',`;
        })
        .join('\n');

    const themeColors = themes
        .map((theme) => {
            const color = themeData[theme] || 'bg-gray-400';
            return `    '${theme}': '${color}',`;
        })
        .join('\n');

    return `/**
 * Auto-generated theme configuration
 * This file is generated from themes.css - do not edit manually
 * Run \`npm run build:themes\` to regenerate
 */

export type Theme =
${themeType};

export const THEME_LABELS: Record<string, string> = {
${themeLabels}
};

export const THEME_COLORS: Record<string, string> = {
${themeColors}
};

export interface ThemeInfo {
    value: Theme;
    label: string;
    color: string;
}

export function getAvailableThemes(): ThemeInfo[] {
    const themes: Theme[] = [${themes.map((t) => `'${t}'`).join(', ')}];
    
    return themes.map(theme => ({
        value: theme,
        label: THEME_LABELS[theme] || formatThemeName(theme),
        color: THEME_COLORS[theme] || 'bg-gray-400',
    }));
}

function formatThemeName(themeName: string): string {
    return themeName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
`;
}

function formatThemeName(themeName) {
    return themeName
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Run the extraction
extractThemesFromCSS();
