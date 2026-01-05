
import React from 'react';

interface ToolbarProps {
  onClear: () => void;
  onCopy: () => void;
  onCopyRichText: () => void;
  onDownload: () => void;
  onExportPDF: () => void;
  isProcessing: boolean;
  hasOutput: boolean;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  onClear, 
  onCopy, 
  onCopyRichText, 
  onDownload, 
  onExportPDF,
  isProcessing,
  hasOutput,
  darkMode,
  toggleDarkMode
}) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 no-print">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
            M
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">DocuMint <span className="text-indigo-600">AI</span></h1>
        </div>
        
        <nav className="hidden md:flex items-center gap-4 border-l border-slate-100 dark:border-slate-800 pl-6 ml-2">
          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
            title="Toggle Dark Mode"
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4-9H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.243 17.657l.707.707M7.757 6.343l.707.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </nav>
      </div>
      
      <div className="flex items-center gap-2 toolbar-actions">
        <button
          onClick={onClear}
          disabled={isProcessing}
          className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors disabled:opacity-30"
        >
          Clear
        </button>
        
        <div className="h-4 w-px bg-slate-100 dark:bg-slate-800 mx-2"></div>

        <button
          onClick={onCopy}
          disabled={isProcessing || !hasOutput}
          className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm disabled:opacity-30"
        >
          Copy MD
        </button>
        
        <button
          onClick={onCopyRichText}
          disabled={isProcessing || !hasOutput}
          className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-slate-900 text-white rounded-lg hover:bg-black dark:bg-indigo-600 dark:hover:bg-indigo-700 transition-all shadow-md active:scale-[0.98] disabled:opacity-30 flex items-center gap-2"
        >
          <span>✨</span> Copy Rich
        </button>

        <div className="flex gap-1">
          <button
            onClick={onDownload}
            disabled={isProcessing || !hasOutput}
            className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:border-indigo-300 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm disabled:opacity-30"
            title="Download Markdown"
          >
            .MD
          </button>
          <button
            onClick={onExportPDF}
            disabled={isProcessing || !hasOutput}
            className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:border-emerald-300 dark:hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shadow-sm disabled:opacity-30"
            title="Export as PDF"
          >
            PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
