import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Plus, Calendar, Users, LogOut } from 'lucide-react';
import { useAuth } from '../App';

function Navigation() {
  const location = useLocation();
  const { logout } = useAuth();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/log', icon: Plus, label: 'Log' },
    { path: '/streak', icon: Calendar, label: 'Streak' },
    { path: '/friends', icon: Users, label: 'Friends' },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={`navigation-item flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-300 ${
              location.pathname === path
                ? 'active text-white'
                : 'text-gray-600 hover:text-primary-600'
            }`}
          >
            <Icon className="w-6 h-6" />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        ))}
        
        <button
          onClick={handleLogout}
          className="navigation-item flex flex-col items-center space-y-1 p-2 rounded-lg text-gray-600 hover:text-red-600 transition-all duration-300"
        >
          <LogOut className="w-6 h-6" />
          <span className="text-xs font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
}

export default Navigation;