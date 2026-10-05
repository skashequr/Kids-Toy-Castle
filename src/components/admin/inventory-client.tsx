"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Package, ArrowRight } from "lucide-react";
import { updateProductStock, adjustProductStock } from "@/server/actions/inventory";
import { toast } from "@/components/ui/toaster";
import type { Product } from "@/types";

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return <span className="rounded-full bg-[#ffe3ec] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#c84270]">Out of stock</span>;
  }
  if (stock < 10) {
    return <span className="rounded-full bg-[#fff2c8] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#956400]">Low stock</span>;
  }
  return <span className="rounded-full bg-[#e8f8e8] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#34784c]">In stock</span>;
}

export function AdminInventoryClient({ products }: { products: Product[] }) {
  const router = useRouter();
  const [inventory, setInventory] = useState<Product[]>(products);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");
  const [editStock, setEditStock] = useState<Record<string, string>>({});
  const [loadingIds, setLoadingIds] = useState<string[]>([]);

  const filteredProducts = useMemo(() => {
    return inventory.filter((product) => {
      const query = search.trim().toLowerCase();
      const matchesSearch =
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.category.name.toLowerCase().includes(query);

      const matchesFilter =
        stockFilter === "all"
          ? true
          : stockFilter === "low"
          ? product.stock > 0 && product.stock < 10
          : product.stock === 0;

      return matchesSearch && matchesFilter;
    });
  }, [inventory, search, stockFilter]);

  const isLoading = (id: string) => loadingIds.includes(id);
  const lowStockCount = inventory.filter((product) => product.stock > 0 && product.stock < 10).length;
  const outOfStockCount = inventory.filter((product) => product.stock === 0).length;
  const totalUnits = inventory.reduce((total, product) => total + product.stock, 0);

  const setStockValue = (id: string, value: string) =>
    setEditStock((prev) => ({ ...prev, [id]: value }));

  const handleUpdateStock = async (productId: string) => {
    const rawValue = editStock[productId] ?? String(inventory.find((item) => item.id === productId)?.stock ?? 0);
    const stockValue = Number(rawValue);
    if (Number.isNaN(stockValue) || stockValue < 0) {
      toast.error("Enter a valid stock number.");
      return;
    }

    setLoadingIds((prev) => [...prev, productId]);
    const result = await updateProductStock(productId, stockValue);
    setLoadingIds((prev) => prev.filter((id) => id !== productId));

    if (result.ok) {
      setInventory((prev) =>
        prev.map((product) =>
          product.id === productId ? { ...product, stock: stockValue } : product
        )
      );
      toast.success("Stock updated.");
    } else {
      toast.error("Could not update stock.");
    }
    router.refresh();
  };

  const handleAdjustStock = async (productId: string, delta: number) => {
    setLoadingIds((prev) => [...prev, productId]);
    const result = await adjustProductStock(productId, delta);
    setLoadingIds((prev) => prev.filter((id) => id !== productId));

    if (result.ok) {
      setInventory((prev) =>
        prev.map((product) =>
          product.id === productId ? { ...product, stock: result.stock } : product
        )
      );
      setEditStock((prev) => ({ ...prev, [productId]: String(result.stock) }));
      toast.success("Stock adjusted.");
    } else {
      toast.error("Could not adjust stock.");
    }
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#238fda] px-6 py-7 text-white shadow-[0_16px_38px_rgba(35,143,218,0.22)] sm:px-8">
        <div className="absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/10" />
        <div className="absolute bottom-0 right-28 h-20 w-20 rounded-t-full bg-[#f9c55b]/25" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/75">Stock control</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight">Inventory</h1>
            <p className="mt-1 text-sm text-white/85">Keep every toy ready to ship with simple, instant stock updates.</p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-[#248fd6] shadow-lg shadow-[#155d98]/15 transition hover:-translate-y-0.5"
          >
            <Package className="h-4 w-4" /> View Products <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#d8edf9] bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#7895aa]">Products tracked</p>
          <p className="mt-1 text-2xl font-black text-[#234963]">{inventory.length}</p>
          <p className="mt-1 text-xs text-[#5f8298]">{totalUnits.toLocaleString()} total units available</p>
        </div>
        <div className="rounded-2xl border border-[#ffe1a1] bg-[#fff9e8] p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#956400]">Low stock</p>
          <p className="mt-1 text-2xl font-black text-[#c07600]">{lowStockCount}</p>
          <p className="mt-1 text-xs text-[#ac8233]">Less than 10 units remaining</p>
        </div>
        <div className="rounded-2xl border border-[#ffd6e3] bg-[#fff5f8] p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#c84270]">Out of stock</p>
          <p className="mt-1 text-2xl font-black text-[#d95789]">{outOfStockCount}</p>
          <p className="mt-1 text-xs text-[#b56b86]">Products that need replenishing</p>
        </div>
      </section>

      <div className="rounded-2xl border border-[#d8edf9] bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-[1fr_220px_180px] items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7895aa]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, SKU or category..."
              className="h-11 w-full rounded-xl border border-[#c9e3f3] bg-[#f7fcff] pl-10 pr-4 text-sm text-[#234963] outline-none placeholder:text-[#91aab9] transition focus:border-[#248fd6] focus:bg-white"
            />
          </div>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as "all" | "low" | "out")}
            className="h-11 rounded-xl border border-[#c9e3f3] bg-[#f7fcff] px-4 text-sm font-medium text-[#234963] outline-none transition focus:border-[#248fd6] focus:bg-white"
          >
            <option value="all">All stock levels</option>
            <option value="low">Low stock (&lt;10)</option>
            <option value="out">Out of stock</option>
          </select>

          <div className="flex items-center gap-2 text-sm text-[#7895aa]">
            <span className="font-black text-[#248fd6]">{filteredProducts.length}</span>
            products shown
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-[#d8edf9] bg-white shadow-[0_10px_30px_rgba(35,143,218,0.08)]">
        <table className="min-w-[780px] w-full text-sm">
          <thead className="bg-[#f1faff] text-left text-xs uppercase tracking-wide text-[#7895aa]">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Adjust</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e7f2f8]">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-[#7895aa]">No products match this filter.</td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product.id} className="transition-colors hover:bg-[#f8fcff]">
                  <td className="px-4 py-4 max-w-[260px]">
                    <div className="font-semibold text-[#234963]">{product.name}</div>
                    <div className="mt-1 text-xs text-[#7895aa]">
                      {product.variants?.length ? `${product.variants.length} variants` : "No variants"}
                    </div>
                  </td>
                  <td className="px-4 py-4 font-mono text-xs text-[#7895aa]">{product.sku}</td>
                  <td className="px-4 py-4 text-xs font-medium text-[#54758b]">{product.category.name}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-2">
                      <span className="text-lg font-black text-[#234963]">{product.stock}</span>
                      <StockBadge stock={product.stock} />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-2">
                      <div className="grid grid-cols-[1fr_auto] gap-2">
                        <input
                          type="number"
                          min={0}
                          value={editStock[product.id] ?? String(product.stock)}
                          onChange={(e) => setStockValue(product.id, e.target.value)}
                          className="h-10 w-full rounded-xl border border-[#c9e3f3] bg-[#f7fcff] px-3 text-sm font-semibold text-[#234963] outline-none transition focus:border-[#248fd6] focus:bg-white"
                        />
                        <button
                          type="button"
                          disabled={isLoading(product.id)}
                          onClick={() => handleUpdateStock(product.id)}
                          className="h-10 rounded-xl bg-[#f06a9f] px-4 text-sm font-bold text-white transition hover:bg-[#e8548b] disabled:opacity-70"
                        >
                          Save
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[ -5, -1, 1, 5 ].map((delta) => (
                          <button
                            key={delta}
                            type="button"
                            disabled={isLoading(product.id)}
                            onClick={() => handleAdjustStock(product.id, delta)}
                            className="inline-flex h-9 min-w-[42px] items-center justify-center rounded-xl border border-[#c9e3f3] bg-white text-xs font-bold text-[#54758b] transition-colors hover:border-[#248fd6] hover:bg-[#e4f5ff] hover:text-[#248fd6] disabled:opacity-70"
                          >
                            {delta > 0 ? "+" : ""}{delta}
                          </button>
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
