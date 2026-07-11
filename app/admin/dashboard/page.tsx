"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ProductItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  sizes: string[];
  colors: string[];
  inventoryBySize: Record<string, number>;
  inventoryByColorSize: Record<string, Record<string, number>>;
  inStock: boolean;
  sourceProductId?: string;
}

const PAYMENT_METHODS = [
  { value: "zelle", label: "Zelle" },
  { value: "cash", label: "Dinheiro" },
  { value: "venmo", label: "Venmo" },
  { value: "other", label: "Outro" },
];

const SIZE_ORDER = ["PP", "P", "M", "G", "GG", "XG", "XGG", "U"];

function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a.toUpperCase());
    const ib = SIZE_ORDER.indexOf(b.toUpperCase());
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

function getStockForSize(product: ProductItem, size: string): number {
  return product.inventoryBySize?.[size] ?? 0;
}

function getTotalStock(product: ProductItem): number {
  const vals = Object.values(product.inventoryBySize ?? {});
  if (vals.length === 0) return product.inStock ? 1 : 0;
  return vals.reduce((a, b) => a + b, 0);
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "out" | "low">("all");

  // Modal de venda
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("zelle");
  const [saleLoading, setSaleLoading] = useState(false);
  const [saleSuccess, setSaleSuccess] = useState("");
  const [saleError, setSaleError] = useState("");

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => {
        if (r.status === 401) {
          router.push("/admin");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.error) {
          setError(data.error);
        } else {
          setProducts(data.products ?? []);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Erro ao carregar produtos.");
        setLoading(false);
      });
  }, [router]);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  }

  function openSaleModal(product: ProductItem) {
    setSelectedProduct(product);
    const sizes = sortSizes(product.sizes ?? []);
    setSelectedSize(sizes[0] ?? "");
    setQuantity(1);
    setPaymentMethod("zelle");
    setSaleSuccess("");
    setSaleError("");
  }

  function closeSaleModal() {
    setSelectedProduct(null);
    setSaleSuccess("");
    setSaleError("");
  }

  async function handleRegisterSale() {
    if (!selectedProduct) return;
    setSaleLoading(true);
    setSaleError("");
    setSaleSuccess("");

    try {
      const productId = selectedProduct.sourceProductId ?? selectedProduct.id;
      const res = await fetch("/api/admin/register-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          size: selectedSize,
          quantity,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaleSuccess("Venda registrada! Estoque atualizado no Square.");
        // Atualizar estoque localmente
        setProducts((prev) =>
          prev.map((p) => {
            if ((p.sourceProductId ?? p.id) !== productId) return p;
            const updated = { ...p, inventoryBySize: { ...p.inventoryBySize } };
            if (selectedSize && updated.inventoryBySize[selectedSize] !== undefined) {
              updated.inventoryBySize[selectedSize] = Math.max(
                0,
                (updated.inventoryBySize[selectedSize] ?? 0) - quantity
              );
            }
            return updated;
          })
        );
      } else {
        setSaleError(data.error || "Erro ao registrar venda.");
      }
    } catch {
      setSaleError("Erro de conexao. Tente novamente.");
    } finally {
      setSaleLoading(false);
    }
  }

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const total = getTotalStock(p);
    if (filter === "out") return matchSearch && total === 0;
    if (filter === "low") return matchSearch && total > 0 && total <= 3;
    return matchSearch;
  });

  const s = {
    page: {
      minHeight: "100vh",
      background: "#f5f0eb",
      fontFamily: "Georgia, serif",
    },
    header: {
      background: "#2C1810",
      color: "#fff",
      padding: "14px 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerTitle: { fontSize: 16, fontWeight: 600, letterSpacing: "0.05em" },
    logoutBtn: {
      background: "transparent",
      border: "1px solid rgba(255,255,255,0.4)",
      color: "#fff",
      padding: "6px 14px",
      borderRadius: 6,
      fontSize: 13,
      cursor: "pointer",
      fontFamily: "Georgia, serif",
    },
    controls: {
      padding: "16px 16px 0",
      display: "flex",
      gap: 10,
      flexWrap: "wrap" as const,
    },
    searchInput: {
      flex: 1,
      minWidth: 180,
      padding: "9px 12px",
      border: "1px solid #ddd",
      borderRadius: 8,
      fontSize: 14,
      outline: "none",
      background: "#fff",
    },
    filterBtn: (active: boolean): React.CSSProperties => ({
      padding: "8px 14px",
      border: "1px solid",
      borderColor: active ? "#8B6914" : "#ddd",
      background: active ? "#8B6914" : "#fff",
      color: active ? "#fff" : "#555",
      borderRadius: 8,
      fontSize: 13,
      cursor: "pointer",
      fontFamily: "Georgia, serif",
    }),
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
      gap: 14,
      padding: 16,
    },
    card: {
      background: "#fff",
      borderRadius: 10,
      overflow: "hidden",
      boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
      cursor: "pointer",
      transition: "transform 0.15s, box-shadow 0.15s",
    },
    cardImg: {
      width: "100%",
      aspectRatio: "3/4",
      objectFit: "cover" as const,
      display: "block",
    },
    cardBody: { padding: "10px 10px 12px" },
    cardName: { fontSize: 13, fontWeight: 600, color: "#2C1810", marginBottom: 4, lineHeight: 1.3 },
    cardPrice: { fontSize: 12, color: "#8B6914", marginBottom: 6 },
    stockBadge: (total: number): React.CSSProperties => ({
      display: "inline-block",
      fontSize: 11,
      padding: "2px 8px",
      borderRadius: 20,
      background: total === 0 ? "#fee2e2" : total <= 3 ? "#fef9c3" : "#dcfce7",
      color: total === 0 ? "#dc2626" : total <= 3 ? "#a16207" : "#166534",
      fontWeight: 600,
    }),
    saleBtn: {
      width: "100%",
      marginTop: 8,
      padding: "7px 0",
      background: "#8B6914",
      color: "#fff",
      border: "none",
      borderRadius: 6,
      fontSize: 12,
      cursor: "pointer",
      fontFamily: "Georgia, serif",
      letterSpacing: "0.04em",
    },
    overlay: {
      position: "fixed" as const,
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
      zIndex: 1000,
    },
    modal: {
      background: "#fff",
      borderRadius: "16px 16px 0 0",
      padding: "24px 20px 32px",
      width: "100%",
      maxWidth: 480,
      maxHeight: "90vh",
      overflowY: "auto" as const,
    },
    modalTitle: { fontSize: 16, fontWeight: 600, color: "#2C1810", marginBottom: 4 },
    modalSubtitle: { fontSize: 13, color: "#888", marginBottom: 20 },
    label: {
      display: "block",
      fontSize: 11,
      letterSpacing: "0.08em",
      color: "#666",
      textTransform: "uppercase" as const,
      marginBottom: 6,
      marginTop: 14,
    },
    sizeGrid: { display: "flex", flexWrap: "wrap" as const, gap: 8 },
    sizeBtn: (active: boolean, stock: number): React.CSSProperties => ({
      padding: "7px 14px",
      border: "1px solid",
      borderColor: active ? "#8B6914" : stock === 0 ? "#f0f0f0" : "#ddd",
      background: active ? "#8B6914" : stock === 0 ? "#fafafa" : "#fff",
      color: active ? "#fff" : stock === 0 ? "#ccc" : "#333",
      borderRadius: 6,
      fontSize: 13,
      cursor: stock === 0 ? "not-allowed" : "pointer",
      fontFamily: "Georgia, serif",
    }),
    qtyRow: { display: "flex", alignItems: "center", gap: 12 },
    qtyBtn: {
      width: 36,
      height: 36,
      border: "1px solid #ddd",
      background: "#fff",
      borderRadius: 6,
      fontSize: 18,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    qtyVal: { fontSize: 18, fontWeight: 600, color: "#2C1810", minWidth: 24, textAlign: "center" as const },
    paymentGrid: { display: "flex", flexWrap: "wrap" as const, gap: 8 },
    payBtn: (active: boolean): React.CSSProperties => ({
      padding: "8px 16px",
      border: "1px solid",
      borderColor: active ? "#8B6914" : "#ddd",
      background: active ? "#8B6914" : "#fff",
      color: active ? "#fff" : "#333",
      borderRadius: 6,
      fontSize: 13,
      cursor: "pointer",
      fontFamily: "Georgia, serif",
    }),
    confirmBtn: {
      width: "100%",
      marginTop: 24,
      padding: "13px",
      background: "#8B6914",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      fontSize: 15,
      cursor: "pointer",
      fontFamily: "Georgia, serif",
      letterSpacing: "0.05em",
    },
    cancelBtn: {
      width: "100%",
      marginTop: 10,
      padding: "11px",
      background: "transparent",
      color: "#888",
      border: "1px solid #ddd",
      borderRadius: 8,
      fontSize: 14,
      cursor: "pointer",
      fontFamily: "Georgia, serif",
    },
    successMsg: {
      background: "#dcfce7",
      border: "1px solid #86efac",
      borderRadius: 8,
      padding: "12px 14px",
      fontSize: 14,
      color: "#166534",
      marginTop: 16,
    },
    errorMsg: {
      background: "#fef2f2",
      border: "1px solid #fca5a5",
      borderRadius: 8,
      padding: "12px 14px",
      fontSize: 14,
      color: "#dc2626",
      marginTop: 16,
    },
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <span style={s.headerTitle}>Virtuosa USA — Painel da Loja</span>
        <button style={s.logoutBtn} onClick={handleLogout}>
          Sair
        </button>
      </div>

      <div style={s.controls}>
        <input
          style={s.searchInput}
          placeholder="Buscar produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {(["all", "low", "out"] as const).map((f) => (
          <button key={f} style={s.filterBtn(filter === f)} onClick={() => setFilter(f)}>
            {f === "all" ? "Todos" : f === "low" ? "Estoque baixo" : "Esgotados"}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: 60, color: "#888", fontSize: 15 }}>
          Carregando produtos...
        </div>
      )}
      {error && (
        <div style={{ margin: 20, padding: 16, background: "#fef2f2", borderRadius: 8, color: "#dc2626", fontSize: 14 }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <div style={s.grid}>
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#888", padding: 40 }}>
              Nenhum produto encontrado.
            </div>
          )}
          {filtered.map((product) => {
            const total = getTotalStock(product);
            return (
              <div key={product.id} style={s.card}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image}
                  alt={product.name}
                  style={s.cardImg}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/placeholder.jpg";
                  }}
                />
                <div style={s.cardBody}>
                  <div style={s.cardName}>{product.name}</div>
                  <div style={s.cardPrice}>
                    ${product.price.toFixed(2)}
                  </div>
                  <span style={s.stockBadge(total)}>
                    {total === 0 ? "Esgotado" : total <= 3 ? `${total} restantes` : `${total} em estoque`}
                  </span>
                  <button style={s.saleBtn} onClick={() => openSaleModal(product)}>
                    Registrar venda
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedProduct && (
        <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && closeSaleModal()}>
          <div style={s.modal}>
            <div style={s.modalTitle}>{selectedProduct.name}</div>
            <div style={s.modalSubtitle}>
              ${selectedProduct.price.toFixed(2)} &nbsp;|&nbsp; Registrar venda manual
            </div>

            {(selectedProduct.sizes?.length ?? 0) > 0 && (
              <>
                <label style={s.label}>Tamanho</label>
                <div style={s.sizeGrid}>
                  {sortSizes(selectedProduct.sizes).map((size) => {
                    const stock = getStockForSize(selectedProduct, size);
                    return (
                      <button
                        key={size}
                        style={s.sizeBtn(selectedSize === size, stock)}
                        onClick={() => stock > 0 && setSelectedSize(size)}
                        disabled={stock === 0}
                      >
                        {size}
                        {stock === 0 && " (0)"}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <label style={s.label}>Quantidade</label>
            <div style={s.qtyRow}>
              <button style={s.qtyBtn} onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                -
              </button>
              <span style={s.qtyVal}>{quantity}</span>
              <button style={s.qtyBtn} onClick={() => setQuantity((q) => q + 1)}>
                +
              </button>
            </div>

            <label style={s.label}>Forma de pagamento</label>
            <div style={s.paymentGrid}>
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  style={s.payBtn(paymentMethod === m.value)}
                  onClick={() => setPaymentMethod(m.value)}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {saleSuccess && <div style={s.successMsg}>{saleSuccess}</div>}
            {saleError && <div style={s.errorMsg}>{saleError}</div>}

            {!saleSuccess && (
              <button
                style={{ ...s.confirmBtn, opacity: saleLoading ? 0.7 : 1 }}
                onClick={handleRegisterSale}
                disabled={saleLoading}
              >
                {saleLoading ? "Registrando..." : "Confirmar venda"}
              </button>
            )}
            <button style={s.cancelBtn} onClick={closeSaleModal}>
              {saleSuccess ? "Fechar" : "Cancelar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
