import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Link as LinkIcon, Loader2, Star } from 'lucide-react';
import { houseService } from '../../services/house.service';
import { toast } from 'sonner';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
  description?: string;
}

export default function ImageUploader({
  images,
  onChange,
  maxImages = 10,
  label = 'Property Photos',
  description = 'Upload high-quality photos (JPG, PNG, WEBP). First photo is the main cover.',
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      toast.error(`Maximum ${maxImages} images reached.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setUploading(true);
    try {
      const uploadedUrls = await houseService.uploadImages(filesToUpload);
      onChange([...images, ...uploadedUrls]);
      toast.success(`Successfully uploaded ${uploadedUrls.length} ${uploadedUrls.length === 1 ? 'photo' : 'photos'}!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload photos. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddUrl = () => {
    const trimmed = urlValue.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      toast.error('Please enter a valid image URL starting with http:// or https://');
      return;
    }
    if (images.length >= maxImages) {
      toast.error(`Maximum ${maxImages} images reached.`);
      return;
    }
    onChange([...images, trimmed]);
    setUrlValue('');
    setShowUrlInput(false);
    toast.success('Image link added!');
  };

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const handleSetCover = (index: number) => {
    if (index === 0) return;
    const item = images[index];
    const filtered = images.filter((_, i) => i !== index);
    onChange([item, ...filtered]);
    toast.info('Set as main cover photo');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {label} ({images.length}/{maxImages})
          </label>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-xs font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors"
        >
          <LinkIcon className="w-3.5 h-3.5" />
          {showUrlInput ? 'Hide URL input' : 'Add by URL'}
        </button>
      </div>

      {/* URL input drawer */}
      {showUrlInput && (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/60 border border-border">
          <input
            type="url"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder="Paste image link (e.g. https://...)"
            className="flex-1 px-3 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:border-amber-500 text-foreground"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all"
            style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)', color: '#070C17' }}
          >
            Add
          </button>
        </div>
      )}

      {/* Image previews grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <div
              key={img + idx}
              className={`group relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted border-2 transition-all ${
                idx === 0 ? 'border-amber-500 shadow-md ring-2 ring-amber-500/20' : 'border-border'
              }`}
            >
              <img src={img} alt={`Property upload ${idx + 1}`} className="w-full h-full object-cover" />

              {/* Main photo badge */}
              {idx === 0 ? (
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-[#070C17] flex items-center gap-1 shadow-md">
                  <Star className="w-3 h-3 fill-[#070C17]" /> Cover
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSetCover(idx)}
                  className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 hover:bg-amber-500 text-white hover:text-[#070C17] opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Set as Cover
                </button>
              )}

              {/* Delete button */}
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-600/90 text-white flex items-center justify-center hover:bg-red-700 transition-colors shadow-md"
                title="Remove photo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload drop/trigger area */}
      {images.length < maxImages && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/jpg"
            onChange={handleFileChange}
            className="hidden"
            id="property-file-upload"
            disabled={uploading}
          />
          <label
            htmlFor="property-file-upload"
            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
              uploading
                ? 'border-amber-400 bg-amber-50/50 cursor-wait'
                : 'border-border hover:border-amber-500 bg-muted/20 hover:bg-amber-50/30'
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2 text-amber-700">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                <span className="text-xs font-bold">Uploading photos to Kiray Bet...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-foreground">Click to upload photos</span>
                  <span className="text-xs text-muted-foreground block mt-0.5">or drag and drop images here</span>
                </div>
                <span className="text-[11px] text-muted-foreground">PNG, JPG, WEBP up to 5MB each</span>
              </div>
            )}
          </label>
        </div>
      )}
    </div>
  );
}
