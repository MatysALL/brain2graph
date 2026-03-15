import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { HexColorPicker } from 'react-colorful';
import { Trash2, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import { BranchData } from '../types';
import { cn } from '../utils'; // Assumes utils.ts has the cn function

interface SortableBranchItemProps {
    branch: BranchData;
    onChange: (id: string, updates: Partial<BranchData>) => void;
    onRemove: (id: string) => void;
    index: number;
}

export const SortableBranchItem: React.FC<SortableBranchItemProps> = ({
    branch,
    onChange,
    onRemove,
    index
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const colorPickerRef = useRef<HTMLDivElement>(null);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: branch.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: showColorPicker ? 100 : (isDragging ? 10 : 1),
    };

    // Close color picker when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
                setShowColorPicker(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "glass-panel mb-4 relative transition-all bg-[var(--color-panel)]",
                isDragging && "opacity-50 ring-2 ring-cyan-400 scale-105 shadow-2xl z-50",
                !isDragging && "hover:bg-[var(--color-panel-hover)]"
            )}
        >
            {/* Header - Always visible */}
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                    {/* Drag Handle */}
                    <button
                        {...attributes}
                        {...listeners}
                        className="text-gray-500 hover:text-white cursor-grab active:cursor-grabbing p-1 -ml-2"
                    >
                        <GripVertical size={18} />
                    </button>

                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-2 hover:text-cyan-400 transition-colors"
                    >
                        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white/5 text-xs text-cyan-400 font-bold border border-cyan-400/30">
                            {index + 1}
                        </div>
                        <h3 className={cn(
                            "font-semibold",
                            branch.name ? "text-gray-200" : "text-gray-500 italic"
                        )}>
                            {branch.name || "Unnamed Branch"}
                        </h3>
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                </div>

                <button
                    onClick={() => onRemove(branch.id)}
                    disabled={!branch.isDeletable}
                    className="text-gray-400 hover:text-pink-500 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
                    title={!branch.isDeletable ? "Core branches cannot be removed" : "Remove branch"}
                >
                    <Trash2 size={18} />
                </button>
            </div>

            {/* Expanded Content - Forms */}
            <div className={cn(
                "grid grid-cols-1 md:grid-cols-2 gap-4 px-4 pb-4 border-t border-white/5 pt-4 transition-all duration-300 origin-top",
                isExpanded ? "block opacity-100 scale-y-100" : "hidden opacity-0 scale-y-0 h-0 p-0 m-0 border-none"
            )}>
                {/* Name Input */}
                <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-xs text-gray-400 uppercase tracking-wider">Name</label>
                    <input
                        type="text"
                        value={branch.name}
                        onChange={(e) => onChange(branch.id, { name: e.target.value })}
                        placeholder="e.g., Intelligence"
                        className={cn("glass-input w-full", !branch.name && "border-pink-500/50 focus:border-pink-500 ring-pink-500/20")}
                    />
                </div>

                {/* Value, Min, Max - Inline */}
                <div className="flex flex-row items-center gap-3 w-full md:col-span-2">
                    <div className="flex flex-col gap-1 w-1/3">
                        <label className="text-xs text-cyan-400 uppercase tracking-wider font-bold">Value</label>
                        <input
                            type="number"
                            value={branch.value}
                            onChange={(e) => onChange(branch.id, { value: Number(e.target.value) })}
                            className="glass-input w-full font-bold text-cyan-400 border-cyan-400/50"
                        />
                    </div>
                    <div className="flex flex-col gap-1 w-1/3">
                        <label className="text-xs text-gray-400 uppercase tracking-wider">Min</label>
                        <input
                            type="number"
                            value={branch.min}
                            onChange={(e) => onChange(branch.id, { min: Number(e.target.value) })}
                            className="glass-input w-full"
                        />
                    </div>
                    <div className="flex flex-col gap-1 w-1/3">
                        <label className="text-xs text-gray-400 uppercase tracking-wider">Max</label>
                        <input
                            type="number"
                            value={branch.max}
                            onChange={(e) => onChange(branch.id, { max: Number(e.target.value) })}
                            className="glass-input w-full"
                        />
                    </div>
                </div>

                {/* Description Textarea */}
                <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-xs text-gray-400 uppercase tracking-wider">Description</label>
                    <textarea
                        value={branch.description || ''}
                        onChange={(e) => onChange(branch.id, { description: e.target.value })}
                        maxLength={500}
                        placeholder="Add details about this metric..."
                        className="glass-input w-full min-h-[60px] resize-y custom-scrollbar"
                    />
                    <div className="text-[10px] text-gray-500 text-right">
                        {(branch.description || '').length} / 500
                    </div>
                </div>

                {/* Color Picker Toggle */}
                <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-xs text-gray-400 uppercase tracking-wider">Chart Color Accent</label>
                    <div className="relative" ref={colorPickerRef}>
                        <button
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            className="glass-input w-full flex items-center justify-between"
                        >
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                                    style={{ backgroundColor: branch.color }}
                                />
                                <span className="text-sm font-mono">{branch.color}</span>
                            </div>
                            <ChevronDown size={16} className="text-gray-400" />
                        </button>

                        {showColorPicker && (
                            <div className="absolute top-full left-0 mt-2 z-50 glass-panel p-3">
                                <HexColorPicker
                                    color={branch.color}
                                    onChange={(color) => {
                                        onChange(branch.id, { color });
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
