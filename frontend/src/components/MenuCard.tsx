import { Link } from "react-router-dom";
import type { MenuItem } from "../types";
import { formatMoney } from "../lib/money";

export function MenuCard({ item }: { item: MenuItem }) {
  return (
    <Link
      to={`/menu/${item.slug}`}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {item.image_url ? (
        <img
          src={item.image_url}
          alt=""
          className="h-48 w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="h-48 bg-gradient-to-br from-amber-100 to-orange-200" />
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-bold text-slate-900 group-hover:text-amber-700">
            {item.title}
          </h2>
          <span className="whitespace-nowrap font-semibold text-amber-700">
            {formatMoney(item.price_amount)}
          </span>
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-slate-600">
          {item.description}
        </p>
      </div>
    </Link>
  );
}
