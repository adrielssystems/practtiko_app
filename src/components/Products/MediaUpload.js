"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Image as ImageIcon, Video, X, Upload, Plus, Film, Loader2 } from "lucide-react";

export default function MediaUpload({ onMediaChange, initialMedia = { images: [], video: null } }) {
  const [images, setImages] = useState(initialMedia.images || []);
  const [video, setVideo] = useState(initialMedia.video || null);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    setIsUploading(true);
    
    const currentImages = [...images];
    let currentVideo = video;

    for (const file of acceptedFiles) {
      const isVideo = file.type.startsWith('video/');
      
      // Validaciones de límites
      if (isVideo && currentVideo) continue; 
      if (!isVideo && currentImages.length >= 5) continue;

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
            currentVideo = data.url;
          } else {
            currentImages.push(data.url);
          }
        }
      } catch (error) {
        console.error("Error subiendo archivo:", error);
      }
    }
    
    setImages(currentImages);
    setVideo(currentVideo);
    onMediaChange({ images: currentImages, video: currentVideo });
    setIsUploading(false);
  }, [images, video, onMediaChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'video/*': ['.mp4', '.webm', '.mov']
    },
    disabled: isUploading,
    multiple: true
  });

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onMediaChange({ images: newImages, video });
  };

  const removeVideo = () => {
    setVideo(null);
    onMediaChange({ images, video: null });
  };

  return (
    <div style={{ width: '100%' }}>
      <label className="label" style={{ marginBottom: '1rem', display: 'block' }}>Multimedia del Producto</label>
      
      {/* ZONA DE DROPZONE PRINCIPAL (GRANDE) */}
      <div 
        {...getRootProps()} 
        style={{ 
          width: '100%',
          minHeight: '180px',
          border: `2px dashed ${isDragActive ? 'var(--primary)' : '#cbd5e1'}`,
          borderRadius: '16px',
          background: isDragActive ? 'rgba(4, 119, 191, 0.05)' : 'rgba(248, 250, 252, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isUploading ? 'wait' : 'pointer',
          transition: 'all 0.2s ease',
          padding: '2rem',
          textAlign: 'center',
          marginBottom: '1.5rem'
        }}
      >
        <input {...getInputProps()} />
        
        {isUploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <Loader2 className="animate-spin" size={40} color="var(--primary)" />
            <p style={{ color: 'var(--primary)', fontWeight: 600 }}>Subiendo y optimizando...</p>
          </div>
        ) : (
          <>
            <div style={{ background: 'white', padding: '1rem', borderRadius: '50%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '1rem' }}>
              <Upload size={32} color={isDragActive ? 'var(--primary)' : '#64748b'} />
            </div>
            <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>
              {isDragActive ? '¡Suéltalos ahora!' : 'Arrastra tus fotos y video aquí'}
            </p>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
              O haz clic para buscar en tu equipo (Máx. 5 fotos y 1 video)
            </p>
          </>
        )}
      </div>

      {/* VISOR DE ARCHIVOS SUBIDOS (GRID) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
        
        {/* Imágenes */}
        {images.map((url, index) => (
          <div key={index} className="group" style={{ position: 'relative', aspectRatio: '1/1', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <img src={url} alt={`Preview ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button 
              type="button"
              onClick={() => removeImage(index)}
              style={{ position: 'absolute', top: '8px', right: '8px', background: 'white', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer', color: '#ef4444', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', display: 'flex' }}
            >
              <X size={14} strokeWidth={3} />
            </button>
            {index === 0 && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--primary)', color: 'white', fontSize: '10px', fontWeight: 900, textAlign: 'center', padding: '4px', letterSpacing: '1px' }}>
                IMAGEN PRINCIPAL
              </div>
            )}
          </div>
        ))}

        {/* Video */}
        {video && (
          <div style={{ position: 'relative', aspectRatio: '1/1', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#000' }}>
            <video src={video} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <Film size={32} color="white" />
            </div>
            <button 
              type="button"
              onClick={removeVideo}
              style={{ position: 'absolute', top: '8px', right: '8px', background: 'white', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer', color: '#ef4444', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', display: 'flex' }}
            >
              <X size={14} strokeWidth={3} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
