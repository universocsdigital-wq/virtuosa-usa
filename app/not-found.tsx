import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <h1 className="font-serif text-display text-virtuosa-deep-brown mb-4">
          Page Not Found
        </h1>
        <span className="gold-divider" />
        <p className="font-sans text-body text-virtuosa-light-brown mt-6 mb-8 max-w-prose">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/" className="btn-primary">
          Return to Home
        </Link>
      </main>
      <Footer />
    </>
  );
}
