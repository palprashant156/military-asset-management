import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-military-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto min-h-[calc(100vh-57px)]">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
