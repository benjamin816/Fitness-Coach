
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, TrendingUp, Dumbbell, Settings as SettingsIcon } from "lucide-react";

const Navigation = () => {
  const pathname = usePathname();
  const navItems = [
    { label: 'Today', path: '/today', icon: LayoutDashboard },
    { label: 'Progress', path: '/progress', icon: TrendingUp },
    { label: 'Lifting', path: '/lifting', icon: Dumbbell },
    { label: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <>
      {/* Desktop Nav */}
      <nav className="hidden md:flex bg-white border-b sticky top-0 z-30 px-6 py-4 justify-between items-center shadow-sm">
        <h1 className="text-2xl font-bold text-blue-600">Fitness Coach</h1>
        <div className="flex space-x-8">
          {navItems.map((item) => (
            <Link 
              key={item.path}
              href={item.path} 
              className={`flex items-center space-x-2 font-medium transition-colors ${
                pathname === item.path ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-3 px-2 z-30 shadow-lg">
        {navItems.map((item) => (
          <Link 
            key={item.path}
            href={item.path} 
            className={`flex flex-col items-center space-y-1 ${
              pathname === item.path ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <item.icon size={24} />
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
};

export default Navigation;
