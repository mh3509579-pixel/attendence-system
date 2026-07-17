import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
