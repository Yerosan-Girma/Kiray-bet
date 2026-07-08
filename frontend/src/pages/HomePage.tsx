import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import {
  Search, MapPin, Home, Building2, Star, Heart, ArrowRight, ChevronDown,
  Menu, X, Phone, Mail, Bed, Bath, Square, Shield, TrendingUp, Users,
  CheckCircle, Play, Quote, Send, Facebook, Twitter, Instagram, Youtube,
  Wifi, Car, Waves, Dumbbell, Trees, ChevronLeft, ChevronRight as ChevronR,
  Eye, Award, Clock, Zap, Filter,
} from "lucide-react";

// ─── Imports ──────────────────────────────────────────────────────────────────
import FeaturedProperties from "../components/property/FeaturedProperties";
import { use3DTilt } from "../hooks/use3DTilt";

// ─── Images ───────────────────────────────────────────────────────────────────
const HQ = (id: string, w = 800, h = 600) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format&q=80`;

const HERO_BG    = "1600596542815-ffad4c1539a9";
const HERO_BG_2  = "1564013799919-ab600027ffc6";



const LOCATIONS = [
  { name:"Nairobi",  count:1240, image:"1611348586804-61bf6c080437" },
  { name:"Mombasa",  count:382,  image:"1572804013309-59a88b7e92f1" },
  { name:"Kisumu",   count:156,  image:"1565876427310-a8dbde24bb16" },
  { name:"Nakuru",   count:98,   image:"1582719508461-905c673771fd" },
  { name:"Eldoret",  count:74,   image:"1509909756405-be0199881695" },
];

const TESTIMONIALS = [
  { name:"Amara Odhiambo",   role:"Business Executive",   avatar:"1494790108755-2616b7b4e9f4", text:"Found my dream penthouse in under 48 hours. The 3D virtual tours were jaw-dropping — felt like I was already living there before I signed.",    rating:5 },
  { name:"David Mwangi",     role:"Property Investor",    avatar:"1507003211169-0a1dd7228f2d", text:"Listed five properties and got qualified tenants within days. The analytics dashboard gives me everything I need to manage my portfolio.", rating:5 },
  { name:"Fatima Al-Rashid", role:"Relocating Professional",avatar:"1438761681033-6461ffad8d80",text:"Moving from Dubai, I needed a trusted platform. NestHub delivered — verified listings, instant responses, seamless onboarding.",          rating:5 },
];

const STATS = [
  { value: 15000, suffix: "+", label: "Properties Listed"  },
  { value: 48000, suffix: "+", label: "Happy Tenants"      },
  { value: 98,    suffix: "%", label: "Satisfaction Rate"  },
  { value: 200,   suffix: "+", label: "Cities Covered"     },
];

const AMENITIES = [
  { icon: Wifi,     label: "High-Speed WiFi" },
  { icon: Car,      label: "Secure Parking"  },
  { icon: Waves,    label: "Swimming Pool"   },
  { icon: Dumbbell, label: "Gym & Fitness"   },
  { icon: Trees,    label: "Private Garden"  },
  { icon: Shield,   label: "24/7 Security"   },
];

const STEPS = [
  { n:"01", title:"Search & Discover",  desc:"Browse thousands of verified listings with our smart search. Filter by location, budget, type, and amenities to find your perfect match.",   icon: Search    },
  { n:"02", title:"Tour & Connect",     desc:"Schedule virtual 3D tours or in-person visits. Chat directly with property owners and brokers through our secure messaging platform.", icon: Eye       },
  { n:"03", title:"Move In & Settle",   desc:"Complete secure payments, sign digital contracts, and get 24/7 support from our dedicated team throughout your entire journey.",         icon: Home      },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useCounter(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let frame = 0;
    const totalFrames = Math.round(duration / 16);
    const timer = setInterval(() => {
      frame++;
      setCount(Math.round(target * (frame / totalFrames)));
      if (frame >= totalFrames) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, start]);
  return count;
}


// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const [tab, setTab] = useState<"rent"|"buy"|"short-stay">("rent");
  const [propType, setPropType] = useState("");
  const [location, setLocation] = useState("");
  const [bg, setBg] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const imgY    = useTransform(scrollYProgress, [0, 1], ["0%",  "25%"]);
  const textY   = useTransform(scrollYProgress, [0, 1], ["0%",  "15%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    const t = setInterval(() => setBg(b => (b + 1) % 2), 7000);
    return () => clearInterval(t);
  }, []);

  const heroImages = [HERO_BG, HERO_BG_2];

  return (
    <section ref={heroRef} className="relative h-screen min-h-[700px] overflow-hidden flex items-center justify-center" style={{ position: "relative" }}>
      {/* Background images with crossfade */}
      {heroImages.map((id, i) => (
        <motion.div key={id} className="absolute inset-0"
          style={{ y: imgY }}
          animate={{ opacity: bg === i ? 1 : 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}>
          <img src={HQ(id, 1920, 1080)} alt="Luxury property" className="w-full h-full object-cover scale-105" />
        </motion.div>
      ))}

      {/* Deep cinematic overlay — gradient layers */}
      <div className="absolute inset-0" style={{
        background: "linear-gradient(180deg, rgba(7,12,23,0.45) 0%, rgba(7,12,23,0.3) 40%, rgba(7,12,23,0.75) 100%)"
      }} />
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(7,12,23,0.9) 0%, transparent 70%)"
      }} />

      {/* Floating glow orbs */}
      <div className="absolute top-24 left-12 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #E8B84B, transparent)" }} />
      <div className="absolute bottom-32 right-16 w-96 h-96 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: "radial-gradient(circle, #0EA5E9, transparent)" }} />

      {/* Hero content */}
      <motion.div style={{ y: textY, opacity }} className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border text-sm font-medium"
            style={{ background: "rgba(232,184,75,0.12)", borderColor: "rgba(232,184,75,0.35)", color: "#E8B84B" }}>
            <Zap className="w-3.5 h-3.5" />
            #1 Rental Platform in East Africa
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.3 }}
            className="font-black text-white leading-none mb-6"
            style={{ fontFamily: "Urbanist, sans-serif", fontSize: "clamp(2.8rem, 7vw, 5.5rem)", letterSpacing: "-0.03em" }}>
            Find Your Perfect
            <br />
            <span className="relative inline-block">
              <span style={{ background: "linear-gradient(135deg, #E8B84B 0%, #F5D68A 40%, #C9922A 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Dream Home
              </span>
              <motion.div className="absolute -bottom-2 left-0 right-0 h-1 rounded-full"
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1, delay: 1.2 }}
                style={{ background: "linear-gradient(90deg, #E8B84B, #C9922A)", transformOrigin: "left" }} />
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }}
            className="text-lg text-white/65 mb-10 max-w-2xl mx-auto leading-relaxed">
            Discover 15,000+ verified rental properties across East Africa. From luxury villas to cozy studios — your next chapter starts here.
          </motion.p>

          {/* Search Card — glassmorphism */}
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)" }}>

            {/* Tabs */}
            <div className="flex border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              {(["rent","buy","short-stay"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className="flex-1 py-4 text-sm font-semibold capitalize transition-all duration-300 relative"
                  style={{ color: tab === t ? "#E8B84B" : "rgba(255,255,255,0.5)" }}>
                  {t.replace("-", " ")}
                  {tab === t && (
                    <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                      style={{ background: "linear-gradient(90deg, #E8B84B, #C9922A)" }} />
                  )}
                </button>
              ))}
            </div>

            {/* Inputs */}
            <div className="p-5 flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#E8B84B" }} />
                <input value={location} onChange={e => setLocation(e.target.value)}
                  placeholder="Enter city or neighborhood…"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-medium placeholder:text-white/40 text-white focus:outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                  onFocus={e => { e.currentTarget.style.borderColor = "rgba(232,184,75,0.5)"; e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
                  onBlur={e  => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }} />
              </div>
              <div className="relative md:w-44">
                <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#E8B84B" }} />
                <select value={propType} onChange={e => setPropType(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-medium focus:outline-none appearance-none transition-all"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: propType ? "white" : "rgba(255,255,255,0.4)" }}>
                  <option value="">Property Type</option>
                  {["Villa","Apartment","Studio","Penthouse","Beach House","House"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <button className="flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 hover:shadow-2xl hover:scale-105 active:scale-95"
                style={{ background: "linear-gradient(135deg, #E8B84B 0%, #C9922A 100%)", color: "#070C17", boxShadow: "0 8px 32px rgba(232,184,75,0.4)" }}>
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>

            {/* Quick tags */}
            <div className="px-5 pb-4 flex flex-wrap gap-2">
              {["🔥 Westlands","⭐ Karen","🌊 Nyali","🏙 Kilimani","🌿 Lavington"].map(tag => (
                <button key={tag} className="text-xs px-3 py-1.5 rounded-full font-medium transition-all hover:scale-105"
                  style={{ background: "rgba(232,184,75,0.12)", color: "#E8B84B", border: "1px solid rgba(232,184,75,0.25)" }}>
                  {tag}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Floating stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1 }}
            className="flex flex-wrap justify-center gap-6 mt-8">
            {[["15K+","Listings"],["48K+","Happy Tenants"],["98%","Satisfaction"]].map(([v, l]) => (
              <div key={l} className="flex items-center gap-2">
                <span className="font-black text-white text-lg" style={{ fontFamily: "Urbanist, sans-serif" }}>{v}</span>
                <span className="text-white/50 text-sm">{l}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        <span className="text-xs text-white/40 font-medium tracking-widest uppercase">Scroll to explore</span>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="w-5 h-8 rounded-full border flex items-start justify-center pt-1.5"
          style={{ borderColor: "rgba(255,255,255,0.3)" }}>
          <div className="w-1 h-2 rounded-full bg-white/50" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ─── Trust Strip ──────────────────────────────────────────────────────────────
function TrustStrip() {
  const items = [
    { icon: Shield,     label: "Verified Listings"   },
    { icon: Award,      label: "Premium Properties"  },
    { icon: Clock,      label: "24/7 Support"         },
    { icon: CheckCircle,label: "Secure Payments"     },
    { icon: TrendingUp, label: "Best Price Guarantee"},
    { icon: Users,      label: "Trusted Community"   },
  ];
  return (
    <section className="py-5 border-y overflow-hidden" style={{ background: "#070C17", borderColor: "rgba(232,184,75,0.2)" }}>
      <div className="flex animate-marquee-slow whitespace-nowrap gap-16 items-center px-8">
        {[...items, ...items].map((item, i) => (
          <div key={i} className="inline-flex items-center gap-2.5 shrink-0">
            <item.icon className="w-4 h-4" style={{ color: "#E8B84B" }} />
            <span className="text-sm font-medium text-white/60">{item.label}</span>
            <span className="text-white/20 ml-8">·</span>
          </div>
        ))}
      </div>
      <style>{`@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}.animate-marquee-slow{animation:marquee 30s linear infinite}`}</style>
    </section>
  );
}

// ─── Property Card (3D Tilt) ──────────────────────────────────────────────────


// ─── Locations ────────────────────────────────────────────────────────────────
function PopularLocations() {
  return (
    <section id="locations" className="py-24" style={{ background: "#070C17" }}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-14">
          <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#E8B84B" }}>Explore Cities</span>
          <h2 className="text-4xl md:text-5xl font-black text-white mt-2" style={{ fontFamily: "Urbanist, sans-serif" }}>Popular Locations</h2>
          <p className="text-white/50 mt-3 max-w-lg mx-auto text-sm">Discover premium rentals in the most sought-after cities across East Africa</p>
        </motion.div>

        {/* Large featured + small grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Large card */}
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="col-span-2 row-span-2 relative rounded-3xl overflow-hidden cursor-pointer group"
            style={{ minHeight: 360 }}>
            <img src={HQ(LOCATIONS[0].image, 800, 700)} alt={LOCATIONS[0].name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 absolute inset-0" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 30%, rgba(7,12,23,0.9) 100%)" }} />
            <div className="absolute bottom-0 left-0 right-0 p-7">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-3"
                style={{ background: "rgba(232,184,75,0.2)", border: "1px solid rgba(232,184,75,0.4)", color: "#E8B84B" }}>
                <MapPin className="w-3 h-3" /> Top City
              </div>
              <h3 className="text-3xl font-black text-white mb-1" style={{ fontFamily: "Urbanist, sans-serif" }}>{LOCATIONS[0].name}</h3>
              <p className="text-white/60 text-sm">{LOCATIONS[0].count.toLocaleString()} properties available</p>
              <button className="mt-4 flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all" style={{ color: "#E8B84B" }}>
                Explore <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* Smaller cards */}
          {LOCATIONS.slice(1).map((loc, i) => (
            <motion.div key={loc.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="relative rounded-2xl overflow-hidden cursor-pointer group" style={{ minHeight: 170 }}>
              <img src={HQ(loc.image, 400, 350)} alt={loc.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 absolute inset-0" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 20%, rgba(7,12,23,0.85) 100%)" }} />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="font-black text-white text-lg" style={{ fontFamily: "Urbanist, sans-serif" }}>{loc.name}</h3>
                <p className="text-white/55 text-xs">{loc.count} listings</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
const HOW_STEPS = [
  {
    n: "01",
    title: "Search & Discover",
    subtitle: "Find your match",
    desc: "Browse 15,000+ verified listings with smart filters. Search by location, budget, amenities, and property type to pinpoint exactly what you need.",
    icon: Search,
    color: "#4F8EF7",
    glow: "rgba(79,142,247,0.18)",
    features: ["Smart filters", "Map view", "Price alerts"],
    image: "1512917774080-9991f1c4c750",
  },
  {
    n: "02",
    title: "Tour & Connect",
    subtitle: "Experience before you commit",
    desc: "Schedule immersive 3D virtual tours or in-person visits. Chat directly with owners and brokers through our secure, real-time messaging platform.",
    icon: Eye,
    color: "#E8B84B",
    glow: "rgba(232,184,75,0.18)",
    features: ["3D virtual tours", "Live video calls", "Instant messaging"],
    image: "1600607687939-ce8a6c25118c",
  },
  {
    n: "03",
    title: "Move In & Settle",
    subtitle: "Start your new chapter",
    desc: "Complete secure payments, sign digital contracts, and get dedicated 24/7 support from our team throughout your entire rental journey.",
    icon: Home,
    color: "#34D399",
    glow: "rgba(52,211,153,0.18)",
    features: ["Digital contracts", "Secure payments", "24/7 support"],
    image: "1570129477492-45c003edd2be",
  },
];

function HowItWorks() {
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [lineWidth, setLineWidth] = useState(0);

  // Animate the progress line as user clicks through steps
  useEffect(() => {
    setLineWidth((active / (HOW_STEPS.length - 1)) * 100);
  }, [active]);

  // Auto-advance
  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % HOW_STEPS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const step = HOW_STEPS[active];

  return (
    <section id="how-it-works" ref={sectionRef} className="py-28 relative overflow-hidden"
      style={{ background: "#070C17" }}>

      {/* Animated background gradient that shifts with active step */}
      <motion.div className="absolute inset-0 pointer-events-none"
        animate={{ background: `radial-gradient(ellipse 70% 50% at 50% 50%, ${step.glow}, transparent)` }}
        transition={{ duration: 0.8, ease: "easeInOut" }} />

      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
            style={{ background: "rgba(232,184,75,0.12)", border: "1px solid rgba(232,184,75,0.3)", color: "#E8B84B" }}>
            <Zap className="w-3 h-3" /> Simple Process
          </motion.span>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-4"
            style={{ fontFamily: "Urbanist, sans-serif", letterSpacing: "-0.03em" }}>
            How It Works
          </h2>
          <p className="text-white/40 max-w-md mx-auto text-sm leading-relaxed">
            From first search to moving in — three effortless steps to your new home.
          </p>
        </motion.div>

        {/* Step tabs with animated progress bar */}
        <div className="max-w-2xl mx-auto mb-14">
          <div className="flex items-center gap-0 relative">
            {/* Background track */}
            <div className="absolute top-5 left-5 right-5 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
            {/* Animated fill */}
            <motion.div className="absolute top-5 left-5 h-px origin-left"
              animate={{ width: `${lineWidth}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{ background: `linear-gradient(90deg, ${HOW_STEPS[0].color}, ${step.color})` }} />

            {HOW_STEPS.map((s, i) => (
              <button key={s.n} onClick={() => setActive(i)}
                className="flex-1 flex flex-col items-center gap-3 relative z-10 group">
                {/* Node circle */}
                <motion.div
                  animate={{
                    background: active >= i
                      ? `linear-gradient(135deg, ${s.color}, ${s.color}cc)`
                      : "rgba(255,255,255,0.08)",
                    borderColor: active >= i ? s.color : "rgba(255,255,255,0.15)",
                    scale: active === i ? 1.2 : 1,
                    boxShadow: active === i ? `0 0 20px ${s.color}66` : "none",
                  }}
                  transition={{ duration: 0.4 }}
                  className="w-10 h-10 rounded-full border-2 flex items-center justify-center">
                  {active > i
                    ? <CheckCircle className="w-4 h-4 text-white" />
                    : <span className="text-xs font-black text-white">{i + 1}</span>}
                </motion.div>
                <motion.span
                  animate={{ color: active === i ? "#fff" : "rgba(255,255,255,0.35)", fontWeight: active === i ? 700 : 500 }}
                  className="text-xs text-center hidden sm:block leading-tight px-1">
                  {s.title}
                </motion.span>
              </button>
            ))}
          </div>
        </div>

        {/* Main card — full-width animated switcher */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div key={active}
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.97 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="grid md:grid-cols-2 gap-0 rounded-3xl overflow-hidden"
              style={{ border: `1px solid ${step.color}30`, background: "rgba(255,255,255,0.03)", backdropFilter: "blur(20px)" }}>

              {/* Left — content */}
              <div className="p-10 md:p-14 flex flex-col justify-center relative overflow-hidden">
                {/* Large ghost number behind content */}
                <div className="absolute -top-4 -left-2 text-[10rem] font-black leading-none select-none pointer-events-none"
                  style={{ fontFamily: "Urbanist, sans-serif", color: `${step.color}08` }}>
                  {step.n}
                </div>

                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15, duration: 0.5 }} className="relative z-10">

                  {/* Step badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-5"
                    style={{ background: `${step.color}18`, border: `1px solid ${step.color}40`, color: step.color }}>
                    <span className="font-black">STEP {step.n}</span>
                    <span className="opacity-60">·</span>
                    {step.subtitle}
                  </div>

                  <h3 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight"
                    style={{ fontFamily: "Urbanist, sans-serif" }}>
                    {step.title}
                  </h3>
                  <p className="text-white/50 leading-relaxed mb-8 text-sm">
                    {step.desc}
                  </p>

                  {/* Feature chips */}
                  <div className="flex flex-wrap gap-2 mb-8">
                    {step.features.map((f, fi) => (
                      <motion.div key={f}
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.25 + fi * 0.07, type: "spring", stiffness: 400, damping: 20 }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                        style={{ background: `${step.color}14`, border: `1px solid ${step.color}30`, color: step.color }}>
                        <CheckCircle className="w-3 h-3" />
                        {f}
                      </motion.div>
                    ))}
                  </div>

                  {/* Animated icon + CTA */}
                  <div className="flex items-center gap-4">
                    <motion.div
                      animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${step.color}20, ${step.color}08)`, border: `1px solid ${step.color}35` }}>
                      <step.icon className="w-6 h-6" style={{ color: step.color }} />
                    </motion.div>
                    <button className="group flex items-center gap-2 text-sm font-bold transition-all"
                      style={{ color: step.color }}>
                      Get started
                      <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>
                        <ArrowRight className="w-4 h-4" />
                      </motion.span>
                    </button>
                  </div>
                </motion.div>
              </div>

              {/* Right — image with layered overlays */}
              <div className="relative min-h-[320px] md:min-h-0 overflow-hidden">
                <motion.img key={step.image}
                  src={HQ(step.image, 700, 600)}
                  alt={step.title}
                  initial={{ opacity: 0, scale: 1.08 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.08 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="absolute inset-0 w-full h-full object-cover" />

                {/* Gradient overlay */}
                <div className="absolute inset-0"
                  style={{ background: `linear-gradient(135deg, rgba(7,12,23,0.6) 0%, rgba(7,12,23,0.1) 60%, ${step.color}22 100%)` }} />

                {/* Floating stat card */}
                <motion.div
                  initial={{ opacity: 0, y: 20, x: 20 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="absolute bottom-6 right-6 px-4 py-3 rounded-2xl"
                  style={{ background: "rgba(7,12,23,0.75)", backdropFilter: "blur(16px)", border: `1px solid ${step.color}30` }}>
                  <div className="flex items-center gap-2.5">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: step.color, boxShadow: `0 0 8px ${step.color}` }} />
                    <div>
                      <p className="text-white text-xs font-bold">
                        {["15,420 listings found", "Virtual tour available", "Move-in ready"][active]}
                      </p>
                      <p className="text-white/40 text-xs">
                        {["Updated just now", "3D + video tours", "Digital contract"][active]}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Step number watermark */}
                <div className="absolute top-5 left-5 font-black text-5xl leading-none select-none"
                  style={{ fontFamily: "Urbanist, sans-serif", color: "rgba(255,255,255,0.07)" }}>
                  {step.n}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom mini cards — all three at a glance */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {HOW_STEPS.map((s, i) => (
            <motion.button key={s.n} onClick={() => setActive(i)}
              whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
              className="p-4 rounded-2xl text-left transition-all duration-300 relative overflow-hidden"
              style={{
                background: active === i ? `${s.color}10` : "rgba(255,255,255,0.03)",
                border: `1px solid ${active === i ? s.color + "40" : "rgba(255,255,255,0.08)"}`,
              }}>
              {/* Pulse ring on active */}
              {active === i && (
                <motion.div className="absolute inset-0 rounded-2xl pointer-events-none"
                  animate={{ boxShadow: [`0 0 0 0px ${s.color}40`, `0 0 0 6px ${s.color}00`] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut" }} />
              )}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${s.color}15` }}>
                  <s.icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <span className="text-xs font-black text-white/30">{s.n}</span>
              </div>
              <p className="text-xs font-bold text-white/80 leading-snug">{s.title}</p>
              {active === i && (
                <motion.div className="absolute bottom-0 left-0 h-0.5 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 4, ease: "linear" }}
                  style={{ background: `linear-gradient(90deg, ${s.color}, ${s.color}60)` }} />
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Statistics ───────────────────────────────────────────────────────────────
function Statistics() {
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.4 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="about" ref={ref} className="py-24 relative overflow-hidden" style={{ background: "#070C17" }}>
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img src={HQ("1600596542815-ffad4c1539a9", 1920, 600)} alt="" className="w-full h-full object-cover opacity-15" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #070C17 0%, rgba(7,12,23,0.7) 50%, #070C17 100%)" }} />
      </div>

      {/* Grid lines decoration */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "linear-gradient(rgba(232,184,75,1) 1px, transparent 1px), linear-gradient(90deg, rgba(232,184,75,1) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-14">
          <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#E8B84B" }}>By The Numbers</span>
          <h2 className="text-4xl md:text-5xl font-black text-white mt-2" style={{ fontFamily: "Urbanist, sans-serif" }}>
            Trusted by Thousands
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s, i) => {
            const count = useCounter(s.value, 2500, started);
            return (
              <motion.div key={s.label} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.1 }}
                className="text-center p-8 rounded-3xl border relative overflow-hidden group"
                style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(232,184,75,0.2)", backdropFilter: "blur(12px)" }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "radial-gradient(circle at center, rgba(232,184,75,0.08), transparent 70%)" }} />
                <div className="text-4xl md:text-5xl font-black mb-2 relative" style={{ fontFamily: "Urbanist, sans-serif", background: "linear-gradient(135deg, #E8B84B, #F5D68A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {count.toLocaleString()}{s.suffix}
                </div>
                <div className="text-sm font-medium text-white/60">{s.label}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Amenities */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {AMENITIES.map((a, i) => (
            <motion.div key={a.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.07 }}
              className="flex flex-col items-center gap-3 p-4 rounded-2xl border text-center group hover:-translate-y-1 transition-all duration-300 cursor-default"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(232,184,75,0.35)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(232,184,75,0.12)" }}>
                <a.icon className="w-5 h-5" style={{ color: "#E8B84B" }} />
              </div>
              <span className="text-xs font-medium text-white/60">{a.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function Testimonials() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-40 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(232,184,75,0.06), transparent)" }} />

      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-16">
          <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#C9922A" }}>Testimonials</span>
          <h2 className="text-4xl md:text-5xl font-black text-foreground mt-2" style={{ fontFamily: "Urbanist, sans-serif" }}>
            What Our Clients Say
          </h2>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div key={active} initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }} transition={{ duration: 0.5 }}
                className="p-10 rounded-3xl border text-center relative"
                style={{ background: "rgba(232,184,75,0.04)", borderColor: "rgba(232,184,75,0.2)", backdropFilter: "blur(20px)" }}>
                <Quote className="w-10 h-10 mx-auto mb-6 opacity-30" style={{ color: "#E8B84B" }} />
                <p className="text-lg text-foreground leading-relaxed mb-8 font-medium">
                  "{TESTIMONIALS[active].text}"
                </p>
                <div className="flex items-center justify-center gap-4">
                  <img src={`https://images.unsplash.com/photo-${TESTIMONIALS[active].avatar}?w=56&h=56&fit=crop&auto=format`}
                    alt={TESTIMONIALS[active].name} className="w-14 h-14 rounded-full object-cover ring-2"
                    style={{ ringColor: "#E8B84B" }} />
                  <div className="text-left">
                    <p className="font-bold text-foreground" style={{ fontFamily: "Urbanist, sans-serif" }}>{TESTIMONIALS[active].name}</p>
                    <p className="text-sm text-muted-foreground">{TESTIMONIALS[active].role}</p>
                    <div className="flex gap-0.5 mt-1">
                      {Array.from({ length: TESTIMONIALS[active].rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {TESTIMONIALS.map((_, i) => (
                <button key={i} onClick={() => setActive(i)}
                  className="transition-all duration-300 rounded-full"
                  style={{ width: active === i ? 28 : 8, height: 8, background: active === i ? "#E8B84B" : "var(--border)" }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Newsletter ───────────────────────────────────────────────────────────────
function Newsletter() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <section id="contact" className="py-20 relative overflow-hidden" style={{ background: "#070C17" }}>
      {/* Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[300px] rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(ellipse, #E8B84B, transparent)" }} />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#E8B84B" }}>Newsletter</span>
          <h2 className="text-4xl md:text-5xl font-black text-white mt-3 mb-4" style={{ fontFamily: "Urbanist, sans-serif" }}>
            Never Miss a<br />Dream Property
          </h2>
          <p className="text-white/50 text-sm mb-8 max-w-md mx-auto">
            Get curated property alerts, market insights, and exclusive deals delivered to your inbox weekly.
          </p>

          {!sent ? (
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 px-5 py-4 rounded-2xl text-sm text-white placeholder:text-white/40 focus:outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                onFocus={e => { e.currentTarget.style.borderColor = "rgba(232,184,75,0.5)"; }}
                onBlur={e  => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }} />
              <button onClick={() => { if(email) setSent(true); }}
                className="flex items-center justify-center gap-2 px-7 py-4 rounded-2xl font-bold text-sm transition-all hover:scale-105 hover:shadow-2xl active:scale-95"
                style={{ background: "linear-gradient(135deg, #E8B84B, #C9922A)", color: "#070C17", boxShadow: "0 8px 32px rgba(232,184,75,0.35)" }}>
                <Send className="w-4 h-4" /> Subscribe
              </button>
            </div>
          ) : (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-3 py-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: "rgba(232,184,75,0.15)", border: "1px solid rgba(232,184,75,0.4)" }}>
                <CheckCircle className="w-7 h-7" style={{ color: "#E8B84B" }} />
              </div>
              <p className="text-white font-semibold">You're in! Welcome to NestHub Insiders.</p>
              <p className="text-white/40 text-sm">Check your inbox for a welcome gift.</p>
            </motion.div>
          )}

          <p className="text-white/30 text-xs mt-4">No spam, ever. Unsubscribe anytime.</p>
        </motion.div>
      </div>
    </section>
  );
}



// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    { q:"How do I list my property on NestHub?",          a:"Create an account, choose Owner or Broker, then click 'List Property'. Our guided flow helps you add photos, set pricing, and publish in under 10 minutes." },
    { q:"Are all listings verified?",                      a:"Yes. Every listing goes through our 3-step verification: document check, physical inspection, and owner ID confirmation before going live." },
    { q:"What payment methods are accepted?",             a:"We support M-Pesa, credit/debit cards, and bank transfers. All transactions are encrypted and processed via our secure payment gateway." },
    { q:"Can I schedule a virtual tour before visiting?", a:"Absolutely. Most premium listings include immersive 3D virtual tours. You can also request a live video tour with the owner through our chat system." },
    { q:"What happens if I have a dispute with a landlord?",a:"Our dedicated mediation team handles disputes within 48 hours. We hold payments in escrow until both parties confirm satisfaction." },
  ];

  return (
    <section className="py-24 bg-background">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-14">
          <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#C9922A" }}>FAQ</span>
          <h2 className="text-4xl md:text-5xl font-black text-foreground mt-2" style={{ fontFamily: "Urbanist, sans-serif" }}>
            Common Questions
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.07 }}
              className="rounded-2xl border overflow-hidden transition-all"
              style={{ borderColor: open === i ? "rgba(201,146,42,0.4)" : "var(--border)", background: open === i ? "rgba(232,184,75,0.04)" : "var(--card)" }}>
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left transition-colors">
                <span className="font-semibold text-foreground text-sm pr-4" style={{ fontFamily: "Urbanist, sans-serif" }}>{faq.q}</span>
                <motion.div animate={{ rotate: open === i ? 45 : 0 }} transition={{ duration: 0.25 }} className="shrink-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: open === i ? "rgba(201,146,42,0.15)" : "var(--muted)" }}>
                    <ChevronDown className="w-4 h-4" style={{ color: open === i ? "#C9922A" : "var(--muted-foreground)" }} />
                  </div>
                </motion.div>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                    <div className="px-6 pb-5">
                      <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <FeaturedProperties />
      <PopularLocations />
      <HowItWorks />
      <Statistics />
      <Testimonials />
      <FAQ />
      <Newsletter />
    </>
  );
}
