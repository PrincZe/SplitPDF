'use client';

import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';
import { Plus, X, FileText, Folder, Edit2, Check, AlertCircle, GripVertical } from 'lucide-react';

interface PageGroup {
  id: string;
  name: string;
  pages: number[];
  color: string;
}

interface PageGroupingProps {
  totalPages: number;
  selectedPages: Set<number>;
  onGroupsChange: (groups: PageGroup[]) => void;
}

const groupColors = [
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-green-100 border-green-300 text-green-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-orange-100 border-orange-300 text-orange-800',
  'bg-pink-100 border-pink-300 text-pink-800',
  'bg-cyan-100 border-cyan-300 text-cyan-800',
];

export default function PageGrouping({ totalPages, selectedPages, onGroupsChange }: PageGroupingProps) {
  const [groups, setGroups] = useState<PageGroup[]>([]);
  const [unassignedPages, setUnassignedPages] = useState<number[]>(() => 
    Array.from(selectedPages).sort((a, b) => a - b)
  );
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Update unassigned pages when selectedPages changes
  React.useEffect(() => {
    const allAssignedPages = new Set(groups.flatMap(group => group.pages));
    const newUnassigned = Array.from(selectedPages).filter(page => !allAssignedPages.has(page));
    setUnassignedPages(newUnassigned.sort((a, b) => a - b));
  }, [selectedPages, groups]);

  // Notify parent of changes
  React.useEffect(() => {
    onGroupsChange(groups);
  }, [groups, onGroupsChange]);

  const addNewGroup = () => {
    const newGroup: PageGroup = {
      id: `group-${Date.now()}`,
      name: `Group ${groups.length + 1}`,
      pages: [],
      color: groupColors[groups.length % groupColors.length],
    };
    setGroups(prev => [...prev, newGroup]);
  };

  const removeGroup = (groupId: string) => {
    setGroups(prev => {
      const groupToRemove = prev.find(g => g.id === groupId);
      if (groupToRemove) {
        // Move pages back to unassigned
        setUnassignedPages(current => [...current, ...groupToRemove.pages].sort((a, b) => a - b));
      }
      return prev.filter(g => g.id !== groupId);
    });
  };

  const startEditingGroup = (groupId: string, currentName: string) => {
    setEditingGroupId(groupId);
    setEditingName(currentName);
  };

  const saveGroupName = () => {
    if (editingGroupId && editingName.trim()) {
      setGroups(prev => prev.map(group => 
        group.id === editingGroupId 
          ? { ...group, name: editingName.trim() }
          : group
      ));
    }
    setEditingGroupId(null);
    setEditingName('');
  };

  const cancelEditingGroup = () => {
    setEditingGroupId(null);
    setEditingName('');
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const pageNumber = parseInt((active.id as string).replace('page-', ''));
    const overId = over.id as string;

    // Determine source
    let sourceType: 'unassigned' | 'group' = 'unassigned';
    let sourceGroupId = '';
    
    if (unassignedPages.includes(pageNumber)) {
      sourceType = 'unassigned';
    } else {
      const sourceGroup = groups.find(group => group.pages.includes(pageNumber));
      if (sourceGroup) {
        sourceType = 'group';
        sourceGroupId = sourceGroup.id;
      }
    }

    // Determine destination
    let destType: 'unassigned' | 'group' = 'unassigned';
    let destGroupId = '';

    if (overId === 'unassigned-droppable') {
      destType = 'unassigned';
    } else if (overId.startsWith('group-')) {
      destType = 'group';
      destGroupId = overId;
    }

    // Skip if dropping in the same place
    if (sourceType === destType && sourceGroupId === destGroupId) return;

    // Remove from source
    if (sourceType === 'unassigned') {
      setUnassignedPages(prev => prev.filter(page => page !== pageNumber));
    } else {
      setGroups(prev => prev.map(group => 
        group.id === sourceGroupId
          ? { ...group, pages: group.pages.filter(page => page !== pageNumber) }
          : group
      ));
    }

    // Add to destination
    if (destType === 'unassigned') {
      setUnassignedPages(prev => [...prev, pageNumber].sort((a, b) => a - b));
    } else {
      setGroups(prev => prev.map(group => 
        group.id === destGroupId
          ? { ...group, pages: [...group.pages, pageNumber].sort((a, b) => a - b) }
          : group
      ));
    }
  };

  const SortablePageItem = ({ pageNumber }: { pageNumber: number }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: `page-${pageNumber}` });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`
          flex items-center gap-2 p-2 bg-white border border-gray-200 rounded shadow-sm cursor-move
          ${isDragging ? 'shadow-lg opacity-50' : 'hover:shadow-md'}
          transition-all duration-200
        `}
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
        <FileText className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium">Page {pageNumber}</span>
      </div>
    );
  };

  const PageItem = ({ pageNumber }: { pageNumber: number }) => (
    <div className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded shadow-sm">
      <FileText className="w-4 h-4 text-gray-500" />
      <span className="text-sm font-medium">Page {pageNumber}</span>
    </div>
  );

  const DroppableArea = ({ 
    id, 
    children, 
    className 
  }: { 
    id: string; 
    children: React.ReactNode; 
    className?: string; 
  }) => {
    const { isOver, setNodeRef } = useDroppable({ id });

    return (
      <div
        ref={setNodeRef}
        className={`${className} ${isOver ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
      >
        {children}
      </div>
    );
  };

  if (selectedPages.size === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Folder className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Select pages to organize them into groups</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Organize Pages</h3>
          <p className="text-sm text-gray-600">Drag pages into groups to create multiple PDF files</p>
        </div>
        <button
          onClick={addNewGroup}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Group
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Unassigned Pages */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Available Pages ({unassignedPages.length})
            </h4>
            <DroppableArea 
              id="unassigned-droppable"
              className="min-h-[200px] p-4 border-2 border-dashed rounded-lg space-y-2 border-gray-300 bg-gray-50 transition-colors duration-200"
            >
              <SortableContext items={unassignedPages.map(p => `page-${p}`)} strategy={verticalListSortingStrategy}>
                {unassignedPages.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FileText className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">All pages are organized</p>
                  </div>
                ) : (
                  unassignedPages.map((pageNumber) => (
                    <SortablePageItem key={pageNumber} pageNumber={pageNumber} />
                  ))
                )}
              </SortableContext>
            </DroppableArea>
          </div>

          {/* Groups */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700 flex items-center gap-2">
              <Folder className="w-4 h-4" />
              Output Groups ({groups.length})
            </h4>
            
            {groups.length === 0 ? (
              <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
                <Folder className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Click "Add Group" to create your first group</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {groups.map((group) => (
                  <div key={group.id} className={`border-2 rounded-lg ${group.color}`}>
                    {/* Group Header */}
                    <div className="flex items-center justify-between p-3 border-b border-current border-opacity-20">
                      {editingGroupId === group.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm bg-white border border-gray-300 rounded"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveGroupName();
                              if (e.key === 'Escape') cancelEditingGroup();
                            }}
                          />
                          <button
                            onClick={saveGroupName}
                            className="p-1 text-green-600 hover:text-green-700"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEditingGroup}
                            className="p-1 text-gray-500 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{group.name}</span>
                            <span className="text-sm opacity-75">({group.pages.length} pages)</span>
                            <button
                              onClick={() => startEditingGroup(group.id, group.name)}
                              className="p-1 opacity-60 hover:opacity-100"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeGroup(group.id)}
                            className="p-1 text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Group Content */}
                    <DroppableArea 
                      id={group.id}
                      className="min-h-[120px] p-3 space-y-2 transition-colors duration-200"
                    >
                      <SortableContext items={group.pages.map(p => `page-${p}`)} strategy={verticalListSortingStrategy}>
                        {group.pages.length === 0 ? (
                          <div className="text-center py-4 opacity-60">
                            <FileText className="w-6 h-6 mx-auto mb-1" />
                            <p className="text-xs">Drag pages here</p>
                          </div>
                        ) : (
                          group.pages.map((pageNumber) => (
                            <SortablePageItem key={pageNumber} pageNumber={pageNumber} />
                          ))
                        )}
                      </SortableContext>
                    </DroppableArea>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeId ? (
            <PageItem pageNumber={parseInt(activeId.replace('page-', ''))} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Summary */}
      {groups.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800">Output Summary</h4>
              <p className="text-sm text-blue-700 mt-1">
                Will create {groups.length} PDF file{groups.length !== 1 ? 's' : ''}:
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                {groups.map(group => (
                  <li key={group.id}>
                    • <strong>{group.name}</strong> - {group.pages.length} page{group.pages.length !== 1 ? 's' : ''}
                    {group.pages.length > 0 && (
                      <span className="ml-2 opacity-75">
                        (Pages: {group.pages.join(', ')})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
