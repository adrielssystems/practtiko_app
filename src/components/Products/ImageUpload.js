"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";

export default function ImageUpload({ onImagesChange, initialImages = [] }) {
  const [images, setImages] = useState(initialImages);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    setUploading(true);
    const formData = new FormData();
    acceptedFiles.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      const newImages = [...images, ...data.urls];
      setImages(newImages);
      onImagesChange(newImages);
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Error al cargar las imágenes");
    } finally {
      setUploading(false);
    }
  }, [images, onImagesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
  });

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesChange(newImages);
  };

  return (
    <div className="image-upload-container">
      <div 
        {...getRootProps()} 
        className={`dropzone card glass ${isDragActive ? 'active' : ''} ${uploading ? 'disabled' : ''}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="dropzone-content">
            <Loader2 className="animate-spin" size={32} />
            <p>Subiendo y optimizando imágenes...</p>
          </div>
        ) : (
          <div className="dropzone-content">
            <Upload size={32} />
            <p>{isDragActive ? "Suelta las imágenes aquí" : "Arrastra imágenes o haz clic para seleccionar"}</p>
            <span>PNG, JPG o WebP (Máx. 10MB por archivo)</span>
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className="image-grid">
          {images.map((url, index) => (
            <div key={index} className="image-preview card glass">
              <img src={url} alt={`Preview ${index}`} />
              <button 
                type="button" 
                onClick={() => removeImage(index)}
                className="remove-btn"
              >
                <X size={16} />
              </button>
              {index === 0 && <span className="main-badge">Principal</span>}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .image-upload-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .dropzone {
          padding: 3rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          border: 2px dashed var(--border);
          background: #ffffff;
        }

        .dropzone:hover, .dropzone.active {
          border-color: var(--primary);
          background: rgba(4, 119, 191, 0.02);
        }

        .dropzone.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          pointer-events: none;
        }

        .dropzone-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          color: var(--muted-foreground);
        }

        .dropzone-content p {
          font-weight: 700;
          color: var(--foreground);
        }

        .dropzone-content span {
          font-size: 0.75rem;
        }

        .image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 1rem;
        }

        .image-preview {
          position: relative;
          padding: 0.5rem;
          aspect-ratio: 1;
        }

        .image-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 0.5rem;
        }

        .remove-btn {
          position: absolute;
          top: -0.5rem;
          right: -0.5rem;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--destructive);
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        .main-badge {
          position: absolute;
          bottom: 0.5rem;
          left: 50%;
          transform: translateX(-50%);
          background: var(--primary);
          color: white;
          font-size: 0.625rem;
          font-weight: 700;
          padding: 0.125rem 0.5rem;
          border-radius: 0.25rem;
          text-transform: uppercase;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
