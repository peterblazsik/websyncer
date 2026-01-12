import React from 'react';
import { Scan } from 'lucide-react';

export const Header: React.FC = () => {
    return (
        <header className="bg-amazon-dark text-white p-3 sticky top-0 z-50">
            <div className="max-w-[1400px] mx-auto flex items-center justify-between">
                {/* Logo Area */}
                <div className="flex items-center gap-2 border border-transparent hover:border-white p-1 rounded cursor-pointer transition-colors">
                    <div className="flex flex-col relative">
                        <span className="text-2xl font-bold tracking-tighter leading-none font-display">ORTHOSCAN</span>
                        <span className="text-[10px] text-amazon-button absolute -bottom-2 right-0 font-sans">marketing</span>
                    </div>
                </div>

                {/* Right Nav */}
                <div className="flex items-center gap-6 text-sm font-medium">
                    <div className="border border-transparent hover:border-white p-2 rounded cursor-pointer">
                        <span className="text-gray-300 block text-xs leading-none">Powered by</span>
                        <span className="font-bold">Nano Banana</span>
                    </div>
                </div>
            </div>

            {/* Secondary Nav Bar */}
            <div className="bg-amazon-light h-10 -mx-3 mt-3 px-4 flex items-center text-sm text-white space-x-5 overflow-hidden">
                <span className="flex items-center gap-1 font-bold cursor-pointer hover:underline border border-transparent p-1"><Scan size={18} /> All</span>
                <span className="cursor-pointer hover:underline border border-transparent p-1">Campaigns</span>
                <span className="cursor-pointer hover:underline border border-transparent p-1">Assets</span>
                <span className="cursor-pointer hover:underline border border-transparent p-1">Fitness</span>
                <span className="cursor-pointer hover:underline border border-transparent p-1">Custom Soles</span>
            </div>
        </header>
    );
};
