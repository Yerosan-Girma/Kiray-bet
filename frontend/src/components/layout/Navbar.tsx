import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Home, Menu, X, CheckCircle, User, LogOut, Heart,
  MessageSquare, Mail, ShieldCheck, Sparkles, Building2,
  MapPin, PhoneCall, ChevronRight, Award, PlusCircle
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import NotificationCenter from "../notifications/NotificationCenter";

// Main navigation items
const NAV_LINKS = [
  { label: "Properties",   hash: "properties",   href: "/#properties", icon: Home },
  { label: "Locations",    hash: "locations",    href: "/#locations",   icon: MapPin },
  { label: "How It Works", hash: "how-it-works", href: "/#how-it-works",icon: Sparkles },
  { label: "About",        hash: null,           href: "/about",        icon: Building2 },
  { label: "Contact",      hash: null,           href: "/contact",      icon: PhoneCall },
];

function smoothScrollTo(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authModal, setAuthModal] = useState<"list" | null>(null);
  const [activeHash, setActiveHash] = useState("");

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  // Track scroll position for navbar transparency & shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Track which section is in view on homepage for active highlight
  useEffect(() => {
    if (location.pathname !== '/') { setActiveHash(""); return; }
    const ids = NAV_LINKS.filter(l => l.hash).map(l => l.hash!);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveHash(entry.target.id);
        });
      },
      { threshold: 0.3 }
    );
    ids.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [location.pathname]);

  function handleHashNav(hash: string) {
    setOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => smoothScrollTo(hash), 350);
    } else {
      smoothScrollTo(hash);
    }
  }

  const isActive = (link: typeof NAV_LINKS[0]) => {
    if (link.href === "/contact") return location.pathname === "/contact";
    if (link.href === "/about") return location.pathname === "/about";
    return location.pathname === "/" && activeHash === link.hash;
  };

  // Header background condition: solid on any non-home page, or when scrolled, or when mobile drawer is open
  const isSolidHeader = scrolled || location.pathname !== '/' || open;

  // Helper for role badge display
  function getRoleBadge(u: any) {
    if (u.role === 'admin') {
      return { label: 'Admin', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
    }
    if (u.role === 'broker') {
      return u.isApproved
        ? { label: 'Verified Broker', color: 'bg-green-500/20 text-green-300 border-green-500/30' }
        : { label: 'Broker (Pending)', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' };
    }
    if (u.role === 'owner') {
      return { label: 'Property Owner', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    }
    return { label: 'Verified Renter', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
  }

  const roleBadge = user ? getRoleBadge(user) : null;

  return (
    <>
      <motion.header
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isSolidHeader
            ? "bg-[#070C17]/95 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/50"
            : "bg-[#070C17]/50 md:bg-transparent backdrop-blur-md md:backdrop-blur-none border-b border-white/5 md:border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 sm:h-20 flex items-center justify-between py-3">
          {/* Logo */}
          <Link
            to="/"
            onClick={() => { if (location.pathname === '/') window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="flex items-center gap-2.5 sm:gap-3 group shrink-0"
          >
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-lg shadow-amber-500/25 shrink-0"
              style={{ background: "linear-gradient(135deg, #E8B84B 0%, #C9922A 100%)" }}
            >
              <Home className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#070C17] relative z-10" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity" />
            </div>
            <div className="flex flex-col min-w-0">
              <span
                className="text-white font-black text-xl sm:text-2xl tracking-tight leading-none"
                style={{ fontFamily: "Urbanist, Outfit, sans-serif" }}
              >
                Kiray<span style={{ color: "#E8B84B" }}>Bet</span>
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-white/60 tracking-wider uppercase mt-0.5 truncate">
                ኪራይ ቤት · Ethiopia
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7 lg:gap-8">
            {NAV_LINKS.map((link) => {
              const active = isActive(link);
              if (link.hash) {
                return (
                  <button
                    key={link.hash}
                    onClick={() => handleHashNav(link.hash!)}
                    className="relative text-sm font-semibold transition-colors duration-200 py-1"
                    style={{ color: active ? '#E8B84B' : 'rgba(255,255,255,0.75)' }}
                  >
                    {link.label}
                    {active && (
                      <motion.div
                        layoutId="navUnderline"
                        className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full"
                        style={{ background: 'linear-gradient(90deg, #E8B84B, #C9922A)' }}
                      />
                    )}
                  </button>
                );
              }
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className="relative text-sm font-semibold transition-colors duration-200 py-1"
                  style={{ color: active ? '#E8B84B' : 'rgba(255,255,255,0.75)' }}
                >
                  {link.label}
                  {active && (
                    <motion.div
                      layoutId="navUnderline"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full"
                      style={{ background: 'linear-gradient(90deg, #E8B84B, #C9922A)' }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop CTA / User controls */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <NotificationCenter />
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="text-sm font-semibold text-white/80 hover:text-white transition-colors px-3 py-2 rounded-xl hover:bg-white/5"
                  >
                    Admin Panel
                  </Link>
                )}
                {user.role === 'broker' && (
                  <Link
                    to={(user as any).isApproved ? "/broker" : "/broker/pending"}
                    className="text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors px-3 py-2 rounded-xl hover:bg-white/5"
                  >
                    Broker Dashboard
                  </Link>
                )}
                {(user.role === 'owner' || user.role === 'renter') && (
                  <>
                    <Link
                      to="/owner"
                      className="text-sm font-bold px-4 py-2 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 shadow-md shadow-amber-500/20"
                      style={{ background: "linear-gradient(135deg, #E8B84B 0%, #C9922A 100%)", color: "#070C17" }}
                    >
                      List Property
                    </Link>
                    {(user as any).brokerApplicationStatus !== 'approved' && (
                      <Link
                        to="/broker/apply"
                        className="text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors px-3 py-2 rounded-xl hover:bg-white/5"
                      >
                        Become a Broker
                      </Link>
                    )}
                  </>
                )}
                <Link
                  to="/profile"
                  className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center hover:bg-amber-500/30 transition-colors overflow-hidden"
                  title={user.name}
                >
                  {user.profileImage ? (
                    <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-amber-400" />
                  )}
                </Link>
                <button
                  onClick={logout}
                  className="text-sm font-semibold text-red-400 hover:text-red-300 transition-colors px-3 py-2 rounded-xl hover:bg-red-500/10"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-white/80 hover:text-white transition-colors px-4 py-2 rounded-xl hover:bg-white/5"
                >
                  Sign In
                </Link>
                <button
                  onClick={() => setAuthModal("list")}
                  className="text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 shadow-lg shadow-amber-500/20"
                  style={{ background: "linear-gradient(135deg, #E8B84B 0%, #C9922A 100%)", color: "#070C17" }}
                >
                  List Property
                </button>
                <Link
                  to="/broker/apply"
                  className="text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors px-3 py-2 rounded-xl hover:bg-white/5"
                >
                  Become a Broker
                </Link>
              </>
            )}
          </div>

          {/* Mobile Right Bar (Notification + User Avatar + Hamburger) */}
          <div className="flex md:hidden items-center gap-1.5 sm:gap-2">
            {user && <NotificationCenter />}
            {user && (
              <Link
                to="/profile"
                className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center overflow-hidden"
                title={user.name}
              >
                {user.profileImage ? (
                  <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-amber-400" />
                )}
              </Link>
            )}
            <button
              onClick={() => setOpen(!open)}
              aria-label="Toggle navigation menu"
              className="p-2 sm:p-2.5 rounded-xl text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors active:scale-95"
            >
              {open ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className="md:hidden overflow-hidden bg-[#070C17]/98 backdrop-blur-2xl border-t border-white/10 shadow-2xl"
            >
              <div className="max-h-[calc(100vh-4.5rem)] overflow-y-auto px-5 py-5 flex flex-col gap-4">
                {/* User Info Card if authenticated */}
                {user && roleBadge && (
                  <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3">
                    <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 overflow-hidden">
                        {user.profileImage ? (
                          <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-amber-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-white text-sm truncate">{user.name}</p>
                        <p className="text-xs text-white/50 truncate">{user.email}</p>
                      </div>
                    </Link>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${roleBadge.color}`}>
                      {roleBadge.label}
                    </span>
                  </div>
                )}

                {/* Primary Action Button */}
                {user ? (
                  <div className="flex flex-col gap-2">
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setOpen(false)}
                        className="w-full py-3 px-4 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2 shadow-lg"
                        style={{ background: "linear-gradient(135deg, #E8B84B 0%, #C9922A 100%)", color: "#070C17" }}
                      >
                        <ShieldCheck className="w-4 h-4" /> Go to Admin Panel
                      </Link>
                    )}
                    {user.role === 'broker' && (
                      <Link
                        to={(user as any).isApproved ? "/broker" : "/broker/pending"}
                        onClick={() => setOpen(false)}
                        className="w-full py-3 px-4 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2 shadow-lg"
                        style={{ background: "linear-gradient(135deg, #E8B84B 0%, #C9922A 100%)", color: "#070C17" }}
                      >
                        <Award className="w-4 h-4" /> Go to Broker Dashboard
                      </Link>
                    )}
                    {(user.role === 'owner' || user.role === 'renter') && (
                      <Link
                        to="/owner"
                        onClick={() => setOpen(false)}
                        className="w-full py-3 px-4 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2 shadow-lg"
                        style={{ background: "linear-gradient(135deg, #E8B84B 0%, #C9922A 100%)", color: "#070C17" }}
                      >
                        <PlusCircle className="w-4 h-4" /> List Your Property
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/login"
                      onClick={() => setOpen(false)}
                      className="py-3 px-4 rounded-xl font-bold text-sm text-center bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-colors"
                    >
                      Sign In
                    </Link>
                    <button
                      onClick={() => { setOpen(false); setAuthModal("list"); }}
                      className="py-3 px-4 rounded-xl font-bold text-sm text-center shadow-lg transition-transform active:scale-95"
                      style={{ background: "linear-gradient(135deg, #E8B84B 0%, #C9922A 100%)", color: "#070C17" }}
                    >
                      List Property
                    </button>
                  </div>
                )}

                {/* Navigation Section */}
                <div className="flex flex-col gap-1 pt-2 border-t border-white/10">
                  <p className="px-3 text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1">Explore</p>
                  {NAV_LINKS.map((link) => {
                    const active = isActive(link);
                    const Icon = link.icon;
                    if (link.hash) {
                      return (
                        <button
                          key={link.hash}
                          onClick={() => handleHashNav(link.hash!)}
                          className="flex items-center justify-between py-2.5 px-3 rounded-xl transition-all text-sm font-medium"
                          style={{
                            color: active ? '#E8B84B' : 'rgba(255,255,255,0.85)',
                            background: active ? 'rgba(232,184,75,0.1)' : 'transparent',
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-4 h-4" style={{ color: active ? '#E8B84B' : 'rgba(255,255,255,0.5)' }} />
                            <span>{link.label}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-white/30" />
                        </button>
                      );
                    }
                    return (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between py-2.5 px-3 rounded-xl transition-all text-sm font-medium"
                        style={{
                          color: active ? '#E8B84B' : 'rgba(255,255,255,0.85)',
                          background: active ? 'rgba(232,184,75,0.1)' : 'transparent',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" style={{ color: active ? '#E8B84B' : 'rgba(255,255,255,0.5)' }} />
                          <span>{link.label}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/30" />
                      </Link>
                    );
                  })}
                </div>

                {/* User Portal Section if logged in */}
                {user ? (
                  <div className="flex flex-col gap-1 pt-3 border-t border-white/10">
                    <p className="px-3 text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1">My Account</p>
                    <Link
                      to="/profile"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between py-2.5 px-3 rounded-xl text-white/85 hover:text-white hover:bg-white/5 transition-all text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-white/50" />
                        <span>My Profile</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/30" />
                    </Link>
                    <Link
                      to="/favorites"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between py-2.5 px-3 rounded-xl text-white/85 hover:text-white hover:bg-white/5 transition-all text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <Heart className="w-4 h-4 text-white/50" />
                        <span>Saved Properties</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/30" />
                    </Link>
                    <Link
                      to="/inquiries"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between py-2.5 px-3 rounded-xl text-white/85 hover:text-white hover:bg-white/5 transition-all text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-4 h-4 text-white/50" />
                        <span>My Inquiries</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/30" />
                    </Link>
                    <Link
                      to="/messages"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between py-2.5 px-3 rounded-xl text-white/85 hover:text-white hover:bg-white/5 transition-all text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-white/50" />
                        <span>Direct Messages</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/30" />
                    </Link>

                    {(user.role === 'owner' || user.role === 'renter') && (user as any).brokerApplicationStatus !== 'approved' && (
                      <Link
                        to="/broker/apply"
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between py-2.5 px-3 rounded-xl text-amber-400 hover:text-amber-300 hover:bg-amber-400/5 transition-all text-sm font-semibold"
                      >
                        <div className="flex items-center gap-3">
                          <Award className="w-4 h-4 text-amber-400" />
                          <span>Become a Certified Broker</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-amber-400/50" />
                      </Link>
                    )}

                    <button
                      onClick={() => { logout(); setOpen(false); }}
                      className="flex items-center gap-3 py-2.5 px-3 mt-1 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-sm font-semibold text-left"
                    >
                      <LogOut className="w-4 h-4 text-red-400" />
                      <span>Log Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
                    <Link
                      to="/signup"
                      onClick={() => setOpen(false)}
                      className="w-full py-2.5 px-4 rounded-xl text-center text-sm font-semibold text-white/90 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                    >
                      Create Free Account
                    </Link>
                    <Link
                      to="/broker/apply"
                      onClick={() => setOpen(false)}
                      className="w-full py-2.5 px-4 rounded-xl text-center text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      Become a Certified Broker
                    </Link>
                  </div>
                )}

                {/* Ethiopian Flag & Tagline */}
                <div className="pt-4 border-t border-white/10 text-center">
                  <p className="text-[11px] text-white/40">
                    🇪🇹 Kiray Bet (ኪራይ ቤት) · Ethiopia's Verified Rental Platform
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Auth / Listing Modal */}
      <AnimatePresence>
        {authModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setAuthModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
              style={{ background: "#0D1422", border: "1px solid rgba(232,184,75,0.25)" }}
            >
              <div
                className="flex items-center justify-between px-6 py-5 border-b"
                style={{ borderColor: "rgba(255,255,255,0.08)" }}
              >
                <h2 className="font-black text-white text-lg" style={{ fontFamily: "Urbanist, sans-serif" }}>
                  List Your Property
                </h2>
                <button
                  onClick={() => setAuthModal(null)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-white/60 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <p className="text-sm text-white/50 leading-relaxed">
                    Join 1,200+ landlords and brokers already earning on Kiray Bet. List your property in minutes.
                  </p>
                  <div className="space-y-2">
                    {["Free to list — no upfront fees", "Reach 48,000+ verified tenants", "Dashboard analytics & chat"].map(f => (
                      <div key={f} className="flex items-center gap-2 text-sm text-white/70">
                        <CheckCircle className="w-4 h-4 shrink-0" style={{ color: "#E8B84B" }} />
                        {f}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => { setAuthModal(null); navigate("/login"); }}
                    className="w-full py-3.5 rounded-xl font-bold text-sm text-[#070C17] transition-all hover:shadow-xl active:scale-95"
                    style={{ background: "linear-gradient(135deg, #E8B84B, #C9922A)" }}
                  >
                    Sign In to List
                  </button>
                  <p className="text-center text-xs text-white/40">
                    Already listed?{" "}
                    <button
                      onClick={() => { setAuthModal(null); navigate("/login"); }}
                      className="font-semibold"
                      style={{ color: "#E8B84B" }}
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
