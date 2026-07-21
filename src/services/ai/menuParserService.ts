/**
 * Service to parse restaurant menu photos into structured catalog data
 * using Google Gemini 2.0 / 1.5 Flash Vision API (Free Tier).
 */

export interface ExtractedProductItem {
    id: string; // Temporary ID for UI tracking
    name: string;
    price: number;
    category: string;
    description: string;
    selected: boolean;
}

export interface ParsedMenuResult {
    categories: string[];
    items: ExtractedProductItem[];
}

/**
 * Converts a File object to a Base64 string and mimeType
 */
function fileToBase64(file: File): Promise<{ mimeType: string; base64Data: string }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const matches = result.match(/^data:(.+);base64,(.+)$/);
            if (matches) {
                resolve({
                    mimeType: matches[1],
                    base64Data: matches[2],
                });
            } else {
                reject(new Error('Formato de imagen inválido'));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}

/**
 * Parses a menu image using Google Gemini Vision API
 */
export async function parseMenuImage(file: File): Promise<ParsedMenuResult> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === '') {
        throw new Error(
            'Falta configurar VITE_GEMINI_API_KEY en tu archivo .env. Obtén tu API Key gratuita en https://aistudio.google.com/'
        );
    }

    const { mimeType, base64Data } = await fileToBase64(file);

    const promptText = `
Eres un asistente experto en digitalización de cartas y menús de restaurantes.
Analiza detenidamente la imagen adjunta de la carta/menú.

REGLAS DE EXTRACCIÓN:
1. Identifica las CATEGORÍAS (ejemplo: "Entradas", "Platos de Fondo", "Bebidas", "Postres", "Ceviches", "Pizzas").
2. Identifica cada PLATO o PRODUCTO con:
   - "name": Nombre del plato (en texto limpio).
   - "price": Precio numérico (ejemplo: 25.50, sin símbolos de moneda). Si no tiene precio o es a pedido, pon 0.
   - "category": La categoría correspondiente a la que pertenece en la carta.
   - "description": Descripción o ingredientes detallados si aparecen en la foto (o "" si no hay).
3. Asegúrate de incluir TODOS los ítems visibles en la foto.

Devuelve EXCLUSIVAMENTE un objeto JSON con la siguiente estructura (sin formato Markdown adicional):
{
  "categories": ["Categoría 1", "Categoría 2"],
  "items": [
    {
      "name": "Nombre del Plato",
      "price": 35.00,
      "category": "Categoría 1",
      "description": "Descripción si existe"
    }
  ]
}
`;

    // Dynamically fetch available models from Google API that support generateContent
    let models: string[] = [];
    try {
        const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (listRes.ok) {
            const listData = await listRes.json();
            if (Array.isArray(listData.models)) {
                models = listData.models
                    .filter((m: any) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
                    .map((m: any) => m.name.replace(/^models\//, ''));
                
                // Sort to prioritize Flash models
                models.sort((a, b) => {
                    if (a.includes('flash') && !b.includes('flash')) return -1;
                    if (!a.includes('flash') && b.includes('flash')) return 1;
                    return 0;
                });
            }
        }
    } catch (e) {
        console.warn('Failed to query dynamic model list:', e);
    }

    if (models.length === 0) {
        models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash-001', 'gemini-1.5-pro'];
    }

    let lastError: Error | null = null;

    for (const model of models) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: promptText },
                                {
                                    inline_data: {
                                        mime_type: mimeType,
                                        data: base64Data,
                                    },
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        response_mime_type: 'application/json',
                        temperature: 0.1,
                    },
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `Error HTTP ${response.status}`);
            }

            const data = await response.json();
            const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!candidateText) {
                throw new Error('La respuesta de la IA no contiene texto.');
            }

            // Clean json response string
            let jsonString = candidateText.trim();
            if (jsonString.startsWith('```json')) {
                jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (jsonString.startsWith('```')) {
                jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            const parsed = JSON.parse(jsonString);

            const rawCategories: string[] = Array.isArray(parsed.categories) ? parsed.categories : [];
            const rawItems: any[] = Array.isArray(parsed.items) ? parsed.items : [];

            const items: ExtractedProductItem[] = rawItems.map((item, index) => ({
                id: `extracted-${Date.now()}-${index}`,
                name: String(item.name || 'Sin Nombre').trim(),
                price: typeof item.price === 'number' ? item.price : parseFloat(String(item.price || 0)) || 0,
                category: String(item.category || 'General').trim(),
                description: String(item.description || '').trim(),
                selected: true,
            }));

            // Deduplicate category list
            const categorySet = new Set<string>();
            rawCategories.forEach(c => categorySet.add(c.trim()));
            items.forEach(i => categorySet.add(i.category));
            const categories = Array.from(categorySet).filter(Boolean);

            return {
                categories,
                items,
            };
        } catch (err: any) {
            console.warn(`Attempt with ${model} failed:`, err);
            lastError = err instanceof Error ? err : new Error(String(err));
        }
    }

    throw lastError || new Error('No se pudo procesar la imagen de la carta.');
}
