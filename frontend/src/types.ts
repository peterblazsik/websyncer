export interface PromptConfig {
    person: {
        mainCharacter: string;
        action: string;
        clothingColor: string;
    };
    foreground: {
        customText: string;
        color: string;
        imageType: string;
        measurement: string;
    };
    background: {
        wallText: string;
        mood: string;
        motivationalText: string;
        sloganLocation: string;
        sloganLanguage: string;
        sloganProduct: string;
    };
    branding: {
        logoText: string;
        logoTextColor: string;
        logoBgColor: string;
        logoBorderColor: string;
        instagramContact: string;
    };
}

export const DEFAULT_CONFIG: PromptConfig = {
    person: {
        mainCharacter: 'Basketball Player',
        action: 'playing basketball',
        clothingColor: 'sporty colorful jerseys',
    },
    foreground: {
        customText: 'JASON',
        color: 'Orange',
        imageType: 'Basketball',
        measurement: '3D Scan',
    },
    background: {
        wallText: 'CHAMPION',
        mood: 'Energetic, Dynamic, Safe',
        motivationalText: 'Never Give Up',
        sloganLocation: 'Wall',
        sloganLanguage: 'German',
        sloganProduct: 'ultra personalized sport shoe soles',
    },
    branding: {
        logoText: 'ORTHOSCAN',
        logoTextColor: 'White',
        logoBgColor: 'Black',
        logoBorderColor: 'Skyblue',
        instagramContact: 'instagram.com/orthoscan_insoles',
    },
};
