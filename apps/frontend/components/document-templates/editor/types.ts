import type { Bold } from 'lucide-react';

export interface TemplateEditorProps {
  slug: string;
  open: boolean;
  onClose: () => void;
}

export type EditorMode = 'edit' | 'split' | 'preview';

export interface ToolbarAction {
  icon: typeof Bold;
  label: string;
  shortcut?: string;
  action: 'wrap' | 'prefix' | 'insert';
  before?: string;
  after?: string;
  prefix?: string;
  insert?: string;
}
