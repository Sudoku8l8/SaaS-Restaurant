// ── Menu Theme Presets ─────────────────────────────────────────────────────────
// Each theme defines a complete visual identity for the digital menu.

export interface MenuTheme {
    id: string;
    name: string;
    description: string;
    icon: string;          // emoji icon
    bgColor: string;
    accentColor: string;
    textColor: string;
    fontFamily: string;    // fontId matching FONT_OPTIONS
    categories: string[];  // suggested category names
}

export const MENU_THEMES: MenuTheme[] = [
    {
        id: 'gourmet',
        name: 'Gourmet / Turístico',
        description: 'Elegante, serif, mucho espacio en blanco. Ideal para restaurantes turísticos.',
        icon: '🍷',
        bgColor: '#FAF8F5',
        accentColor: '#C8A96E',
        textColor: '#1A1A1A',
        fontFamily: 'playfair',
        categories: ['Entradas', 'Platos Fuertes', 'Postres', 'Bebidas'],
    },
    {
        id: 'fastfood',
        name: 'Fast Food / Pollería',
        description: 'Colores vivos, precios grandes, combos protagonistas. Alto contraste.',
        icon: '🍗',
        bgColor: '#FFFFFF',
        accentColor: '#E63946',
        textColor: '#1A1A1A',
        fontFamily: 'poppins',
        categories: ['Combos', 'Pollos', 'Acompañamientos', 'Bebidas'],
    },
    {
        id: 'bar_cafe',
        name: 'Bar / Café Oscuro',
        description: 'Modo oscuro, tipografía limpia, foco en bebidas. Uso nocturno.',
        icon: '🍸',
        bgColor: '#1A1A2E',
        accentColor: '#D4A843',
        textColor: '#F0F0F0',
        fontFamily: 'inter',
        categories: ['Cócteles', 'Cervezas', 'Cafés', 'Snacks'],
    },
    {
        id: 'dark_kitchen',
        name: 'Delivery / Dark Kitchen',
        description: 'Minimal, funcional, sin distracciones. Solo delivery.',
        icon: '🛵',
        bgColor: '#FFFFFF',
        accentColor: '#2ECC71',
        textColor: '#333333',
        fontFamily: 'inter',
        categories: ['Platos', 'Extras', 'Bebidas'],
    },
];

/** Find a theme by ID, returns undefined if not found */
export function getMenuTheme(id: string): MenuTheme | undefined {
    return MENU_THEMES.find(t => t.id === id);
}
