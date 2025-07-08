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
    <div className={`flex gap-3 p-3 rounded-lg border ${
      message.role === "user" 
        ? "bg-blue-600/10 border-blue-600/30" 
        : "bg-gray-800/50 border-gray-700"
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
          <span className="font-medium text-sm text-white">
            {message.role === "user" ? "あなた" : "AI"}
          </span>
          <span className="text-xs text-gray-400">
            {formatTimestamp(message.timestamp)}
          </span>
          {message.isVoice && (
            <Badge variant="outline" className="text-xs border-blue-500 text-blue-300">
              <Mic className="w-3 h-3 mr-1" />
              音声
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-300 whitespace-pre-wrap">
          {message.content}
        </p>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-h-[700px] max-h-[90vh] bg-gray-900 border-gray-700 text-white overflow-hidden flex flex-col">
        <DialogHeader className="border-b border-gray-700 pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-white">
            <MessageCircle className="w-6 h-6" />
            チャット履歴
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            過去の会話を確認・検索できます
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 min-h-0">
          <Tabs defaultValue="sessions" className="w-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mx-6 mb-4 bg-gray-800 border-gray-700">
              <TabsTrigger value="sessions" className="text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white">セッション別</TabsTrigger>
              <TabsTrigger value="search" className="text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white">検索・フィルター</TabsTrigger>
            </TabsList>

            <TabsContent value="sessions" className="flex-1 m-0 flex">
              <div className="flex w-full h-full">
                <div className="w-1/3 flex-shrink-0 border-r border-gray-700 bg-gray-800/30">
                  <div className="p-4 space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="セッションを検索..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                      {filteredSessions.map((session) => (
                        <Card
                          key={session.id}
                          className={`cursor-pointer transition-colors bg-gray-800 border-gray-700 ${
                            selectedSession === session.id
                              ? "bg-blue-600/20 border-blue-500"
                              : "hover:bg-gray-700/50"
                          }`}
                          onClick={() => setSelectedSession(session.id)}
                        >
                          <CardHeader className="p-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-medium truncate text-white">
                                {session.title}
                              </CardTitle>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSession(session.id);
                                }}
                                className="w-6 h-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-600/20"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="p-3 pt-0">
                            <div className="text-xs text-gray-400 space-y-1">
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

                <div className="flex-1 flex flex-col bg-gray-900/50">
                  {selectedSession ? (
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {sessionMessages.map((message) => (
                        <MessageItem key={message.id} message={message} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center text-gray-400">
                        <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>セッションを選択してください</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="search" className="flex-1 m-0">
              <div className="p-4 space-y-4 h-full flex flex-col">
                <div className="flex gap-4 items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="メッセージを検索..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setFilter({ voiceOnly: !filter.voiceOnly })}
                    className={`border-gray-600 text-gray-300 hover:bg-gray-700 ${
                      filter.voiceOnly ? "bg-blue-600/20 border-blue-500 text-blue-300" : ""
                    }`}
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    音声のみ
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3">
                  {allFilteredMessages.map((message) => (
                    <MessageItem key={message.id} message={message} />
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="p-4 border-t border-gray-700 bg-gray-800/50 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {sessions.length} セッション • {messages.length} メッセージ
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={clearHistory}
              disabled={messages.length === 0}
              className="bg-red-600 hover:bg-red-700 text-white"
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