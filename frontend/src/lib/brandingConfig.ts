/**
 * ARTIN Branding Image Configuration
 *
 * Naming Convention: {section}-{concept}-v{n}.webp
 * - Supports multiple variants per concept for rotation
 * - Version numbers allow easy addition of new variants
 *
 * Note: negativePrompt is no longer supported by Imagen 4.0 (Jan 2025)
 * Prompts follow: [Style] [Subject] [Composition] [Atmosphere]
 *
 * HYPERPERSONALIZATION FOCUS: Main selling point is hyperpersonalized
 * orthopedic insoles with custom names and designs integrated into artwork.
 */

import type { ImageSpec, ImageCategory } from '../types/branding';

// ============================================
// CATEGORY IMAGES - Using versioned naming
// ============================================

export const ALL_IMAGES: ImageSpec[] = [
    // ============================================
    // HERO IMAGES - 5 Variants for rotation
    // ============================================
    {
        id: 'hero-athletic-v1',
        name: 'Hero - Athletic Runner',
        category: 'hero',
        concept: 'athletic',
        version: 1,
        prompt: "Professional sports photography of an athletic runner in a powerful running pose mid-stride. The athlete wears modern black and orange athletic shoes with custom performance insoles visible through a subtle artistic cutaway. The brand name 'ARTIN' is seamlessly integrated into the insole design in a stylised athletic font. Dramatic rim lighting from behind creates an orange edge glow on the figure. Pure charcoal black background. Motion blur on the limbs conveys explosive speed. Premium athletic brand campaign aesthetic with high contrast. Studio quality with dramatic shadows. Photorealistic, professional lighting, dark moody atmosphere.",
        aspectRatio: '16:9',
        dimensions: { width: 1920, height: 1080 },
        outputPath: 'hero/hero-athletic-v1.webp',
    },
    {
        id: 'hero-product-craft-v1',
        name: 'Hero - Product Craftsmanship',
        category: 'hero',
        concept: 'product-craft',
        version: 1,
        prompt: "Premium product photography of a pair of custom athletic insoles floating at a 30-degree angle against a pure black background. Dramatic rim lighting creates a glowing orange edge effect around the insoles. The foam texture and material quality are clearly visible with macro-level detail. The brand name 'ARTIN' is seamlessly integrated into the design at the bottom of the insole in a stylised modern font matching the geometric theme. A subtle shadow beneath suggests the insoles are floating. High-end advertising aesthetic with professional studio lighting. The insoles feature a striking orange and black geometric design. Photorealistic, premium brand aesthetic, dark background only.",
        aspectRatio: '16:9',
        dimensions: { width: 1920, height: 1080 },
        outputPath: 'hero/hero-product-craft-v1.webp',
    },
    {
        id: 'hero-tech-innovation-v1',
        name: 'Hero - Tech Innovation',
        category: 'hero',
        concept: 'tech-innovation',
        version: 1,
        prompt: 'Futuristic technology visualization showing a human foot silhouette with a glowing digital scanning grid overlay. Abstract data visualization particles flow in cyan blue and orange colors. Dark black background with holographic measurement lines displaying foot dimensions. A subtle neural network pattern is visible in the background. Clean modern aesthetic similar to premium tech brand product launches. Photorealistic 3D rendering with sleek, minimal design. Professional, sophisticated, pure black background.',
        aspectRatio: '16:9',
        dimensions: { width: 1920, height: 1080 },
        outputPath: 'hero/hero-tech-innovation-v1.webp',
    },
    {
        id: 'hero-lifestyle-confidence-v1',
        name: 'Hero - Lifestyle Confidence',
        category: 'hero',
        concept: 'lifestyle-confidence',
        version: 1,
        prompt: "Cinematic sports photography of a confident athlete sitting in a dark locker room putting on athletic shoes. Custom performance insoles with the brand name 'ARTIN' elegantly integrated into the design are visible in the athlete's hand. Dramatic window light creates strong shadows across the scene. Dark moody atmosphere with warm orange accent lighting from locker lights. The athlete looks directly at the camera with a determined expression. Authentic moment, candid feel. Premium brand campaign aesthetic with film-like color grading. Professional photography, dark environment.",
        aspectRatio: '16:9',
        dimensions: { width: 1920, height: 1080 },
        outputPath: 'hero/hero-lifestyle-confidence-v1.webp',
    },
    {
        id: 'hero-customization-v1',
        name: 'Hero - Customization Array',
        category: 'hero',
        concept: 'customization',
        version: 1,
        prompt: "Premium flat lay product photography showing 6 pairs of custom athletic insoles arranged in a dynamic diagonal pattern on a dark slate surface. Each insole pair displays a different design style including sports themes, abstract patterns, and artistic graphics. The brand name 'ARTIN' is seamlessly integrated into each insole design in stylised fonts matching each theme. Soft overhead lighting with subtle shadows. Orange accent light from the side creates depth and dimension. High-end advertising aesthetic with visible premium material quality. The insoles feature vibrant colors against the dark background. Professional product photography, clean composition, dark background.",
        aspectRatio: '16:9',
        dimensions: { width: 1920, height: 1080 },
        outputPath: 'hero/hero-customization-v1.webp',
    },

    // ============================================
    // FEATURES - Hyperpersonalized Orthopedic Insoles
    // ============================================
    {
        id: 'feature-personalized-v1',
        name: 'Feature - Personalized Orthopedic Design',
        category: 'features',
        concept: 'personalized',
        version: 1,
        prompt: "Premium product photography of a custom orthopedic insole with an elaborate dragon design in red and gold on dark background. The name 'EMMA' is elegantly integrated into the design at the bottom of the insole in a stylized medieval font that matches the dragon theme. The brand name 'ARTIN' appears subtly in the heel area in a complementary style. The insole shows premium foam construction with visible arch support contours. Dramatic rim lighting with green accent glow highlights the orthopedic support zones. Professional studio photography showing the personalized name as part of the artistic design. Dark black background, premium athletic brand aesthetic.",
        aspectRatio: '4:3',
        dimensions: { width: 800, height: 600 },
        outputPath: 'features/feature-personalized-v1.webp',
        accentColor: '#22C55E',
    },
    {
        id: 'feature-ai-art-v1',
        name: 'Feature - AI-Generated Custom Art',
        category: 'features',
        concept: 'ai-art',
        version: 1,
        prompt: "Two custom orthopedic insoles side by side showing different AI-generated designs. Left insole features a cosmic galaxy pattern in purple and blue with the name 'MAX' integrated in futuristic typography. Right insole shows a graffiti street art style in vibrant colors with 'SOFIA' as stylized graffiti lettering. The brand name 'ARTIN' is seamlessly integrated into both designs in matching stylised fonts. Both insoles display premium foam construction. Violet and purple accent lighting creates depth. The personalized names are seamlessly integrated into each unique design theme. Dark black background, premium product photography, showing AI personalization variety.",
        aspectRatio: '4:3',
        dimensions: { width: 800, height: 600 },
        outputPath: 'features/feature-ai-art-v1.webp',
        accentColor: '#8B5CF6',
    },
    {
        id: 'feature-fit-v1',
        name: 'Feature - Perfect Fit Technology',
        category: 'features',
        concept: 'fit',
        version: 1,
        prompt: "Split-view product photography showing a custom insole. One half displays the artistic top surface with a basketball-themed design and the name 'LUCAS' integrated in athletic block letters. The brand name 'ARTIN' is seamlessly integrated into the design in a stylised athletic font. The other half shows a cutaway revealing the multi-layer orthopedic foam construction with arch support highlighted in orange. Premium medical-athletic hybrid aesthetic. Orange accent lighting emphasizes the precision engineering. The personalized name visible on the design surface. Dark black background, professional studio photography.",
        aspectRatio: '4:3',
        dimensions: { width: 800, height: 600 },
        outputPath: 'features/feature-fit-v1.webp',
        accentColor: '#FF6B2C',
    },
    {
        id: 'feature-growth-v1',
        name: 'Feature - Growth Club Collection',
        category: 'features',
        concept: 'growth',
        version: 1,
        prompt: "Premium flat lay photography showing 3 pairs of custom insoles in different sizes arranged diagonally from small to large on dark slate surface. Each pair features a unique design theme: soccer theme with 'NOAH', unicorn fantasy with 'LILY', and superhero style with 'ALEX'. The personalized names and the brand name 'ARTIN' are seamlessly integrated into each design in stylised fonts matching each theme. Warm amber accent lighting from above. The size progression shows the Growth Club concept - new designs as feet grow. Premium foam materials visible. Professional product photography, dark background.",
        aspectRatio: '4:3',
        dimensions: { width: 800, height: 600 },
        outputPath: 'features/feature-growth-v1.webp',
        accentColor: '#F59E0B',
    },

    // ============================================
    // PROCESS - Customer Journey Steps (Scan, Design, Receive)
    // ============================================
    {
        id: 'step-scan-v1',
        name: 'Process - Step 1: Scan',
        category: 'process',
        concept: 'scan',
        version: 1,
        prompt: 'Technology lifestyle photography showing hands holding a modern iPhone scanning a foot from above. An AR visualization grid appears on the phone screen showing foot measurements. Dark black background with the phone screen glowing brightly. The app interface is visible showing scan progress. Clean modern aesthetic similar to Apple marketing photography. Shallow depth of field focuses on the phone screen. Premium tech brand style with dramatic lighting. Professional photography, dark environment.',
        aspectRatio: '4:3',
        dimensions: { width: 800, height: 600 },
        outputPath: 'process/step-scan-v1.webp',
    },
    {
        id: 'step-design-v1',
        name: 'Process - Step 2: Design',
        category: 'process',
        concept: 'design',
        version: 1,
        prompt: 'Creative technology visualization showing a tablet screen displaying a design interface for insole customization. A finger touches the color selection palette. Vibrant design elements with prominent orange accents appear on screen. Dark workspace background with creative studio atmosphere. The interface shows an insole preview with color options and pattern choices. Premium modern app interface aesthetic with sleek dark mode design. Professional photography, contemporary UI design.',
        aspectRatio: '4:3',
        dimensions: { width: 800, height: 600 },
        outputPath: 'process/step-design-v1.webp',
    },
    {
        id: 'step-receive-v1',
        name: 'Process - Step 3: Receive',
        category: 'process',
        concept: 'receive',
        version: 1,
        prompt: 'Premium unboxing photography showing hands lifting custom athletic insoles from a sleek matte black packaging box. Dark surface background with warm accent lighting from above. Premium materials visible including tissue paper and the quality foam of the insoles. Luxury brand unboxing moment aesthetic. The box features subtle embossed branding. Authentic candid moment, natural feel. High-end product photography style. Professional, dark background.',
        aspectRatio: '4:3',
        dimensions: { width: 800, height: 600 },
        outputPath: 'process/step-receive-v1.webp',
    },

    // ============================================
    // LIFESTYLE - Sports Action Shots (Soccer, Basketball, Multi-Sport)
    // ============================================
    {
        id: 'lifestyle-soccer-v1',
        name: 'Lifestyle - Soccer',
        category: 'lifestyle',
        concept: 'soccer',
        version: 1,
        prompt: "Dynamic sports photography of a soccer player on a field at dusk. Dramatic stadium lighting creates long shadows. Custom performance insoles with the brand name 'ARTIN' integrated into the design are visible inside the soccer cleat through an artistic cutaway angle. The orange sunset sky blends with stadium lights. Dark moody atmosphere with authentic action moment, candid feel. Premium sports brand campaign aesthetic. The player is mid-kick with explosive energy. Professional photography, dramatic lighting.",
        aspectRatio: '16:9',
        dimensions: { width: 1920, height: 1080 },
        outputPath: 'lifestyle/lifestyle-soccer-v1.webp',
    },
    {
        id: 'lifestyle-basketball-v1',
        name: 'Lifestyle - Basketball',
        category: 'lifestyle',
        concept: 'basketball',
        version: 1,
        prompt: "High-energy sports photography on a basketball court with dramatic overhead spotlights. Close-up of basketball shoes during a powerful jump with feet leaving the ground. Custom insoles with the brand name 'ARTIN' integrated into the design visible through an artistic transparent shoe effect. An orange basketball in the frame provides color accent. Dark gym atmosphere with motion blur suggesting explosive power. Premium athletic brand campaign aesthetic with cinematic lighting. Professional photography, dynamic action shot.",
        aspectRatio: '16:9',
        dimensions: { width: 1920, height: 1080 },
        outputPath: 'lifestyle/lifestyle-basketball-v1.webp',
    },
    {
        id: 'lifestyle-multi-sport-v1',
        name: 'Lifestyle - Multi-Sport Grid',
        category: 'lifestyle',
        concept: 'multi-sport',
        version: 1,
        prompt: "Editorial product photography showing an organized grid arrangement of 4 different sports shoes on a dark slate surface. The shoes include soccer cleats, basketball sneakers, running shoes, and casual athletic footwear. Each shoe has a custom insole with the brand name 'ARTIN' integrated into the design peeking out visibly. Dramatic side lighting with orange accent creates depth. Premium lifestyle magazine aesthetic with clean composition. High-end product styling. Professional photography, dark background.",
        aspectRatio: '16:9',
        dimensions: { width: 1920, height: 1080 },
        outputPath: 'lifestyle/lifestyle-multi-sport-v1.webp',
    },

    // ============================================
    // PRODUCT GALLERY - Multiple Design Styles & Views
    // ============================================

    // --- Dragon Fire Design (5 views) ---
    {
        id: 'product-dragon-fire-topdown-v1',
        name: 'Product - Dragon Fire Top-Down',
        category: 'product',
        concept: 'dragon-fire-topdown',
        version: 1,
        subcategory: 'dragon-fire',
        prompt: "Premium flat lay product photography of a pair of custom athletic insoles viewed directly from above. The insoles feature a fiery dragon scale pattern in orange, red, and black with flame accents. The brand name 'ARTIN' is seamlessly integrated into the design at the bottom of the insole in a stylised font matching the dragon theme. Pure black background with soft diffused lighting from above. The foam texture and material quality are clearly visible. High-end e-commerce product shot aesthetic. Both left and right insoles positioned parallel with slight angle. Professional product photography, clean composition.",
        aspectRatio: '1:1',
        dimensions: { width: 1200, height: 1200 },
        outputPath: 'product/dragon-fire/topdown-v1.webp',
    },
    {
        id: 'product-dragon-fire-angled-v1',
        name: 'Product - Dragon Fire Angled',
        category: 'product',
        concept: 'dragon-fire-angled',
        version: 1,
        subcategory: 'dragon-fire',
        prompt: "Premium product photography of a pair of custom athletic insoles floating at a 45-degree angle against a pure black background. The insoles feature a fiery dragon scale pattern in orange, red, and black with flame accents. The brand name 'ARTIN' is seamlessly integrated into the design in a stylised font matching the dragon theme. Dramatic rim lighting creates an orange edge glow. Subtle shadow beneath suggests floating. Both insoles overlap slightly showing the design from the top surface. High-end advertising aesthetic with visible material quality. Professional studio photography, dark background only.",
        aspectRatio: '1:1',
        dimensions: { width: 1200, height: 1200 },
        outputPath: 'product/dragon-fire/angled-v1.webp',
    },
    {
        id: 'product-dragon-fire-profile-v1',
        name: 'Product - Dragon Fire Side Profile',
        category: 'product',
        concept: 'dragon-fire-profile',
        version: 1,
        subcategory: 'dragon-fire',
        prompt: "Product photography showing an athletic insole from the side profile view against a pure black background. The arch support curve and foam thickness are clearly visible. The insole features a fiery dragon scale pattern in orange, red, and black visible on the top edge. The brand name 'ARTIN' is subtly visible on the side. Soft studio lighting reveals the contoured shape. Premium product shot highlighting the ergonomic design and material layers. Professional photography, dark background.",
        aspectRatio: '1:1',
        dimensions: { width: 1200, height: 1200 },
        outputPath: 'product/dragon-fire/profile-v1.webp',
    },

    // --- Galaxy Nebula Design (3 views) ---
    {
        id: 'product-galaxy-topdown-v1',
        name: 'Product - Galaxy Nebula Top-Down',
        category: 'product',
        concept: 'galaxy-topdown',
        version: 1,
        subcategory: 'galaxy-nebula',
        prompt: "Premium flat lay product photography of a pair of custom athletic insoles viewed directly from above. The insoles feature a cosmic purple and blue nebula pattern with star clusters and orange accents. The brand name 'ARTIN' is seamlessly integrated into the design in a stylised futuristic font matching the galaxy theme. Pure black background with soft diffused lighting from above. The foam texture and material quality are clearly visible. High-end e-commerce product shot aesthetic. Both left and right insoles positioned parallel with slight angle. Professional product photography, clean composition.",
        aspectRatio: '1:1',
        dimensions: { width: 1200, height: 1200 },
        outputPath: 'product/galaxy-nebula/topdown-v1.webp',
    },
    {
        id: 'product-galaxy-angled-v1',
        name: 'Product - Galaxy Nebula Angled',
        category: 'product',
        concept: 'galaxy-angled',
        version: 1,
        subcategory: 'galaxy-nebula',
        prompt: "Premium product photography of a pair of custom athletic insoles floating at a 45-degree angle against a pure black background. The insoles feature a cosmic purple and blue nebula pattern with star clusters and orange accents. The brand name 'ARTIN' is seamlessly integrated into the design in a stylised futuristic font. Dramatic rim lighting creates a purple edge glow. Subtle shadow beneath suggests floating. Both insoles overlap slightly showing the design. High-end advertising aesthetic with visible material quality. Professional studio photography, dark background only.",
        aspectRatio: '1:1',
        dimensions: { width: 1200, height: 1200 },
        outputPath: 'product/galaxy-nebula/angled-v1.webp',
    },
    {
        id: 'product-galaxy-macro-v1',
        name: 'Product - Galaxy Nebula Detail',
        category: 'product',
        concept: 'galaxy-macro',
        version: 1,
        subcategory: 'galaxy-nebula',
        prompt: "Macro close-up photography of a custom athletic insole showing the cosmic purple and blue nebula pattern with star clusters in extreme detail. The brand name 'ARTIN' is visible integrated into the design. The foam texture and print quality are sharply visible. Dark background with focused lighting on the detail area. Premium product photography revealing material craftsmanship. The pattern colors are vibrant and the surface texture shows quality construction. Sharp focus, professional macro photography.",
        aspectRatio: '1:1',
        dimensions: { width: 1200, height: 1200 },
        outputPath: 'product/galaxy-nebula/macro-v1.webp',
    },

    // --- Graffiti Art Design (3 views) ---
    {
        id: 'product-graffiti-topdown-v1',
        name: 'Product - Graffiti Art Top-Down',
        category: 'product',
        concept: 'graffiti-topdown',
        version: 1,
        subcategory: 'graffiti-art',
        prompt: "Premium flat lay product photography of a pair of custom athletic insoles viewed directly from above. The insoles feature an urban street art graffiti style in vibrant colors on black background. The brand name 'ARTIN' is seamlessly integrated as stylised graffiti lettering. Pure black background with soft diffused lighting from above. The foam texture and material quality are clearly visible. High-end e-commerce product shot aesthetic. Both left and right insoles positioned parallel with slight angle. Professional product photography, clean composition.",
        aspectRatio: '1:1',
        dimensions: { width: 1200, height: 1200 },
        outputPath: 'product/graffiti-art/topdown-v1.webp',
    },
    {
        id: 'product-graffiti-angled-v1',
        name: 'Product - Graffiti Art Angled',
        category: 'product',
        concept: 'graffiti-angled',
        version: 1,
        subcategory: 'graffiti-art',
        prompt: "Premium product photography of a pair of custom athletic insoles floating at a 45-degree angle against a pure black background. The insoles feature an urban street art graffiti style in vibrant colors. The brand name 'ARTIN' is seamlessly integrated as stylised graffiti lettering. Dramatic rim lighting creates colorful edge glow. Subtle shadow beneath suggests floating. Both insoles overlap slightly showing the design. High-end advertising aesthetic with visible material quality. Professional studio photography, dark background only.",
        aspectRatio: '1:1',
        dimensions: { width: 1200, height: 1200 },
        outputPath: 'product/graffiti-art/angled-v1.webp',
    },
    {
        id: 'product-graffiti-context-v1',
        name: 'Product - Graffiti Art In-Context',
        category: 'product',
        concept: 'graffiti-context',
        version: 1,
        subcategory: 'graffiti-art',
        prompt: "Lifestyle product photography showing a custom athletic insole being placed into a modern black athletic shoe. The insole features an urban street art graffiti style in vibrant colors clearly visible. The brand name 'ARTIN' is seamlessly integrated as stylised graffiti lettering. Dark background with the shoe partially visible. Hands gently holding the insole. Premium brand aesthetic showing the product in use context. The insole design is the focal point. Professional photography, dark environment.",
        aspectRatio: '1:1',
        dimensions: { width: 1200, height: 1200 },
        outputPath: 'product/graffiti-art/context-v1.webp',
    },

    // --- Soccer Pitch Design (2 views) ---
    {
        id: 'product-soccer-topdown-v1',
        name: 'Product - Soccer Pitch Top-Down',
        category: 'product',
        concept: 'soccer-topdown',
        version: 1,
        subcategory: 'soccer-pitch',
        prompt: "Premium flat lay product photography of a pair of custom athletic insoles viewed directly from above. The insoles feature a grass green field pattern with white line markings and soccer ball accents. The brand name 'ARTIN' is seamlessly integrated into the design in a stylised athletic font. Pure black background with soft diffused lighting from above. The foam texture and material quality are clearly visible. High-end e-commerce product shot aesthetic. Both left and right insoles positioned parallel with slight angle. Professional product photography, clean composition.",
        aspectRatio: '1:1',
        dimensions: { width: 1200, height: 1200 },
        outputPath: 'product/soccer-pitch/topdown-v1.webp',
    },
    {
        id: 'product-soccer-angled-v1',
        name: 'Product - Soccer Pitch Angled',
        category: 'product',
        concept: 'soccer-angled',
        version: 1,
        subcategory: 'soccer-pitch',
        prompt: "Premium product photography of a pair of custom athletic insoles floating at a 45-degree angle against a pure black background. The insoles feature a grass green field pattern with white line markings and soccer ball accents. The brand name 'ARTIN' is seamlessly integrated into the design in a stylised athletic font. Dramatic rim lighting creates a green edge glow. Subtle shadow beneath suggests floating. High-end advertising aesthetic with visible material quality. Professional studio photography, dark background only.",
        aspectRatio: '1:1',
        dimensions: { width: 1200, height: 1200 },
        outputPath: 'product/soccer-pitch/angled-v1.webp',
    },

    // --- Geometric Tech Design (2 views) ---
    {
        id: 'product-geometric-topdown-v1',
        name: 'Product - Geometric Tech Top-Down',
        category: 'product',
        concept: 'geometric-topdown',
        version: 1,
        subcategory: 'geometric-tech',
        prompt: "Premium flat lay product photography of a pair of custom athletic insoles viewed directly from above. The insoles feature a modern geometric hexagon pattern in orange and dark gray with tech aesthetic. The brand name 'ARTIN' is seamlessly integrated into the design in a stylised modern tech font. Pure black background with soft diffused lighting from above. The foam texture and material quality are clearly visible. High-end e-commerce product shot aesthetic. Both left and right insoles positioned parallel with slight angle. Professional product photography, clean composition.",
        aspectRatio: '1:1',
        dimensions: { width: 1200, height: 1200 },
        outputPath: 'product/geometric-tech/topdown-v1.webp',
    },
    {
        id: 'product-geometric-angled-v1',
        name: 'Product - Geometric Tech Angled',
        category: 'product',
        concept: 'geometric-angled',
        version: 1,
        subcategory: 'geometric-tech',
        prompt: "Premium product photography of a pair of custom athletic insoles floating at a 45-degree angle against a pure black background. The insoles feature a modern geometric hexagon pattern in orange and dark gray with tech aesthetic. The brand name 'ARTIN' is seamlessly integrated into the design in a stylised modern tech font. Dramatic rim lighting creates an orange edge glow. Subtle shadow beneath suggests floating. High-end advertising aesthetic with visible material quality. Professional studio photography, dark background only.",
        aspectRatio: '1:1',
        dimensions: { width: 1200, height: 1200 },
        outputPath: 'product/geometric-tech/angled-v1.webp',
    },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getImagesByCategory = (category: ImageCategory): ImageSpec[] => {
    return ALL_IMAGES.filter((img) => img.category === category);
};

export const getImageById = (id: string): ImageSpec | undefined => {
    return ALL_IMAGES.find((img) => img.id === id);
};

export const getImagesByConcept = (concept: string): ImageSpec[] => {
    return ALL_IMAGES.filter((img) => img.concept === concept);
};

export const getLatestVersion = (category: ImageCategory, concept: string): number => {
    const images = ALL_IMAGES.filter(
        (img) => img.category === category && img.concept === concept
    );
    if (images.length === 0) return 0;
    return Math.max(...images.map((img) => img.version));
};

export const getCategoryCount = (category: ImageCategory): number => {
    return getImagesByCategory(category).length;
};

// Category counts for display (computed dynamically)
export const CATEGORY_COUNTS: Record<ImageCategory, number> = {
    hero: getImagesByCategory('hero').length,
    features: getImagesByCategory('features').length,
    process: getImagesByCategory('process').length,
    lifestyle: getImagesByCategory('lifestyle').length,
    product: getImagesByCategory('product').length,
};

export const TOTAL_IMAGE_COUNT = ALL_IMAGES.length;
