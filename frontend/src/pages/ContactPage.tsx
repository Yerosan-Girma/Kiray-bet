import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail, Phone, MapPin, Send, CheckCircle, Clock,
  MessageSquare, HelpCircle, Building2, Users,
  ArrowRight, Loader2, X,
} from 'lucide-react';
import api from '../api/axios';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'general',     label: 'General Inquiry',    icon: HelpCircle  },
  { value: 'property',    label: 'Property Question',  icon: Building2   },
  { value: 'broker',      label: 'Broker Support',     icon: Users       },
  { value: 'technical',   label: 'Technical Issue',    icon: MessageSquare },
  { value: 'billing',     label: 'Billing & Payments', icon: CheckCircle },
];

const INFO_CARDS = [
  {
    icon: Mail,
    title: 'Email Us',
    value: 'support@kiraybet.et',
    sub: 'We reply within 24 hours',
    color: '#4F8EF7',
    glow: 'rgba(79,142,247,0.15)',
  },
  {
    icon: Phone,
    title: 'Call Us',
    value: '+251 911 123 456',
    sub: 'Mon–Fri, 8am – 6pm EAT',
    color: '#E8B84B',
    glow: 'rgba(232,184,75,0.15)',
  },
  {
    icon: MapPin,
    title: 'Visit Us',
    value: 'Bole, Addis Ababa',
    sub: 'Kiray Bet HQ, Ethiopia',
    color: '#34D399',
    glow: 'rgba(52,211,153,0.15)',
  },
  {
    icon: Clock,
    title: 'Working Hours',
    value: '8:00 AM – 6:00 PM',
    sub: 'Monday to Friday (EAT)',
    color: '#A78BFA',
    glow: 'rgba(167,139,250,0.15)',
  },
];

const FAQ = [
  { q: 'How long does it take to list a property?', a: 'After broker review and approval, your property goes live immediately — no waiting for admin.' },
  { q: 'Is Kiray Bet free for renters?', a: 'Absolutely. Searching, contacting brokers, and booking viewings is completely free for renters.' },
  { q: 'How do I become a broker?', a: 'Click "Become a Broker" in the navbar, fill in your details and pay the one-time registration fee.' },
  { q: 'What payment methods do you accept?', a: 'We support Chapa, Telebirr, and bank transfers for premium upgrades and broker registration.' },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '', category: 'general' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [charCount, setCharCount] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (name === 'message') setCharCount(value.length);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/contact', form);
      setSent(true);
      toast.success(res.data.message);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setForm({ name: '', email: '', phone: '', subject: '', message: '', category: 'general' });
    setCharCount(0);
    setSent(false);
  };

  return (
    <div className="min-h-screen" style={{ background: '#070C17' }}>

      {/* ── Hero ── */}
      <div className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10"
            style={{ background: 'radial-gradient(circle, #E8B84B, transparent)' }} />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-8"
            style={{ background: 'radial-gradient(circle, #4F8EF7, transparent)' }} />
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-5"
            style={{ background: 'rgba(232,184,75,0.12)', border: '1px solid rgba(232,184,75,0.3)', color: '#E8B84B' }}>
            <MessageSquare className="w-3 h-3" /> Get in Touch
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-white mb-5"
            style={{ fontFamily: 'Urbanist, sans-serif', letterSpacing: '-0.03em' }}>
            We'd Love to
            <span className="block" style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Hear From You
            </span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
            className="text-white/50 text-lg max-w-xl mx-auto leading-relaxed">
            Got a question, feedback, or need help? Send us a message and our team will get back to you within 24 hours.
          </motion.p>
        </div>
      </div>

      {/* ── Info Cards ── */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {INFO_CARDS.map((card, i) => (
            <motion.div key={card.title} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className="relative rounded-2xl p-5 overflow-hidden group cursor-default"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                style={{ background: card.glow }} />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${card.color}18`, border: `1px solid ${card.color}30` }}>
                  <card.icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
                <p className="text-xs text-white/40 font-medium mb-1">{card.title}</p>
                <p className="text-sm font-bold text-white leading-tight">{card.value}</p>
                <p className="text-xs text-white/30 mt-1">{card.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Main: Form + FAQ ── */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid lg:grid-cols-5 gap-10">

          {/* ── Contact Form ── */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-3">
            <div className="rounded-3xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>

              {/* Form header */}
              <div className="p-8 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Urbanist, sans-serif' }}>Send a Message</h2>
                <p className="text-white/40 text-sm mt-1">Fill in the form — we respond within 24–48 hours.</p>
              </div>

              <AnimatePresence mode="wait">
                {sent ? (
                  /* ── Success state ── */
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }} className="p-12 text-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                      style={{ background: 'rgba(52,211,153,0.15)', border: '2px solid rgba(52,211,153,0.4)' }}>
                      <CheckCircle className="w-10 h-10 text-emerald-400" />
                    </motion.div>
                    <h3 className="text-2xl font-black text-white mb-3" style={{ fontFamily: 'Urbanist, sans-serif' }}>Message Sent!</h3>
                    <p className="text-white/50 text-sm mb-2">We've received your message and sent a confirmation to your email.</p>
                    <p className="text-white/30 text-xs mb-8">Expect a reply within 24–48 business hours.</p>
                    <button onClick={reset}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
                      style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}>
                      <X className="w-4 h-4" /> Send Another
                    </button>
                  </motion.div>
                ) : (
                  /* ── Form ── */
                  <motion.form key="form" onSubmit={handleSubmit} className="p-8 space-y-5">
                    {/* Category pills */}
                    <div>
                      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Category</label>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map(cat => (
                          <button key={cat.value} type="button" onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                            style={form.category === cat.value
                              ? { background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }
                              : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <cat.icon className="w-3.5 h-3.5" /> {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Name + Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Full Name *</label>
                        <input name="name" value={form.name} onChange={handleChange} placeholder="Amara Bekele" required
                          className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none transition-all"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                          onFocus={e => e.target.style.borderColor = 'rgba(232,184,75,0.5)'}
                          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Email Address *</label>
                        <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required
                          className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none transition-all"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                          onFocus={e => e.target.style.borderColor = 'rgba(232,184,75,0.5)'}
                          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                      </div>
                    </div>

                    {/* Phone + Subject */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Phone <span className="opacity-50">(optional)</span></label>
                        <input name="phone" value={form.phone} onChange={handleChange} placeholder="+251 9XX XXX XXX"
                          className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none transition-all"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                          onFocus={e => e.target.style.borderColor = 'rgba(232,184,75,0.5)'}
                          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Subject *</label>
                        <input name="subject" value={form.subject} onChange={handleChange} placeholder="How can we help?" required
                          className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none transition-all"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                          onFocus={e => e.target.style.borderColor = 'rgba(232,184,75,0.5)'}
                          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider">Message *</label>
                        <span className={`text-xs ${charCount > 1800 ? 'text-red-400' : 'text-white/30'}`}>{charCount}/2000</span>
                      </div>
                      <textarea name="message" rows={6} value={form.message} onChange={handleChange}
                        placeholder="Describe your question or issue in detail..." required
                        className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none transition-all resize-none"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                        onFocus={e => e.target.style.borderColor = 'rgba(232,184,75,0.5)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                    </div>

                    <button type="submit" disabled={loading}
                      className="w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
                      style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17', boxShadow: '0 8px 32px rgba(232,184,75,0.3)' }}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {loading ? 'Sending your message...' : 'Send Message'}
                    </button>
                    <p className="text-center text-xs text-white/25">
                      By submitting you agree to our Privacy Policy. We'll never share your info.
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ── Right: FAQ + Map ── */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }} className="lg:col-span-2 space-y-6">

            {/* Response time badge */}
            <div className="rounded-2xl p-5 flex items-center gap-4"
              style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(52,211,153,0.15)' }}>
                <Clock className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Average Response Time</p>
                <p className="text-xs text-emerald-400 font-semibold">Under 4 hours during business hours</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400 font-medium">Online</span>
              </div>
            </div>

            {/* FAQ accordion */}
            <div className="rounded-3xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <h3 className="text-lg font-black text-white" style={{ fontFamily: 'Urbanist, sans-serif' }}>
                  Frequently Asked
                </h3>
                <p className="text-white/40 text-xs mt-0.5">Quick answers to common questions</p>
              </div>
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {FAQ.map((item, i) => (
                  <div key={i} style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-white/5 transition-colors">
                      <span className="text-sm font-semibold text-white/80">{item.q}</span>
                      <motion.div animate={{ rotate: openFaq === i ? 45 : 0 }} transition={{ duration: 0.2 }}
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: openFaq === i ? 'rgba(232,184,75,0.2)' : 'rgba(255,255,255,0.06)', color: openFaq === i ? '#E8B84B' : 'rgba(255,255,255,0.4)' }}>
                        <ArrowRight className="w-3 h-3 -rotate-45" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {openFaq === i && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                          className="overflow-hidden">
                          <p className="px-5 pb-5 text-sm text-white/40 leading-relaxed">{item.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* Map placeholder / Office card */}
            <div className="rounded-3xl overflow-hidden relative"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', minHeight: 200 }}>
              <img
                src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&h=300&fit=crop&auto=format&q=70"
                alt="Office" className="w-full h-48 object-cover opacity-40" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 30%, #0a0f1a 100%)' }} />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span className="text-white font-bold text-sm">Kiray Bet Headquarters</span>
                </div>
                <p className="text-white/40 text-xs">Bole Road, Addis Ababa, Ethiopia</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* ── Bottom CTA ── */}
      <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <p className="text-white/30 text-sm mb-2">Still need help?</p>
          <h3 className="text-3xl font-black text-white mb-4" style={{ fontFamily: 'Urbanist, sans-serif' }}>
            Browse our{' '}
            <span style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Help Center
            </span>
          </h3>
          <p className="text-white/40 text-sm mb-6 max-w-md mx-auto">
            Find guides, tutorials, and answers to hundreds of questions in our comprehensive knowledge base.
          </p>
          <a href="#" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
            style={{ background: 'rgba(232,184,75,0.12)', border: '1px solid rgba(232,184,75,0.3)', color: '#E8B84B' }}>
            Visit Help Center <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
