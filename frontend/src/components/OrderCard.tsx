import type { CustomerOrder, MerchantOrder } from "../types";
import { formatMoney } from "../lib/money";

export function OrderCard({
  order,
  merchant = false,
  actions,
}: {
  order: CustomerOrder | MerchantOrder;
  merchant?: boolean;
  actions?: React.ReactNode;
}) {
  const merchantOrder = merchant ? (order as MerchantOrder) : undefined;
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Order {order.id.slice(0, 8).toUpperCase()}
          </p>
          {merchantOrder && (
            <h2 className="mt-1 text-lg font-bold">
              {merchantOrder.customer_name}
            </h2>
          )}
          {merchantOrder && (
            <a
              className="text-sm text-amber-700 underline"
              href={`mailto:${merchantOrder.customer_email}`}
            >
              {merchantOrder.customer_email}
            </a>
          )}
        </div>
        <div className="text-right">
          <p className="font-bold">
            {formatMoney(order.amount_total, order.currency)}
          </p>
          <p className="text-sm capitalize text-slate-600">
            {order.fulfillment_status}
          </p>
        </div>
      </div>
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Pickup</dt>
          <dd className="font-medium">{order.location}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Placed</dt>
          <dd className="font-medium">
            {new Date(order.created_at).toLocaleString()}
          </dd>
        </div>
      </dl>
      <ul className="mt-5 divide-y divide-slate-100 border-y border-slate-100">
        {order.items.map((item, index) => (
          <li className="py-3" key={`${item.title}-${index}`}>
            <div className="flex justify-between gap-3">
              <span className="font-medium">
                {item.quantity} × {item.title}
              </span>
              <span>
                {formatMoney(item.unit_amount * item.quantity, order.currency)}
              </span>
            </div>
            {item.customizations.length > 0 && (
              <ul className="mt-1 text-sm text-slate-500">
                {item.customizations.map((option) => (
                  <li key={`${option.group_name}:${option.option_name}`}>
                    {option.group_name}: {option.option_name}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      {actions && <div className="mt-5 flex flex-wrap gap-3">{actions}</div>}
    </article>
  );
}
