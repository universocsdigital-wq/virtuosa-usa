import "server-only";
import { revalidatePath } from "next/cache";

export function revalidateStorefront(): void {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/best-sellers");
  revalidatePath("/shop/[slug]", "page");
}
