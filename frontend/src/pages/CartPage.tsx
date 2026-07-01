import { Link } from "react-router-dom";
import { Checkout } from "../components/Checkout";
import { useCart } from "../context/CartContext";
import { formatMoney } from "../lib/money";

export function CartPage() {
  const { cart, increment, decrement, remove } = useCart();
  const lineAmount = (line: (typeof cart)[number]) => {
    const options = line.item.customization_groups
      .flatMap((group) => group.options)
      .filter((option) => line.optionIds.includes(option.id));
    return (
      (line.item.price_amount +
        options.reduce((sum, option) => sum + option.extra_amount, 0)) *
      line.quantity
    );
  };
  const total = cart.reduce((sum, line) => sum + lineAmount(line), 0);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-black">Your cart</h1>
      {!cart.length ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-slate-600">Your cart is empty.</p>
          <Link
            className="mt-4 inline-block font-semibold text-amber-700 hover:underline"
            to="/"
          >
            Browse the menu
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
          <ul className="space-y-4">
            {cart.map((line) => {
              const selectedOptions = line.item.customization_groups
                .flatMap((group) =>
                  group.options.map((option) => ({
                    ...option,
                    group: group.name,
                  })),
                )
                .filter((option) => line.optionIds.includes(option.id));
              return (
                <li
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  key={line.key}
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <h2 className="font-bold">{line.item.title}</h2>
                      {selectedOptions.map((option) => (
                        <p className="text-sm text-slate-500" key={option.id}>
                          {option.group}: {option.name}
                        </p>
                      ))}
                    </div>
                    <p className="font-semibold">
                      {formatMoney(lineAmount(line))}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      aria-label={`Decrease ${line.item.title}`}
                      className="h-9 w-9 rounded-full border border-slate-300"
                      onClick={() => decrement(line.key)}
                      type="button"
                    >
                      −
                    </button>
                    <span
                      aria-label="Quantity"
                      className="min-w-6 text-center font-semibold"
                    >
                      {line.quantity}
                    </span>
                    <button
                      aria-label={`Increase ${line.item.title}`}
                      className="h-9 w-9 rounded-full border border-slate-300"
                      disabled={line.quantity >= 20}
                      onClick={() => increment(line.key)}
                      type="button"
                    >
                      +
                    </button>
                    <button
                      className="ml-auto text-sm font-medium text-red-700 hover:underline"
                      onClick={() => remove(line.key)}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatMoney(total)}</span>
            </div>
            <Checkout />
            <p className="mt-3 text-center text-xs text-slate-500">
              Prices are verified securely before payment.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
