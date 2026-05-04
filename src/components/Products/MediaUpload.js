"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Image as ImageIcon, Video, X, Upload, Plus, Film } from "lucide-react";

export default function MediaUpload({ onMediaChange }) {
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    setIsUploading(true);
    
    for (const file of acceptedFiles) {
      const isVideo = file.type.startsWith('video/');
      
      // Validaciones básicas
      if (isVideo && video) continue; // Solo 1 video
      if (!isVideo && images.length >= 5) continue; // Máx 5 imágenes

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', isVideo ? 'video' : 'image');

      try {
        const res = await fetch('/api/products/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();

        if (data.url) {
          if (isVideo) {
            setVideo(data.url);
            onMediaChange({ images, video: data.url });
          } else {
            const newImages = [...images, data.url];
            setImages(newImages);
            onMediaChange({ images: newImages, video });
          }
        }
      } catch (error) {
        console.error("Upload error:", error);
      }
    }
    
    setIsUploading(false);
  }, [images, video, onMediaChange]);

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onMediaChange({ images: newImages, video });
  };

  const removeVideo = () => {
    setVideo(null);
    onMediaChange({ images, video: null });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'video/*': ['.mp4', '.webm', '.mov']
    },
    disabled: isUploading
  });

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <label className="label">Fotos y Video del Producto (Máx 5 fotos + 1 video)</label>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        
        {/* Imágenes subidas */}
        {images.map((url, index) => (
          <div key={index} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee' }}>
            <img src={url} alt={`Preview ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button 
              type="button"
              onClick={() => removeImage(index)}
              style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer', color: '#ff4757' }}
            >
              <X size={14} />
            </button>
            {index === 0 && (
              <span style={{ position: 'absolute', bottom: '0', left: '0', right: '0', background: 'rgba(4, 119, 191, 0.8)', color: 'white', fontSize: '10px', textAlign: 'center', padding: '2px', fontWeight: 800 }}>PRINCIPAL</span>
            )}
          </div>
        ))}

        {/* Video subido */}
        {video && (
          <div style={{ position: 'relative', aspectRatio: '1/1', borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <video src={video} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <Film size={32} color="white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
            </div>
            <button 
              type="button"
              onClick={removeVideo}
              style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer', color: '#ff4757' }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Dropzone */}
        {(images.length < 5 || !video) && (
          <div 
            {...getRootProps()} 
            style={{ 
              aspectRatio: '1/1', 
              border: `2px dashed ${isDragActive ? 'var(--primary)' : '#ddd'}`, 
              borderRadius: '12px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: isUploading ? 'wait' : 'pointer',
              background: isDragActive ? 'rgba(4, 119, 191, 0.05)' : 'transparent',
              transition: 'all 0.2s',
              opacity: isUploading ? 0.5 : 1
            }}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <div className="animate-spin" style={{ color: 'var(--primary)' }}><Plus size={24} /></div>
            ) : (
              <>
                <Plus size={24} color="#999" />
                <span style={{ fontSize: '10px', color: '#999', marginTop: '4px', fontWeight: 700, textAlign: 'center', padding: '0 5px' }}>
                  Añadir Multimedia
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
