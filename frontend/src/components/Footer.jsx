import React from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold text-white mb-3">{t('brand')}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              {t('footer.quickLinks')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition">
                  {t('footer.home')}
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition">
                  {t('footer.login')}
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition">
                  {t('footer.register')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact / Info */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              {t('footer.information')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-400">
                {t('footer.info1')}
              </li>
              <li className="text-gray-400">
                {t('footer.info2')}
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            &copy; {currentYear} {t('brand')}. {t('footer.copyright')}
          </p>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            {t('footer.madeWith')} <Heart className="w-3 h-3 text-[rgb(211,46,149)]" /> {t('footer.forFamilies')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
