import { useState } from "react";
import {
  User,
  LogOut,
  LayoutDashboard,
  DollarSign,
  Menu,
  X,
} from "lucide-react";

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {};

  return (
    <nav className="bg-black text-white shadow-lg sticky top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          
          <div className="flex items-center">
            <div className="text-2xl font-bold tracking-wider">LOOP</div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <button className="px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2">
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
            <button className="px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Earnings</span>
            </button>
            <button className="px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Profile</span>
            </button>
            <button
              onClick={handleLogout}
              className="ml-2 px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-800"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-1">
            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2">
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Earnings</span>
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Profile</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
