import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Trash2, 
  Loader2, 
  History, 
  Plus, 
  ArrowUp, 
  Sparkles, 
  Cpu, 
  Paperclip, 
  Mic, 
  X, 
  MessageSquare, 
  Clock, 
  ChevronDown,
  Tag,
  Check
} from 'lucide-react';
import Markdown from 'react-markdown';
import { ChatMessage, ChatSession, Product, UserProfile } from '../types';
import { 
  askPuterAI, 
  loadChatSessions, 
  saveChatSessions, 
  createNewSession 
} from '../lib/puter';

interface AiAssistantProps {
  user: UserProfile;
  products: Product[];
  primaryColor: string;
  accentColor: string;
}

const QUICK_ACTIONS = [
  { label: 'تفاصيل المنتجات', icon: '📦', query: 'اعرض لي تفاصيل المنتجات المتوفرة في متجري الآن' },
  { label: 'ملخص المخزون', icon: '📊', query: 'أعطني تقرير شامل عن إجمالي المخزون وقيمته' },
  { label: 'نقص المخزون', icon: '⚠️', query: 'ما هي المنتجات التي كميتها أقل من 5 قطع؟' },
  { label: 'وصف تسويقي', icon: '✍️', query: 'اقترح وصف تسويقي جذاب لأحد منتجات المتجر' },
  { label: 'أفكار مبيعات', icon: '💡', query: 'أعطني 3 أفكار لزيادة المبيعات وتنشيط المتجر' },
];

export const AiAssistant: React.FC<AiAssistantProps> = ({
  user,
  products,
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'claude' | 'gemini'>('claude');
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load sessions on mount
  useEffect(() => {
    let isMounted = true;
    setLoadingSessions(true);
    loadChatSessions(user.uid)
      .then((loaded) => {
        if (isMounted) {
          setSessions(loaded);
          if (loaded.length > 0) {
            setActiveSessionId(loaded[0].id);
          } else {
            const fresh = createNewSession('محادثة جديدة');
            setSessions([fresh]);
            setActiveSessionId(fresh.id);
          }
        }
      })
      .finally(() => {
        if (isMounted) setLoadingSessions(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user.uid]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const messages = activeSession ? activeSession.messages : [];

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Create a brand new session
  const handleCreateNewSession = () => {
    const newSession = createNewSession(`محادثة جديدة #${sessions.length + 1}`);
    const updated = [newSession, ...sessions];
    setSessions(updated);
    setActiveSessionId(newSession.id);
    saveChatSessions(user.uid, updated);
    setIsHistoryOpen(false);
  };

  // Switch active session
  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    setIsHistoryOpen(false);
  };

  // Delete a saved session
  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    let updated = sessions.filter((s) => s.id !== id);
    if (updated.length === 0) {
      const fresh = createNewSession('محادثة جديدة');
      updated = [fresh];
    }
    setSessions(updated);
    if (activeSessionId === id) {
      setActiveSessionId(updated[0].id);
    }
    saveChatSessions(user.uid, updated);
  };

  // Send a message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text || isLoading || !activeSession) return;

    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now(),
    };

    // Auto-update session title if it's the first user message
    const isFirstUserMessage = !activeSession.messages.some((m) => m.sender === 'user');
    const newTitle = isFirstUserMessage ? text.slice(0, 32) : activeSession.title;

    const updatedMessages = [...activeSession.messages, userMsg];
    const updatedSessions = sessions.map((s) =>
      s.id === activeSession.id
        ? {
            ...s,
            title: newTitle,
            messages: updatedMessages,
            updatedAt: Date.now(),
          }
        : s
    );

    setSessions(updatedSessions);
    setInputVal('');
    setIsLoading(true);

    try {
      const reply = await askPuterAI(text, products, updatedMessages);
      const assistantMsg: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        sender: 'assistant',
        text: reply,
        timestamp: Date.now(),
      };

      const finalMessages = [...updatedMessages, assistantMsg];
      const finalSessions = sessions.map((s) =>
        s.id === activeSession.id
          ? {
              ...s,
              title: newTitle,
              messages: finalMessages,
              updatedAt: Date.now(),
            }
          : s
      );

      setSessions(finalSessions);
      await saveChatSessions(user.uid, finalSessions);
    } catch (err) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        sender: 'assistant',
        text: 'تعذر الاتصال بالذكاء الاصطناعي، يرجى المحاولة مرة أخرى.',
        timestamp: Date.now(),
      };
      const finalMessages = [...updatedMessages, errMsg];
      const finalSessions = sessions.map((s) =>
        s.id === activeSession.id
          ? {
              ...s,
              title: newTitle,
              messages: finalMessages,
              updatedAt: Date.now(),
            }
          : s
      );
      setSessions(finalSessions);
    } finally {
      setIsLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'صباح الخير';
    if (hour >= 12 && hour < 17) return 'مساء الخير';
    return 'أهلاً بك';
  };

  const userFirstName = user.name ? user.name.split(' ')[0] : 'صديقي';
  const hasUserMessages = messages.some((m) => m.sender === 'user');

  return (
    <div id="ai-assistant-container" className="flex flex-col h-full bg-[#fbfbfb] dark:bg-slate-950 text-right relative overflow-hidden">
      
      {/* Top Navigation Bar */}
      <div className="px-4 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white">
                المساعد الذكي للمتجر
              </h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-medium">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[170px]">
              {activeSession ? activeSession.title : 'محادثة جديدة'}
            </p>
          </div>
        </div>

        {/* Action Buttons: History Drawer Toggle + New Chat */}
        <div className="flex items-center gap-1.5">
          <button
            id="open-saved-chats-btn"
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors"
            title="المحادثات المحفوظة"
          >
            <History className="w-3.5 h-3.5 text-violet-500" />
            <span className="hidden sm:inline">المحادثات</span>
            <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center">
              {sessions.length}
            </span>
          </button>

          <button
            id="new-chat-top-btn"
            type="button"
            onClick={handleCreateNewSession}
            className="flex items-center gap-1 py-1.5 px-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 text-xs font-bold shadow-xs transition-all"
            title="محادثة جديدة"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>جديدة</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {loadingSessions ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 gap-2 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
            <span>جاري تحميل المحادثات...</span>
          </div>
        ) : !hasUserMessages ? (
          /* Claude-style Hero Screen when starting a conversation (Matching User's Uploaded Image) */
          <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-xl mx-auto w-full my-auto">
            {/* Elegant Greeting from screenshot */}
            <div className="text-center mb-6 space-y-1.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {getGreeting()}، {userFirstName}
              </h1>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-700 dark:text-slate-200">
                كيف يمكنني{' '}
                <span className="bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
                  مساعدتك اليوم؟
                </span>
              </h2>
            </div>

            {/* Centered Sleek Claude Card Box */}
            <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-3.5 sm:p-4 space-y-3 transition-all focus-within:border-slate-400 dark:focus-within:border-slate-600 focus-within:shadow-md">
              {/* Mini Top Banner (Claude Pro style from image) */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                  <Sparkles className="w-3 h-3 text-violet-500" />
                  مساعد فائق السرعة • متصل بالمخزون مباشرة
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                  {products.length} منتج مسجل
                </span>
              </div>

              {/* Textarea */}
              <textarea
                id="hero-chat-textarea"
                ref={textareaRef}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={2}
                placeholder="اسألني عن تفاصيل أي منتج، المخزون، أو خطة تسويقية..."
                className="w-full resize-none bg-transparent text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 leading-relaxed"
              />

              {/* Inside Bottom Actions */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  {/* Model Selector Pill (like Claude 3.5 sonnet in screenshot) */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowModelMenu(!showModelMenu)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                    >
                      <Cpu className="w-3 h-3 text-violet-500" />
                      <span>{selectedModel === 'claude' ? 'Claude 3.5 Sonnet' : 'Gemini 2.5 Flash'}</span>
                      <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                    </button>

                    {showModelMenu && (
                      <div className="absolute bottom-full mb-1 right-0 w-44 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg py-1 z-30 text-xs text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedModel('claude');
                            setShowModelMenu(false);
                          }}
                          className={`w-full px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                            selectedModel === 'claude' ? 'text-violet-600 font-bold' : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span>Claude 3.5 Sonnet</span>
                          {selectedModel === 'claude' && <Check className="w-3.5 h-3.5 text-violet-600" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedModel('gemini');
                            setShowModelMenu(false);
                          }}
                          className={`w-full px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                            selectedModel === 'gemini' ? 'text-violet-600 font-bold' : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span>Gemini 2.5 Flash</span>
                          {selectedModel === 'gemini' && <Check className="w-3.5 h-3.5 text-violet-600" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right controls: Mic + Round Send Button from Claude design */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    title="تسجيل صوتي"
                    onClick={() => {
                      setInputVal('تفاصيل المنتجات المتوفرة');
                    }}
                    className="w-7 h-7 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
                  >
                    <Mic className="w-3.5 h-3.5" />
                  </button>

                  <button
                    id="hero-send-message-btn"
                    type="button"
                    disabled={!inputVal.trim() || isLoading}
                    onClick={() => handleSendMessage()}
                    className="w-7 h-7 rounded-full bg-slate-800 dark:bg-white text-white dark:text-slate-900 disabled:opacity-30 hover:opacity-90 flex items-center justify-center shadow-xs transition-all cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Category Quick Action Pills (below input box as in screenshot) */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              {QUICK_ACTIONS.map((action, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(action.query)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-medium hover:border-violet-500 hover:text-violet-600 dark:hover:text-violet-400 shadow-2xs transition-all"
                >
                  <span className="text-xs">{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Active Chat Feed */
          <div className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-4">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 max-w-[90%] sm:max-w-[85%] ${
                    isUser ? 'mr-auto flex-row-reverse' : 'ml-auto'
                  }`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed transition-all ${
                      isUser
                        ? 'bg-slate-900 dark:bg-violet-600 text-white rounded-tr-xs shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 shadow-xs rounded-tl-xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-line font-medium text-white">{msg.text}</p>
                    ) : (
                      <div className="markdown-body text-xs space-y-1 text-slate-800 dark:text-slate-200">
                        <Markdown
                          components={{
                            h3: ({ children }) => (
                              <h3 className="text-xs font-bold text-slate-900 dark:text-white pb-1 mb-1.5 flex items-center gap-1 border-b border-slate-100 dark:border-slate-800">
                                {children}
                              </h3>
                            ),
                            p: ({ children }) => (
                              <p className="mb-1.5 last:mb-0 leading-relaxed text-slate-800 dark:text-slate-200">
                                {children}
                              </p>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-bold text-slate-900 dark:text-white">
                                {children}
                              </strong>
                            ),
                            ul: ({ children }) => (
                              <ul className="space-y-1 my-1 list-none pr-0">{children}</ul>
                            ),
                            li: ({ children }) => (
                              <li className="leading-relaxed text-slate-700 dark:text-slate-300">
                                {children}
                              </li>
                            ),
                            hr: () => (
                              <hr className="my-2.5 border-slate-100 dark:border-slate-800" />
                            ),
                          }}
                        >
                          {msg.text}
                        </Markdown>
                      </div>
                    )}
                    <span
                      className={`block text-[10px] mt-1.5 ${
                        isUser ? 'text-slate-300 text-right' : 'text-slate-400 text-left'
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Thinking Indicator */}
            {isLoading && (
              <div className="flex gap-2 max-w-[80%] ml-auto">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-2xl rounded-tl-xs border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mr-1.5">جاري التحليل والرد...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Docked Claude-style Input at the Bottom (When in chat conversation) */}
      {hasUserMessages && (
        <div className="p-3 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 pb-20 sm:pb-4">
          <div className="max-w-2xl mx-auto">
            {/* Quick action chips bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-1 scrollbar-none">
              {QUICK_ACTIONS.slice(0, 3).map((action, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(action.query)}
                  className="shrink-0 text-[10px] px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-violet-500 font-medium transition-colors"
                >
                  {action.icon} {action.label}
                </button>
              ))}
            </div>

            {/* Input Box */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm flex items-end gap-2 focus-within:border-slate-400 dark:focus-within:border-slate-700 transition-colors">
              <textarea
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                placeholder="اكتب سؤالك أو اطلب تفاصيل منتج..."
                className="flex-1 resize-none bg-transparent text-xs text-slate-900 dark:text-white px-2 py-1.5 focus:outline-none placeholder:text-slate-400"
              />

              <div className="flex items-center gap-1 shrink-0 pb-0.5">
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputVal.trim() || isLoading}
                  className="w-7 h-7 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 disabled:opacity-30 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* قسم حفظ المحادثات - Slide-in Drawer / Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex justify-start animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            onClick={() => setIsHistoryOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          {/* Drawer Panel */}
          <div className="relative w-80 max-w-[85vw] h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-10 text-right">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-violet-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  المحادثات المحفوظة
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* New Chat Button */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleCreateNewSession}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>بدء محادثة جديدة</span>
              </button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  لا توجد محادثات سابقة
                </div>
              ) : (
                sessions.map((sess) => {
                  const isActive = sess.id === activeSessionId;
                  const messageCount = sess.messages.length;
                  return (
                    <div
                      key={sess.id}
                      onClick={() => handleSelectSession(sess.id)}
                      className={`group p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isActive
                          ? 'border-violet-500 bg-violet-50/60 dark:bg-violet-950/30'
                          : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-800/30'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-violet-600' : 'text-slate-400'}`} />
                          <h4 className={`text-xs font-semibold truncate ${isActive ? 'text-violet-900 dark:text-violet-200' : 'text-slate-800 dark:text-slate-200'}`}>
                            {sess.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(sess.updatedAt).toLocaleDateString('ar-EG', {
                              month: 'numeric',
                              day: 'numeric',
                            })}
                          </span>
                          <span>•</span>
                          <span>{messageCount} رسائل</span>
                        </div>
                      </div>

                      {/* Delete Session Button */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(e, sess.id)}
                        className="opacity-60 hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                        title="حذف المحادثة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 text-center">
              يتم حفظ كافة المحادثات تلقائياً
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
