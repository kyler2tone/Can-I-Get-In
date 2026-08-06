/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { approvePhotoAction, rejectPhotoAction } from "@/lib/studio-actions";
import type { StudioPhoto } from "@/lib/studio";

export function PhotoModerationQueue({ photos }: { photos: StudioPhoto[] }) {
  if (!photos.length) {
    return (
      <div className="border border-dashed border-line bg-surface p-6">
        <h2 className="text-xl font-semibold">No photos are awaiting review.</h2>
        <p className="mt-2 text-sm text-muted">
          New Contributor uploads will appear here before they are shown publicly.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {photos.map((photo) => (
        <article className="border border-line bg-surface" key={photo.id}>
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="bg-background">
              {photo.signedUrl ? (
                <img
                  alt={`${photo.categoryLabel} photo awaiting review`}
                  className="max-h-[520px] w-full object-contain"
                  src={photo.signedUrl}
                />
              ) : (
                <div className="grid min-h-80 place-items-center px-4 text-center text-sm text-muted">
                  Photo preview is unavailable.
                </div>
              )}
            </div>
            <div className="space-y-4 border-t border-line p-4 lg:border-l lg:border-t-0">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                  Pending photo
                </p>
                <h2 className="mt-2 text-xl font-semibold">{photo.placeName}</h2>
                {photo.placeSlug ? (
                  <Link
                    className="mt-1 inline-flex text-sm font-semibold text-brand-strong underline"
                    href={`/places/${photo.placeSlug}`}
                  >
                    View place page
                  </Link>
                ) : null}
                <p className="mt-2 text-sm text-muted">{photo.placeAddress}</p>
              </div>
              <dl className="grid gap-3 text-sm">
                <div>
                  <dt className="font-semibold">Category</dt>
                  <dd className="text-muted">{photo.categoryLabel}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Contributor</dt>
                  <dd className="text-muted">
                    {photo.contributorUsername ? (
                      <Link href={`/contributors/${photo.contributorUsername}`}>
                        {photo.contributorName}
                      </Link>
                    ) : (
                      photo.contributorName
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold">Uploaded</dt>
                  <dd className="text-muted">{formatDate(photo.uploadedAt)}</dd>
                </div>
              </dl>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <form action={approvePhotoAction}>
                  <input name="photoId" type="hidden" value={photo.id} />
                  <button
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-brand bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong"
                    type="submit"
                  >
                    Approve
                  </button>
                </form>
                <form action={rejectPhotoAction}>
                  <input name="photoId" type="hidden" value={photo.id} />
                  <button
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-rose-900 transition hover:border-rose-300"
                    type="submit"
                  >
                    Reject
                  </button>
                </form>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
