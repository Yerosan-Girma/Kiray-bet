import { Home, Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import { Link } from "react-router";

export default function Footer() {
  const cols = [
    { title:"Explore",  links:[
      { label:"Properties", href:"/properties" },
      { label:"Map Search",  href:"/properties" },
      { label:"Premium Listings", href:"/premium" },
      { label:"New Arrivals", href:"/properties" },
      { label:"Open Houses", href:"/properties" },
    ]},
    { title:"Company",  links:[
      { label:"About Us", href:"/about" },
      { label:"How It Works", href:"/" },
      { label:"Careers", href:"/" },
      { label:"Press", href:"/" },
      { label:"Blog", href:"/" },
    ]},
    { title:"Support",  links:[
      { label:"Help Center", href:"/" },
      { label:"Contact Us", href:"/contact" },
      { label:"Report Issue", href:"/contact" },
      { label:"Terms", href:"/" },
      { label:"Privacy", href:"/" },
    ]},
  ];

  return (
    <footer style={{ background: "#04080F" }}>
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20"
                style={{ background: "linear-gradient(135deg, #E8B84B, #C9922A)" }}>
                <Home className="w-4.5 h-4.5 text-[#070C17]" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-black text-xl leading-none" style={{ fontFamily: "Urbanist, sans-serif" }}>
                  Kiray<span style={{ color: "#E8B84B" }}>Bet</span>
                </span>
                <span className="text-[10px] font-bold text-white/50 tracking-wider uppercase mt-0.5">
                  ኪራይ ቤት · Ethiopia
                </span>
              </div>
            </div>
            <p className="text-sm text-white/40 leading-relaxed mb-5">
              Ethiopia's most trusted home rental marketplace. Find, rent, and manage houses across Addis Ababa and beyond with verified brokers and instant agreements.
            </p>
            <div className="flex gap-3">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <Icon className="w-4 h-4 text-white/60" />
                </a>
              ))}
            </div>
          </div>

          {cols.map(col => (
            <div key={col.title}>
              <h4 className="font-bold text-white text-sm mb-5" style={{ fontFamily: "Urbanist, sans-serif" }}>{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map(l => (
                  <li key={l.label}><Link to={l.href} className="text-sm text-white/40 hover:text-white transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-xs text-white/30">© 2026 Kiray Bet (ኪራይ ቤት). All rights reserved. Built for Ethiopia 🇪🇹.</p>
          <div className="flex items-center gap-2 text-xs text-white/30">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
