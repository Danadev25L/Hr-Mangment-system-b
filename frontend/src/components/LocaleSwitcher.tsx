"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Globe } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from 'next/navigation';

export default function LocaleSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const languages = [
    { code: "en", label: "English" },
    { code: "ku", label: "Kurdish" },
    { code: "ar", label: "Arabic" },
  ];

  // Get current language from URL
  const getCurrentLang = () => {
    const pathSegments = pathname.split('/');
    return pathSegments[1]?.toUpperCase() || "EN";
  };

  const [currentLang, setCurrentLang] = useState(getCurrentLang());

  useEffect(() => {
    setCurrentLang(getCurrentLang());
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode: string) => {
    const pathSegments = pathname.split('/');
    const newPath = pathSegments.slice(2).join('/');
    
    // Set locale cookie
    document.cookie = `NEXT_LOCALE=${langCode}; path=/; max-age=31536000`;
    
    // Use startTransition for smooth navigation
    startTransition(() => {
      router.push(`/${langCode}/${newPath}`);
      router.refresh(); // Force refresh to reload server components with new locale
    });
    
    setCurrentLang(langCode.toUpperCase());
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Change Language"
      >
        <Globe className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{currentLang}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute right-0 mt-1 w-20 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-gray-700 z-50"
          >
            <div className="py-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 