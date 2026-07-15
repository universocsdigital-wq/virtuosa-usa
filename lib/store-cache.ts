import "server-only";
import { revalidatePath } from "next/cache";

export function revalidateStorefront(productSlug?: string): void {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/best-sellers");
  if (productSlug) {
    revalidatePath(`/shop/${productSlug}`);
  }
  revalidatePath("/shop/[slug]", "page");
}
