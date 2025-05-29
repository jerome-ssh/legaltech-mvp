import Link from 'next/link';
import { Home, Bell } from 'lucide-react';

export default function Sidebar() {
  console.log('Sidebar rendered on server'); // Server-side debug log

  return (
    <div className="flex flex-col space-y-2">
      <Link href="/dashboard" className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg">
        <Home className="w-5 h-5" />
        <span>Dashboard</span>
      </Link>
      <Link href="/notifications" className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg">
        <Bell className="w-5 h-5" />
        <span>Notifications</span>
      </Link>
    </div>
  );
} 