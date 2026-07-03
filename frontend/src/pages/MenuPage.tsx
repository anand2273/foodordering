import { useQuery } from "@tanstack/react-query";
import { getMenu } from "../api/foodapp";
import { ErrorMessage, Loading } from "../components/Feedback";
import { MenuCard } from "../components/MenuCard";

export function MenuPage() {
  const menu = useQuery({
    queryKey: ["menu"],
    queryFn: getMenu,
    staleTime: 60_000,
  });
  if (menu.isLoading) return <Loading label="Loading menu…" />;
  if (menu.isError)
    return <ErrorMessage message="The menu could not be loaded." />;
  return (
    <>
      <div className="mb-8 max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-wider text-amber-700">
          Order ahead
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">
          Fresh drinks, ready when you are.
        </h1>
        <p className="mt-3 text-slate-600">
          Customize your order and choose a convenient pickup point.
        </p>
      </div>
      {menu.data?.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {menu.data.map((item) => (
            <MenuCard item={item} key={item.id} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-600">
          No menu items are available.
        </p>
      )}
    </>
  );
}
