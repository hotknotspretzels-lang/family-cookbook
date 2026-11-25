export function SetupNotice() {
  return (
    <section className="rounded-3xl bg-card p-6 ring-1 ring-foreground/10">
      <h1 className="font-heading text-3xl">Almost ready</h1>
      <p className="mt-2 text-muted-foreground">
        Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then run the SQL
        migrations. Saving also needs SUPABASE_SERVICE_ROLE_KEY on the server.
      </p>
    </section>
  );
}
