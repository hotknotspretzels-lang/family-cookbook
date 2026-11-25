import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-4">
      <h1 className="text-4xl">That page is not in the cookbook</h1>
      <Link href="/" className="font-semibold text-primary">
        Back home
      </Link>
    </div>
  );
}
