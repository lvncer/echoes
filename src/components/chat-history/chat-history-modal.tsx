"use client";

import { useState } from "react";
import { MessageCircle, Search, Trash2, Calendar, Mic } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useChatHistoryStore } from "@/lib/stores/chat-history-store";
import type { ChatMessage } from "@/lib/types/ai";

interface ChatHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatHistoryModal({ open, onOpenChange }: ChatHistoryModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  
  const {
    sessions,
    messages,
    getSessionMessages,
    getFilteredMessages,
    deleteSession,
    clearHistory,
    setFilter,
    filter,
  } = useChatHistoryStore();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilter({ searchQuery: query });
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId);
    if (selectedSession === sessionId) {
      setSelectedSession(null);
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (!searchQuery) return true;
    return (
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.firstMessage?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const sessionMessages = selectedSession ? getSessionMessages(selectedSession) : [];
  const allFilteredMessages = getFilteredMessages();

  const formatDate = (date: Date) => {
    return date.toLocaleString("ja-JP", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const MessageItem = ({ message }: { message: ChatMessage }) => (
    <div className={`flex gap-3 p-3 rounded-lg ${
      message.role === "user" 
        ? "bg-blue-50 dark:bg-blue-900/20" 
        : "bg-gray-50 dark:bg-gray-800/50"
    }`}>
      <div className="flex-shrink-0">
        {message.role === "user" ? (
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-white text-xs font-semibold">U</span>
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center">
            <span className="text-white text-xs font-semibold">AI</span>
          </div>
        )}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">
            {message.role === "user" ? "あなた" : "AI"}
          </span>
          <span className="text-xs text-gray-500">
            {formatTimestamp(message.timestamp)}
          </span>
          {message.isVoice && (
            <Badge variant="outline" className="text-xs">
              <Mic className="w-3 h-3 mr-1" />
              音声
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {message.content}
        </p>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] w-[90vw] p-0 bg-gray-50/95 backdrop-blur-lg border-gray-200/50 dark:bg-gray-900/95 dark:border-gray-700/50">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <MessageCircle className="w-6 h-6" />
            チャット履歴
          </DialogTitle>
          <DialogDescription>
            過去の会話を確認・検索できます
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="sessions" className="h-full">
            <TabsList className="grid w-full grid-cols-2 mx-6 mb-4">
              <TabsTrigger value="sessions">セッション別</TabsTrigger>
              <TabsTrigger value="search">検索・フィルター</TabsTrigger>
            </TabsList>

            <TabsContent value="sessions" className="h-full m-0">
              <div className="flex h-full">
                <div className="w-1/3 border-r border-gray-200 dark:border-gray-700">
                  <div className="p-4 space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="セッションを検索..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                      {filteredSessions.map((session) => (
                        <Card
                          key={session.id}
                          className={`cursor-pointer transition-colors ${
                            selectedSession === session.id
                              ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700"
                              : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          }`}
                          onClick={() => setSelectedSession(session.id)}
                        >
                          <CardHeader className="p-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-medium truncate">
                                {session.title}
                              </CardTitle>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSession(session.id);
                                }}
                                className="w-6 h-6 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="p-3 pt-0">
                            <div className="text-xs text-gray-500 space-y-1">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(session.lastUpdatedAt)}
                              </div>
                              <div>{session.messageCount} メッセージ</div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col">
                  {selectedSession ? (
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {sessionMessages.map((message) => (
                        <MessageItem key={message.id} message={message} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>セッションを選択してください</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="search" className="h-full m-0">
              <div className="p-4 space-y-4">
                <div className="flex gap-4 items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="メッセージを検索..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setFilter({ voiceOnly: !filter.voiceOnly })}
                    className={filter.voiceOnly ? "bg-blue-50 border-blue-200" : ""}
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    音声のみ
                  </Button>
                </div>

                <div className="max-h-[55vh] overflow-y-auto space-y-3">
                  {allFilteredMessages.map((message) => (
                    <MessageItem key={message.id} message={message} />
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {sessions.length} セッション • {messages.length} メッセージ
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={clearHistory}
              disabled={messages.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              すべて削除
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}