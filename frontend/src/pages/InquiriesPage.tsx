import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, ChevronRight, Home } from 'lucide-react';
import { inquiryService } from '../services/inquiry.service';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { toast } from 'sonner';
import type { Inquiry, Reply, User, House } from '../types';

function ChatWindow({ inquiry, onClose }: { inquiry: Inquiry; onClose: () => void }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Reply[]>(inquiry.replies || []);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const queryClient = useQueryClient();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join-inquiry', inquiry._id);

    socket.on('new-message', ({ reply, sender }: any) => {
      setMessages((prev) => [...prev, { ...reply, userId: sender }]);
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    });

    socket.on('user-typing', ({ isTyping: t, userId }: any) => {
      if (userId !== user?._id) {
        setTypingUser(t ? 'Other party' : '');
      }
    });

    return () => {
      socket.emit('leave-inquiry', inquiry._id);
      socket.off('new-message');
      socket.off('user-typing');
    };
  }, [socket, inquiry._id]);

  const handleTyping = () => {
    socket?.emit('typing', { inquiryId: inquiry._id, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket?.emit('typing', { inquiryId: inquiry._id, isTyping: false });
    }, 2000);
  };

  const sendMutation = useMutation({
    mutationFn: () => inquiryService.addReply(inquiry._id, { message }),
    onSuccess: () => {
      // Message will arrive via socket, but also optimistically add it
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
      setMessage('');
    },
    onError: () => toast.error('Failed to send message'),
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Try socket first, fall back to REST
    if (socket?.connected) {
      socket.emit('send-message', { inquiryId: inquiry._id, message });
      setMessages((prev) => [...prev, {
        userId: user as any,
        message,
        createdAt: new Date().toISOString(),
      }]);
      setMessage('');
    } else {
      setSending(true);
      await sendMutation.mutateAsync();
      setSending(false);
    }
  };

  const house = typeof inquiry.houseId === 'object' ? inquiry.houseId as House : null;

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-background">
        <button onClick={onClose} className="lg:hidden p-1 text-muted-foreground">
          <ChevronRight className="w-5 h-5 rotate-180" />
        </button>
        <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center overflow-hidden">
          {house?.images?.[0]
            ? <img src={house.images[0]} alt="" className="w-full h-full object-cover" />
            : <Home className="w-5 h-5 text-muted-foreground" />}
        </div>
        <div>
          <p className="font-bold text-foreground text-sm">
            {house?.title || 'Property Inquiry'}
          </p>
          <p className="text-xs text-muted-foreground">{house?.location}</p>
        </div>
        <span className={`ml-auto px-2 py-1 rounded-full text-xs font-medium ${
          inquiry.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
        }`}>{inquiry.status}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((reply, i) => {
          const replyUser = typeof reply.userId === 'object' ? reply.userId as User : null;
          const isMe = replyUser?._id === user?._id || reply.userId === user?._id;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                isMe
                  ? 'text-[#070C17] rounded-br-sm'
                  : 'bg-muted text-foreground rounded-bl-sm'
              }`}
              style={isMe ? { background: 'linear-gradient(135deg, #E8B84B, #C9922A)' } : {}}>
                {!isMe && replyUser?.name && (
                  <p className="text-xs font-semibold text-amber-600 mb-1">{replyUser.name}</p>
                )}
                <p className="text-sm">{reply.message}</p>
                <p className={`text-xs mt-1 ${isMe ? 'text-[#070C17]/60' : 'text-muted-foreground'}`}>
                  {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          );
        })}

        {typingUser && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5">
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-border flex gap-3">
        <input
          type="text"
          value={message}
          onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 text-sm bg-background"
        />
        <button type="submit" disabled={!message.trim() || sending}
          className="w-12 h-12 rounded-xl flex items-center justify-center disabled:opacity-50 transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)' }}>
          <Send className="w-4 h-4 text-[#070C17]" />
        </button>
      </form>
    </div>
  );
}

export default function InquiriesPage() {
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['inquiries', page],
    queryFn: () => inquiryService.getInquiries({ page, limit: 20 }),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const inquiries: Inquiry[] = data?.data || [];

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-6 py-8 h-[calc(100vh-5rem)]">
        <div className="flex h-full rounded-3xl border border-border overflow-hidden bg-background shadow-sm">
          {/* Sidebar list */}
          <div className={`w-full lg:w-80 xl:w-96 border-r border-border flex flex-col ${selected ? 'hidden lg:flex' : 'flex'}`}>
            <div className="p-4 border-b border-border">
              <h2 className="font-bold text-foreground text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-500" /> Inquiries
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 border-b border-border animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                ))
              ) : inquiries.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No inquiries yet</p>
                </div>
              ) : (
                inquiries.map((inq) => {
                  const house = typeof inq.houseId === 'object' ? inq.houseId as House : null;
                  const lastReply = inq.replies[inq.replies.length - 1];
                  return (
                    <button key={inq._id} onClick={() => setSelected(inq)}
                      className={`w-full p-4 border-b border-border text-left hover:bg-muted/50 transition-colors ${
                        selected?._id === inq._id ? 'bg-amber-50 border-l-2 border-l-amber-500' : ''
                      }`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted flex-shrink-0 overflow-hidden">
                          {house?.images?.[0]
                            ? <img src={house.images[0]} alt="" className="w-full h-full object-cover" />
                            : <Home className="w-5 h-5 text-muted-foreground m-auto" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">
                            {house?.title || 'Property'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {lastReply?.message || 'No messages yet'}
                          </p>
                        </div>
                        <span className={`shrink-0 w-2 h-2 rounded-full ${
                          inq.status === 'active' ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className={`flex-1 ${selected ? 'flex' : 'hidden lg:flex'} flex-col`}>
            {selected ? (
              <ChatWindow inquiry={selected} onClose={() => setSelected(null)} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-bold text-foreground text-lg mb-2">Select an inquiry</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a conversation from the list to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
