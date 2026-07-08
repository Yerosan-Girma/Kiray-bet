import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Home, Menu, X, CheckCircle, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import NotificationCenter from "../notifications/NotificationCenter";

const NAV_LINKS = [
  { label: "Properties", id: "properties" },
  { label: "Locations", id: "locations" },
  { label: "How It Works", id: "how-it-works" },
  { label: "About", id: "about" },
  { label: "Contact", id: "contact" },
];

function scrollTo(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authModal, setAuthModal] = useState<"list" | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  // Real authentication hooks
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleNav(id: string) {
    setOpen(false);
    setTimeout(() => scrollTo(id), 50);
  }

  return (
    <>
      <motion.header initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-[#070C17]/95 backdrop-blur-xl border-b border-white/8 shadow-2xl shadow-black/40"
            : "bg-transparent"
        }`}>
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between py-4">
          {/* Logo */}
          <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #E8B84B 0%, #C9922A 100%)" }}>
              <Home className="w-4.5 h-4.5 text-[#070C17] relative z-10" style={{ width: 18, height: 18 }} />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight" style={{ fontFamily: "Urbanist, Outfit, sans-serif" }}>
              Nest<span style={{ color: "#E8B84B" }}>Hub</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ label, id }) => (
              <button key={id} onClick={() => handleNav(id)}
                className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-200">
                {label}
              </button>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <NotificationCenter />
                <Link to={`/${user.role}`} className="text-sm font-medium text-white/80 hover:text-white transition-colors px-4 py-2">
                  Dashboard
                </Link>
                <Link to="/profile" className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center hover:bg-amber-500/30 transition-colors"
                  title={user.name}>
                  {user.profileImage
                    ? <img src={user.profileImage} alt="" className="w-full h-full rounded-xl object-cover" />
                    : <User className="w-4 h-4 text-amber-400" />}
                </Link>
                <button onClick={logout} className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors px-4 py-2">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login"
                  className="text-sm font-medium text-white/80 hover:text-white transition-colors px-4 py-2">
                  Sign In
                </Link>
                <button onClick={() => setAuthModal("list")}
                  className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
                  style={{ background: "linear-gradient(135deg, #E8B84B 0%, #C9922A 100%)", color: "#070C17" }}>
                  List Property
                </button>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setOpen(!open)} className="md:hidden text-white p-2 rounded-xl hover:bg-white/10 transition-colors">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {open && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="md:hidden overflow-hidden bg-[#070C17]/98 backdrop-blur-xl border-t border-white/10">
              <div className="px-6 py-5 flex flex-col gap-1">
                {NAV_LINKS.map(({ label, id }) => (
                  <button key={id} onClick={() => handleNav(id)}
                    className="text-left text-white/80 hover:text-white hover:bg-white/6 font-medium py-3 px-3 rounded-xl transition-all">
                    {label}
                  </button>
                ))}
                <div className="flex flex-col gap-3 pt-4 mt-2 border-t border-white/10">
                  {user ? (
                    <>
                      <Link to={`/${user.role}`} onClick={() => setOpen(false)} className="text-white/80 hover:text-white font-medium py-2 text-left px-3 rounded-xl hover:bg-white/6 transition-all">
                        Dashboard
                      </Link>
                      <button onClick={() => { logout(); setOpen(false); }} className="text-red-400 font-medium py-2 text-left px-3 rounded-xl hover:bg-white/6 transition-all">
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setOpen(false)}
                        className="text-white/80 hover:text-white font-medium py-2 text-left px-3 rounded-xl hover:bg-white/6 transition-all">
                        Sign In
                      </Link>
                      <button onClick={() => { setOpen(false); setAuthModal("list"); }}
                        className="py-3 rounded-xl font-semibold text-[#070C17] active:scale-95 transition-transform"
                        style={{ background: "linear-gradient(135deg, #E8B84B 0%, #C9922A 100%)" }}>
                        List Property
                      </button>
                    </>
                  )}
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAuthModal(null)} />
            <motion.div initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }} transition={{ duration: 0.3, ease: [0.22,1,0.36,1] }}
              className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
              style={{ background: "#0D1422", border: "1px solid rgba(232,184,75,0.25)" }}>
              <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <h2 className="font-black text-white text-lg" style={{ fontFamily: "Urbanist, sans-serif" }}>
                  List Your Property
                </h2>
                <button onClick={() => setAuthModal(null)} className="p-1.5 rounded-xl hover:bg-white/10 text-white/60 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <p className="text-sm text-white/50 leading-relaxed">Join 1,200+ landlords and brokers already earning on NestHub. List your property in minutes.</p>
                  <div className="space-y-2">
                    {["Free to list — no upfront fees","Reach 48,000+ verified tenants","Dashboard analytics & chat"].map(f => (
                      <div key={f} className="flex items-center gap-2 text-sm text-white/70">
                        <CheckCircle className="w-4 h-4 shrink-0" style={{ color: "#E8B84B" }} />
                        {f}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { setAuthModal(null); navigate("/login"); }} className="w-full py-3.5 rounded-xl font-bold text-sm text-[#070C17] transition-all hover:shadow-xl active:scale-95"
                    style={{ background: "linear-gradient(135deg, #E8B84B, #C9922A)" }}>
                    Sign In to List
                  </button>
                  <p className="text-center text-xs text-white/40">
                    Already listed?{" "}
                    <button onClick={() => { setAuthModal(null); navigate("/login"); }} className="font-semibold" style={{ color: "#E8B84B" }}>Sign in</button>
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
