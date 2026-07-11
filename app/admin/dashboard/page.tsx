"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface ProductItem {
  id: string;
  name: string;
  slug?: string;
  price: number;
  image: string;
  category: string;
  sizes: string[];
  colors: string[];
  inventoryBySize: Record<string, number>;
  inventoryByColorSize: Record<string, Record<string, number>>;
  inStock: boolean;
  sourceProductId?: string;
  squareId: string | null; // null = produto manual sem backing no Square
}

const PAYMENT_METHODS = [
  { value: "zelle", label: "Zelle" },
  { value: "cash", label: "Dinheiro" },
  { value: "venmo", label: "Venmo" },
  { value: "other", label: "Outro" },
];

const SIZE_OPTIONS = ["PP", "P", "M", "G", "GG", "XG", "XGG", "U"];
const STORE_CATEGORIES = [
  "Lançamentos",
  "Vestidos",
  "Blusas",
  "Camisas",
  "Conjuntos",
  "Saias",
  "Casacos",
  "Macacão",
  "Calças",
  "Live",
];

const CATEGORY_LABEL_BY_ID: Record<string, string> = {
  lancamentos: "Lançamentos",
  vestidos: "Vestidos",
  blusas: "Blusas",
  camisas: "Camisas",
  conjuntos: "Conjuntos",
  saias: "Saias",
  casacos: "Casacos",
  macacao: "Macacão",
  calcas: "Calças",
  live: "Live",
};

function normalizeCategory(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getCategoryLabel(category: string): string {
  if (!category) return "Vestidos";
  const normalized = normalizeCategory(category);
  return (
    CATEGORY_LABEL_BY_ID[normalized] ??
    STORE_CATEGORIES.find((item) => normalizeCategory(item) === normalized) ??
    "Vestidos"
  );
}

function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const ia = SIZE_OPTIONS.indexOf(a.toUpperCase());
    const ib = SIZE_OPTIONS.indexOf(b.toUpperCase());
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

type ModalType = "sale" | "edit" | "stock" | "create" | null;

export default function AdminDashboardPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "out" | "low">("all");
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  // Modal de venda
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("zelle");
  const [saleLoading, setSaleLoading] = useState(false);
  const [saleSuccess, setSaleSuccess] = useState("");
  const [saleError, setSaleError] = useState("");

  // Modal de edicao
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCategory, setEditCategory] = useState("Vestidos");
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState("");
  const [editError, setEditError] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState("");

  // Modal de ajuste de estoque
  const [stockSize, setStockSize] = useState("");
  const [stockQty, setStockQty] = useState(1);
  const [stockAction, setStockAction] = useState<"add" | "set">("add");
  const [stockLoading, setStockLoading] = useState(false);
  const [stockSuccess, setStockSuccess] = useState("");
  const [stockError, setStockError] = useState("");

  // Modal de cadastro
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createPrice, setCreatePrice] = useState("");
  const [createCategory, setCreateCategory] = useState("Vestidos");
  const [createSizes, setCreateSizes] = useState<{ size: string; quantity: number }[]>([
    { size: "P", quantity: 1 },
    { size: "M", quantity: 1 },
    { size: "G", quantity: 1 },
  ]);
  const [createImageFile, setCreateImageFile] = useState<File | null>(null);
  const [createImagePreview, setCreateImagePreview] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createSuccess, setCreateSuccess] = useState("");
  const [createError, setCreateError] = useState("");

  const editFileRef = useRef<HTMLInputElement>(null);
  const createFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadProducts() {
    setLoading(true);
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
        if (data.error) setError(data.error);
        else setProducts(data.products ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError("Erro ao carregar produtos.");
        setLoading(false);
      });
  }

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
    setActiveModal("sale");
  }

  function openEditModal(product: ProductItem) {
    if (!product.squareId) {
      alert("Este produto e local e nao pode ser editado pelo painel. Cadastre-o no Square primeiro.");
      return;
    }
    setSelectedProduct(product);
    setEditName(product.name);
    setEditDescription("");
    setEditPrice(product.price.toFixed(2));
    setEditCategory(getCategoryLabel(product.category));
    setEditSuccess("");
    setEditError("");
    setEditImageFile(null);
    setEditImagePreview(product.image);
    setActiveModal("edit");
  }

  function openStockModal(product: ProductItem) {
    if (!product.squareId) {
      alert("Este produto e local e nao pode ter estoque ajustado pelo painel. Cadastre-o no Square primeiro.");
      return;
    }
    setSelectedProduct(product);
    const sizes = sortSizes(product.sizes ?? []);
    setStockSize(sizes[0] ?? "");
    setStockQty(1);
    setStockAction("add");
    setStockSuccess("");
    setStockError("");
    setActiveModal("stock");
  }

  function openCreateModal() {
    setCreateName("");
    setCreateDescription("");
    setCreatePrice("");
    setCreateCategory("Vestidos");
    setCreateSizes([
      { size: "P", quantity: 1 },
      { size: "M", quantity: 1 },
      { size: "G", quantity: 1 },
    ]);
    setCreateImageFile(null);
    setCreateImagePreview("");
    setCreateSuccess("");
    setCreateError("");
    setActiveModal("create");
  }

  function closeModal() {
    setActiveModal(null);
    setSelectedProduct(null);
  }

  async function handleRegisterSale() {
    if (!selectedProduct) return;
    setSaleLoading(true);
    setSaleError("");
    setSaleSuccess("");
    try {
      // Usa squareId quando disponivel, senao tenta sourceProductId, senao id
      const productId = selectedProduct.squareId ?? selectedProduct.sourceProductId ?? selectedProduct.id;
      const res = await fetch("/api/admin/register-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, size: selectedSize, quantity, paymentMethod }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaleSuccess("Venda registrada! Estoque atualizado no Square.");
        setProducts((prev) =>
          prev.map((p) => {
            if ((p.squareId ?? p.sourceProductId ?? p.id) !== productId) return p;
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

  async function handleEditProduct() {
    if (!selectedProduct || !selectedProduct.squareId) return;
    setEditLoading(true);
    setEditError("");
    setEditSuccess("");
    try {
      const squareId = selectedProduct.squareId;

      // Upload de imagem PRIMEIRO se houver
      if (editImageFile) {
        const fd = new FormData();
        fd.append("image", editImageFile);
        fd.append("productId", squareId);
        const imgRes = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
        const imgData = await imgRes.json().catch(() => ({}));
        if (!imgRes.ok) {
          setEditError("Erro ao enviar foto: " + (imgData.error || imgRes.status));
          setEditLoading(false);
          return;
        }
      }

      // Atualizar dados do produto
      const res = await fetch("/api/admin/update-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: squareId,
          name: editName,
          description: editDescription || undefined,
          price: parseFloat(editPrice) || undefined,
          category: editCategory,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditSuccess("Produto atualizado com sucesso!");
        setProducts((prev) =>
          prev.map((p) =>
            p.squareId === squareId
              ? { ...p, name: editName, price: parseFloat(editPrice) || p.price, category: editCategory }
              : p
          )
        );
      } else {
        setEditError(data.error || "Erro ao atualizar produto.");
      }
    } catch {
      setEditError("Erro de conexao. Tente novamente.");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleAdjustStock() {
    if (!selectedProduct || !selectedProduct.squareId) return;
    setStockLoading(true);
    setStockError("");
    setStockSuccess("");
    try {
      const squareId = selectedProduct.squareId;
      const res = await fetch("/api/admin/adjust-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: squareId, size: stockSize, quantity: stockQty, action: stockAction }),
      });
      const data = await res.json();
      if (res.ok) {
        setStockSuccess(data.message || "Estoque atualizado no Square!");
        setProducts((prev) =>
          prev.map((p) => {
            if (p.squareId !== squareId) return p;
            const updated = { ...p, inventoryBySize: { ...p.inventoryBySize } };
            if (stockSize) {
              if (stockAction === "set") {
                updated.inventoryBySize[stockSize] = stockQty;
              } else {
                updated.inventoryBySize[stockSize] = (updated.inventoryBySize[stockSize] ?? 0) + stockQty;
              }
            }
            return updated;
          })
        );
      } else {
        setStockError(data.error || "Erro ao ajustar estoque.");
      }
    } catch {
      setStockError("Erro de conexao. Tente novamente.");
    } finally {
      setStockLoading(false);
    }
  }

  async function handleCreateProduct() {
    if (!createName || !createPrice || createSizes.length === 0) {
      setCreateError("Preencha nome, preco e pelo menos um tamanho.");
      return;
    }
    setCreateLoading(true);
    setCreateError("");
    setCreateSuccess("");
    try {
      const res = await fetch("/api/admin/create-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName,
          description: createDescription,
          price: parseFloat(createPrice),
          category: createCategory,
          sizes: createSizes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // Upload de imagem usando o ID real retornado pelo Square
        if (createImageFile && data.productId) {
          const fd = new FormData();
          fd.append("image", createImageFile);
          fd.append("productId", data.productId);
          const imgRes = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
          if (!imgRes.ok) {
            setCreateSuccess("Produto cadastrado! Mas a foto nao foi enviada — use o botao Editar depois.");
            setTimeout(() => loadProducts(), 2000);
            return;
          }
        }
        setCreateSuccess("Produto cadastrado com sucesso! Aparecera na loja em instantes.");
        setTimeout(() => loadProducts(), 2000);
      } else {
        setCreateError(data.error || "Erro ao cadastrar produto.");
      }
    } catch {
      setCreateError("Erro de conexao. Tente novamente.");
    } finally {
      setCreateLoading(false);
    }
  }

  function addCreateSize() {
    const used = createSizes.map((s) => s.size);
    const next = SIZE_OPTIONS.find((s) => !used.includes(s));
    if (next) setCreateSizes((prev) => [...prev, { size: next, quantity: 1 }]);
  }

  function removeCreateSize(idx: number) {
    setCreateSizes((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateCreateSize(idx: number, field: "size" | "quantity", value: string | number) {
    setCreateSizes((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  }

  async function copyProductLink(product: ProductItem) {
    if (!product.slug) {
      alert("Link da peça ainda não está disponível. Recarregue os produtos e tente novamente.");
      return;
    }

    const url = `${window.location.origin}/shop/${product.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      alert("Link da peça copiado para enviar na live.");
    } catch {
      window.prompt("Copie o link da peça:", url);
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
    page: { minHeight: "100vh", background: "#f5f0eb", fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif" } as React.CSSProperties,
    header: {
      background: "#2C1810", color: "#fff", padding: "14px 20px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    } as React.CSSProperties,
    headerTitle: { fontSize: 16, fontWeight: 600, letterSpacing: "0.05em" } as React.CSSProperties,
    headerRight: { display: "flex", gap: 10, alignItems: "center" } as React.CSSProperties,
    addBtn: {
      background: "#8B6914", border: "none", color: "#fff",
      padding: "7px 16px", borderRadius: 6, fontSize: 13, cursor: "pointer", fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
    } as React.CSSProperties,
    logoutBtn: {
      background: "transparent", border: "1px solid rgba(255,255,255,0.4)", color: "#fff",
      padding: "6px 14px", borderRadius: 6, fontSize: 13, cursor: "pointer", fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
    } as React.CSSProperties,
    controls: { padding: "16px 16px 0", display: "flex", gap: 10, flexWrap: "wrap" as const } as React.CSSProperties,
    searchInput: {
      flex: 1, minWidth: 180, padding: "9px 12px", border: "1px solid #ddd",
      borderRadius: 8, fontSize: 14, outline: "none", background: "#fff",
    } as React.CSSProperties,
    filterBtn: (active: boolean): React.CSSProperties => ({
      padding: "8px 14px", border: "1px solid",
      borderColor: active ? "#8B6914" : "#ddd",
      background: active ? "#8B6914" : "#fff",
      color: active ? "#fff" : "#555",
      borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
    }),
    grid: {
      display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
      gap: 14, padding: 16,
    } as React.CSSProperties,
    card: {
      background: "#fff", borderRadius: 10, overflow: "hidden",
      boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
    } as React.CSSProperties,
    cardImg: { width: "100%", aspectRatio: "3/4", objectFit: "cover" as const, display: "block" } as React.CSSProperties,
    cardBody: { padding: "10px 10px 12px" } as React.CSSProperties,
    cardName: { fontSize: 13, fontWeight: 600, color: "#2C1810", marginBottom: 4, lineHeight: 1.3 } as React.CSSProperties,
    cardPrice: { fontSize: 12, color: "#8B6914", marginBottom: 6 } as React.CSSProperties,
    stockBadge: (total: number): React.CSSProperties => ({
      display: "inline-block", fontSize: 11, padding: "2px 8px", borderRadius: 20,
      background: total === 0 ? "#fee2e2" : total <= 3 ? "#fef9c3" : "#dcfce7",
      color: total === 0 ? "#dc2626" : total <= 3 ? "#a16207" : "#166534",
      fontWeight: 600,
    }),

    cardActions: { display: "flex", gap: 6, marginTop: 8 } as React.CSSProperties,
    saleBtn: {
      flex: 1, padding: "7px 0", background: "#8B6914", color: "#fff",
      border: "none", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
    } as React.CSSProperties,
    linkBtn: {
      padding: "7px 10px",
      background: "#f5f0eb",
      color: "#8B6914",
      border: "1px solid #d7c6ae",
      borderRadius: 6,
      fontSize: 11,
      cursor: "pointer",
      fontFamily: "Georgia, serif",
      fontWeight: 600,
    } as React.CSSProperties,
    iconBtn: (enabled: boolean): React.CSSProperties => ({
      padding: "7px 10px",
      background: enabled ? "#fff" : "#f9f9f9",
      color: enabled ? "#2C1810" : "#ccc",
      border: "1px solid",
      borderColor: enabled ? "#ddd" : "#eee",
      borderRadius: 6, fontSize: 11,
      cursor: enabled ? "pointer" : "not-allowed",
      fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
    }),
    overlay: {
      position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000,
    } as React.CSSProperties,
    modal: {
      background: "#fff", borderRadius: "16px 16px 0 0",
      padding: "24px 20px 32px", width: "100%", maxWidth: 480,
      maxHeight: "90vh", overflowY: "auto" as const,
    } as React.CSSProperties,
    modalTitle: { fontSize: 16, fontWeight: 600, color: "#2C1810", marginBottom: 4 } as React.CSSProperties,
    modalSubtitle: { fontSize: 13, color: "#888", marginBottom: 20 } as React.CSSProperties,
    label: {
      display: "block", fontSize: 11, letterSpacing: "0.08em", color: "#666",
      textTransform: "uppercase" as const, marginBottom: 6, marginTop: 14,
    } as React.CSSProperties,
    input: {
      width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8,
      fontSize: 14, fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif", outline: "none", boxSizing: "border-box" as const,
    } as React.CSSProperties,
    textarea: {
      width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8,
      fontSize: 14, fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif", outline: "none",
      boxSizing: "border-box" as const, minHeight: 80, resize: "vertical" as const,
    } as React.CSSProperties,
    sizeGrid: { display: "flex", flexWrap: "wrap" as const, gap: 8 } as React.CSSProperties,
    sizeBtn: (active: boolean, stock: number): React.CSSProperties => ({
      padding: "7px 14px", border: "1px solid",
      borderColor: active ? "#8B6914" : stock === 0 ? "#f0f0f0" : "#ddd",
      background: active ? "#8B6914" : stock === 0 ? "#fafafa" : "#fff",
      color: active ? "#fff" : stock === 0 ? "#ccc" : "#333",
      borderRadius: 6, fontSize: 13,
      cursor: stock === 0 ? "not-allowed" : "pointer",
      fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
    }),
    sizeBtnSimple: (active: boolean): React.CSSProperties => ({
      padding: "7px 14px", border: "1px solid",
      borderColor: active ? "#8B6914" : "#ddd",
      background: active ? "#8B6914" : "#fff",
      color: active ? "#fff" : "#333",
      borderRadius: 6, fontSize: 13, cursor: "pointer", fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
    }),
    qtyRow: { display: "flex", alignItems: "center", gap: 12 } as React.CSSProperties,
    qtyBtn: {
      width: 36, height: 36, border: "1px solid #ddd", background: "#fff",
      borderRadius: 6, fontSize: 18, cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
    } as React.CSSProperties,
    qtyVal: { fontSize: 18, fontWeight: 600, color: "#2C1810", minWidth: 24, textAlign: "center" as const } as React.CSSProperties,
    paymentGrid: { display: "flex", flexWrap: "wrap" as const, gap: 8 } as React.CSSProperties,
    payBtn: (active: boolean): React.CSSProperties => ({
      padding: "8px 16px", border: "1px solid",
      borderColor: active ? "#8B6914" : "#ddd",
      background: active ? "#8B6914" : "#fff",
      color: active ? "#fff" : "#333",
      borderRadius: 6, fontSize: 13, cursor: "pointer", fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
    }),
    confirmBtn: {
      width: "100%", marginTop: 24, padding: "13px", background: "#8B6914",
      color: "#fff", border: "none", borderRadius: 8, fontSize: 15,
      cursor: "pointer", fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif", letterSpacing: "0.05em",
    } as React.CSSProperties,
    cancelBtn: {
      width: "100%", marginTop: 10, padding: "11px", background: "transparent",
      color: "#888", border: "1px solid #ddd", borderRadius: 8,
      fontSize: 14, cursor: "pointer", fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
    } as React.CSSProperties,
    successMsg: {
      background: "#dcfce7", border: "1px solid #86efac", borderRadius: 8,
      padding: "12px 14px", fontSize: 14, color: "#166534", marginTop: 16,
    } as React.CSSProperties,
    errorMsg: {
      background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8,
      padding: "12px 14px", fontSize: 14, color: "#dc2626", marginTop: 16,
    } as React.CSSProperties,
    imagePreview: {
      width: "100%", height: 180, objectFit: "cover" as const,
      borderRadius: 8, marginBottom: 8, display: "block",
    } as React.CSSProperties,
    uploadBtn: {
      width: "100%", padding: "10px", background: "#f5f0eb",
      border: "1px dashed #8B6914", borderRadius: 8, fontSize: 13,
      color: "#8B6914", cursor: "pointer", fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
      textAlign: "center" as const,
    } as React.CSSProperties,
    select: {
      width: "100%", padding: "10px 12px", border: "1px solid #ddd",
      borderRadius: 8, fontSize: 14, fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
      outline: "none", background: "#fff",
    } as React.CSSProperties,
    sizeRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 } as React.CSSProperties,
    removeBtn: {
      padding: "6px 10px", background: "#fef2f2", border: "1px solid #fca5a5",
      borderRadius: 6, fontSize: 12, color: "#dc2626", cursor: "pointer",
    } as React.CSSProperties,
    addSizeBtn: {
      padding: "8px 14px", background: "#fff", border: "1px dashed #8B6914",
      borderRadius: 6, fontSize: 13, color: "#8B6914", cursor: "pointer",
      fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif", marginTop: 4,
    } as React.CSSProperties,
    actionToggle: (active: boolean): React.CSSProperties => ({
      flex: 1, padding: "9px", border: "1px solid",
      borderColor: active ? "#8B6914" : "#ddd",
      background: active ? "#8B6914" : "#fff",
      color: active ? "#fff" : "#555",
      borderRadius: 6, fontSize: 13, cursor: "pointer", fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
    }),
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <span style={s.headerTitle}>Virtuosa USA — Painel da Loja</span>
        <div style={s.headerRight}>
          <button style={s.addBtn} onClick={openCreateModal}>+ Nova peca</button>
          <button style={s.logoutBtn} onClick={handleLogout}>Sair</button>
        </div>
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
            const hasSquare = !!product.squareId;
            return (
              <div key={product.id} style={s.card}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image}
                  alt={product.name}
                  style={s.cardImg}
                  onError={(e) => { (e.target as HTMLImageElement).src = "/images/placeholder.jpg"; }}
                />
                <div style={s.cardBody}>
                  <div style={s.cardName}>
                    {product.name}
                  </div>
                  <div style={s.cardPrice}>${product.price.toFixed(2)}</div>
                  <span style={s.stockBadge(total)}>
                    {total === 0 ? "Esgotado" : total <= 3 ? `${total} restantes` : `${total} em estoque`}
                  </span>
                  {(product.sizes?.length ?? 0) > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                      {sortSizes(product.sizes).map((size) => {
                        const qty = getStockForSize(product, size);
                        return (
                          <span
                            key={size}
                            style={{
                              fontSize: 10,
                              padding: "2px 6px",
                              borderRadius: 4,
                              border: "1px solid",
                              borderColor: qty === 0 ? "#f0f0f0" : "#ddd",
                              background: qty === 0 ? "#fafafa" : "#fff",
                              color: qty === 0 ? "#ccc" : "#444",
                              fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
                            }}
                          >
                            {size} <strong style={{ color: qty === 0 ? "#ccc" : "#8B6914" }}>{qty}</strong>
                          </span>
                        );
                      })}
                    </div>
                  )}
                  <div style={s.cardActions}>
                    <button style={s.saleBtn} onClick={() => openSaleModal(product)}>Venda</button>
                    <button
                      style={s.linkBtn}
                      onClick={() => copyProductLink(product)}
                      title="Copiar link da peça para enviar na live"
                    >
                      Link
                    </button>
                    <button
                      style={s.iconBtn(hasSquare)}
                      onClick={() => openStockModal(product)}
                      title={hasSquare ? "Ajustar estoque" : "Produto local — cadastre no Square"}
                    >
                      📦
                    </button>
                    <button
                      style={s.iconBtn(hasSquare)}
                      onClick={() => openEditModal(product)}
                      title={hasSquare ? "Editar produto" : "Produto local — cadastre no Square"}
                    >
                      ✏️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== MODAL DE VENDA ===== */}
      {activeModal === "sale" && selectedProduct && (
        <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div style={s.modal}>
            <div style={s.modalTitle}>{selectedProduct.name}</div>
            <div style={s.modalSubtitle}>${selectedProduct.price.toFixed(2)} | Registrar venda manual</div>

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
                        {size}{stock === 0 && " (0)"}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <label style={s.label}>Quantidade</label>
            <div style={s.qtyRow}>
              <button style={s.qtyBtn} onClick={() => setQuantity((q) => Math.max(1, q - 1))}>-</button>
              <span style={s.qtyVal}>{quantity}</span>
              <button style={s.qtyBtn} onClick={() => setQuantity((q) => q + 1)}>+</button>
            </div>

            <label style={s.label}>Forma de pagamento</label>
            <div style={s.paymentGrid}>
              {PAYMENT_METHODS.map((m) => (
                <button key={m.value} style={s.payBtn(paymentMethod === m.value)} onClick={() => setPaymentMethod(m.value)}>
                  {m.label}
                </button>
              ))}
            </div>

            {saleSuccess && <div style={s.successMsg}>{saleSuccess}</div>}
            {saleError && <div style={s.errorMsg}>{saleError}</div>}

            {!saleSuccess && (
              <button style={{ ...s.confirmBtn, opacity: saleLoading ? 0.7 : 1 }} onClick={handleRegisterSale} disabled={saleLoading}>
                {saleLoading ? "Registrando..." : "Confirmar venda"}
              </button>
            )}
            <button style={s.cancelBtn} onClick={closeModal}>{saleSuccess ? "Fechar" : "Cancelar"}</button>
          </div>
        </div>
      )}

      {/* ===== MODAL DE EDICAO ===== */}
      {activeModal === "edit" && selectedProduct && selectedProduct.squareId && (
        <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div style={s.modal}>
            <div style={s.modalTitle}>Editar produto</div>
            <div style={s.modalSubtitle}>{selectedProduct.name}</div>

            {editImagePreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={editImagePreview}
                alt="preview"
                style={s.imagePreview}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
            <input
              ref={editFileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setEditImageFile(f); setEditImagePreview(URL.createObjectURL(f)); }
              }}
            />
            <button style={s.uploadBtn} onClick={() => editFileRef.current?.click()}>
              {editImageFile ? "Foto selecionada — clique para trocar" : "Clique para trocar a foto"}
            </button>

            <label style={s.label}>Nome</label>
            <input style={s.input} value={editName} onChange={(e) => setEditName(e.target.value)} />

            <label style={s.label}>Descricao (opcional)</label>
            <textarea style={s.textarea} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Deixe em branco para manter a atual" />

            <label style={s.label}>Preco (USD)</label>
            <input style={s.input} type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />

            <label style={s.label}>Categoria</label>
            <select style={s.select} value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
              {STORE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {editSuccess && <div style={s.successMsg}>{editSuccess}</div>}
            {editError && <div style={s.errorMsg}>{editError}</div>}

            {!editSuccess && (
              <button style={{ ...s.confirmBtn, opacity: editLoading ? 0.7 : 1 }} onClick={handleEditProduct} disabled={editLoading}>
                {editLoading ? "Salvando..." : "Salvar alteracoes"}
              </button>
            )}
            <button style={s.cancelBtn} onClick={closeModal}>{editSuccess ? "Fechar" : "Cancelar"}</button>
          </div>
        </div>
      )}

      {/* ===== MODAL DE AJUSTE DE ESTOQUE ===== */}
      {activeModal === "stock" && selectedProduct && selectedProduct.squareId && (
        <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div style={s.modal}>
            <div style={s.modalTitle}>Ajustar estoque</div>
            <div style={s.modalSubtitle}>{selectedProduct.name}</div>

            <label style={s.label}>Acao</label>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={s.actionToggle(stockAction === "add")} onClick={() => setStockAction("add")}>
                Adicionar unidades
              </button>
              <button style={s.actionToggle(stockAction === "set")} onClick={() => setStockAction("set")}>
                Definir quantidade
              </button>
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
                        style={s.sizeBtnSimple(stockSize === size)}
                        onClick={() => setStockSize(size)}
                      >
                        {size} ({stock})
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <label style={s.label}>{stockAction === "add" ? "Quantidade a adicionar" : "Nova quantidade total"}</label>
            <div style={s.qtyRow}>
              <button style={s.qtyBtn} onClick={() => setStockQty((q) => Math.max(0, q - 1))}>-</button>
              <span style={s.qtyVal}>{stockQty}</span>
              <button style={s.qtyBtn} onClick={() => setStockQty((q) => q + 1)}>+</button>
            </div>

            {stockSuccess && <div style={s.successMsg}>{stockSuccess}</div>}
            {stockError && <div style={s.errorMsg}>{stockError}</div>}

            {!stockSuccess && (
              <button style={{ ...s.confirmBtn, opacity: stockLoading ? 0.7 : 1 }} onClick={handleAdjustStock} disabled={stockLoading}>
                {stockLoading ? "Atualizando..." : "Confirmar ajuste"}
              </button>
            )}
            <button style={s.cancelBtn} onClick={closeModal}>{stockSuccess ? "Fechar" : "Cancelar"}</button>
          </div>
        </div>
      )}

      {/* ===== MODAL DE CADASTRO ===== */}
      {activeModal === "create" && (
        <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div style={s.modal}>
            <div style={s.modalTitle}>Cadastrar nova peca no Square</div>
            <div style={s.modalSubtitle}>Preencha os dados abaixo. O produto sera criado diretamente no Square e ja aparecera na loja.</div>

            {createImagePreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={createImagePreview} alt="preview" style={s.imagePreview} />
            )}
            <input
              ref={createFileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setCreateImageFile(f); setCreateImagePreview(URL.createObjectURL(f)); }
              }}
            />
            <button style={s.uploadBtn} onClick={() => createFileRef.current?.click()}>
              {createImageFile ? "Foto selecionada — clique para trocar" : "Adicionar foto do produto"}
            </button>

            <label style={s.label}>Nome da peca *</label>
            <input style={s.input} value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="Ex: Vestido Midi Floral" />

            <label style={s.label}>Descricao</label>
            <textarea style={s.textarea} value={createDescription} onChange={(e) => setCreateDescription(e.target.value)} placeholder="Descreva o produto..." />

            <label style={s.label}>Preco (USD) *</label>
            <input style={s.input} type="number" step="0.01" value={createPrice} onChange={(e) => setCreatePrice(e.target.value)} placeholder="0.00" />

            <label style={s.label}>Categoria</label>
            <select style={s.select} value={createCategory} onChange={(e) => setCreateCategory(e.target.value)}>
              {STORE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <label style={s.label}>Tamanhos e quantidades *</label>
            {createSizes.map((item, idx) => (
              <div key={idx} style={s.sizeRow}>
                <select
                  style={{ ...s.select, width: "auto", flex: "0 0 80px" }}
                  value={item.size}
                  onChange={(e) => updateCreateSize(idx, "size", e.target.value)}
                >
                  {SIZE_OPTIONS.map((sz) => (
                    <option key={sz} value={sz}>{sz}</option>
                  ))}
                </select>
                <input
                  style={{ ...s.input, flex: 1 }}
                  type="number"
                  min={0}
                  value={item.quantity}
                  onChange={(e) => updateCreateSize(idx, "quantity", parseInt(e.target.value) || 0)}
                  placeholder="Qtd"
                />
                <span style={{ fontSize: 11, color: "#888", whiteSpace: "nowrap" }}>unid.</span>
                {createSizes.length > 1 && (
                  <button style={s.removeBtn} onClick={() => removeCreateSize(idx)}>x</button>
                )}
              </div>
            ))}
            {createSizes.length < SIZE_OPTIONS.length && (
              <button style={s.addSizeBtn} onClick={addCreateSize}>+ Adicionar tamanho</button>
            )}

            {createSuccess && <div style={s.successMsg}>{createSuccess}</div>}
            {createError && <div style={s.errorMsg}>{createError}</div>}

            {!createSuccess && (
              <button style={{ ...s.confirmBtn, opacity: createLoading ? 0.7 : 1 }} onClick={handleCreateProduct} disabled={createLoading}>
                {createLoading ? "Cadastrando..." : "Cadastrar produto"}
              </button>
            )}
            <button style={s.cancelBtn} onClick={closeModal}>{createSuccess ? "Fechar" : "Cancelar"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
