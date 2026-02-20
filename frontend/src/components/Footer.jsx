import React from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold text-white mb-3">যত্ন : Jotno</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Peace of mind for you, care for your loved ones. Helping families
              manage elderly healthcare with confidence.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition">
                  Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact / Info */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Information
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-400">
                A healthcare companion for elderly users and their families.
              </li>
              <li className="text-gray-400">
                Medicine data sourced from the Bangladesh national medicine dataset.
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            &copy; {currentYear} যত্ন : Jotno. All rights reserved.
          </p>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-[rgb(211,46,149)]" /> for
            families everywhere
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
