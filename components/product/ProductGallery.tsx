"use client";

import { useState } from "react";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const galleryImages = images.length > 0 ? images : ["/images/placeholder.jpg"];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const selectedImage = galleryImages[selectedIndex] || galleryImages[0];

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className="group relative block w-full overflow-hidden rounded-[16px] bg-[#2A1712] text-left shadow-[0_24px_70px_rgba(42,23,18,0.13)]"
        aria-label={`Ampliar foto de ${productName}`}
      >
        <div className="relative aspect-[4/5]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedImage}
            alt={productName}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 texture-linen opacity-20" aria-hidden />
          <span className="absolute bottom-4 right-4 rounded-full border border-white/45 bg-[#2A1712]/55 px-4 py-2 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-white/90 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
            Ampliar
          </span>
        </div>
      </button>

      {galleryImages.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
          {galleryImages.map((image, index) => {
            const isSelected = index === selectedIndex;

            return (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={`relative aspect-[4/5] overflow-hidden rounded-[10px] border bg-[#2A1712] transition-all duration-200 ${
                  isSelected
                    ? "border-[#B88A62] ring-2 ring-[#B88A62]/35"
                    : "border-[#D8C4AD] opacity-80 hover:border-[#B88A62] hover:opacity-100"
                }`}
                aria-label={`Mostrar foto ${index + 1} de ${productName}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={`${productName} - foto ${index + 1}`}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </button>
            );
          })}
        </div>
      )}

      {isExpanded && (
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className="fixed inset-0 z-[90] flex cursor-zoom-out items-center justify-center bg-[#160905]/90 p-4 backdrop-blur-sm"
          aria-label="Fechar foto ampliada"
        >
          <span className="absolute right-4 top-4 rounded-full border border-white/25 px-4 py-2 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-white/90">
            Fechar
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedImage}
            alt={productName}
            className="max-h-[88vh] max-w-[94vw] rounded-[10px] object-contain shadow-[0_30px_90px_rgba(0,0,0,0.45)]"
          />
        </button>
      )}
    </div>
  );
}
