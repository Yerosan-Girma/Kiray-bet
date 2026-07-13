import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { MessageSquare, Send, ChevronRight, User } from 'lucide-react';
import { messageService } from '../services/message.service';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { toast } from 'sonner';
import type { Message, Conversation, User as IUser } from '../types';

function getConversationId(id1: string, id2: string) {
  return [id1, id2].sort().join('_');
}

function ChatWindow({ partnerId, onBack }: { partnerId: string; onBack: () => void }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [typingUser, setTypingUser] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();

  const convId = user ? getConversationId(user._id, partnerId) : '';

  const { data: partnerData } = useQuery({
    queryKey: ['userProfile', partnerId],
    queryFn: async () => {
      // Get partner info from conversations list
      const convs = await messageService.getConversations();
      return convs.data?.find((c: Conversation) => c.conversationId === convId)?.partner || null;
    },
    staleTime: 60_000,
  });

  const { data: msgsData } = useQuery({
    queryKey: ['messages', partnerId],
    queryFn: () => messageService.getMessages(partnerId),
    staleTime: 10_000,
  });

  useEffect(() => {
    if (msgsData?.data) setLocalMessages(msgsData.data);
  }, [msgsData]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages]);

  useEffect(() => {
    if (!socket || !convId) return;
    socket.emit('join-dm', convId);

    socket.on('new-dm', (msg: Message) => {
      setLocalMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    socket.on('dm-user-typing', ({ name, isTyping }: any) => {
      setTypingUser(isTyping ? name : '');
    });

    return () => {
      socket.emit('leave-dm', convId);
      socket.off('new-dm');
      socket.off('dm-user-typing');
    };
  }, [socket, convId]);

  const handleTyping = () => {
    socket?.emit('dm-typing', { conversationId: convId, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket?.emit('dm-typing', { conversationId: convId, isTyping: false });
    }, 2000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;
    const content = message;
    setMessage('');

    // Optimistic
    const optimistic: Message = {
      _id: `opt-${Date.now()}`,
      conversationId: convId,
      senderId: user,
      receiverId: partnerId,
      content,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, optimistic]);

    if (socket?.connected) {
      socket.emit('send-dm', { conversationId: convId, receiverId: partnerId, content });
    } else {
      setSending(true);
      try {
        const res = await messageService.sendMessage(partnerId, content);
        setLocalMessages((prev) => prev.map((m) => m._id === optimistic._id ? res.data : m));
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      } catch {
        toast.error('Failed to send message');
        setLocalMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      } finally {
        setSending(false);
      }
    }
  };

  const partner = partnerData as IUser | null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-background">
        <button onClick={onBack} className="lg:hidden p-1 text-muted-foreground">
          <ChevronRight className="w-5 h-5 rotate-180" />
        </button>
        <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center overflow-hidden">
          {partner?.profileImage
            ? <img src={partner.profileImage} alt="" className="w-full h-full object-cover" />
            : <span className="font-bold text-amber-700">{partner?.name?.[0] || '?'}</span>}
        </div>
        <div>
          <p className="font-bold text-foreground text-sm">{partner?.name || 'Loading...'}</p>
          <p className="text-xs text-muted-foreground capitalize">{partner?.role}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {localMessages.map((msg, i) => {
          const senderId = typeof msg.senderId === 'object' ? (msg.senderId as IUser)._id : msg.senderId;
          const isMe = senderId === user?._id;
          return (
            <motion.div key={msg._id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                isMe ? 'text-[#070C17] rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'
              }`}
              style={isMe ? { background: 'linear-gradient(135deg, #E8B84B, #C9922A)' } : {}}>
                <p className="text-sm">{msg.content}</p>
                <p className={`text-xs mt-1 ${isMe ? 'text-[#070C17]/60' : 'text-muted-foreground'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {isMe && msg.read && <span className="ml-1">✓✓</span>}
                </p>
              </div>
            </motion.div>
          );
        })}

        {typingUser && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5">
              <div className="flex gap-1 items-center">
                {[0, 150, 300].map((delay) => (
                  <div key={delay} className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-border flex gap-3">
        <input type="text" value={message}
          onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm bg-background" />
        <button type="submit" disabled={!message.trim() || sending}
          className="w-12 h-12 rounded-xl flex items-center justify-center disabled:opacity-50 transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)' }}>
          <Send className="w-4 h-4 text-[#070C17]" />
        </button>
      </form>
    </div>
  );
}

export default function MessagesPage() {
  const { partnerId } = useParams<{ partnerId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messageService.getConversations(),
    enabled: !!user,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const conversations: Conversation[] = data?.data || [];

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-6 py-8 h-[calc(100vh-5rem)]">
        <div className="flex h-full rounded-3xl border border-border overflow-hidden bg-background shadow-sm">
          {/* Sidebar */}
          <div className={`w-full lg:w-80 xl:w-96 border-r border-border flex flex-col ${partnerId ? 'hidden lg:flex' : 'flex'}`}>
            <div className="p-4 border-b border-border">
              <h2 className="font-bold text-foreground text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-500" /> Messages
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 border-b border-border animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                ))
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No conversations yet</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button key={conv.conversationId}
                    onClick={() => navigate(`/messages/${conv.partner._id}`)}
                    className={`w-full p-4 border-b border-border text-left hover:bg-muted/50 transition-colors ${
                      partnerId === conv.partner._id ? 'bg-amber-50 border-l-2 border-l-amber-500' : ''
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center overflow-hidden shrink-0 relative">
                        {conv.partner.profileImage
                          ? <img src={conv.partner.profileImage} alt="" className="w-full h-full object-cover" />
                          : <span className="font-bold text-amber-700 text-sm">{conv.partner.name?.[0]}</span>}
                        {conv.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-foreground text-sm truncate">{conv.partner.name}</p>
                          {conv.lastMessage && (
                            <span className="text-xs text-muted-foreground shrink-0 ml-2">
                              {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate capitalize">{conv.partner.role}</p>
                        {conv.lastMessage && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage.content}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className={`flex-1 ${partnerId ? 'flex' : 'hidden lg:flex'} flex-col`}>
            {partnerId ? (
              <ChatWindow partnerId={partnerId} onBack={() => navigate('/messages')} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-bold text-foreground text-lg mb-2">Select a conversation</h3>
                  <p className="text-sm text-muted-foreground">Choose a contact to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
