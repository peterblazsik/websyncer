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

    return (
        <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-6 border-b pb-2">
                <h2 className="text-xl font-bold text-amazon-dark">Campaign Details</h2>
            </div>

            {/* Person Section */}
            <div className="space-y-4 mb-6">
                <h3 className="text-sm font-bold text-amazon-light flex items-center gap-2">
                    <User size={16} className="text-amazon-blue" /> Person Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Main Character (e.g. Batman)</label>
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amazon-orange focus:border-transparent"
                            value={config.person.mainCharacter}
                            onChange={(e) => updatePerson('mainCharacter', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Action</label>
                        <input
                            type="text"
                            value={config.person.action}
                            onChange={(e) => updatePerson('action', e.target.value)}
                            className="w-full bg-white border border-gray-400 rounded-md p-2 text-sm shadow-sm focus:border-amazon-button focus:ring-1 focus:ring-amazon-button focus:outline-none"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Clothing Color/Style</label>
                        <input
                            type="text"
                            value={config.person.clothingColor}
                            onChange={(e) => updatePerson('clothingColor', e.target.value)}
                            className="w-full bg-white border border-gray-400 rounded-md p-2 text-sm shadow-sm focus:border-amazon-button focus:ring-1 focus:ring-amazon-button focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Foreground Section */}
            <div className="space-y-4 mb-6">
                <h3 className="text-sm font-bold text-amazon-light flex items-center gap-2">
                    <Footprints size={16} className="text-amazon-blue" /> Sole / Foreground
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Custom Text</label>
                        <input
                            type="text"
                            value={config.foreground.customText}
                            onChange={(e) => updateForeground('customText', e.target.value)}
                            className="w-full bg-white border border-gray-400 rounded-md p-2 text-sm shadow-sm focus:border-amazon-button focus:ring-1 focus:ring-amazon-button focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Color</label>
                        <input
                            type="text"
                            value={config.foreground.color}
                            onChange={(e) => updateForeground('color', e.target.value)}
                            className="w-full bg-white border border-gray-400 rounded-md p-2 text-sm shadow-sm focus:border-amazon-button focus:ring-1 focus:ring-amazon-button focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Image Type</label>
                        <input
                            type="text"
                            value={config.foreground.imageType}
                            onChange={(e) => updateForeground('imageType', e.target.value)}
                            placeholder="e.g. Basketball, Dragon"
                            className="w-full bg-white border border-gray-400 rounded-md p-2 text-sm shadow-sm focus:border-amazon-button focus:ring-1 focus:ring-amazon-button focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Measurement Source</label>
                        <input
                            type="text"
                            value={config.foreground.measurement}
                            onChange={(e) => updateForeground('measurement', e.target.value)}
                            className="w-full bg-white border border-gray-400 rounded-md p-2 text-sm shadow-sm focus:border-amazon-button focus:ring-1 focus:ring-amazon-button focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Background Section */}
            <div className="space-y-4 mb-6">
                <h3 className="text-sm font-bold text-amazon-light flex items-center gap-2">
                    <Image size={16} className="text-amazon-blue" /> Background & Mood
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Wall Text</label>
                        <input
                            type="text"
                            value={config.background.wallText}
                            onChange={(e) => updateBackground('wallText', e.target.value)}
                            className="w-full bg-white border border-gray-400 rounded-md p-2 text-sm shadow-sm focus:border-amazon-button focus:ring-1 focus:ring-amazon-button focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Mood</label>
                        <input
                            type="text"
                            value={config.background.mood}
                            onChange={(e) => updateBackground('mood', e.target.value)}
                            className="w-full bg-white border border-gray-400 rounded-md p-2 text-sm shadow-sm focus:border-amazon-button focus:ring-1 focus:ring-amazon-button focus:outline-none"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Motivational Text</label>
                        <input
                            type="text"
                            value={config.background.motivationalText}
                            onChange={(e) => updateBackground('motivationalText', e.target.value)}
                            className="w-full bg-white border border-gray-400 rounded-md p-2 text-sm shadow-sm focus:border-amazon-button focus:ring-1 focus:ring-amazon-button focus:outline-none"
                        />
                    </div>
                </div>

                {/* Slogan Settings */}
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                    <label className="block text-xs font-bold text-amazon-dark mb-2">Slogan Configuration</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-[10px] text-gray-600 mb-1">Product Text</label>
                            <input
                                type="text"
                                value={config.background.sloganProduct}
                                onChange={(e) => updateBackground('sloganProduct', e.target.value)}
                                className="w-full bg-white border border-gray-400 rounded-md p-2 text-xs"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-gray-600 mb-1">Location</label>
                            <input
                                type="text"
                                value={config.background.sloganLocation}
                                onChange={(e) => updateBackground('sloganLocation', e.target.value)}
                                className="w-full bg-white border border-gray-400 rounded-md p-2 text-xs"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-gray-600 mb-1">Language</label>
                            <input
                                type="text"
                                value={config.background.sloganLanguage}
                                onChange={(e) => updateBackground('sloganLanguage', e.target.value)}
                                className="w-full bg-white border border-gray-400 rounded-md p-2 text-xs"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Branding Section */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-amazon-light flex items-center gap-2">
                    <Hexagon size={16} className="text-amazon-blue" /> Branding
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Logo Text</label>
                        <input
                            type="text"
                            value={config.branding.logoText}
                            onChange={(e) => updateBranding('logoText', e.target.value)}
                            className="w-full bg-white border border-gray-400 rounded-md p-2 text-sm shadow-sm focus:border-amazon-button focus:ring-1 focus:ring-amazon-button focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Label Colors (Text / Bg / Border)</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Text (White)"
                                value={config.branding.logoTextColor}
                                onChange={(e) => updateBranding('logoTextColor', e.target.value)}
                                className="w-1/3 bg-white border border-gray-400 rounded-md p-2 text-xs"
                            />
                            <input
                                type="text"
                                placeholder="Bg (Black)"
                                value={config.branding.logoBgColor}
                                onChange={(e) => updateBranding('logoBgColor', e.target.value)}
                                className="w-1/3 bg-white border border-gray-400 rounded-md p-2 text-xs"
                            />
                            <input
                                type="text"
                                placeholder="Border (Skyblue)"
                                value={config.branding.logoBorderColor}
                                onChange={(e) => updateBranding('logoBorderColor', e.target.value)}
                                className="w-1/3 bg-white border border-gray-400 rounded-md p-2 text-xs"
                            />
                        </div>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Instagram Contact</label>
                    <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amazon-orange focus:border-transparent"
                        value={config.branding.instagramContact}
                        onChange={(e) => updateBranding('instagramContact', e.target.value)}
                    />
                </div>
            </div>

        </div>
    );
};
