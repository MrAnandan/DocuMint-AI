import { AIAction } from './types';

export const AI_ACTIONS: AIAction[] = [
  // --- BRANDING ---
  {
    id: 'resume-formatter',
    label: 'Professional Resume',
    icon: '👤',
    description: 'Format messy career notes into a clean resume.',
    category: 'Branding',
    promptTemplate: 'Transform the input into a high-impact, professional resume. Organize the content into logical sections: Professional Summary, Core Competencies (Skills), Work Experience (using bullet points with action verbs), and Education. Use clean Markdown headers and bold text for titles.'
  },
  {
    id: 'professional-email',
    label: 'Professional Email',
    icon: '📧',
    description: 'Convert notes into a polished email body.',
    category: 'Branding',
    promptTemplate: 'Rewrite the following content as a professional email. Include a clear, concise Subject Line at the very top. Ensure the tone is polite, professional, and the message is structured for quick reading with appropriate greetings and sign-offs.'
  },
  {
    id: 'meeting-notes',
    label: 'Meeting Notes',
    icon: '📝',
    description: 'Turn transcript/notes into structured minutes.',
    category: 'Branding',
    promptTemplate: 'Transform the input into structured meeting notes. Use the following sections: 1. Attendees (if mentioned), 2. Overview/Objective, 3. Key Discussion Points (bulleted), 4. Decisions Made, 5. Action Items (with owners if mentioned). Use clear Markdown formatting.'
  },
  {
    id: 'formal-header',
    label: 'Letterhead Style',
    icon: '🏛️',
    description: 'Official document header with branding.',
    category: 'Branding',
    promptTemplate: 'Format the input into a formal corporate letterhead. Place organization details at the top, followed by a right-aligned date and recipient block. Use horizontal lines to separate the branding from the body.'
  },
  {
    id: 'legal-footer',
    label: 'Legal Disclaimer',
    icon: '⚖️',
    description: 'Add standardized confidentiality notices.',
    category: 'Branding',
    promptTemplate: 'Transform the input or add a professional legal disclaimer at the end. Use a small-text format (italicized Markdown). Include clauses for confidentiality, unintended recipient notification, and data privacy.'
  }
];