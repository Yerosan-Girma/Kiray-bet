import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import PropertyCard from "./PropertyCard";
import { useQuery } from "@tanstack/react-query";
import { houseService } from "../../services/house.service";

// ─── Fallback mock data (shown when backend has no listings yet) ───────────────
const MOCK_PROPERTIES = [
  {
    _id: "mock-1",
    title: "Azure Heights Villa",
    location: "Westlands, Nairobi",
    price: 85000,
    priceUnit: "/mo",
    bedrooms: 5,
    bathrooms: 4,
    sqft: 4200,
    propertyType: "villa",
    tag: "Premium",
    images: ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop&auto=format&q=80"],
    rating: 4.9,
    reviews: 128,
    isPremium: true,
    views: 2341,
    status: "approved",
  },
  {
    _id: "mock-2",
    title: "Parkview Penthouse",
    location: "Kilimani, Nairobi",
    price: 55000,
    priceUnit: "/mo",
    bedrooms: 4,
    bathrooms: 3,
    sqft: 3100,
    propertyType: "apartment",
    tag: "New",
    images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop&auto=format&q=80"],
    rating: 4.7,
    reviews: 84,
    isPremium: true,
    views: 1876,
    status: "approved",
  },
  {
    _id: "mock-3",
    title: "Garden Terrace Flat",
    location: "Karen, Nairobi",
    price: 28000,
    priceUnit: "/mo",
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1850,
    propertyType: "apartment",
    images: ["https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop&auto=format&q=80"],
    rating: 4.5,
    reviews: 61,
    views: 943,
    status: "approved",
  },
  {
    _id: "mock-4",
    title: "Mombasa Beach House",
    location: "Nyali, Mombasa",
    price: 62000,
    priceUnit: "/mo",
    bedrooms: 6,
    bathrooms: 5,
    sqft: 5500,
    propertyType: "house",
    tag: "Hot",
    images: ["https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&h=600&fit=crop&auto=format&q=80"],
    rating: 4.8,
    reviews: 96,
    isPremium: true,
    views: 1654,
    status: "approved",
  },
  {
    _id: "mock-5",
    title: "Skyline Studio Loft",
    location: "CBD, Nairobi",
    price: 18000,
    priceUnit: "/mo",
    bedrooms: 1,
    bathrooms: 1,
    sqft: 720,
    propertyType: "studio",
    tag: "Best Value",
    images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&auto=format&q=80"],
    rating: 4.6,
    reviews: 42,
    views: 721,
    status: "approved",
  },
  {
    _id: "mock-6",
    title: "Lakeside Residence",
    location: "Kisumu, Lake Victoria",
    price: 35000,
    priceUnit: "/mo",
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2600,
    propertyType: "house",
    tag: "Scenic",
    images: ["https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop&auto=format&q=80"],
    rating: 4.4,
    reviews: 38,
    views: 589,
    status: "approved",
  },
];

const FILTER_MAP: Record<string, string> = {
  All: "all",
  Villa: "villa",
  Apartment: "apartment",
  Studio: "studio",
  Penthouse: "condo",
  "Beach House": "house",
  House: "house",
};

export default function FeaturedProperties() {
  const [filter, setFilter] = useState("All");
  const types = ["All", "Villa", "Apartment", "Studio", "Penthouse", "Beach House", "House"];

  const { data, isLoading } = useQuery({
    queryKey: ["houses"],
    queryFn: () => houseService.getHouses({ status: "approved" }),
    retry: 1,
    staleTime: 30_000,
  });

  // Use real data if available, fall back to mock data
  const allProperties = data?.data?.length > 0 ? data.data : MOCK_PROPERTIES;

  const filtered =
    filter === "All"
      ? allProperties
      : allProperties.filter(
          (p: any) => p.propertyType?.toLowerCase() === FILTER_MAP[filter]
        );

  return (
    <section id="properties" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div>
            <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#C9922A" }}>
              Featured Listings
            </span>
            <h2
              className="text-4xl md:text-5xl font-black text-foreground mt-2 leading-tight"
              style={{ fontFamily: "Urbanist, sans-serif" }}
            >
              Handpicked<br />Properties
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300"
                style={
                  filter === t
                    ? { background: "linear-gradient(135deg, #E8B84B, #C9922A)", color: "#070C17" }
                    : { background: "var(--muted)", color: "var(--muted-foreground)" }
                }
              >
                {t}
              </button>
            ))}
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#E8B84B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">No properties found for this category.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.slice(0, 6).map((p: any, i: number) => (
              <PropertyCard key={p._id || i} house={p} index={i} />
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-center mt-12"
        >
          <button
            className="group flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold border-2 text-foreground transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            style={{ borderColor: "rgba(201,146,42,0.5)" }}
          >
            View All Properties
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
