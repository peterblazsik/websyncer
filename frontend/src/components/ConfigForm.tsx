import React from 'react';
import type { PromptConfig } from '../types';
import { User, Footprints, Image, Hexagon } from 'lucide-react';

interface ConfigFormProps {
    config: PromptConfig;
    onChange: (newConfig: PromptConfig) => void;
}

export const ConfigForm: React.FC<ConfigFormProps> = ({ config, onChange }) => {

    const updatePerson = (field: keyof PromptConfig['person'], value: string) => {
        onChange({ ...config, person: { ...config.person, [field]: value } });
    };

    const updateForeground = (field: keyof PromptConfig['foreground'], value: string) => {
        onChange({ ...config, foreground: { ...config.foreground, [field]: value } });
    };

    const updateBackground = (field: keyof PromptConfig['background'], value: string) => {
        onChange({ ...config, background: { ...config.background, [field]: value } });
    };

    const updateBranding = (field: keyof PromptConfig['branding'], value: string) => {
        onChange({ ...config, branding: { ...config.branding, [field]: value } });
    };

    const inputClass = "w-full px-4 py-2 bg-black border border-brand-border rounded-lg text-white placeholder:text-brand-muted focus:border-white focus:outline-none transition-all";
    const labelClass = "block text-xs font-bold uppercase tracking-wider text-brand-muted mb-2";
    const sectionHeaderClass = "text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-brand-border pb-2";

    return (
        <div className="bg-brand-card p-8 rounded-2xl border border-brand-border">
            <div className="flex items-center gap-2 mb-8 border-b border-brand-border pb-4">
                <h2 className="text-2xl font-bold text-white">Campaign Details</h2>
            </div>

            {/* Person Section */}
            <div className="space-y-4 mb-8">
                <h3 className={sectionHeaderClass}>
                    <User size={16} /> Person Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}>Main Character</label>
                        <input
                            type="text"
                            placeholder="e.g. Batman, Athlete"
                            className={inputClass}
                            value={config.person.mainCharacter}
                            onChange={(e) => updatePerson('mainCharacter', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Action</label>
                        <input
                            type="text"
                            value={config.person.action}
                            onChange={(e) => updatePerson('action', e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className={labelClass}>Clothing Color/Style</label>
                        <input
                            type="text"
                            value={config.person.clothingColor}
                            onChange={(e) => updatePerson('clothingColor', e.target.value)}
                            className={inputClass}
                        />
                    </div>
                </div>
            </div>

            {/* Foreground Section */}
            <div className="space-y-4 mb-8">
                <h3 className={sectionHeaderClass}>
                    <Footprints size={16} /> Sole / Foreground
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}>Custom Text</label>
                        <input
                            type="text"
                            value={config.foreground.customText}
                            onChange={(e) => updateForeground('customText', e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Color</label>
                        <input
                            type="text"
                            value={config.foreground.color}
                            onChange={(e) => updateForeground('color', e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Image Type</label>
                        <input
                            type="text"
                            value={config.foreground.imageType}
                            onChange={(e) => updateForeground('imageType', e.target.value)}
                            placeholder="e.g. Basketball, Dragon"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Measurement Source</label>
                        <input
                            type="text"
                            value={config.foreground.measurement}
                            onChange={(e) => updateForeground('measurement', e.target.value)}
                            className={inputClass}
                        />
                    </div>
                </div>
            </div>

            {/* Background Section */}
            <div className="space-y-4 mb-8">
                <h3 className={sectionHeaderClass}>
                    <Image size={16} /> Background & Mood
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}>Wall Text</label>
                        <input
                            type="text"
                            value={config.background.wallText}
                            onChange={(e) => updateBackground('wallText', e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Mood</label>
                        <input
                            type="text"
                            value={config.background.mood}
                            onChange={(e) => updateBackground('mood', e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className={labelClass}>Motivational Text</label>
                        <input
                            type="text"
                            value={config.background.motivationalText}
                            onChange={(e) => updateBackground('motivationalText', e.target.value)}
                            className={inputClass}
                        />
                    </div>
                </div>

                {/* Slogan Settings */}
                <div className="bg-black/50 p-4 rounded-xl border border-brand-border mt-6">
                    <label className="block text-xs font-bold text-brand-muted uppercase tracking-wide mb-3">Slogan Configuration</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs text-brand-muted mb-1">Product Text</label>
                            <input
                                type="text"
                                value={config.background.sloganProduct}
                                onChange={(e) => updateBackground('sloganProduct', e.target.value)}
                                className="w-full px-3 py-2 bg-black border border-brand-border rounded text-white placeholder:text-brand-muted focus:border-white focus:outline-none transition-all text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-brand-muted mb-1">Location</label>
                            <input
                                type="text"
                                value={config.background.sloganLocation}
                                onChange={(e) => updateBackground('sloganLocation', e.target.value)}
                                className="w-full px-3 py-2 bg-black border border-brand-border rounded text-white placeholder:text-brand-muted focus:border-white focus:outline-none transition-all text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-brand-muted mb-1">Language</label>
                            <input
                                type="text"
                                value={config.background.sloganLanguage}
                                onChange={(e) => updateBackground('sloganLanguage', e.target.value)}
                                className="w-full px-3 py-2 bg-black border border-brand-border rounded text-white placeholder:text-brand-muted focus:border-white focus:outline-none transition-all text-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Branding Section */}
            <div className="space-y-4">
                <h3 className={sectionHeaderClass}>
                    <Hexagon size={16} /> Branding
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}>Logo Text</label>
                        <input
                            type="text"
                            value={config.branding.logoText}
                            onChange={(e) => updateBranding('logoText', e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Label Colors (Text / Bg / Border)</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Text (White)"
                                value={config.branding.logoTextColor}
                                onChange={(e) => updateBranding('logoTextColor', e.target.value)}
                                className="w-1/3 px-2 py-2 bg-black border border-brand-border rounded text-white placeholder:text-brand-muted focus:border-white focus:outline-none transition-all text-xs"
                            />
                            <input
                                type="text"
                                placeholder="Bg (Black)"
                                value={config.branding.logoBgColor}
                                onChange={(e) => updateBranding('logoBgColor', e.target.value)}
                                className="w-1/3 px-2 py-2 bg-black border border-brand-border rounded text-white placeholder:text-brand-muted focus:border-white focus:outline-none transition-all text-xs"
                            />
                            <input
                                type="text"
                                placeholder="Border (Skyblue)"
                                value={config.branding.logoBorderColor}
                                onChange={(e) => updateBranding('logoBorderColor', e.target.value)}
                                className="w-1/3 px-2 py-2 bg-black border border-brand-border rounded text-white placeholder:text-brand-muted focus:border-white focus:outline-none transition-all text-xs"
                            />
                        </div>
                    </div>
                </div>
                <div>
                    <label className={labelClass}>Instagram Contact</label>
                    <input
                        type="text"
                        className={inputClass}
                        value={config.branding.instagramContact}
                        onChange={(e) => updateBranding('instagramContact', e.target.value)}
                    />
                </div>
            </div>

        </div>
    );
};
