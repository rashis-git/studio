import { MainNav } from '@/components/main-nav';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-dvh">
      <main className="flex-1 w-full max-w-lg mx-auto">{children}</main>
      <MainNav />
    </div>
  );
}
