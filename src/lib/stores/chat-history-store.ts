import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage, ChatSession, ChatHistoryFilter } from "@/types/ai";

interface ChatHistoryStore {
  sessions: ChatSession[];
  messages: ChatMessage[];
  currentSessionId: string | null;
  filter: ChatHistoryFilter;

  createSession: (firstMessage?: string) => string;
  getCurrentSession: () => ChatSession | null;
  addMessage: (message: Omit<ChatMessage, "sessionId">) => void;
  getSessionMessages: (sessionId: string) => ChatMessage[];
  getFilteredMessages: () => ChatMessage[];
  deleteSession: (sessionId: string) => void;
  clearHistory: () => void;
  setFilter: (filter: Partial<ChatHistoryFilter>) => void;
  generateSessionTitle: (sessionId: string) => string;
}

const generateSessionTitle = (firstMessage?: string, _messageCount: number = 0): string => {
  if (firstMessage) {
    const trimmed = firstMessage.trim();
    if (trimmed.length > 30) {
      return trimmed.substring(0, 30) + "...";
    }
    return trimmed;
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `会話 ${dateStr}`;
};

export const useChatHistoryStore = create<ChatHistoryStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      messages: [],
      currentSessionId: null,
      filter: {},

      createSession: (firstMessage?: string) => {
        const sessionId = `session_${Date.now()}`;
        const now = new Date();

        const newSession: ChatSession = {
          id: sessionId,
          title: generateSessionTitle(firstMessage, 0),
          startedAt: now,
          lastUpdatedAt: now,
          messageCount: 0,
          firstMessage: firstMessage,
        };

        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSessionId: sessionId,
        }));

        return sessionId;
      },

      getCurrentSession: () => {
        const { sessions, currentSessionId } = get();
        return sessions.find((s) => s.id === currentSessionId) || null;
      },

      addMessage: (message) => {
        const { currentSessionId } = get();

        let sessionId = currentSessionId;

        if (!sessionId) {
          sessionId = get().createSession(message.content);
        }

        const messageWithSession: ChatMessage = {
          ...message,
          sessionId,
        };

        set((state) => {
          const updatedSessions = state.sessions.map((session) => {
            if (session.id === sessionId) {
              return {
                ...session,
                lastUpdatedAt: new Date(),
                messageCount: session.messageCount + 1,
                title:
                  session.messageCount === 0 && message.role === "user"
                    ? generateSessionTitle(message.content, 1)
                    : session.title,
              };
            }
            return session;
          });

          return {
            sessions: updatedSessions,
            messages: [...state.messages, messageWithSession],
          };
        });
      },

      getSessionMessages: (sessionId: string) => {
        const { messages } = get();
        return messages
          .filter((msg) => msg.sessionId === sessionId)
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      },

      getFilteredMessages: () => {
        const { messages, filter } = get();
        let filtered = [...messages];

        if (filter.sessionId) {
          filtered = filtered.filter((msg) => msg.sessionId === filter.sessionId);
        }

        if (filter.searchQuery) {
          const query = filter.searchQuery.toLowerCase();
          filtered = filtered.filter((msg) => msg.content.toLowerCase().includes(query));
        }

        if (filter.voiceOnly) {
          filtered = filtered.filter((msg) => msg.isVoice);
        }

        if (filter.dateRange) {
          filtered = filtered.filter(
            (msg) =>
              msg.timestamp >= filter.dateRange!.start && msg.timestamp <= filter.dateRange!.end,
          );
        }

        return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      },

      deleteSession: (sessionId: string) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          messages: state.messages.filter((msg) => msg.sessionId !== sessionId),
          currentSessionId: state.currentSessionId === sessionId ? null : state.currentSessionId,
        }));
      },

      clearHistory: () => {
        set({
          sessions: [],
          messages: [],
          currentSessionId: null,
        });
      },

      setFilter: (newFilter) => {
        set((state) => ({
          filter: { ...state.filter, ...newFilter },
        }));
      },

      generateSessionTitle: (sessionId: string) => {
        const { messages } = get();
        const sessionMessages = messages.filter((msg) => msg.sessionId === sessionId);

        if (sessionMessages.length > 0) {
          const firstUserMessage = sessionMessages.find((msg) => msg.role === "user");
          return generateSessionTitle(firstUserMessage?.content, sessionMessages.length);
        }

        return generateSessionTitle(undefined, 0);
      },
    }),
    {
      name: "chat-history-storage",
      partialize: (state) => ({
        sessions: state.sessions,
        messages: state.messages,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.sessions = state.sessions.map((session) => ({
            ...session,
            startedAt: new Date(session.startedAt),
            lastUpdatedAt: new Date(session.lastUpdatedAt),
          }));

          state.messages = state.messages.map((message) => ({
            ...message,
            timestamp: new Date(message.timestamp),
          }));
        }
      },
    },
  ),
);
