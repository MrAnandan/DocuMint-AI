import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import Toolbar from './components/Toolbar';
import ActionCard from './components/ActionCard';
import { AI_ACTIONS } from './constants';
import { AIAction } from './types';
import { formatDocument } from './services/geminiService';

// Access 'marked' from the window object as it's loaded via CDN in index.html
declare const marked: {
  parse: (md: string) => string;
};

const App: React.FC = () => {
  // Theme state
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('documint_theme') === 'dark' || 
      (!localStorage.getItem('documint_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Typography state
  const [fontMode, setFontMode] = useState<'sans' | 'serif'>(() => {
    return (localStorage.getItem('documint_font_mode') as 'sans' | 'serif') || 'sans';
  });

  // Draft loading
  const [input, setInput] = useState(() => localStorage.getItem('documint_draft_input') || '');
  const [customInstruction, setCustomInstruction] = useState(() => localStorage.getItem('documint_draft_instruction') || '');
  
  const [output, setOutput] = useState('');
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');
  const [inputViewMode, setInputViewMode] = useState<'preview' | 'edit'>('edit');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Custom Formats State
  const [customActions, setCustomActions] = useState<AIAction[]>(() => {
    const saved = localStorage.getItem('documint_custom_formats');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Custom Format Creator State
  const [isCreatingFormat, setIsCreatingFormat] = useState(false);
  const [newFormat, setNewFormat] = useState({
    label: '',
    icon: '✨',
    description: '',
    promptTemplate: ''
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Persistence - Drafts & Formats
  useEffect(() => {
    localStorage.setItem('documint_draft_input', input);
  }, [input]);

  useEffect(() => {
    localStorage.setItem('documint_draft_instruction', customInstruction);
  }, [customInstruction]);

  useEffect(() => {
    localStorage.setItem('documint_custom_formats', JSON.stringify(customActions));
    localStorage.setItem('documint_font_mode', fontMode);
  }, [customActions, fontMode]);

  // Theme effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('documint_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('documint_theme', 'light');
    }
  }, [darkMode]);

  // Input Stats
  const inputStats = useMemo(() => {
    const trimmed = input.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = input.length;
    const lines = input.split('\n').length;
    const bytes = new Blob([input]).size;
    const kb = (bytes / 1024).toFixed(2);
    
    return { words, chars, lines, kb };
  }, [input]);

  // Output Stats
  const outputStats = useMemo(() => {
    const trimmed = output.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    return { words };
  }, [output]);

  // Combined Actions
  const allActions = useMemo(() => {
    const customWithCat = customActions.map(a => ({ ...a, category: 'My Formats' as any }));
    return [...AI_ACTIONS, ...customWithCat];
  }, [customActions]);

  // Group actions by category
  const groupedActions = useMemo(() => {
    const order = ['My Formats', 'Branding'];
    const groups = allActions.reduce((acc, action) => {
      const category = action.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(action);
      return acc;
    }, {} as Record<string, AIAction[]>);

    return Object.keys(groups)
      .sort((a, b) => {
        const indexA = order.indexOf(a);
        const indexB = order.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      })
      .reduce((obj, key) => {
        obj[key] = groups[key];
        return obj;
      }, {} as Record<string, AIAction[]>);
  }, [allActions]);

  const handleClear = () => {
    setInput('');
    setOutput('');
    setCustomInstruction('');
    setError(null);
    setInputViewMode('edit');
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    triggerCopySuccess();
  };

  const triggerCopySuccess = () => {
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const parseMarkdown = useCallback((content: string) => {
    if (!content) return '';
    try {
      return marked.parse(content);
    } catch (e) {
      return `<p>${content}</p>`;
    }
  }, []);

  const handleCopyRichText = async () => {
    if (!output) return;
    try {
      const html = parseMarkdown(output);
      const fontStack = fontMode === 'serif' ? '"Times New Roman", Times, serif' : 'Inter, ui-sans-serif, system-ui';
      const styledHtml = `<div style="font-family: ${fontStack}; line-height: 1.6; color: ${darkMode ? '#e2e8f0' : '#333'};">${html}</div>`;
      const blobHtml = new Blob([styledHtml], { type: 'text/html' });
      const blobText = new Blob([output], { type: 'text/plain' });
      const data = [new ClipboardItem({ 'text/html': blobHtml, 'text/plain': blobText })];
      await navigator.clipboard.write(data);
      triggerCopySuccess();
    } catch (err) {
      console.error('Failed to copy rich text:', err);
      handleCopy();
    }
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `documint-${new Date().getTime()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    window.print();
  };

  const processResponse = (result: { text: string }) => {
    setOutput(result.text);
    setViewMode('preview');
  };

  const handleAction = async (action: AIAction) => {
    if (!input.trim()) {
      setError("Please enter some text first.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      // If action is Resume or formal, suggest serif
      if (action.id === 'resume-formatter' || action.id === 'formal-header') {
        setFontMode('serif');
      }

      const enrichedPrompt = `TASK: ${action.promptTemplate}\n\nSTRICT REQUIREMENT: Ensure high quality formatting. Use clear structure.`;
      const result = await formatDocument(input, enrichedPrompt);
      processResponse(result);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomAction = async () => {
    if (!input.trim()) {
      setError("Please enter some text first.");
      return;
    }
    if (!customInstruction.trim()) {
      setError("Please provide a formatting instruction.");
      return;
    }

    // Auto-detect serif requests
    if (customInstruction.toLowerCase().includes('times new roman') || customInstruction.toLowerCase().includes('serif')) {
      setFontMode('serif');
    }

    setIsProcessing(true);
    setError(null);
    try {
      const prompt = `Act as an expert document editor.
      PRIMARY INSTRUCTION: ${customInstruction}. 
      FINAL OUTPUT FORMAT: Markdown.`;
      const result = await formatDocument(input, prompt);
      processResponse(result);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveAsTemplate = () => {
    if (!customInstruction.trim()) return;
    setNewFormat({
      label: 'New Template',
      icon: '🪄',
      description: customInstruction.slice(0, 50) + (customInstruction.length > 50 ? '...' : ''),
      promptTemplate: customInstruction
    });
    setIsCreatingFormat(true);
  };

  const saveNewFormat = () => {
    if (!newFormat.label || !newFormat.promptTemplate) return;
    const action: AIAction = {
      ...newFormat,
      id: `custom-${Date.now()}`,
      category: 'My Formats'
    };
    setCustomActions(prev => [action, ...prev]);
    setIsCreatingFormat(false);
    setNewFormat({ label: '', icon: '✨', description: '', promptTemplate: '' });
  };

  const deleteCustomFormat = (id: string) => {
    setCustomActions(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 overflow-hidden transition-colors">
      <Toolbar 
        onClear={handleClear} 
        onCopy={handleCopy} 
        onCopyRichText={handleCopyRichText}
        onDownload={handleDownload} 
        onExportPDF={handleExportPDF}
        isProcessing={isProcessing}
        hasOutput={!!output}
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {copySuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-indigo-600 text-white px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest z-50 animate-bounce shadow-xl no-print">
          Copied to clipboard!
        </div>
      )}

      <main className="flex-1 flex flex-col md:flex-row h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-full md:w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col gap-8 overflow-y-auto hide-scrollbar shadow-[inset_-1px_0_0_0_#e2e8f0] dark:shadow-[inset_-1px_0_0_0_#1e293b] no-print">
          <div className="space-y-6">
            <div>
              <h2 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <span className="w-1 h-3 bg-indigo-500 rounded-full"></span>
                Refinement Tool
              </h2>
              <div className="space-y-3">
                <textarea
                  value={customInstruction}
                  onChange={(e) => setCustomInstruction(e.target.value)}
                  placeholder="Example: 'Format this as a resume using Times New Roman'..."
                  className="w-full p-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none h-24 resize-none text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-inner"
                  disabled={isProcessing}
                />
                <div className="grid grid-cols-5 gap-2">
                  <button
                    onClick={handleCustomAction}
                    disabled={isProcessing || !customInstruction.trim()}
                    className="col-span-4 py-3 px-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black dark:hover:bg-indigo-500 transition-all shadow-md active:scale-[0.98] disabled:opacity-30"
                  >
                    {isProcessing ? 'Optimizing...' : 'Apply Style ✨'}
                  </button>
                  <button
                    onClick={handleSaveAsTemplate}
                    disabled={isProcessing || !customInstruction.trim()}
                    className="py-3 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm disabled:opacity-30"
                    title="Save current prompt as a custom format"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
               {!isCreatingFormat ? (
                 <button 
                  onClick={() => setIsCreatingFormat(true)}
                  className="w-full py-3 px-4 bg-white dark:bg-slate-800 border border-dashed border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all"
                 >
                   + Create Custom Format
                 </button>
               ) : (
                 <div className="p-5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-widest">New Format</h3>
                      <button onClick={() => setIsCreatingFormat(false)} className="text-indigo-300 hover:text-indigo-600">✕</button>
                    </div>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Icon (e.g. 📄)"
                          value={newFormat.icon}
                          onChange={e => setNewFormat({...newFormat, icon: e.target.value})}
                          className="w-12 p-2 text-xs bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900 rounded-lg outline-none text-center"
                        />
                        <input 
                          type="text" 
                          placeholder="Format Name"
                          value={newFormat.label}
                          onChange={e => setNewFormat({...newFormat, label: e.target.value})}
                          className="flex-1 p-2 text-xs bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900 rounded-lg outline-none text-slate-800 dark:text-slate-200"
                        />
                      </div>
                      <textarea 
                        placeholder="AI Prompt Instructions"
                        value={newFormat.promptTemplate}
                        onChange={e => setNewFormat({...newFormat, promptTemplate: e.target.value})}
                        className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900 rounded-lg outline-none h-20 text-slate-800 dark:text-slate-200"
                      />
                      <button onClick={saveNewFormat} className="w-full py-2 bg-indigo-600 text-white text-[9px] font-bold rounded-lg uppercase tracking-widest hover:bg-indigo-700">Save Format</button>
                    </div>
                 </div>
               )}
            </div>
          </div>

          <div className="space-y-8 pb-8">
            {Object.entries(groupedActions).map(([category, actions]) => (
              <div key={category}>
                <h2 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <span className="w-1 h-3 bg-slate-200 dark:bg-slate-800 rounded-full"></span>
                  {category}
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  {actions.map(action => (
                    <ActionCard 
                      key={action.id} 
                      action={action} 
                      onSelect={handleAction}
                      disabled={isProcessing}
                      onDelete={category === 'My Formats' ? deleteCustomFormat : undefined}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Workspace */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white dark:bg-slate-950">
          {/* Input Panel */}
          <section className="flex-1 flex flex-col bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-800 min-w-0 input-panel no-print">
            <div className="flex items-center justify-between px-8 py-4 border-b border-slate-50 dark:border-slate-900">
               <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                   <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em]">Input Source</label>
                 </div>
                 
                 <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                    <button 
                      onClick={() => setInputViewMode('preview')}
                      className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-md transition-all ${inputViewMode === 'preview' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
                    >
                      Preview
                    </button>
                    <button 
                      onClick={() => setInputViewMode('edit')}
                      className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-md transition-all ${inputViewMode === 'edit' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
                    >
                      Edit
                    </button>
                 </div>
               </div>
               
               <div className="hidden lg:flex items-center gap-3">
                 <div className="text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-wider flex items-center gap-2">
                    <span title="Characters">{inputStats.chars} Chars</span>
                    <span>•</span>
                    <span title="Estimated Size">{inputStats.kb} KB</span>
                 </div>
                 <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded">
                   {inputStats.words} Words
                 </div>
               </div>
            </div>
            
            <div className="flex-1 overflow-hidden relative">
              {inputViewMode === 'edit' ? (
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Paste your document or notes here..."
                  className="w-full h-full p-8 resize-none border-none focus:ring-0 text-slate-800 dark:text-slate-100 text-[17px] leading-[1.8] outline-none bg-transparent"
                  disabled={isProcessing}
                />
              ) : (
                <div className="w-full h-full p-8 overflow-y-auto prose dark:prose-invert prose-slate max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: parseMarkdown(input) }} />
                </div>
              )}
            </div>
          </section>

          {/* Result Panel */}
          <section className="flex-1 flex flex-col bg-white dark:bg-slate-950 overflow-hidden relative border-l border-slate-50 dark:border-slate-900 min-w-0 result-panel">
             <div className="flex items-center justify-between px-8 py-4 border-b border-slate-50 dark:border-slate-900 sticky top-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md z-10 no-print">
               <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                   <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em]">Result</label>
                 </div>
                 
                 {output && (
                   <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                      <button 
                        onClick={() => setViewMode('preview')}
                        className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-md transition-all ${viewMode === 'preview' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
                      >
                        Preview
                      </button>
                      <button 
                        onClick={() => setViewMode('edit')}
                        className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-md transition-all ${viewMode === 'edit' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
                      >
                        Edit
                      </button>
                   </div>
                 )}
               </div>
               
               <div className="flex items-center gap-4">
                  {output && (
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                      <button 
                        onClick={() => setFontMode('sans')}
                        className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-md transition-all ${fontMode === 'sans' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
                        title="Sans-serif font (Inter)"
                      >
                        Sans
                      </button>
                      <button 
                        onClick={() => setFontMode('serif')}
                        className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-md transition-all ${fontMode === 'serif' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
                        title="Serif font (Times New Roman)"
                      >
                        Serif
                      </button>
                    </div>
                  )}

                 {output && (
                   <div className="text-[10px] font-semibold text-slate-300 dark:text-slate-600 uppercase tracking-widest bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded">
                     {outputStats.words} Words
                   </div>
                 )}
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 pb-32 hide-scrollbar">
              {isProcessing ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700">
                  <div className="w-20 h-20 mb-8 relative">
                    <div className="absolute inset-0 border-4 border-slate-50 dark:border-slate-900 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-indigo-400 animate-pulse">
                    Optimizing Output...
                  </p>
                </div>
              ) : error ? (
                <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 rounded-2xl text-red-600 dark:text-red-400 text-sm no-print">{error}</div>
              ) : output ? (
                <div className="animate-in fade-in duration-500">
                  {viewMode === 'preview' ? (
                    <article 
                      className={`prose dark:prose-invert prose-slate max-w-none prose-headings:font-bold prose-p:leading-[1.9] ${fontMode === 'serif' ? 'font-serif-mode' : ''}`}
                      dangerouslySetInnerHTML={{ __html: parseMarkdown(output) }}
                    />
                  ) : (
                    <textarea
                      value={output}
                      onChange={(e) => setOutput(e.target.value)}
                      className={`w-full h-[70vh] p-4 font-mono text-sm text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl focus:ring-0 resize-none outline-none leading-relaxed no-print ${fontMode === 'serif' ? 'font-serif-mode' : ''}`}
                      placeholder="Manually adjust result..."
                    />
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-30 grayscale dark:opacity-20 no-print">
                   <div className="text-5xl mb-6">🖋️</div>
                   <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600">Empty Output</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
      
      <footer className="h-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center px-6 justify-between text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 no-print">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span> Optimized Engine</span>
          <span className="text-slate-200 dark:text-slate-800">|</span>
          <span>Turbo: Gemini 3 Flash</span>
        </div>
        <span>v1.5.3 - Web Research Removed</span>
      </footer>
    </div>
  );
};

export default App;