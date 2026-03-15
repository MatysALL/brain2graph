import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { BranchData } from '../types';
import { SortableBranchItem } from './SortableBranchItem';
import { Plus } from 'lucide-react';

interface BranchConfiguratorProps {
  branches: BranchData[];
  onChange: (id: string, updates: Partial<BranchData>) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  onReorder: (activeId: string, overId: string) => void;
}

export const BranchConfigurator: React.FC<BranchConfiguratorProps> = ({
  branches,
  onChange,
  onRemove,
  onAdd,
  onReorder
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(active.id as string, over.id as string);
    }
  };

  const canAddBranch = branches.every(b => b.name.trim().length > 0);

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-2rem)] overflow-hidden">
      <div className="mb-6 flex-shrink-0">
        <h2 className="text-2xl font-bold neon-text-cyan flex items-center gap-2 mb-2">
          <div className="w-2 h-6 bg-cyan-400 rounded-sm"></div>
          Configuration
        </h2>
        <p className="text-gray-400 text-sm">
          Drag handles to reorder branches. Click an item to expand settings.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={branches.map(b => b.id)}
            strategy={verticalListSortingStrategy}
          >
            {branches.map((branch, idx) => (
              <SortableBranchItem
                key={branch.id}
                index={idx}
                branch={branch}
                onChange={onChange}
                onRemove={onRemove}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <div className="mt-4 pt-4 flex-shrink-0 bg-transparent pb-4 px-1 overflow-hidden rounded-md border-t border-white/10">
        <button
          onClick={onAdd}
          disabled={!canAddBranch}
          className="neon-button m-0 p-0"
          style={{ 
            backgroundColor: 'transparent', 
            display: 'block', 
            width: '100%', 
            boxSizing: 'border-box', 
            boxShadow: 'none',
            border: '1px solid rgba(0, 240, 255, 0.4)' // Keep border strictly native, discard local neon bleeding
          }}
        >
          <div className="w-full h-12 flex flex-row items-center justify-center gap-2 pointer-events-none">
            <Plus size={18} />
            <span>{canAddBranch ? "Add New Branch" : "Name all branches to add a new one"}</span>
          </div>
        </button>
      </div>
    </div>
  );
};
