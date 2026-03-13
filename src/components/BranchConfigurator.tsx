import React from 'react';
import { BranchData } from '../types';
import { BranchItem } from './BranchItem';
import { Plus } from 'lucide-react';

interface BranchConfiguratorProps {
  branches: BranchData[];
  onChange: (id: string, updates: Partial<BranchData>) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}

export const BranchConfigurator: React.FC<BranchConfiguratorProps> = ({ 
  branches, 
  onChange, 
  onRemove, 
  onAdd 
}) => {
  // Check if we can add a new branch: all current branches must have a name
  const canAddBranch = branches.every(b => b.name.trim().length > 0);

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-2rem)] overflow-y-auto pr-2 custom-scrollbar">
      <div className="mb-6">
        <h2 className="text-2xl font-bold neon-text-cyan flex items-center gap-2 mb-2">
          <div className="w-2 h-6 bg-cyan-400 rounded-sm"></div>
          Configuration
        </h2>
        <p className="text-gray-400 text-sm">
          Define your radar chart branches below. The first 3 branches map out the core shape and cannot be deleted.
        </p>
      </div>

      <div className="flex-1">
        {branches.map((branch, idx) => (
          <BranchItem 
            key={branch.id} 
            index={idx}
            branch={branch} 
            onChange={onChange} 
            onRemove={onRemove} 
          />
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-white/10 sticky bottom-0 bg-[var(--background)] pb-4">
        <button
          onClick={onAdd}
          disabled={!canAddBranch}
          className="neon-button w-full flex items-center justify-center gap-2 py-3"
        >
          <Plus size={18} />
          {canAddBranch ? "Add New Branch" : "Name all branches to add a new one"}
        </button>
      </div>
    </div>
  );
};
