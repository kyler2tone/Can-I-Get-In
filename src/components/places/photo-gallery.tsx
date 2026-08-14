import Image from "next/image";
import Link from "next/link";
import { Camera } from "lucide-react";
import { groupPhotosByCategory, type PlacePhoto } from "@/lib/places";

export function PhotoGallery({
  photos,
  placeSlug,
}: {
  photos: PlacePhoto[];
  placeSlug: string;
}) {
  const groups = groupPhotosByCategory(photos);

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
                      <Image
                        alt={`${group.label} accessibility photo`}
                        className="h-52 w-full object-cover"
                        height={360}
                        src={photo.signedUrl}
                        unoptimized
                        width={520}
                      />
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
                className="mt-4 flex min-h-16 items-center justify-between gap-3 rounded-md border border-dashed border-line bg-background p-4 text-sm text-muted transition hover:border-brand hover:bg-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand"
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
    </section>
  );
}
