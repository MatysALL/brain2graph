"use client";

import { useState } from 'react';
import { BranchData, DisplaySettings, ConfigurationData } from '@/types';
import { BranchConfigurator } from '@/components/BranchConfigurator';
import { RadarVisualizer } from '@/components/RadarVisualizer';
import { Toolbar } from '@/components/Toolbar';
import { arrayMove } from '@dnd-kit/sortable';

const generateId = () => Math.random().toString(36).substring(2, 9);

const DEFAULT_BRANCHES: BranchData[] = [
  { id: generateId(), name: 'Intelligence', min: 0, max: 100, value: 75, color: '#00f0ff', isDeletable: false },
  { id: generateId(), name: 'Strength', min: 0, max: 100, value: 40, color: '#ff007f', isDeletable: false },
  { id: generateId(), name: 'Agility', min: 0, max: 100, value: 85, color: '#b026ff', isDeletable: false },
];

const DEFAULT_SETTINGS: DisplaySettings = {
  showThresholds: true,
  colorMode: 'multi',
  customColor: '#00f0ff'
};

export default function Home() {
  const [branches, setBranches] = useState<BranchData[]>(DEFAULT_BRANCHES);
  const [settings, setSettings] = useState<DisplaySettings>(DEFAULT_SETTINGS);

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

  const handleBranchReorder = (activeId: string, overId: string) => {
    setBranches((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === activeId);
      const newIndex = prev.findIndex((item) => item.id === overId);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleSettingsChange = (updates: Partial<DisplaySettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const handleImport = (config: ConfigurationData) => {
    // Generate new IDs so we don't accidentally conflict with React keys natively
    const formattedBranches = config.branches.map((b, idx) => ({
      ...b,
      id: generateId(),
      isDeletable: idx >= 3 // enforce the first 3 rule on incoming files
    }));

    setBranches(formattedBranches);
    if (config.displaySettings) {
      setSettings(config.displaySettings);
    }
  };

  const handleExport = () => {
    const configToExport: ConfigurationData = {
      version: "1.0",
      branches: branches.map(({ id, isDeletable, ...rest }) => ({
        ...rest,
        id: "", // Strip internal React state properties
      })) as BranchData[],
      displaySettings: settings
    };

    const blob = new Blob([JSON.stringify(configToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `radar-config-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Scroll to a specific branch config when clicked from the radar
  const handleLabelClick = (branchId: string) => {
    // For a real app we might attach refs to the SortableBranchItem but as a quick fix
    // we can iterate through the DOM or just trigger an expansion. 
    // Here we alert or focus to demonstrate the flow.
    console.log("Scroll request for branch ID:", branchId);
  };

  return (
    <main className="h-screen w-screen overflow-hidden flex flex-col bg-[var(--background)]">

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col xl:flex-row overflow-hidden relative">

        {/* Configuration Panel - Left Side */}
        <section className="w-full xl:w-[450px] shrink-0 border-r border-white/10 bg-[var(--color-panel)] flex flex-col relative z-20 shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
          <div className="flex-1 h-full p-6 pb-0 overflow-y-auto custom-scrollbar">
            <BranchConfigurator
              branches={branches}
              onChange={handleBranchChange}
              onRemove={handleBranchRemove}
              onAdd={handleBranchAdd}
              onReorder={handleBranchReorder}
            />
          </div>
        </section>

        {/* Visualizer Panel - Right Side */}
        <section className="flex-1 min-h-[50vh] xl:h-full relative z-0 flex flex-col bg-black/20">
          <div className="absolute top-4 right-6 z-10 pointer-events-none text-right">
            <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase neon-text-cyan flex items-center justify-end drop-shadow-[0_0_15px_rgba(0,240,255,0.4)]">
              <div>
                Radar<span className="text-pink-500 neon-text-pink">Gen</span>
              </div>
            </h1>
            <p className="text-gray-400 font-mono text-xs mt-1">SYS.VER // v3.0.0-SPA</p>
          </div>
          <RadarVisualizer
            branches={branches}
            settings={settings}
            onLabelClick={handleLabelClick}
            onRemove={handleBranchRemove}
          />
        </section>
      </div>

      {/* Global Bottom Toolbar */}
      <div className="shrink-0 z-[100] bg-black/90 backdrop-blur-xl border-t border-cyan-500/30 relative shadow-[0_-5px_30px_rgba(0,0,0,0.8)]">
        <Toolbar
          settings={settings}
          branches={branches}
          onSettingsChange={handleSettingsChange}
          onImport={handleImport}
          onExport={handleExport}
        />
      </div>

    </main>
  );
}
