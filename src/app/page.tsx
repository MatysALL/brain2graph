"use client";

import { useState } from 'react';
import { BranchData } from '@/types';
import { BranchConfigurator } from '@/components/BranchConfigurator';
import { RadarVisualizer } from '@/components/RadarVisualizer';


const generateId = () => Math.random().toString(36).substring(2, 9);

const DEFAULT_BRANCHES: BranchData[] = [
  { id: generateId(), name: 'Intelligence', min: 0, max: 100, value: 75, color: '#00f0ff', isDeletable: false },
  { id: generateId(), name: 'Strength', min: 0, max: 100, value: 40, color: '#ff007f', isDeletable: false },
  { id: generateId(), name: 'Agility', min: 0, max: 100, value: 85, color: '#b026ff', isDeletable: false },
];

export default function Home() {
  const [branches, setBranches] = useState<BranchData[]>(DEFAULT_BRANCHES);

  const handleBranchChange = (id: string, updates: Partial<BranchData>) => {
    setBranches(prev => 
      prev.map(branch => branch.id === id ? { ...branch, ...updates } : branch)
    );
  };

  const handleBranchRemove = (id: string) => {
    setBranches(prev => prev.filter(branch => branch.id !== id));
  };

  const handleBranchAdd = () => {
    const newBranch: BranchData = {
      id: generateId(),
      name: `Branch ${branches.length + 1}`,
      min: 0,
      max: 100,
      value: 50,
      color: '#ffffff',
      isDeletable: true,
    };
    setBranches(prev => [...prev, newBranch]);
  };

  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col xl:flex-row gap-8">
      
      {/* Configuration Panel - Left Side */}
      <section className="w-full xl:w-1/3 flex flex-col gap-6 order-2 xl:order-1">
        <div className="glass-panel p-6 shadow-[0_0_30px_rgba(0,240,255,0.1)] border-t border-t-cyan-500/30">
          <div className="mb-4">
            <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase neon-text-cyan">
              Radar<span className="text-pink-500 neon-text-pink">Gen</span>
            </h1>
            <p className="text-gray-400 font-mono text-xs mt-1">SYS.VER // v1.0.0-SPA</p>
          </div>
          
          <div className="h-[calc(100vh-250px)] min-h-[500px]">
            <BranchConfigurator 
              branches={branches}
              onChange={handleBranchChange}
              onRemove={handleBranchRemove}
              onAdd={handleBranchAdd}
            />
          </div>
        </div>
      </section>

      {/* Visualizer Panel - Right Side */}
      <section className="w-full xl:w-2/3 h-[500px] xl:h-[calc(100vh-4rem)] order-1 xl:order-2 flex flex-col">
        <RadarVisualizer branches={branches} />
        
        {/* Helper footer text */}
        <div className="mt-4 text-center text-xs font-mono text-gray-500 flex justify-center gap-6">
          <span>[ZOOM: AUTO-SCALE]</span>
          <span>[REACTIVE: ACTIVE]</span>
          <span>[THEME: NEON-DARK]</span>
        </div>
      </section>
      
    </main>
  );
}
