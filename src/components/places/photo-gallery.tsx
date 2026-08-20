"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, ChevronLeft, ChevronRight, X } from "lucide-react";
import { photoCategories } from "@/lib/photo-categories";
import type { PlacePhoto } from "@/lib/places";

type GalleryPhoto = PlacePhoto & {
  categoryLabel: string;
};

export function PhotoGallery({
  photos,
  placeSlug,
}: {
  photos: PlacePhoto[];
  placeSlug: string;
}) {
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const activeButtonRef = useRef<HTMLButtonElement | null>(null);

  const groups = photoCategories.map((category) => ({
    ...category,
    photos: photos
      .filter((photo) => photo.category === category.value)
      .map((photo) => ({ ...photo, categoryLabel: category.label })),
  }));
  const activeGroup = groups.find((group) => group.value === activeCategory);
  const lightboxPhotos = activeGroup?.photos ?? [];
  const activeIndex = lightboxPhotos.findIndex((photo) => photo.id === activePhotoId);
  const activePhoto = activeIndex >= 0 ? lightboxPhotos[activeIndex] : null;

  function openLightbox(photoId: string, category: string, button: HTMLButtonElement) {
    activeButtonRef.current = button;
    setActiveCategory(category);
    setActivePhotoId(photoId);
  }

  function closeLightbox() {
    setActivePhotoId(null);
    setActiveCategory(null);
    window.setTimeout(() => activeButtonRef.current?.focus(), 0);
  }

  return (
    <section className="mt-5 border border-line bg-surface p-5">
      <h2 className="text-xl font-semibold">Community photos</h2>
      <p className="mt-2 text-sm text-muted">
        Photos are grouped by what they document. Some categories may still need help.
      </p>
      <div className="mt-5 space-y-5">
        {groups.map((group) => (
          <div className="border border-line bg-white p-4" key={group.value}>
            <h3 className="font-semibold">{group.label}</h3>
            <p className="mt-1 text-sm text-muted">{group.guidance}</p>
            {group.photos.length ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {group.photos.map((photo) => (
                  <figure className="overflow-hidden border border-line bg-surface" key={photo.id}>
                    {photo.signedUrl ? (
                      <button
                        className="block w-full focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand"
                        onClick={(event) => openLightbox(photo.id, group.value, event.currentTarget)}
                        type="button"
                      >
                        <img
                          alt={`${group.label} accessibility photo`}
                          className="h-52 w-full object-cover transition hover:brightness-95 active:scale-[0.995] motion-reduce:active:scale-100"
                          src={photo.signedUrl}
                        />
                      </button>
                    ) : (
                      <div className="grid h-52 place-items-center bg-background px-4 text-center text-sm text-muted">
                        Photo preview is not available with the current storage permissions.
                      </div>
                    )}
                    <figcaption className="flex items-center justify-between gap-3 px-3 py-2 text-xs text-muted">
                      <span>Community photo</span>
                      <span>{photo.created_at.slice(0, 10)}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <Link
                className="mt-4 flex min-h-16 items-center justify-between gap-3 rounded-md border border-dashed border-line bg-background p-4 text-sm text-muted transition hover:border-brand hover:bg-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand active:translate-y-px motion-reduce:active:translate-y-0"
                href={`/places/${placeSlug}/contribute?category=${group.value}`}
              >
                <span className="flex items-center gap-3">
                  <Camera size={18} aria-hidden="true" />
                  <span>No photos yet. A Contributor can help complete this category.</span>
                </span>
                <span className="shrink-0 whitespace-nowrap font-semibold text-brand-strong">Add a photo</span>
              </Link>
            )}
          </div>
        ))}
      </div>
      {activePhoto ? (
        <PhotoLightbox
          activeIndex={activeIndex}
          onClose={closeLightbox}
          onNavigate={(index) => setActivePhotoId(lightboxPhotos[index]?.id ?? null)}
          photos={lightboxPhotos}
        />
      ) : null}
    </section>
  );
}

function PhotoLightbox({
  activeIndex,
  photos,
  onClose,
  onNavigate,
}: {
  activeIndex: number;
  photos: GalleryPhoto[];
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const photo = photos[activeIndex];
  const previousIndex = activeIndex > 0 ? activeIndex - 1 : photos.length - 1;
  const nextIndex = activeIndex < photos.length - 1 ? activeIndex + 1 : 0;

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && photos.length > 1) onNavigate(previousIndex);
      if (event.key === "ArrowRight" && photos.length > 1) onNavigate(nextIndex);
      if (event.key === "Tab") {
        const controls = Array.from(
          document.querySelectorAll<HTMLButtonElement>("[data-lightbox-control]"),
        ).filter((item) => !item.disabled);
        if (!controls.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [nextIndex, onClose, onNavigate, photos.length, previousIndex]);

  useEffect(() => {
    if (photos[previousIndex]?.signedUrl) {
      const image = new Image();
      image.src = photos[previousIndex].signedUrl!;
    }
    if (photos[nextIndex]?.signedUrl) {
      const image = new Image();
      image.src = photos[nextIndex].signedUrl!;
    }
  }, [nextIndex, photos, previousIndex]);

  if (!photo) return null;

  return (
    <div
      aria-label="Photo viewer"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/82 px-3 py-4 text-white sm:px-6"
      onMouseDown={onClose}
      onPointerDown={onClose}
      role="dialog"
    >
      <div
        className="mx-auto flex h-full max-w-6xl flex-col"
        onMouseDown={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{photo.categoryLabel}</p>
            <p className="text-xs text-white/72">
              {activeIndex + 1} of {photos.length} · 
              {photo.created_at.slice(0, 10)}
            </p>
          </div>
          <div className="relative flex items-center gap-2">
            <button
              className="grid size-10 place-items-center rounded-full bg-white text-foreground transition hover:bg-sky-soft focus:outline focus:outline-2 focus:outline-white active:translate-y-px motion-reduce:active:translate-y-0"
              data-lightbox-control
              onClick={onClose}
              ref={closeRef}
              type="button"
              aria-label="Close photo viewer"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="relative mt-4 grid min-h-0 flex-1 place-items-center">
          {photos.length > 1 ? (
            <button
              className="absolute left-0 z-10 grid size-11 place-items-center rounded-full bg-white/12 transition hover:bg-white/20 focus:outline focus:outline-2 focus:outline-white active:translate-y-px motion-reduce:active:translate-y-0"
              data-lightbox-control
              onClick={() => onNavigate(previousIndex)}
              type="button"
              aria-label="Previous photo"
            >
              <ChevronLeft size={24} aria-hidden="true" />
            </button>
          ) : null}
          {photo.signedUrl ? (
            <img
              alt={`${photo.categoryLabel} accessibility photo enlarged`}
              className="max-h-full max-w-full object-contain"
              onMouseDown={(event) => event.stopPropagation()}
              src={photo.signedUrl}
            />
          ) : null}
          {photos.length > 1 ? (
            <button
              className="absolute right-0 z-10 grid size-11 place-items-center rounded-full bg-white/12 transition hover:bg-white/20 focus:outline focus:outline-2 focus:outline-white active:translate-y-px motion-reduce:active:translate-y-0"
              data-lightbox-control
              onClick={() => onNavigate(nextIndex)}
              type="button"
              aria-label="Next photo"
            >
              <ChevronRight size={24} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
