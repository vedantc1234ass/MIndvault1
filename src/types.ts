export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationSummary {
  id: string;
  userId: string;
  conversationId?: string;
  title: string;
  shortSummary: string;
  keyTopics: string[];
  importantIdeas: string[];
  actionItems: string[];
  createdAt: string;
}

export interface AiReflectionSummary {
  id: string;
  userId: string;
  period: string;
  insightText: string;
  focusArea?: string;
  analyzedCount: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  summary?: ConversationSummary;
  keyTopics?: string[];
}

export interface AskJournalInteraction {
  id: string;
  question: string;
  answer: string;
  referencedEntriesCount: number;
  timestamp: string;
}

export interface SecurityAuditCheck {
  id: string;
  name: string;
  category: 'Authentication' | 'Authorization' | 'Data Isolation' | 'Secret Protection' | 'Prompt Injection' | 'Input Validation';
  description: string;
  status: 'idle' | 'running' | 'passed' | 'failed';
  details?: string;
  timestamp?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous: boolean;
}

export type PageRoute = 'login' | 'dashboard' | 'chat' | 'journal' | 'ask' | 'insights' | 'settings';
