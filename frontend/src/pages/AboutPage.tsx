import { useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import {
  ShieldCheck, Home, Users, CheckCircle, Award, Sparkles,
  MapPin, FileText, ArrowRight, HeartHandshake, Eye, Lock,
  TrendingUp, Building2, PhoneCall
} from 'lucide-react';

const STATS = [
  { value: '15,000+', label: 'Verified Listings', labelAm: 'የተረጋገጡ ቤቶች' },
  { value: '48,000+', label: 'Happy Tenants', labelAm: 'ረክተው የተከራዩ' },
  { value: '1,200+', label: 'Certified Brokers', labelAm: 'የተረጋገጡ ደላሎች' },
  { value: '100%', label: 'Secure Agreements', labelAm: 'ህጋዊ የኪራይ ውል' },
];

const PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Certified Brokers Only',
    titleAm: 'የተረጋገጡ ህጋዊ ደላሎች',
    desc: 'No more informal, unverified middlemen. Every broker on Kiray Bet undergoes strict identity verification and pays a commitment registration fee before admin approval.',
    color: '#E8B84B',
  },
  {
    icon: Home,
    title: 'Transparent Pricing in ETB',
    titleAm: 'ግልጽና ትክክለኛ የኪራይ ዋጋ',
    desc: 'Direct pricing from homeowners with zero hidden markups. Renters know exactly what they pay in Ethiopian Birr (ETB) before scheduling a viewing or making an inquiry.',
    color: '#4F8EF7',
  },
  {
    icon: FileText,
    title: 'Formal Digital Agreements',
    titleAm: 'ዘመናዊ ዲጂታል የኪራይ ውል',
    desc: 'Say goodbye to ambiguous verbal agreements. Kiray Bet generates comprehensive digital rental agreements with start/end dates, security deposits, and real-time alerts to both owner and tenant.',
    color: '#10B981',
  },
  {
    icon: Lock,
    title: 'Instant Property Protection',
    titleAm: 'የንብረት ጥበቃና ደህንነት',
    desc: 'The moment a lease is created, the house is automatically marked as rented and hidden from public searches, preventing double-booking and wasted tenant inquiries.',
    color: '#A855F7',
  },
];

const CITIES = [
  { name: 'Addis Ababa (አዲስ አበባ)', areas: 'Bole, Kazanchis, CMC, Old Airport, Piassa, Sar Bet, Megenagna, Gerji, Summit' },
  { name: 'Hawassa (ሀዋሳ)', areas: 'Lakefront Residences, Millennium, Piazza, Tabor' },
  { name: 'Bahir Dar (ባህር ዳር)', areas: 'Lake Tana Views, Kebele 04, Ginbot 20, Belay Zeleke' },
  { name: 'Adama & Bishoftu (አዳማ እና ቢሾፍቱ)', areas: 'Resort Zones, City Center, Lakeview Flats' },
  { name: 'Dire Dawa (ድሬዳዋ)', areas: 'Kezira, Megala, Taiwan Market Area' },
];

export default function AboutPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* ── 1. Hero Section ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24" style={{ background: '#070C17' }}>
        {/* Glow backdrop */}
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[140px] pointer-events-none opacity-20"
          style={{ background: 'radial-gradient(circle, #E8B84B 0%, #C9922A 50%, transparent 80%)' }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider mb-6"
            style={{ background: 'rgba(232,184,75,0.12)', borderColor: 'rgba(232,184,75,0.35)', color: '#E8B84B' }}
          >
            <Sparkles className="w-3.5 h-3.5" /> About Kiray Bet · ስለ ኪራይ ቤት
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-white leading-tight mb-6"
            style={{ fontFamily: 'Urbanist, sans-serif' }}
          >
            Reinventing How Ethiopia Rents Homes
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #E8B84B 0%, #F5D68A 50%, #C9922A 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              የኢትዮጵያ ቀዳሚና ዘመናዊ የቤት ኪራይ መድረክ
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto leading-relaxed mb-10"
          >
            <strong className="text-white">Kiray Bet (ኪራይ ቤት)</strong> bridges homeowners, certified brokers, and prospective tenants with complete transparency, verified listings, and secure digital agreements across Addis Ababa and throughout Ethiopia.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              to="/properties"
              className="px-8 py-3.5 rounded-xl font-bold text-sm text-[#070C17] transition-all hover:scale-105 shadow-xl shadow-amber-500/20"
              style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)' }}
            >
              Browse Available Homes
            </Link>
            <Link
              to="/contact"
              className="px-8 py-3.5 rounded-xl font-semibold text-sm text-white border-2 border-white/20 hover:border-white/50 transition-all hover:bg-white/5"
            >
              Contact Our Team
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── 2. The Story & Ethiopian Mission ────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
                Our Story · የኛ ታሪክ
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-foreground mt-2 mb-6" style={{ fontFamily: 'Urbanist, sans-serif' }}>
                Why Kiray Bet Was Built for Ethiopia
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed text-sm md:text-base">
                <p>
                  For decades, finding a rental home in Ethiopia meant relying on informal, street-level middlemen (*delalas*), vague phone calls, unverified photos, and exhausting physical travel between neighborhoods like Bole, Kazanchis, and CMC.
                </p>
                <p>
                  Landlords lacked trusted professionals to represent their properties. Tenants faced surprise rate hikes and handshake agreements that frequently caused bitter disputes.
                </p>
                <p className="font-semibold text-foreground">
                  Kiray Bet was founded to change this reality forever.
                </p>
                <p>
                  We created a verified 3-way platform: <strong>Homeowners</strong> submit their properties; <strong>Certified Brokers</strong> (screened, approved, and backed by a financial commitment fee) review and publish listings; and <strong>Renters</strong> discover authentic homes with verified ETB pricing, instant messaging, and legally binding digital lease contracts.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-border">
                <img
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&h=750&fit=crop&auto=format&q=80"
                  alt="Modern Home in Addis Ababa"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 p-6 rounded-2xl bg-[#070C17] text-white border border-white/10 shadow-2xl max-w-xs hidden sm:block">
                <p className="text-xs font-bold uppercase text-amber-400 mb-1 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4" /> Trusted & Verified
                </p>
                <p className="text-xs text-white/70 leading-relaxed">
                  Every house listed on Kiray Bet is reviewed by an approved broker and confirmed by the owner before going live.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. The 4 Core Pillars ────────────────────────────────────────── */}
      <section className="py-20" style={{ background: '#070C17' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#E8B84B' }}>
              Core Pillars · ዋና ዋና መርሆዎች
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white mt-2 mb-4" style={{ fontFamily: 'Urbanist, sans-serif' }}>
              How Kiray Bet Protects You
            </h2>
            <p className="text-sm text-white/60">
              Built from the ground up to solve the real challenges of Ethiopian property rentals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PILLARS.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-3xl border flex flex-col transition-all hover:-translate-y-1"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: `${p.color}20`, border: `1px solid ${p.color}40` }}
                >
                  <p.icon className="w-6 h-6" style={{ color: p.color }} />
                </div>
                <h3 className="text-white font-bold text-lg mb-1" style={{ fontFamily: 'Urbanist, sans-serif' }}>
                  {p.title}
                </h3>
                <span className="text-xs font-semibold mb-3" style={{ color: p.color }}>
                  {p.titleAm}
                </span>
                <p className="text-xs text-white/60 leading-relaxed mt-auto">
                  {p.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Key Metrics ──────────────────────────────────────────────── */}
      <section className="py-16 bg-background border-y border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div
                  className="text-4xl md:text-5xl font-black mb-1"
                  style={{
                    fontFamily: 'Urbanist, sans-serif',
                    background: 'linear-gradient(135deg, #E8B84B, #C9922A)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {s.value}
                </div>
                <div className="font-bold text-foreground text-sm">{s.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.labelAm}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Cities We Serve in Ethiopia ───────────────────────────────── */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
              Coverage · የአገልግሎት ክልሎች
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-foreground mt-2 mb-4" style={{ fontFamily: 'Urbanist, sans-serif' }}>
              Active Across Major Ethiopian Hubs
            </h2>
            <p className="text-sm text-muted-foreground">
              From the bustling metropolis of Addis Ababa to lakeside residences in Hawassa and Bahir Dar.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CITIES.map((c) => (
              <div key={c.name} className="p-6 rounded-3xl bg-card border border-border shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-foreground text-base">{c.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pl-7">
                  {c.areas}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Bottom Call to Action ─────────────────────────────────────── */}
      <section className="py-20" style={{ background: '#04080F' }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4" style={{ fontFamily: 'Urbanist, sans-serif' }}>
            Ready to Find or List Your Home?
          </h2>
          <p className="text-white/60 text-sm md:text-base mb-8 max-w-xl mx-auto">
            Join thousands of Ethiopian landlords, certified brokers, and satisfied tenants on Kiray Bet today.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/properties"
              className="px-8 py-3.5 rounded-xl font-bold text-sm text-[#070C17] transition-all hover:scale-105 shadow-xl"
              style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)' }}
            >
              Search Available Rentals
            </Link>
            <Link
              to="/signup"
              className="px-8 py-3.5 rounded-xl font-bold text-sm text-white border-2 border-white/20 hover:border-white/50 transition-all hover:bg-white/5"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
