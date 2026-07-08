import { Home, Facebook, Twitter, Instagram, Youtube } from "lucide-react";

export default function Footer() {
  const cols = [
    { title:"Explore",  links:["Properties","Map Search","Premium Listings","New Arrivals","Open Houses"] },
    { title:"Company",  links:["About Us","How It Works","Careers","Press","Blog"] },
    { title:"Support",  links:["Help Center","Contact Us","Report Issue","Terms","Privacy"] },
  ];

  return (
    <footer style={{ background: "#04080F" }}>
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #E8B84B, #C9922A)" }}>
                <Home className="w-4 h-4 text-[#070C17]" />
              </div>
              <span className="text-white font-bold text-lg" style={{ fontFamily: "Urbanist, sans-serif" }}>
                Nest<span style={{ color: "#E8B84B" }}>Hub</span>
              </span>
            </div>
            <p className="text-sm text-white/40 leading-relaxed mb-5">
              East Africa's most trusted rental platform. Find, rent, and manage properties with ease.
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
                  <li key={l}><a href="#" className="text-sm text-white/40 hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-xs text-white/30">© 2024 NestHub. All rights reserved. Built for East Africa.</p>
          <div className="flex items-center gap-2 text-xs text-white/30">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
