"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { X, Upload, Film, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function MediaUpload({ onMediaChange, initialMedia = { images: [], video: null } }) {
  const { addToast } = useToast();
  const [images, setImages] = useState(initialMedia.images || []);
  const [video, setVideo] = useState(initialMedia.video || null);
  const [isUploading, setIsUploading] = useState(false);

  // Sincronizar con el padre cada vez que cambie algo localmente
  useEffect(() => {
    onMediaChange({ images, video });
  }, [images, video, onMediaChange]);

  const onDrop = useCallback(async (acceptedFiles) => {
    setIsUploading(true);
    
    for (const file of acceptedFiles) {
      const isVideo = file.type.startsWith('video/');
      
      // Validaciones locales con Toast
      if (isVideo && video) {
        addToast("Solo se permite un video por producto.", "error");
        continue;
      }
      if (!isVideo && images.length >= 5) {
        addToast("Máximo 5 imágenes permitidas.", "error");
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', isVideo ? 'video' : 'image');

      try {
        const res = await fetch('/api/products/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!res.ok) throw new Error('Error en el servidor al subir');
        
        const data = await res.json();

        if (data.url) {
          if (isVideo) {
            setVideo(data.url);
            addToast("Video subido con éxito", "success");
          } else {
            setImages(prev => [...prev, data.url]);
            addToast("Imagen optimizada y subida", "success");
          }
        }
      } catch (err) {
        console.error("Upload error:", err);
        addToast("Error al subir archivo. Verifica tu conexión.", "error");
      }
    }
    
    setIsUploading(false);
  }, [images, video, addToast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'video/*': ['.mp4', '.webm', '.mov']
    },
    disabled: isUploading
  });

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    addToast("Imagen eliminada", "success");
  };

  const removeVideo = () => {
    setVideo(null);
    addToast("Video eliminado", "success");
  };

  return (
    <div style={{ width: '100%' }}>
      <label className="label" style={{ marginBottom: '1rem', display: 'block', fontWeight: 800 }}>Multimedia del Producto</label>

      {/* ZONA DE ARRASTRE */}
      <div 
        {...getRootProps()} 
        style={{ 
          width: '100%',
          minHeight: '160px',
          border: `2px dashed ${isDragActive ? 'var(--primary)' : '#cbd5e1'}`,
          borderRadius: '16px',
          background: isDragActive ? 'rgba(4, 119, 191, 0.05)' : '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isUploading ? 'wait' : 'pointer',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          transition: 'all 0.2s'
        }}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        ) : (
          <>
            <Upload size={32} color="#64748b" style={{ marginBottom: '0.5rem' }} />
            <p style={{ fontWeight: 700, margin: 0 }}>Arrastra tus fotos aquí</p>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Hasta 5 fotos y 1 video</p>
          </>
        )}
      </div>

      {/* MINIATURAS (CRÍTICO: Asegurar visualización) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        
        {images.map((url, index) => (
          <div key={index} style={{ width: '120px', height: '120px', position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '2px solid #e2e8f0' }}>
            <img src={url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button 
              type="button"
              onClick={() => removeImage(index)}
              style={{ position: 'absolute', top: '4px', right: '4px', background: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
            >
              <X size={14} color="#ef4444" />
            </button>
            {index === 0 && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--primary)', color: 'white', fontSize: '8px', textAlign: 'center', padding: '2px', fontWeight: 900 }}>PORTADA</div>
            )}
          </div>
        ))}

        {video && (
          <div style={{ width: '120px', height: '120px', position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '2px solid #e2e8f0', background: '#000' }}>
            <video src={video} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Film size={24} color="white" />
            </div>
            <button 
              type="button"
              onClick={removeVideo}
              style={{ position: 'absolute', top: '4px', right: '4px', background: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
            >
              <X size={14} color="#ef4444" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
