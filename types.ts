export type FormattingStyle = 
  | 'professional' 
  | 'creative' 
  | 'concise' 
  | 'academic' 
  | 'technical';

export type OutputFormat = 
  | 'markdown' 
  | 'email' 
  | 'report' 
  | 'summary' 
  | 'meeting-notes';

export interface DocumentState {
  rawContent: string;
  formattedContent: string;
  isProcessing: boolean;
  history: string[];
}

export interface AIAction {
  id: string;
  label: string;
  icon: string;
  description: string;
  promptTemplate: string;
  category: 'Branding' | 'My Formats';
}

export interface FormatResult {
  text: string;
}