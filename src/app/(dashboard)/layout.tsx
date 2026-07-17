import Sidebar from '@/components/Sidebar';
import DateDisplay from '@/components/DateDisplay';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="sticky top-0 z-30 flex items-center justify-end px-6 lg:px-8 pt-4 pb-2">
          <DateDisplay />
        </div>
        <div className="px-6 lg:px-8 pb-6 lg:pb-8 max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
