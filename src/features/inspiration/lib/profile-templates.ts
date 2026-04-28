// Profile templates configuration
// These are predefined themes users can choose from for their public profile

export interface ProfileTemplate {
    id: string;
    name: string;
    description: string;
    preview: {
        background: string;
        cardBg: string;
        cardBorder: string;
        textColor: string;
        mutedColor: string;
        accentColor: string;
    };
    styles: {
        background: string;
        cardStyle: 'rounded' | 'sharp' | 'pill';
        cardBg: string;
        cardBorder: string;
        cardShadow: string;
        cardHover: string;
        fontFamily: string;
        // Text colors for profile header
        headerTextColor: string;
        headerMutedColor: string;
        // Card text colors  
        cardTextColor: string;
    };
}

export const profileTemplates: ProfileTemplate[] = [
    {
        id: 'minimal-light',
        name: 'Minimal Light',
        description: 'Clean and simple with subtle shadows',
        preview: {
            background: '#fafafa',
            cardBg: '#ffffff',
            cardBorder: '#e5e5e5',
            textColor: '#171717',
            mutedColor: '#737373',
            accentColor: '#3b82f6',
        },
        styles: {
            background: 'bg-gradient-to-b from-gray-50 to-white',
            cardStyle: 'rounded',
            cardBg: 'bg-white',
            cardBorder: 'border border-gray-200',
            cardShadow: 'shadow-sm',
            cardHover: 'hover:shadow-md hover:scale-[1.02] hover:border-gray-300',
            fontFamily: 'font-sans',
            headerTextColor: 'text-gray-900',
            headerMutedColor: 'text-gray-500',
            cardTextColor: 'text-gray-900',
        },
    },
    {
        id: 'dark-mode',
        name: 'Dark Mode',
        description: 'Sleek dark theme with neon accents',
        preview: {
            background: '#0a0a0a',
            cardBg: '#171717',
            cardBorder: '#262626',
            textColor: '#fafafa',
            mutedColor: '#a3a3a3',
            accentColor: '#22d3ee',
        },
        styles: {
            background: 'bg-gradient-to-b from-black via-gray-950 to-gray-900',
            cardStyle: 'rounded',
            cardBg: 'bg-gray-900/80 backdrop-blur-sm',
            cardBorder: 'border border-gray-800',
            cardShadow: 'shadow-lg shadow-black/20',
            cardHover: 'hover:border-cyan-500/50 hover:shadow-cyan-500/10 hover:scale-[1.02]',
            fontFamily: 'font-sans',
            headerTextColor: 'text-white',
            headerMutedColor: 'text-gray-400',
            cardTextColor: 'text-white',
        },
    },
    {
        id: 'gradient-wave',
        name: 'Gradient Wave',
        description: 'Vibrant gradient with solid cards',
        preview: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            cardBg: 'rgba(255,255,255,0.95)',
            cardBorder: 'rgba(255,255,255,0.5)',
            textColor: '#1f2937',
            mutedColor: '#6b7280',
            accentColor: '#7c3aed',
        },
        styles: {
            background: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500',
            cardStyle: 'rounded',
            cardBg: 'bg-white/95 backdrop-blur-md',
            cardBorder: 'border border-white/50',
            cardShadow: 'shadow-xl shadow-purple-500/20',
            cardHover: 'hover:bg-white hover:scale-[1.02] hover:shadow-2xl',
            fontFamily: 'font-sans',
            headerTextColor: 'text-white',
            headerMutedColor: 'text-white/80',
            cardTextColor: 'text-gray-800',
        },
    },
    {
        id: 'glassmorphism',
        name: 'Glassmorphism',
        description: 'Frosted glass on dreamy gradient',
        preview: {
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            cardBg: 'rgba(255,255,255,0.25)',
            cardBorder: 'rgba(255,255,255,0.4)',
            textColor: '#ffffff',
            mutedColor: 'rgba(255,255,255,0.8)',
            accentColor: '#ffffff',
        },
        styles: {
            background: 'bg-gradient-to-br from-pink-400 via-rose-400 to-orange-300',
            cardStyle: 'rounded',
            cardBg: 'bg-white/25 backdrop-blur-lg',
            cardBorder: 'border border-white/40',
            cardShadow: 'shadow-lg shadow-rose-500/20',
            cardHover: 'hover:bg-white/35 hover:scale-[1.02]',
            fontFamily: 'font-sans',
            headerTextColor: 'text-white',
            headerMutedColor: 'text-white/80',
            cardTextColor: 'text-white',
        },
    },
    {
        id: 'brutalist',
        name: 'Brutalist',
        description: 'Bold borders and sharp edges',
        preview: {
            background: '#fffbeb',
            cardBg: '#ffffff',
            cardBorder: '#000000',
            textColor: '#000000',
            mutedColor: '#525252',
            accentColor: '#000000',
        },
        styles: {
            background: 'bg-amber-50',
            cardStyle: 'sharp',
            cardBg: 'bg-white',
            cardBorder: 'border-2 border-black',
            cardShadow: 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
            cardHover: 'hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5',
            fontFamily: 'font-mono',
            headerTextColor: 'text-black',
            headerMutedColor: 'text-gray-600',
            cardTextColor: 'text-black',
        },
    },
    {
        id: 'pastel-dream',
        name: 'Pastel Dream',
        description: 'Soft pastel colors with gentle vibes',
        preview: {
            background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            cardBg: '#ffffff',
            cardBorder: '#fecaca',
            textColor: '#7c2d12',
            mutedColor: '#a16207',
            accentColor: '#f97316',
        },
        styles: {
            background: 'bg-gradient-to-br from-orange-100 via-rose-100 to-purple-100',
            cardStyle: 'pill',
            cardBg: 'bg-white/90',
            cardBorder: 'border border-rose-200',
            cardShadow: 'shadow-md shadow-rose-200/50',
            cardHover: 'hover:shadow-lg hover:scale-[1.02] hover:bg-white',
            fontFamily: 'font-sans',
            headerTextColor: 'text-orange-900',
            headerMutedColor: 'text-orange-700',
            cardTextColor: 'text-orange-900',
        },
    },
];

export function getTemplate(templateId: string | null | undefined): ProfileTemplate {
    if (!templateId) return profileTemplates[0];
    return profileTemplates.find(t => t.id === templateId) || profileTemplates[0];
}

export function getCardBorderRadius(style: ProfileTemplate['styles']['cardStyle']): string {
    switch (style) {
        case 'sharp': return 'rounded-none';
        case 'pill': return 'rounded-full';
        default: return 'rounded-xl';
    }
}
