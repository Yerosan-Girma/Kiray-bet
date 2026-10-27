import { useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { Award, Heart, Star, MapPin, Bed, Bath, Square, Eye, Key } from "lucide-react";
import { use3DTilt } from "../../hooks/use3DTilt";
import { House } from "../../types";

const BACKEND_BASE = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://kiray-bet.onrender.com/api' : 'http://localhost:5000/api')).replace(/\/api\/?$/, '');

const HQ = (id: string, w = 800, h = 600) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format&q=80`;

interface PropertyCardProps {
  house: House | any;
  index: number;
}

export default function PropertyCard({ house, index }: PropertyCardProps) {
  const tilt = use3DTilt(10);
  const [wished, setWished] = useState(false);
  const navigate = useNavigate();

  // Map backend House model to UI requirements or fallback
  const image = house.images?.[0] || house.image || "1600596542815-ffad4c1539a9";
  const title = house.title;
  const location = house.location;
  const price = house.price;
  const priceUnit = house.priceUnit || "/mo";
  const beds = house.bedrooms || house.beds || 0;
  const baths = house.bathrooms || house.baths || 0;
  const sqft = house.sqft || 1200;
  const type = house.propertyType || house.type;
  const tag = house.tag;
  const premium = house.isPremium || house.premium;
  const rating = house.rating || 4.5;
  const reviews = house.reviews || 0;
  const views = house.views || 0;
  const isRented = house.status === 'rented';

  return (
    <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22,1,0.36,1] }}
      ref={tilt.ref} style={{ ...tilt.style, transformStyle: "preserve-3d" }}
      onMouseMove={tilt.onMouseMove} onMouseLeave={tilt.onMouseLeave}
      onClick={() => house._id && !house._id.startsWith('mock-') && navigate(`/properties/${house._id}`)}
      className="group cursor-pointer rounded-3xl overflow-hidden bg-card border border-border hover:shadow-2xl transition-shadow duration-500"
      {...{} as any}>

      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={
            image.startsWith('http://') || image.startsWith('https://') || image.startsWith('data:') || image.startsWith('blob:')
              ? image
              : image.startsWith('/uploads')
              ? `${BACKEND_BASE}${image}`
              : HQ(image)
          }
          alt={title}
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isRented ? 'grayscale-[20%]' : ''}`}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Tag / Rented Status */}
        {isRented ? (
          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black shadow-lg uppercase tracking-wider bg-purple-600 text-white border border-purple-400/50">
            <Key className="w-3.5 h-3.5" /> Rented
          </div>
        ) : tag ? (
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: "linear-gradient(135deg, #E8B84B, #C9922A)", color: "#070C17" }}>
            {tag}
          </div>
        ) : null}

        {/* Premium badge */}
        {premium && !isRented && (
          <div className="absolute top-4 right-14 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
            style={{ background: "rgba(7,12,23,0.8)", backdropFilter: "blur(8px)", color: "#E8B84B", border: "1px solid rgba(232,184,75,0.4)" }}>
            <Award className="w-3 h-3" /> Premium
          </div>
        )}

        {/* Wishlist */}
        <button onClick={e => { e.stopPropagation(); setWished(!wished); }}
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-90"
          style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)" }}>
          <Heart className={`w-4 h-4 transition-colors ${wished ? "fill-red-400 text-red-400" : "text-white"}`} />
        </button>

        {/* Price on image */}
        <div className="absolute bottom-4 left-4 text-white flex items-center gap-2">
          <div>
            <span className="text-xl font-black" style={{ fontFamily: "Urbanist, sans-serif" }}>
              ETB {price.toLocaleString()}
            </span>
            <span className="text-white/70 text-xs ml-1">{priceUnit}</span>
          </div>
          {isRented && (
            <span className="px-2.5 py-0.5 rounded-md bg-purple-900/90 text-purple-200 text-[10px] font-bold uppercase tracking-wider border border-purple-400/40">
              Leased
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5" style={{ transform: "translateZ(10px)" }}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-foreground text-base leading-snug group-hover:text-amber-700 transition-colors" style={{ fontFamily: "Urbanist, sans-serif" }}>
            {title}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-foreground">{rating}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-4">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground truncate">{location}</span>
          <span className="text-xs text-muted-foreground/50 ml-auto shrink-0">{reviews} reviews</span>
        </div>

        {/* Specs */}
        <div className="flex items-center gap-4 pt-4 border-t border-border">
          {[
            [Bed,    beds,  beds  === 1 ? "Bed"  : "Beds"],
            [Bath,   baths, baths === 1 ? "Bath" : "Baths"],
            [Square, sqft, "sqft"],
          ].map(([Icon, val, label]: any, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon className="w-3.5 h-3.5" />
              <span className="font-semibold text-foreground">{val}</span>
              <span>{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1 ml-auto text-xs text-muted-foreground">
            <Eye className="w-3 h-3" />
            <span>{views.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
