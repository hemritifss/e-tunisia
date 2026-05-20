// Hand-tuned dot positions in a 100×160 viewBox laid over a simplified
// Tunisia outline. Visual correctness > geographic precision.

export interface CityCoord { name: string; x: number; y: number; }

export const TUNISIA_CITIES: CityCoord[] = [
    { name: 'Tunis',         x: 55, y: 12 },
    { name: 'Bizerte',       x: 50, y: 6 },
    { name: 'Sidi Bou Said', x: 60, y: 11 },
    { name: 'Hammamet',      x: 62, y: 22 },
    { name: 'Sousse',        x: 60, y: 32 },
    { name: 'Mahdia',        x: 66, y: 40 },
    { name: 'Kairouan',      x: 52, y: 36 },
    { name: 'Sfax',          x: 60, y: 52 },
    { name: 'Djerba',        x: 70, y: 78 },
    { name: 'Tabarka',       x: 30, y: 12 },
    { name: 'Tozeur',        x: 28, y: 72 },
    { name: 'Matmata',       x: 50, y: 80 },
    { name: 'Tataouine',     x: 55, y: 100 },
    { name: 'Douz',          x: 38, y: 88 },
];

/** Stylized Tunisia silhouette. 100×160 viewBox. */
export const TUNISIA_OUTLINE_PATH =
    'M40,2 L62,4 L70,12 L66,22 L74,32 L70,46 L66,56 L78,70 L82,84 L72,100 L62,118 L50,138 L42,150 L34,150 L24,130 L20,108 L20,82 L16,62 L20,46 L26,32 L30,18 Z';
