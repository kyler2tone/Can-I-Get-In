import Image from "next/image";
import { Camera } from "lucide-react";
import { groupPhotosByCategory, type PlacePhoto } from "@/lib/places";

export function PhotoGallery({ photos }: { photos: PlacePhoto[] }) {
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
              <div className="mt-4 flex items-center gap-3 rounded-md border border-dashed border-line bg-background p-4 text-sm text-muted">
                <Camera size={18} aria-hidden="true" />
                No photos yet. A Contributor can help complete this category.
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
