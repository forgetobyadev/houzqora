'use client';

/*
 * Pagination: Previous, the previous page number in a small circle,
 * the current page in the main circle, the next page number in a
 * small circle, Next, and a page status line.
 * Only rendered when there is more than one page.
 */
export default function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onPage(page - 1)}
        className="btn-press rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-velvet disabled:opacity-50"
      >
        Previous
      </button>
      {page > 1 && (
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          aria-label={`Go to page ${page - 1}`}
          className="btn-press flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-xs font-bold text-velvet"
        >
          {page - 1}
        </button>
      )}
      <button
        type="button"
        aria-current="page"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-velvet text-sm font-bold text-white"
      >
        {page}
      </button>
      {page < totalPages && (
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          aria-label={`Go to page ${page + 1}`}
          className="btn-press flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-xs font-bold text-velvet"
        >
          {page + 1}
        </button>
      )}
      <button
        type="button"
        disabled={page === totalPages}
        onClick={() => onPage(page + 1)}
        className="btn-press rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-velvet disabled:opacity-50"
      >
        Next
      </button>
      <span className="text-sm font-extrabold text-velvet">
        Page {page} of {totalPages}
      </span>
    </div>
  );
}
