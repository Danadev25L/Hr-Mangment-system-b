"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Globe } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from 'next/navigation';
import Image from 'next/image';
import KurdistanFlag from '@/public/Flag_of_Kurdistan.svg';
import USAFlag from '@/public/Flag_of_USA.svg';
import IraqFlag from '@/public/Flag_of_Iraq.svg';

export default function LocaleSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const languages = [
    { code: "en", label: "English", flag: "🇺🇸", fullName: "English (US)", useSvg: true, svgPath: USAFlag },
    { code: "ku", label: "Kurdish", flag: "🇮🇶", fullName: "کوردی (Kurdistan)", useSvg: true, svgPath: KurdistanFlag },
    { code: "ar", label: "Arabic", flag: "🇮🇶", fullName: "العربية (Iraq)", useSvg: true, svgPath: IraqFlag },
  ];

  // Get current language from URL
  const getCurrentLang = () => {
    if (!mounted) return "EN"; // Prevent hydration mismatch
    const pathSegments = pathname.split('/');
    return pathSegments[1]?.toUpperCase() || "EN";
  };

  const [currentLang, setCurrentLang] = useState("EN");

  useEffect(() => {
    setMounted(true);
    setCurrentLang(getCurrentLang());
  }, []);

  useEffect(() => {
    if (mounted) {
      setCurrentLang(getCurrentLang());
    }
  }, [pathname, mounted]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode: string) => {
    const pathSegments = pathname.split('/');
    const newPath = pathSegments.slice(2).join('/') || '';
    
    // Set locale cookie
    document.cookie = `NEXT_LOCALE=${langCode}; path=/; max-age=31536000`;
    
    setCurrentLang(langCode.toUpperCase());
    setIsOpen(false);
    
    // Use startTransition for smooth navigation
    startTransition(() => {
      const targetPath = `/${langCode}${newPath ? `/${newPath}` : ''}`;
      console.log('Changing locale to:', langCode, 'Target path:', targetPath);
      router.push(targetPath);
      router.refresh(); // Force refresh to reload server components with new locale
    });
  };

  // Get current language flag
  const getCurrentFlag = () => {
    const currentLangObj = languages.find(lang => lang.code.toUpperCase() === currentLang)
    return currentLangObj
  }

  return (
    <div className="relative z-[100]" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
        aria-label="Change Language"
      >
        {getCurrentFlag()?.useSvg && getCurrentFlag()?.svgPath ? (
          <Image src={getCurrentFlag()!.svgPath} alt={getCurrentFlag()!.label} width={24} height={24} className="rounded" />
        ) : (
          <span className="text-xl">{getCurrentFlag()?.flag || "🌐"}</span>
        )}
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{currentLang}</span>
        <svg 
          className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl ring-1 ring-gray-200 dark:ring-gray-700 z-[101] overflow-hidden"
          >
            <div className="py-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Language button clicked:', lang.code);
                    handleLanguageChange(lang.code);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = currentLang === lang.code.toUpperCase() ? '' : 'rgb(249 250 251)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '';
                  }}
                  disabled={isPending}
                  className={`block w-full text-left px-4 py-3 text-sm font-medium transition-colors duration-150 ${
                    currentLang === lang.code.toUpperCase()
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600 dark:border-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  style={{ pointerEvents: isPending ? 'none' : 'auto' }}
                >
                  <div className="flex items-center gap-3 pointer-events-none">
                    {lang.useSvg && lang.svgPath ? (
                      <Image src={lang.svgPath} alt={lang.label} width={32} height={32} className="rounded pointer-events-none" />
                    ) : (
                      <span className="text-2xl pointer-events-none">{lang.flag}</span>
                    )}
                    <div className="flex flex-col pointer-events-none">
                      <span className="font-semibold pointer-events-none">{lang.label}</span>
                      <span className="text-xs opacity-75 pointer-events-none">{lang.fullName}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 