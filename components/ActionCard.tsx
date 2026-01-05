
import React from 'react';
import { AIAction } from '../types';

interface ActionCardProps {
  action: AIAction;
  onSelect: (action: AIAction) => void;
  disabled: boolean;
  onDelete?: (id: string) => void;
}

const ActionCard: React.FC<ActionCardProps> = ({ action, onSelect, disabled, onDelete }) => {
  return (
    <div className="relative group">
      <button
        onClick={() => onSelect(action)}
        disabled={disabled}
        className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500 hover:ring-4 hover:ring-indigo-50 dark:hover:ring-indigo-900/20 transition-all group disabled:opacity-50 shadow-sm"
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl group-hover:scale-110 transition-transform">{action.icon}</span>
          <div className="flex-1 pr-6 overflow-hidden">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">{action.label}</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{action.description}</p>
          </div>
        </div>
      </button>
      
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(action.id);
          }}
          className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Delete Format"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ActionCard;
