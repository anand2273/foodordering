import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { getMenuItem } from "../api/foodapp";
import { ErrorMessage, Loading } from "../components/Feedback";
import { useCart } from "../context/CartContext";
import { formatMoney } from "../lib/money";

export function MenuItemPage() {
  const { slug = "" } = useParams();
  const item = useQuery({
    queryKey: ["menu-item", slug],
    queryFn: () => getMenuItem(slug),
  });
  const { add } = useCart();
  const [selections, setSelections] = useState<Record<number, number[]>>({});
  const [added, setAdded] = useState(false);

  const optionIds = useMemo(
    () => Object.values(selections).flat(),
    [selections],
  );
  const extraAmount =
    item.data?.customization_groups
      .flatMap((group) => group.options)
      .filter((option) => optionIds.includes(option.id))
      .reduce((sum, option) => sum + option.extra_amount, 0) ?? 0;

  if (item.isLoading) return <Loading />;
  if (item.isError || !item.data)
    return <ErrorMessage message="This menu item could not be loaded." />;

  const choose = (groupId: number, optionId: number, maxChoices: number) => {
    setSelections((current) => {
      const selected = current[groupId] ?? [];
      if (selected.includes(optionId)) {
        return {
          ...current,
          [groupId]: selected.filter((id) => id !== optionId),
        };
      }
      const next =
        maxChoices === 1
          ? [optionId]
          : [...selected, optionId].slice(-maxChoices);
      return { ...current, [groupId]: next };
    });
    setAdded(false);
  };

  const canAdd = item.data.customization_groups.every(
    (group) => !group.required || (selections[group.id]?.length ?? 0) > 0,
  );

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        className="text-sm font-semibold text-amber-700 hover:underline"
        to="/"
      >
        ← Back to menu
      </Link>
      <article className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {item.data.image_url && (
          <img
            alt=""
            className="h-72 w-full object-cover"
            src={item.data.image_url}
          />
        )}
        <div className="p-6 sm:p-8">
          <h1 className="text-3xl font-black">{item.data.title}</h1>
          <p className="mt-3 text-slate-600">{item.data.description}</p>
          <div className="mt-8 space-y-7">
            {item.data.customization_groups.map((group) => (
              <fieldset key={group.id}>
                <legend className="font-bold">
                  {group.name}
                  {group.required && (
                    <span className="ml-1 text-red-600">*</span>
                  )}
                  <span className="ml-2 text-xs font-normal text-slate-500">
                    Choose up to {group.max_choices}
                  </span>
                </legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {group.options.map((option) => {
                    const checked =
                      selections[group.id]?.includes(option.id) ?? false;
                    return (
                      <label
                        className={`flex cursor-pointer justify-between rounded-lg border p-3 ${checked ? "border-amber-500 bg-amber-50" : "border-slate-200"}`}
                        key={option.id}
                      >
                        <span>
                          <input
                            checked={checked}
                            className="mr-3"
                            name={`group-${group.id}`}
                            onChange={() =>
                              choose(group.id, option.id, group.max_choices)
                            }
                            type={
                              group.max_choices === 1 ? "radio" : "checkbox"
                            }
                          />
                          {option.name}
                        </span>
                        {option.extra_amount > 0 && (
                          <span className="text-sm text-slate-500">
                            +{formatMoney(option.extra_amount)}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
          <button
            className="mt-8 w-full rounded-xl bg-amber-600 px-5 py-3 font-bold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!canAdd}
            onClick={() => {
              add(item.data, optionIds);
              setAdded(true);
            }}
            type="button"
          >
            {added
              ? "Added to cart"
              : `Add to cart · ${formatMoney(item.data.price_amount + extraAmount)}`}
          </button>
        </div>
      </article>
    </div>
  );
}
