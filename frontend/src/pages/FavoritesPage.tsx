import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Heart, Trash2 } from 'lucide-react';
import { favoriteService } from '../services/favorite.service';
import PropertyCard from '../components/property/PropertyCard';
import { toast } from 'sonner';

export default function FavoritesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['favorites', page],
    queryFn: () => favoriteService.getFavorites({ page, limit: 12 }),
    staleTime: 30_000,
  });

  const removeMutation = useMutation({
    mutationFn: (houseId: string) => favoriteService.removeFavorite(houseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast.success('Removed from favorites');
    },
    onError: () => toast.error('Failed to remove favorite'),
  });

  const favorites: any[] = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center">
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: 'Urbanist, sans-serif' }}>
              Saved Properties
            </h1>
            <p className="text-sm text-muted-foreground">
              {pagination ? `${pagination.total} saved` : ''}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-3xl bg-muted animate-pulse h-80" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-red-300" />
            </div>
            <h3 className="font-bold text-foreground text-xl mb-2">No saved properties</h3>
            <p className="text-muted-foreground text-sm">
              Heart any listing to save it here for quick access.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((fav: any, i: number) => {
                const house = fav.houseId;
                if (!house) return null;
                return (
                  <motion.div key={fav._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }} className="relative group">
                    <PropertyCard house={house} index={i} />
                    <button
                      onClick={() => removeMutation.mutate(house._id)}
                      className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                      title="Remove from favorites">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                  className="px-4 py-2 rounded-xl border-2 border-border text-sm font-medium disabled:opacity-40">
                  Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {pagination.pages}
                </span>
                <button disabled={page === pagination.pages} onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 rounded-xl border-2 border-border text-sm font-medium disabled:opacity-40">
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
