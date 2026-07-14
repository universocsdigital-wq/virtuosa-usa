import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "About",
  description: "The story behind Virtuosa USA — femininity, presence, and timeless elegance.",
};

export default function AboutPage() {
  redirect("/#manifesto");
}
