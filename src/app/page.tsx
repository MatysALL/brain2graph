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
    <main className="min-h-screen flex flex-col relative pb-20 md:pb-0">

      <div className="flex-1 p-4 md:p-8 flex flex-col xl:flex-row gap-8">
        {/* Configuration Panel - Left Side */}
        <section className="w-full xl:w-1/3 flex flex-col gap-6 order-2 xl:order-1 relative z-10">
          <div className="glass-panel p-6 shadow-[0_0_30px_rgba(0,240,255,0.1)] border-t border-t-cyan-500/30 flex flex-col h-full">
            <div className="mb-4">
              <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase neon-text-cyan flex items-center justify-between">
                <div>
                  Radar<span className="text-pink-500 neon-text-pink">Gen</span>
                </div>
              </h1>
              <p className="text-gray-400 font-mono text-xs mt-1">SYS.VER // v2.0.0-SPA</p>
            </div>

            <div className="flex-1 min-h-[500px]">
              <BranchConfigurator
                branches={branches}
                onChange={handleBranchChange}
                onRemove={handleBranchRemove}
                onAdd={handleBranchAdd}
                onReorder={handleBranchReorder}
              />
            </div>
          </div>
        </section>

        {/* Visualizer Panel - Right Side */}
        <section className="w-full xl:w-2/3 h-[500px] xl:h-[calc(100vh-6rem)] order-1 xl:order-2 flex flex-col relative z-0">
          <RadarVisualizer
            branches={branches}
            settings={settings}
            onLabelClick={handleLabelClick}
            onRemove={handleBranchRemove}
          />
        </section>
      </div>

      {/* Global Bottom Toolbar */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
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
