"use client";

import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
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
  return categoryOptions.find((option) => option.id === category)?.label ?? "Todos";
}

function categoryFromHash(): CategoryFilter {
  if (typeof window === "undefined") return "todos";
  const hash = window.location.hash.replace("#", "");
  return validCategoryFilters.includes(hash as (typeof validCategoryFilters)[number])
    ? (hash as CategoryFilter)
    : "todos";
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

interface FilterControlsProps {
  category: CategoryFilter;
  selectedSizes: string[];
  priceFilter: PriceFilter;
  hasActiveFilters: boolean;
  onCategoryChange: (category: CategoryFilter) => void;
  onSizeToggle: (size: string) => void;
  onPriceChange: (price: PriceFilter) => void;
  onClear: () => void;
}

function FilterControls({ category, selectedSizes, priceFilter, hasActiveFilters, onCategoryChange, onSizeToggle, onPriceChange, onClear }: FilterControlsProps) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-[#2A1712]">Filtros</h2>
        {hasActiveFilters && (
          <button type="button" onClick={onClear} className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-[#8A5A36] underline-offset-4 hover:underline">
            Limpar
          </button>
        )}
      </div>

      <div className="border-t border-[#E4D5C3] py-4">
        <h3 className="mb-3 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-[#4F3527]">Categoria</h3>
        <div className="grid gap-1.5">
          {categoryOptions.map((option) => (
            <button key={option.id} type="button" onClick={() => onCategoryChange(option.id)} className={`rounded-full px-3 py-2.5 text-left font-sans text-[13px] transition-colors ${category === option.id ? "bg-[#E8D9C6] font-semibold text-[#2A1712]" : "text-[#4F3527] hover:bg-white/70"}`}>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-[#E4D5C3] py-4">
        <h3 className="mb-3 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-[#4F3527]">Tamanho</h3>
        <div className="flex flex-wrap gap-2">
          {sizeOptions.map((size) => (
            <button key={size} type="button" onClick={() => onSizeToggle(size)} className={`h-10 min-w-11 rounded-full border px-3 font-sans text-[12px] font-semibold transition-colors ${selectedSizes.includes(size) ? "border-[#8A5A36] bg-[#8A5A36] text-white" : "border-[#CDB89F] bg-white/70 text-[#4F3527] hover:border-[#B88A62]"}`}>
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-[#E4D5C3] py-4">
        <h3 className="mb-3 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-[#4F3527]">Valor</h3>
        <div className="grid gap-1.5">
          {priceOptions.map((option) => (
            <button key={option.id} type="button" onClick={() => onPriceChange(option.id)} className={`rounded-full px-3 py-2.5 text-left font-sans text-[13px] transition-colors ${priceFilter === option.id ? "bg-[#E8D9C6] font-semibold text-[#2A1712]" : "text-[#4F3527] hover:bg-white/70"}`}>
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ShopClient({ products }: { products: Product[] }) {
  const [category, setCategory] = useState<CategoryFilter>("todos");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("todos");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    setCategory(categoryFromHash());
    const handleHashChange = () => setCategory(categoryFromHash());
    const handleCategoryFilter = (event: Event) => {
      const filter = (event as CustomEvent<CategoryFilter>).detail;
      if (filter) setCategory(filter);
    };
    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("virtuosa-category-filter", handleCategoryFilter);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("virtuosa-category-filter", handleCategoryFilter);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileFiltersOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileFiltersOpen]);

  const filteredProducts = useMemo(() => products.filter((product) => {
    const productSizes = product.sizes ?? [];
    const sizeMatch = selectedSizes.length === 0 || selectedSizes.some((size) => productSizes.includes(size));
    return matchesCategory(product, category) && sizeMatch && matchesPrice(product.price, priceFilter);
  }), [category, priceFilter, products, selectedSizes]);

  const hasActiveFilters = category !== "todos" || selectedSizes.length > 0 || priceFilter !== "todos";
  const activeFilterCount = (category !== "todos" ? 1 : 0) + selectedSizes.length + (priceFilter !== "todos" ? 1 : 0);

  function toggleSize(size: string) {
    setSelectedSizes((current) => current.includes(size) ? current.filter((item) => item !== size) : [...current, size]);
  }

  function clearFilters() {
    setCategory("todos");
    setSelectedSizes([]);
    setPriceFilter("todos");
    window.history.replaceState(null, "", "/shop");
  }

  function selectCategory(nextCategory: CategoryFilter) {
    setCategory(nextCategory);
    window.history.replaceState(null, "", nextCategory === "todos" ? "/shop" : `/shop#${nextCategory}`);
  }

  const filterProps: FilterControlsProps = {
    category,
    selectedSizes,
    priceFilter,
    hasActiveFilters,
    onCategoryChange: selectCategory,
    onSizeToggle: toggleSize,
    onPriceChange: setPriceFilter,
    onClear: clearFilters,
  };

  return (
    <main id="main-content" className="min-h-screen bg-[#F7F1E8]">
      <section className="border-b border-[#D9C8B5] bg-[#FCF8F2] py-9 lg:py-12">
        <div className="container-virtuosa text-center lg:text-left">
          <p className="mb-3 font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9E714C]">Virtuosa USA</p>
          <h1 className="font-serif text-[#2A1712]" style={{ fontSize: "clamp(2.15rem, 4vw, 3.8rem)", lineHeight: 1.05 }}>
            Peças Selecionadas para Você
          </h1>
          <div className="mx-auto mt-5 space-y-2 font-sans text-[14px] leading-relaxed text-[#4F3527] lg:mx-0 lg:text-[15px]">
            <p className="lg:whitespace-nowrap">Cada peça foi escolhida para mulheres que desejam se vestir com elegância, feminilidade e autenticidade.</p>
            <p className="lg:whitespace-nowrap">Explore nossa seleção, descubra os detalhes de cada peça e encontre aquela que melhor expressa sua essência.</p>
          </div>
        </div>
      </section>

      <section className="container-virtuosa py-7 lg:py-12">
        <div className="mb-5 lg:hidden">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categoryOptions.map((option) => (
              <button key={option.id} type="button" onClick={() => selectCategory(option.id)} className={`min-h-10 shrink-0 rounded-full border px-4 font-sans text-[11px] font-semibold ${category === option.id ? "border-[#8A5A36] bg-[#8A5A36] text-white" : "border-[#D2BFA8] bg-[#FFFDF8] text-[#3A241B]"}`}>
                {option.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setMobileFiltersOpen(true)} className="flex min-h-12 w-full items-center justify-center gap-2 border border-[#B88A62] bg-[#FFFDF8] px-5 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-[#2A1712] shadow-[0_7px_18px_rgba(42,23,18,0.10)]" aria-haspopup="dialog">
            <SlidersHorizontal size={16} strokeWidth={1.6} aria-hidden />
            Filtrar peças
            {activeFilterCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#8A5A36] px-1 text-[10px] text-white">{activeFilterCount}</span>}
          </button>
        </div>

        <div className="grid gap-7 lg:grid-cols-[220px_1fr]">
          <aside className="hidden h-fit rounded-[12px] border border-[#D9C8B5]/70 bg-white/45 p-4 lg:block">
            <FilterControls {...filterProps} />
          </aside>

          <div>
            <div className="mb-5 flex items-end justify-between gap-4 border-b border-[#D9C8B5] pb-4 lg:mb-6">
              <div>
                <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9E714C]">{getCategoryLabel(category)}</p>
                <p className="mt-1 font-sans text-[13px] font-medium text-[#3A241B]">
                  {filteredProducts.length} {filteredProducts.length === 1 ? "peça encontrada" : "peças encontradas"}
                </p>
              </div>
              <p className="hidden max-w-sm font-sans text-[12px] leading-relaxed text-[#5D4336] sm:block">Filtre por categoria, tamanho ou valor.</p>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 xl:gap-6">
                {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            ) : (
              <div className="rounded-[14px] border border-[#D9C8B5] bg-white/60 px-6 py-14 text-center">
                <h2 className="font-serif text-3xl text-[#2A1712]">Nenhuma peça encontrada</h2>
                <p className="mx-auto mt-3 max-w-md font-sans text-sm leading-relaxed text-[#5D4336]">Ajuste tamanho ou valor para ver mais opções da coleção.</p>
                <button type="button" onClick={clearFilters} className="mt-6 bg-[#B88A62] px-7 py-3 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_7px_18px_rgba(42,23,18,0.12)]">Ver todas {"\u2192"}</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[120] lg:hidden" role="dialog" aria-modal="true" aria-label="Filtros da coleção">
          <button type="button" className="absolute inset-0 bg-[#170B07]/55 backdrop-blur-[2px]" onClick={() => setMobileFiltersOpen(false)} aria-label="Fechar filtros" />
          <div className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-[18px] bg-[#F8F3EB] px-6 pb-7 pt-5 shadow-[0_-18px_50px_rgba(23,11,7,0.22)]">
            <div className="mb-4 flex items-center justify-between border-b border-[#D9C8B5] pb-4">
              <p className="font-serif text-2xl text-[#2A1712]">Filtrar coleção</p>
              <button type="button" onClick={() => setMobileFiltersOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#CDB89F] text-[#2A1712]" aria-label="Fechar filtros">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
            <FilterControls {...filterProps} />
            <button type="button" onClick={() => setMobileFiltersOpen(false)} className="mt-2 flex min-h-12 w-full items-center justify-center bg-[#8A5A36] px-6 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_8px_20px_rgba(42,23,18,0.16)]">
              Ver {filteredProducts.length} {filteredProducts.length === 1 ? "peça" : "peças"} {"\u2192"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
