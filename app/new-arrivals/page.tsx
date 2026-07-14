import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "New Arrivals",
  description: "Discover the latest additions to the Virtuosa USA collection.",
};

export default function NewArrivalsPage() {
  redirect("/shop#lancamentos");
}
