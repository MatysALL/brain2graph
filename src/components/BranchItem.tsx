import React, { useState, useRef, useEffect, useCallback } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Trash2, ChevronDown } from 'lucide-react';
import { BranchData } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BranchItemProps {
  branch: BranchData;
  onChange: (id: string, updates: Partial<BranchData>) => void;
  onRemove: (id: string) => void;
  index: number;
}

export const BranchItem: React.FC<BranchItemProps> = ({ branch, onChange, onRemove, index }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Local state for visually fast response, without triggering global rerenders
  const [tempColor, setTempColor] = useState(branch.color);

  // Sync tempColor if branch.color changes externally
  useEffect(() => {
    setTempColor(branch.color);
  }, [branch.color]);

  const commitColor = useCallback(() => {
    onChange(branch.id, { color: tempColor });
  }, [branch.id, tempColor, onChange]);

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
    <div className="glass-panel p-4 mb-4 relative transition-all hover:bg-[var(--color-panel-hover)]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white/5 text-xs text-cyan-400 font-bold border border-cyan-400/30">
            {index + 1}
          </div>
          <h3 className="font-semibold text-gray-200">Compétence</h3>
        </div>
        <button
          onClick={() => onRemove(branch.id)}
          disabled={!branch.isDeletable}
          className="text-gray-400 hover:text-pink-500 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
          title={!branch.isDeletable ? "La compétence ne peut pas être supprimée" : "Supprimer"}
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name Input */}
        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-xs text-gray-400 uppercase tracking-wider">Nom</label>
          <input
            type="text"
            value={branch.name}
            onChange={(e) => onChange(branch.id, { name: e.target.value })}
            placeholder="ex. Intelligence"
            className={cn("glass-input w-full", !branch.name && "border-pink-500/50 focus:border-pink-500 ring-pink-500/20")}
          />
        </div>

        {/* Value Inputs */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 uppercase tracking-wider">Valeur</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={branch.value}
              onChange={(e) => onChange(branch.id, { value: Number(e.target.value) })}
              className="glass-input w-full"
            />
          </div>
        </div>

        {/* Min/Max Inputs */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 uppercase tracking-wider">Min / Max</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={branch.min}
              onChange={(e) => onChange(branch.id, { min: Number(e.target.value) })}
              className="glass-input w-1/2"
              placeholder="Min"
            />
            <span className="text-gray-500">/</span>
            <input
              type="number"
              value={branch.max}
              onChange={(e) => onChange(branch.id, { max: Number(e.target.value) })}
              className="glass-input w-1/2"
              placeholder="Max"
            />
          </div>
        </div>

        {/* Color Picker Toggle */}
        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-xs text-gray-400 uppercase tracking-wider">Couleur du graphique</label>
          <div className="relative" ref={colorPickerRef}>
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="glass-input w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full border border-white/20 shadow-sm transition-colors duration-100"
                  style={{ backgroundColor: tempColor }}
                />
                <span className="text-sm font-mono">{tempColor}</span>
              </div>
              <ChevronDown size={16} className="text-gray-400" />
            </button>

            {showColorPicker && (
              <div
                className="absolute top-full left-0 mt-2 z-50 glass-panel p-3"
                onMouseUp={commitColor}
                onTouchEnd={commitColor}
              >
                <HexColorPicker
                  color={tempColor}
                  onChange={setTempColor}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
