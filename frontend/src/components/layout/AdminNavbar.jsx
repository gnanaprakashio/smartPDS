import { Search, Bell, User, LogOut } from 'lucide-react';
import { useState } from 'react';

const AdminNavbar = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    // Search ration card API call
    console.log('Searching for:', searchTerm);
  };

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-2xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-white font-bold text-xl">AI</span>
              </div>
              <span className="ml-4 text-white font-bold text-xl hidden md:block">SPDS</span>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search ration card..."
                className="block w-full pl-10 pr-12 py-3 border border-transparent rounded-xl bg-white/20 backdrop-blur-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="submit"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <div className="w-8 h-8 bg-indigo-500 hover:bg-indigo-400 rounded-lg flex items-center justify-center transition-all duration-200">
                  <Search className="h-4 w-4 text-white" />
                </div>
              </button>
            </form>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <button className="relative p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200">
              <Bell className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 block h-4 w-4 rounded-full ring-2 ring-white bg-red-500 text-xs text-white flex items-center justify-center">
                3
              </span>
            </button>

            {/* Profile */}
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-orange-500 rounded-2xl flex items-center justify-center">
                <span className="text-white font-semibold text-sm">AD</span>
              </div>
              <span className="text-white font-medium hidden md:block">Admin</span>
            </div>

            {/* Logout */}
            <button className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;

