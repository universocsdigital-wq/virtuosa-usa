"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface ProductItem {
  id: string;
  name: string;
  description: string;
  slug?: string;
  price: number;
  image: string;
  images?: string[];
  category: string;
  badge?: "best-seller" | "new" | "sale";
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

function moveArrayItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function normalizeColor(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

function parseMoneyInput(value: string): number {
  const cleaned = value.trim().replace(/\s/g, "");
  if (!cleaned) return Number.NaN;
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  return Number(normalized);
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
  const [editIsLaunch, setEditIsLaunch] = useState(false);
  const [editColor, setEditColor] = useState("");
  const [editOriginalColor, setEditOriginalColor] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState("");
  const [editError, setEditError] = useState("");
  const [editImageFiles, setEditImageFiles] = useState<File[]>([]);
  const [editImagePreviews, setEditImagePreviews] = useState<string[]>([]);
  const [deletingImageUrl, setDeletingImageUrl] = useState<string | null>(null);

  // Modal de ajuste de estoque
  const [stockSize, setStockSize] = useState("");
  const [stockQty, setStockQty] = useState(1);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockSuccess, setStockSuccess] = useState("");
  const [stockError, setStockError] = useState("");
  const [addSizeOpen, setAddSizeOpen] = useState(false);
  const [newStockSize, setNewStockSize] = useState("");
  const [newStockQty, setNewStockQty] = useState(1);
  const [addSizeLoading, setAddSizeLoading] = useState(false);

  // Modal de cadastro
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createPrice, setCreatePrice] = useState("");
  const [createCategory, setCreateCategory] = useState("Vestidos");
  const [createIsLaunch, setCreateIsLaunch] = useState(false);
  const [createColor, setCreateColor] = useState("");
  const [createSizes, setCreateSizes] = useState<{ size: string; quantity: number }[]>([
    { size: "P", quantity: 1 },
    { size: "M", quantity: 1 },
    { size: "G", quantity: 1 },
  ]);
  const [createImageFiles, setCreateImageFiles] = useState<File[]>([]);
  const [createImagePreviews, setCreateImagePreviews] = useState<string[]>([]);
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
    setEditDescription(product.description ?? "");
    setEditPrice(product.price.toFixed(2));
    setEditCategory(getCategoryLabel(product.category));
    setEditIsLaunch(product.badge === "new");
    const currentColor = product.colors?.length === 1 ? product.colors[0] : "";
    setEditColor(currentColor);
    setEditOriginalColor(currentColor);
    setEditSuccess("");
    setEditError("");
    setEditImageFiles([]);
    setEditImagePreviews([]);
    setDeletingImageUrl(null);
    setActiveModal("edit");
  }

  function openStockModal(product: ProductItem) {
    if (!product.squareId) {
      alert("Este produto e local e nao pode ter estoque ajustado pelo painel. Cadastre-o no Square primeiro.");
      return;
    }
    setSelectedProduct(product);
    const sizes = sortSizes(product.sizes ?? []);
    const initialSize = sizes[0] ?? "U";
    setStockSize(initialSize);
    setStockQty(getStockForSize(product, initialSize));
    setStockSuccess("");
    setStockError("");
    setAddSizeOpen(false);
    setNewStockSize(SIZE_OPTIONS.find((size) => !sizes.includes(size)) ?? "");
    setNewStockQty(1);
    setAddSizeLoading(false);
    setActiveModal("stock");
  }

  function openCreateModal() {
    setCreateName("");
    setCreateDescription("");
    setCreatePrice("");
    setCreateCategory("Vestidos");
    setCreateIsLaunch(false);
    setCreateColor("");
    setCreateSizes([
      { size: "P", quantity: 1 },
      { size: "M", quantity: 1 },
      { size: "G", quantity: 1 },
    ]);
    setCreateImageFiles([]);
    setCreateImagePreviews([]);
    setCreateSuccess("");
    setCreateError("");
    setActiveModal("create");
  }

  function closeModal() {
    editImagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    createImagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    setActiveModal(null);
    setSelectedProduct(null);
  }

  function selectEditImages(fileList: FileList | null) {
    if (!fileList) return;
    editImagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    const files = Array.from(fileList);
    setEditImageFiles(files);
    setEditImagePreviews(files.map((file) => URL.createObjectURL(file)));
  }

  function selectCreateImages(fileList: FileList | null) {
    if (!fileList) return;
    createImagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    const files = Array.from(fileList);
    setCreateImageFiles(files);
    setCreateImagePreviews(files.map((file) => URL.createObjectURL(file)));
  }

  function removeEditImage(index: number) {
    URL.revokeObjectURL(editImagePreviews[index]);
    setEditImageFiles((files) => files.filter((_, currentIndex) => currentIndex !== index));
    setEditImagePreviews((previews) => previews.filter((_, currentIndex) => currentIndex !== index));
  }

  function removeCreateImage(index: number) {
    URL.revokeObjectURL(createImagePreviews[index]);
    setCreateImageFiles((files) => files.filter((_, currentIndex) => currentIndex !== index));
    setCreateImagePreviews((previews) => previews.filter((_, currentIndex) => currentIndex !== index));
  }

  function moveEditImage(fromIndex: number, toIndex: number) {
    setEditImageFiles((files) => moveArrayItem(files, fromIndex, toIndex));
    setEditImagePreviews((previews) => moveArrayItem(previews, fromIndex, toIndex));
  }

  function moveCreateImage(fromIndex: number, toIndex: number) {
    setCreateImageFiles((files) => moveArrayItem(files, fromIndex, toIndex));
    setCreateImagePreviews((previews) => moveArrayItem(previews, fromIndex, toIndex));
  }

  async function deleteExistingImage(imageUrl: string) {
    if (!selectedProduct?.squareId || deletingImageUrl) return;
    setDeletingImageUrl(imageUrl);
    setEditError("");
    setEditSuccess("");
    try {
      const response = await fetch("/api/admin/delete-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selectedProduct.squareId, imageUrl }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setEditError(data.error || "Nao foi possivel excluir a foto.");
        return;
      }

      const applyImageRemoval = (product: ProductItem): ProductItem => {
        if (product.squareId !== selectedProduct.squareId) return product;
        const remainingImages = (product.images ?? [product.image]).filter((image) => image !== imageUrl);
        return {
          ...product,
          image: remainingImages[0] ?? "/images/placeholder.jpg",
          images: remainingImages,
        };
      };
      setProducts((current) => current.map(applyImageRemoval));
      setSelectedProduct((current) => (current ? applyImageRemoval(current) : current));
      setEditSuccess("Foto excluida do Square e do catalogo.");
    } catch {
      setEditError("Erro de conexao ao excluir a foto.");
    } finally {
      setDeletingImageUrl(null);
    }
  }

  async function prepareImageForUpload(file: File): Promise<File> {
    const targetBytes = 3 * 1024 * 1024;
    if (file.size <= targetBytes) return file;
    if (file.type === "image/gif") {
      throw new Error(`${file.name} excede 3 MB. Reduza o arquivo GIF antes de enviar.`);
    }

    const bitmap = await createImageBitmap(file);
    try {
      const maxDimension = 2200;
      const initialScale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
      let width = Math.max(1, Math.round(bitmap.width * initialScale));
      let height = Math.max(1, Math.round(bitmap.height * initialScale));
      let quality = 0.86;
      let result: Blob | null = null;

      for (let attempt = 0; attempt < 8; attempt += 1) {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Nao foi possivel preparar a foto.");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
        context.drawImage(bitmap, 0, 0, width, height);
        result = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
        if (result && result.size <= targetBytes) break;

        if (quality > 0.58) {
          quality -= 0.1;
        } else {
          width = Math.max(1, Math.round(width * 0.82));
          height = Math.max(1, Math.round(height * 0.82));
        }
      }

      if (!result || result.size > targetBytes) {
        throw new Error(`${file.name} nao pôde ser reduzida para envio.`);
      }

      const baseName = file.name.replace(/\.[^.]+$/, "") || "foto";
      return new File([result], `${baseName}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
    } finally {
      bitmap.close();
    }
  }

  async function uploadProductImages(files: File[], productId: string): Promise<string[]> {
    const uploadedUrls: string[] = [];

    for (let index = 0; index < files.length; index += 1) {
      const preparedFile = await prepareImageForUpload(files[index]);
      const fd = new FormData();
      fd.append("image", preparedFile);
      fd.append("productId", productId);
      fd.append("isPrimary", String(index === 0));
      const response = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(`Foto ${index + 1}: ${data.error || response.status}`);
      }
      if (data.imageUrl) uploadedUrls.push(data.imageUrl);
    }

    return uploadedUrls;
  }

  async function handleRegisterSale() {
    if (!selectedProduct) return;
    setSaleLoading(true);
    setSaleError("");
    setSaleSuccess("");
    try {
      // Usa squareId quando disponivel, senao tenta sourceProductId, senao id
      const productId = selectedProduct.squareId ?? selectedProduct.sourceProductId ?? selectedProduct.id;
      const displayProductId = selectedProduct.id;
      const selectedColor = selectedProduct.colors?.length === 1 ? selectedProduct.colors[0] : undefined;
      const res = await fetch("/api/admin/register-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, slug: selectedProduct.slug, size: selectedSize, color: selectedColor, quantity, paymentMethod }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaleSuccess("Venda registrada! Estoque atualizado no Square.");
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id !== displayProductId) return p;
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
    const parsedPrice = parseMoneyInput(editPrice);
    if (!editName.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setEditError("Preencha um nome e um preco valido maior que zero.");
      return;
    }
    const colorChanged = normalizeColor(editColor) !== normalizeColor(editOriginalColor);
    setEditLoading(true);
    setEditError("");
    setEditSuccess("");
    try {
      const squareId = selectedProduct.squareId;

      // Enviar a galeria na ordem selecionada; a primeira foto sera a capa.
      let uploadedImageUrls: string[] = [];
      if (editImageFiles.length > 0) {
        try {
          uploadedImageUrls = await uploadProductImages(editImageFiles, squareId);
        } catch (error) {
          setEditError("Erro ao enviar fotos: " + (error instanceof Error ? error.message : String(error)));
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
          slug: selectedProduct.slug,
          name: editName,
          description: editDescription || undefined,
          price: parsedPrice,
          category: editCategory,
          isLaunch: editIsLaunch,
          color: colorChanged ? editColor : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditSuccess("Produto atualizado com sucesso!");
        setProducts((prev) =>
          prev.map((p) =>
            p.squareId === squareId
              ? {
                  ...p,
                  name: editName,
                  description: editDescription,
                  price: parsedPrice,
                  category: editCategory,
                  badge: editIsLaunch ? "new" : undefined,
                  colors: colorChanged ? (editColor ? [editColor.trim()] : []) : p.colors,
                  image: uploadedImageUrls[0] || p.image,
                  images: uploadedImageUrls.length > 0
                    ? Array.from(new Set([...uploadedImageUrls, ...(p.images ?? [p.image])]))
                    : p.images,
                }
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

  async function handleDeleteProduct(product: ProductItem) {
    if (!product.squareId || deleteLoadingId) return;
    if (pendingDeleteId !== product.squareId) {
      setPendingDeleteId(product.squareId);
      return;
    }

    setDeleteLoadingId(product.squareId);
    try {
      const response = await fetch("/api/admin/delete-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.squareId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Nao foi possivel excluir o produto.");
        return;
      }
      setError("");
      setProducts((current) => current.filter((item) => item.squareId !== product.squareId));
    } catch {
      setError("Erro de conexao ao excluir. Tente novamente.");
    } finally {
      setDeleteLoadingId(null);
      setPendingDeleteId(null);
    }
  }

  async function handleAdjustStock() {
    if (!selectedProduct || !selectedProduct.squareId) return;
    setStockLoading(true);
    setStockError("");
    setStockSuccess("");
    try {
      const squareId = selectedProduct.squareId;
      const displayProductId = selectedProduct.id;
      const selectedColor = selectedProduct.colors?.length === 1 ? selectedProduct.colors[0] : undefined;
      const res = await fetch("/api/admin/adjust-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: squareId, slug: selectedProduct.slug, size: stockSize, color: selectedColor, quantity: stockQty, action: "set" }),
      });
      const data = await res.json();
      if (res.ok) {
        setStockSuccess(data.message || "Estoque atualizado no Square!");
        const applyStockAdjustment = (product: ProductItem): ProductItem => {
          if (product.id !== displayProductId || !stockSize) return product;
          const inventoryBySize = {
            ...product.inventoryBySize,
            [stockSize]: stockQty,
          };
          return {
            ...product,
            inStock: Object.values(inventoryBySize).some((quantity) => quantity > 0),
            inventoryBySize,
          };
        };

        setProducts((prev) => prev.map(applyStockAdjustment));
        setSelectedProduct((current) => (current ? applyStockAdjustment(current) : current));
      } else {
        setStockError(data.error || "Erro ao ajustar estoque.");
      }
    } catch {
      setStockError("Erro de conexao. Tente novamente.");
    } finally {
      setStockLoading(false);
    }
  }

  async function handleAddStockSize() {
    if (!selectedProduct?.squareId || !newStockSize) return;
    setAddSizeLoading(true);
    setStockError("");
    setStockSuccess("");
    try {
      const squareId = selectedProduct.squareId;
      const displayProductId = selectedProduct.id;
      const selectedColor = selectedProduct.colors?.length === 1 ? selectedProduct.colors[0] : undefined;
      const response = await fetch("/api/admin/add-size", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: squareId,
          slug: selectedProduct.slug,
          size: newStockSize,
          color: selectedColor,
          quantity: newStockQty,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStockError(data.error || "Nao foi possivel adicionar o tamanho.");
        return;
      }

      const applyAddedSize = (product: ProductItem): ProductItem => {
        if (product.id !== displayProductId) return product;
        const sizes = sortSizes(Array.from(new Set([...(product.sizes ?? []), newStockSize])));
        const inventoryBySize = { ...product.inventoryBySize, [newStockSize]: newStockQty };
        return {
          ...product,
          sizes,
          inventoryBySize,
          inStock: Object.values(inventoryBySize).some((stock) => stock > 0),
        };
      };

      setProducts((current) => current.map(applyAddedSize));
      setSelectedProduct((current) => (current ? applyAddedSize(current) : current));
      setStockSize(newStockSize);
      setStockQty(newStockQty);
      setAddSizeOpen(false);
      setStockSuccess(data.message || `Tamanho ${newStockSize} adicionado com sucesso.`);
    } catch {
      setStockError("Erro de conexao ao adicionar o tamanho.");
    } finally {
      setAddSizeLoading(false);
    }
  }

  async function handleCreateProduct() {
    const parsedPrice = parseMoneyInput(createPrice);
    if (!createName.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0 || createSizes.length === 0) {
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
          price: parsedPrice,
          category: createCategory,
          isLaunch: createIsLaunch,
          color: createColor,
          sizes: createSizes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // Upload de imagem usando o ID real retornado pelo Square
        if (createImageFiles.length > 0 && data.productId) {
          try {
            await uploadProductImages(createImageFiles, data.productId);
          } catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            setCreateSuccess(`Produto cadastrado, mas nem todas as fotos foram enviadas (${detail}). Use o botao Editar para completar a galeria.`);
            setTimeout(() => loadProducts(), 2000);
            return;
          }
        }
        setCreateSuccess(
          createImageFiles.length > 1
            ? `Produto cadastrado com ${createImageFiles.length} fotos! Aparecera na loja em instantes.`
            : "Produto cadastrado com sucesso! Aparecera na loja em instantes."
        );
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
      display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
      gap: 20, padding: "20px 24px",
    } as React.CSSProperties,
    card: {
      background: "#fff", borderRadius: 12, overflow: "hidden",
      boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      display: "flex", flexDirection: "column" as const,
    } as React.CSSProperties,
    cardImg: { width: "100%", aspectRatio: "3/4", objectFit: "cover" as const, display: "block", flexShrink: 0 } as React.CSSProperties,
    cardBody: { padding: "12px 14px 16px", display: "flex", flexDirection: "column" as const, flex: 1 } as React.CSSProperties,
    cardName: { fontSize: 14, fontWeight: 600, color: "#2C1810", marginBottom: 6, lineHeight: 1.4, wordBreak: "break-word" as const } as React.CSSProperties,
    cardPrice: { fontSize: 13, color: "#8B6914", marginBottom: 8, fontWeight: 500 } as React.CSSProperties,
    stockBadge: (total: number): React.CSSProperties => ({
      display: "inline-block", fontSize: 11, padding: "2px 8px", borderRadius: 20,
      background: total === 0 ? "#fee2e2" : total <= 3 ? "#fef9c3" : "#dcfce7",
      color: total === 0 ? "#dc2626" : total <= 3 ? "#a16207" : "#166534",
      fontWeight: 600,
    }),

    cardActions: {
      display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: 8, marginTop: "auto" as const, paddingTop: 14,
    } as React.CSSProperties,
    saleBtn: {
      width: "100%", minHeight: 38, padding: "8px 10px", background: "#8B6914", color: "#fff",
      border: "none", borderRadius: 7, fontSize: 12, cursor: "pointer", fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
      fontWeight: 500,
    } as React.CSSProperties,
    linkBtn: {
      width: "100%", minHeight: 38, padding: "8px 10px",
      background: "#f5f0eb",
      color: "#8B6914",
      border: "1px solid #d7c6ae",
      borderRadius: 7,
      fontSize: 12,
      cursor: "pointer",
      fontFamily: "Georgia, serif",
      fontWeight: 600,
    } as React.CSSProperties,
    iconBtn: (enabled: boolean): React.CSSProperties => ({
      width: "100%", minHeight: 38, padding: "8px 10px",
      background: enabled ? "#fff" : "#f9f9f9",
      color: enabled ? "#2C1810" : "#ccc",
      border: "1px solid",
      borderColor: enabled ? "#ddd" : "#eee",
      borderRadius: 7, fontSize: 12,
      cursor: enabled ? "pointer" : "not-allowed",
      fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
    }),
    deleteBtn: (enabled: boolean): React.CSSProperties => ({
      gridColumn: "1 / -1", width: "100%", minHeight: 36, padding: "7px 10px", background: enabled ? "#fff7f7" : "#f9f9f9",
      color: enabled ? "#b42318" : "#ccc", border: "1px solid",
      borderColor: enabled ? "#f2b8b5" : "#eee", borderRadius: 7, fontSize: 11,
      cursor: enabled ? "pointer" : "not-allowed",
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
      width: "100%", height: 120, objectFit: "cover" as const,
      borderRadius: 8, display: "block",
    } as React.CSSProperties,
    launchToggle: {
      display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px",
      marginTop: 12, border: "1px solid #d9c99f", borderRadius: 8,
      background: "#fffaf0", color: "#2C1810", cursor: "pointer",
    } as React.CSSProperties,
    imageGrid: {
      display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gap: 8, marginBottom: 8,
    } as React.CSSProperties,
    imageTile: {
      position: "relative" as const, minWidth: 0,
    } as React.CSSProperties,
    removeImageBtn: {
      position: "absolute" as const, top: 5, right: 5,
      width: 25, height: 25, padding: 0, border: "none", borderRadius: "50%",
      background: "rgba(220, 38, 38, 0.92)", color: "#fff", cursor: "pointer",
      fontSize: 13, lineHeight: "25px",
    } as React.CSSProperties,
    coverBadge: {
      position: "absolute" as const, left: 5, bottom: 5,
      padding: "3px 7px", borderRadius: 10,
      background: "rgba(139, 105, 20, 0.94)", color: "#fff", fontSize: 10,
    } as React.CSSProperties,
    coverActionBtn: {
      position: "absolute" as const, left: 5, bottom: 5,
      padding: "4px 7px", border: "none", borderRadius: 10,
      background: "rgba(44, 24, 16, 0.88)", color: "#fff", fontSize: 9,
      cursor: "pointer",
    } as React.CSSProperties,
    imageHint: {
      marginTop: 6, marginBottom: 4, fontSize: 11, color: "#777", lineHeight: 1.4,
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
                      Estoque
                    </button>
                    <button
                      style={s.iconBtn(hasSquare)}
                      onClick={() => openEditModal(product)}
                      title={hasSquare ? "Editar produto" : "Produto local — cadastre no Square"}
                    >
                      Editar
                    </button>
                    <button
                      style={{
                        ...s.deleteBtn(hasSquare && deleteLoadingId !== product.squareId),
                        ...(pendingDeleteId === product.squareId ? { background: "#b42318", color: "#fff", borderColor: "#b42318" } : {}),
                      }}
                      onClick={() => handleDeleteProduct(product)}
                      disabled={!hasSquare || deleteLoadingId === product.squareId}
                      title={pendingDeleteId === product.squareId ? "Clique novamente para confirmar" : hasSquare ? "Excluir do Square e da loja" : "Produto local"}
                    >
                      {deleteLoadingId === product.squareId ? "Excluindo..." : pendingDeleteId === product.squareId ? "Confirmar exclusao" : "Excluir"}
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
              <button
                style={s.qtyBtn}
                onClick={() => setQuantity((q) => Math.min(getStockForSize(selectedProduct, selectedSize), q + 1))}
                disabled={!selectedSize || quantity >= getStockForSize(selectedProduct, selectedSize)}
              >+</button>
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

            <div style={s.imageGrid}>
              {(editImagePreviews.length > 0
                ? editImagePreviews
                : (selectedProduct.images?.length ? selectedProduct.images : [selectedProduct.image])
              ).map((preview, index) => (
                <div
                  key={`${preview}-${index}`}
                  style={{ ...s.imageTile, cursor: editImagePreviews.length > 0 ? "grab" : "default" }}
                  draggable={editImagePreviews.length > 0}
                  onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))}
                  onDragOver={(event) => editImagePreviews.length > 0 && event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const fromIndex = Number(event.dataTransfer.getData("text/plain"));
                    if (Number.isInteger(fromIndex)) moveEditImage(fromIndex, index);
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt={`Foto ${index + 1}`} style={s.imagePreview} />
                  {editImagePreviews.length > 0 ? (
                    <button type="button" style={s.removeImageBtn} onClick={() => removeEditImage(index)}>x</button>
                  ) : (
                    <button
                      type="button"
                      style={{ ...s.removeImageBtn, opacity: deletingImageUrl === preview ? 0.55 : 1 }}
                      onClick={() => deleteExistingImage(preview)}
                      disabled={Boolean(deletingImageUrl)}
                      aria-label={`Excluir foto ${index + 1}`}
                    >
                      {deletingImageUrl === preview ? "..." : "x"}
                    </button>
                  )}
                  {index === 0 && <span style={s.coverBadge}>Capa</span>}
                  {editImagePreviews.length > 0 && index > 0 && (
                    <button type="button" style={s.coverActionBtn} onClick={() => moveEditImage(index, 0)}>Tornar capa</button>
                  )}
                </div>
              ))}
            </div>
            <input
              ref={editFileRef}
              type="file"
              accept="image/jpeg,image/png,image/gif"
              multiple
              style={{ display: "none" }}
              onChange={(e) => selectEditImages(e.target.files)}
            />
            <button style={s.uploadBtn} onClick={() => editFileRef.current?.click()}>
              {editImageFiles.length > 0 ? `${editImageFiles.length} foto(s) selecionada(s) - clique para trocar` : "Selecionar varias fotos para a galeria"}
            </button>

            <div style={s.imageHint}>Escolha todas de uma vez. Arraste para mudar a ordem ou use Tornar capa. A primeira foto sera a capa.</div>

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

            <label style={s.launchToggle}>
              <input
                type="checkbox"
                checked={editIsLaunch}
                onChange={(e) => setEditIsLaunch(e.target.checked)}
                style={{ marginTop: 3 }}
              />
              <span>
                <strong style={{ display: "block", fontSize: 14 }}>Mostrar também em Lançamentos</strong>
                <small style={{ display: "block", marginTop: 3, color: "#777", lineHeight: 1.4 }}>
                  A peça continua na categoria acima e usa o mesmo produto e estoque do Square.
                </small>
              </span>
            </label>

            <label style={s.label}>Cor do produto</label>
            <input list="virtuosa-colors-edit" style={s.input} value={editColor} onChange={(e) => setEditColor(e.target.value)} placeholder="Ex: Verde, Rose, Off White" />
            <datalist id="virtuosa-colors-edit">
              {Array.from(new Set(products.flatMap((product) => product.colors ?? []))).sort().map((color) => <option key={color} value={color} />)}
            </datalist>
            {selectedProduct.colors?.length > 1 && !editColor && (
              <div style={{ marginTop: 6, fontSize: 12, color: "#8B6914" }}>
                Cores atuais: {selectedProduct.colors.join(", ")}. Preencha apenas para substituir todas por uma unica cor.
              </div>
            )}

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
            <div style={s.modalTitle}>{selectedProduct.name}</div>
            <div style={s.modalSubtitle}>Defina a quantidade atual no estoque</div>

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
                        onClick={() => {
                          setStockSize(size);
                          setStockQty(stock);
                        }}
                      >
                        {size} ({stock})
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {!stockSuccess && (
              <div style={{ marginTop: 14 }}>
                <button
                  type="button"
                  style={{ ...s.cancelBtn, marginTop: 0, borderStyle: "dashed", color: "#8B6914" }}
                  onClick={() => setAddSizeOpen((current) => !current)}
                  disabled={SIZE_OPTIONS.every((size) => selectedProduct.sizes?.includes(size))}
                >
                  {SIZE_OPTIONS.every((size) => selectedProduct.sizes?.includes(size))
                    ? "Todos os tamanhos cadastrados"
                    : addSizeOpen ? "Fechar novo tamanho" : "+ Adicionar tamanho"}
                </button>

                {addSizeOpen && (
                  <div style={{ marginTop: 10, padding: 12, border: "1px solid #E1D3BF", borderRadius: 8, background: "#FBF7F0" }}>
                    <label style={{ ...s.label, marginTop: 0 }}>Novo tamanho</label>
                    <select style={s.select} value={newStockSize} onChange={(event) => setNewStockSize(event.target.value)}>
                      {SIZE_OPTIONS.filter((size) => !selectedProduct.sizes?.includes(size)).map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>

                    <label style={s.label}>Quantidade inicial</label>
                    <div style={s.qtyRow}>
                      <button type="button" style={s.qtyBtn} onClick={() => setNewStockQty((quantity) => Math.max(0, quantity - 1))}>-</button>
                      <span style={s.qtyVal}>{newStockQty}</span>
                      <button type="button" style={s.qtyBtn} onClick={() => setNewStockQty((quantity) => quantity + 1)}>+</button>
                    </div>

                    <button
                      type="button"
                      style={{ ...s.confirmBtn, marginTop: 12, opacity: addSizeLoading ? 0.7 : 1 }}
                      onClick={handleAddStockSize}
                      disabled={addSizeLoading || !newStockSize}
                    >
                      {addSizeLoading ? "Criando tamanho..." : "Criar tamanho no Square"}
                    </button>
                  </div>
                )}
              </div>
            )}

            <label style={s.label}>Quantidade final em estoque</label>
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

            {createImagePreviews.length > 0 && (
              <div style={s.imageGrid}>
                {createImagePreviews.map((preview, index) => (
                  <div
                    key={`${preview}-${index}`}
                    style={{ ...s.imageTile, cursor: "grab" }}
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      const fromIndex = Number(event.dataTransfer.getData("text/plain"));
                      if (Number.isInteger(fromIndex)) moveCreateImage(fromIndex, index);
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt={`Foto ${index + 1}`} style={s.imagePreview} />
                    <button type="button" style={s.removeImageBtn} onClick={() => removeCreateImage(index)}>x</button>
                    {index === 0 && <span style={s.coverBadge}>Capa</span>}
                    {index > 0 && (
                      <button type="button" style={s.coverActionBtn} onClick={() => moveCreateImage(index, 0)}>Tornar capa</button>
                    )}
                  </div>
                ))}
              </div>
            )}
            <input
              ref={createFileRef}
              type="file"
              accept="image/jpeg,image/png,image/gif"
              multiple
              style={{ display: "none" }}
              onChange={(e) => selectCreateImages(e.target.files)}
            />
            <button style={s.uploadBtn} onClick={() => createFileRef.current?.click()}>
              {createImageFiles.length > 0 ? `${createImageFiles.length} foto(s) selecionada(s) - clique para trocar` : "Adicionar varias fotos do produto"}
            </button>

            <div style={s.imageHint}>Escolha todas de uma vez. Arraste para mudar a ordem ou use Tornar capa. A primeira foto sera a capa.</div>

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

            <label style={s.launchToggle}>
              <input
                type="checkbox"
                checked={createIsLaunch}
                onChange={(e) => setCreateIsLaunch(e.target.checked)}
                style={{ marginTop: 3 }}
              />
              <span>
                <strong style={{ display: "block", fontSize: 14 }}>Mostrar também em Lançamentos</strong>
                <small style={{ display: "block", marginTop: 3, color: "#777", lineHeight: 1.4 }}>
                  A peça será exibida nos dois lugares, com um único estoque no Square.
                </small>
              </span>
            </label>

            <label style={s.label}>Cor do produto</label>
            <input list="virtuosa-colors-create" style={s.input} value={createColor} onChange={(e) => setCreateColor(e.target.value)} placeholder="Ex: Verde, Rose, Off White" />
            <datalist id="virtuosa-colors-create">
              {Array.from(new Set(products.flatMap((product) => product.colors ?? []))).sort().map((color) => <option key={color} value={color} />)}
            </datalist>
            <div style={{ marginTop: 6, fontSize: 12, color: "#777" }}>Use uma cor ja existente na lista sempre que possivel para manter o mesmo nome no Square.</div>

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
