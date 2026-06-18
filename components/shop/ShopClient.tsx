"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product, ProductCategory } from "@/types";

type CategoryFilter = "todos" | "lancamentos" | ProductCategory;
type PriceFilter = "todos" | "ate-150" | "150-250" | "250-350" | "350-plus";

const validCategoryFilters = ["lancamentos", "vestidos", "blusas", "conjuntos", "saias", "calcas"] as const;
const categoryOptions: { id: CategoryFilter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "lancamentos", label: "Lançamentos" },
  { id: "vestidos", label: "Vestidos" },
  { id: "blusas", label: "Blusas" },
  { id: "conjuntos", label: "Conjuntos" },
  { id: "saias", label: "Saias" },
  { id: "calcas", label: "Calças" },
];
const sizeOptions = ["P", "M", "G", "GG"];
const priceOptions: { id: PriceFilter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "ate-150", label: "Até $150" },
  { id: "150-250", label: "$150 a $250" },
  { id: "250-350", label: "$250 a $350" },
  { id: "350-plus", label: "Acima de $350" },
];

function getCategoryLabel(category: CategoryFilter) {
  const labels: Record<CategoryFilter, string> = {
    todos: "Todas as peças",
    lancamentos: "Lançamentos",
    vestidos: "Vestidos",
    blusas: "Blusas",
    conjuntos: "Conjuntos",
    saias: "Saias",
    calcas: "Calças",
  };

  return labels[category];
}

function categoryFromHash(): CategoryFilter {
  if (typeof window === "undefined") return "todos";

  const hash = window.location.hash.replace("#", "");
  if (validCategoryFilters.includes(hash as (typeof validCategoryFilters)[number])) {
    return hash as CategoryFilter;
  }

  return "todos";
}

function matchesCategory(product: Product, category: CategoryFilter) {
  if (category === "todos") return true;
  if (category === "lancamentos") return product.badge === "new";
  return product.category === category;
}

function matchesPrice(price: number, filter: PriceFilter) {
  if (filter === "todos") return true;
  if (filter === "ate-150") return price <= 150;
  if (filter === "150-250") return price > 150 && price <= 250;
  if (filter === "250-350") return price > 250 && price <= 350;
  return price > 350;
}

export function ShopClient({ products }: { products: Product[] }) {
  const [category, setCategory] = useState<CategoryFilter>("todos");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("todos");

  useEffect(() => {
    setCategory(categoryFromHash());

    function handleHashChange() {
      setCategory(categoryFromHash());
    }

    function handleCategoryFilter(event: Event) {
      const filter = (event as CustomEvent<CategoryFilter>).detail;
      if (filter) setCategory(filter);
    }

    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("virtuosa-category-filter", handleCategoryFilter);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("virtuosa-category-filter", handleCategoryFilter);
    };
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const productSizes = product.sizes ?? [];
      const sizeMatch = selectedSizes.length === 0 || selectedSizes.some((size) => productSizes.includes(size));
      return matchesCategory(product, category) && sizeMatch && matchesPrice(product.price, priceFilter);
    });
  }, [category, priceFilter, products, selectedSizes]);

  const hasActiveFilters = category !== "todos" || selectedSizes.length > 0 || priceFilter !== "todos";

  function toggleSize(size: string) {
    setSelectedSizes((current) =>
      current.includes(size) ? current.filter((item) => item !== size) : [...current, size]
    );
  }

  function clearFilters() {
    setCategory("todos");
    setSelectedSizes([]);
    setPriceFilter("todos");
    window.history.replaceState(null, "", "/shop");
  }

  function selectCategory(nextCategory: CategoryFilter) {
    setCategory(nextCategory);
    const path = nextCategory === "todos" ? "/shop" : `/shop#${nextCategory}`;
    window.history.replaceState(null, "", path);
  }

  return (
    <main id="main-content" className="min-h-screen bg-[#F7F1E8]">
      <section className="border-b border-[#D9C8B5] bg-white/60 py-10">
        <div className="container-virtuosa">
          <p className="mb-3 font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9E714C]">
            Virtuosa USA
          </p>
          <h1 className="font-serif text-[#2A1712]" style={{ fontSize: "clamp(2.3rem, 4vw, 4rem)", lineHeight: 1 }}>
            Explore a Coleção
          </h1>
          <p className="mt-4 max-w-3xl whitespace-normal font-sans text-[15px] leading-relaxed text-[#4F3527] lg:whitespace-nowrap">
            Escolha sua peça, veja os detalhes e finalize sua compra com segurança.
          </p>
        </div>
      </section>

      <section className="container-virtuosa py-9 lg:py-12">
        <div className="grid gap-7 lg:grid-cols-[220px_1fr]">
          <aside className="h-fit rounded-[12px] border border-[#D9C8B5]/70 bg-white/45 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-[#2A1712]">
                Filtros
              </h2>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9E714C] transition-colors hover:text-[#4F2107]"
                >
                  Limpar
                </button>
              )}
            </div>

            <div className="border-t border-[#E4D5C3] py-4">
              <h3 className="mb-3 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-[#4F3527]">
                Categoria
              </h3>
              <div className="grid gap-1.5">
                {categoryOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => selectCategory(option.id)}
                    className={`rounded-full px-3 py-2 text-left font-sans text-[12px] transition-colors ${
                      category === option.id
                        ? "bg-[#E8D9C6] font-semibold text-[#2A1712]"
                        : "text-[#5D4336] hover:bg-white/70"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-[#E4D5C3] py-4">
              <h3 className="mb-3 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-[#4F3527]">
                Tamanho
              </h3>
              <div className="flex flex-wrap gap-2">
                {sizeOptions.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    className={`h-8 min-w-9 rounded-full border px-3 font-sans text-[11px] font-semibold transition-colors ${
                      selectedSizes.includes(size)
                        ? "border-[#8A5A36] bg-[#8A5A36] text-white"
                        : "border-[#D9C8B5] bg-white/60 text-[#4F3527] hover:border-[#B88A62]"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-[#E4D5C3] py-4">
              <h3 className="mb-3 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-[#4F3527]">
                Valor
              </h3>
              <div className="grid gap-1.5">
                {priceOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPriceFilter(option.id)}
                    className={`rounded-full px-3 py-2 text-left font-sans text-[12px] transition-colors ${
                      priceFilter === option.id
                        ? "bg-[#E8D9C6] font-semibold text-[#2A1712]"
                        : "text-[#5D4336] hover:bg-white/70"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div>
            <div className="mb-6 flex flex-col justify-between gap-2 border-b border-[#D9C8B5] pb-4 sm:flex-row sm:items-end">
              <div>
                <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9E714C]">
                  {getCategoryLabel(category)}
                </p>
                <p className="mt-1 font-sans text-[13px] text-[#4F3527]">
                  {filteredProducts.length} {filteredProducts.length === 1 ? "peça encontrada" : "peças encontradas"}
                </p>
              </div>
              <p className="max-w-sm font-sans text-[12px] leading-relaxed text-[#6F5547]">
                Filtre por categoria, tamanho ou valor sem sair da coleção.
              </p>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 xl:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="rounded-[14px] border border-[#D9C8B5] bg-white/60 px-6 py-14 text-center">
                <h2 className="font-serif text-3xl text-[#2A1712]">Nenhuma peça encontrada</h2>
                <p className="mx-auto mt-3 max-w-md font-sans text-sm leading-relaxed text-[#5D4336]">
                  Ajuste tamanho ou valor para ver mais opções da coleção.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-6 rounded-full bg-[#B88A62] px-7 py-3 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-white"
                >
                  Ver todas
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
