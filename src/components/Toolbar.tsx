import React, { useRef } from 'react';
import {
    Download,
    Upload,
    Settings2,
    Palette,
    Target
} from 'lucide-react';
import { DisplaySettings, ConfigurationData, BranchData } from '../types';
import { cn } from '../utils';

interface ToolbarProps {
    settings: DisplaySettings;
    branches: BranchData[];
    onSettingsChange: (updates: Partial<DisplaySettings>) => void;
    onImport: (config: ConfigurationData) => void;
    onExport: () => void;
    onRecenter: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
    settings,
    branches,
    onSettingsChange,
    onImport,
    onExport,
    onRecenter
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (json.version && json.branches) {
                    onImport(json as ConfigurationData);
                } else {
                    alert('Invalid configuration file format.');
                }
            } catch (err) {
                alert('Failed to parse JSON file.');
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

    const cycleColorMode = () => {
        const modes: ('default' | 'multi' | 'custom')[] = ['default', 'multi', 'custom'];
        const nextIdx = (modes.indexOf(settings.colorMode) + 1) % modes.length;
        onSettingsChange({ colorMode: modes[nextIdx] });
    };

    return (
        <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4 border-t border-t-cyan-500/30">

            {/* Settings Group */}
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-black/40 rounded-lg border border-white/5">
                    <Settings2 size={16} className="text-gray-400" />
                    <span className="text-xs font-mono text-gray-400 mr-2 uppercase">Display Options</span>

                    {/* Thresholds Toggle */}
                    <button
                        onClick={() => onSettingsChange({ showThresholds: !settings.showThresholds })}
                        className={cn(
                            "px-3 py-1 text-xs rounded transition-all flex items-center gap-1.5",
                            settings.showThresholds
                                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50"
                                : "bg-white/5 text-gray-500 border border-white/10 hover:bg-white/10"
                        )}
                        title="Toggle Guide Rings / Thresholds"
                    >
                        <Target size={14} />
                        Guides {settings.showThresholds ? 'ON' : 'OFF'}
                    </button>

                    {/* Color Mode Toggle */}
                    <div className="flex items-center gap-1.5 ml-2">
                        <button
                            onClick={cycleColorMode}
                            className="px-3 py-1 text-xs rounded transition-all bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 flex items-center gap-1.5 min-w-[120px]"
                            title="Cycle Color Modes"
                        >
                            <Palette size={14} className={
                                settings.colorMode === 'multi' ? 'text-pink-400' :
                                    settings.colorMode === 'custom' ? 'text-[var(--customColor)]' : 'text-gray-400'
                            } />
                            Mode: <span className="capitalize font-bold">{settings.colorMode}</span>
                        </button>

                        {/* Custom Color Picker (only shows if custom mode is active) */}
                        {settings.colorMode === 'custom' && (
                            <input
                                type="color"
                                value={settings.customColor}
                                onChange={(e) => onSettingsChange({ customColor: e.target.value })}
                                className="w-7 h-7 p-0 border-0 rounded cursor-pointer bg-transparent"
                                title="Select Custom Glow Color"
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Import / Export Group */}
            <div className="flex items-center gap-3">
                <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />
                <button
                    onClick={onRecenter}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-pink-400 bg-pink-900/30 border border-pink-500/50 rounded-lg hover:bg-pink-900/50 transition-all font-semibold shadow-[0_0_10px_rgba(255,0,127,0.2)]"
                    title="Recalibrate and Center View"
                >
                    <Target size={16} />
                    <span className="hidden sm:inline">Recalibrate View</span>
                </button>
                <div className="w-px h-6 bg-white/10 mx-1"></div>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                >
                    <Upload size={16} />
                    Import JSON
                </button>

                <button
                    onClick={onExport}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-cyan-400 bg-cyan-900/30 border border-cyan-500/50 rounded-lg hover:bg-cyan-900/50 shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-all"
                >
                    <Download size={16} />
                    Export JSON
                </button>
            </div>
        </div>
    );
};
