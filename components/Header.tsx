'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { href: '#home', label: 'Home' },
    { href: '#features', label: 'Features' },
    { href: '#pricing', label: 'Pricing' },
    { href: '#about', label: 'About' },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'glass shadow-2xl shadow-accent-blue/10'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo - Left Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex-shrink-0"
          >
            <a href="#home" className="text-2xl font-bold gradient-text">
              Swiftly
            </a>
          </motion.div>

          {/* Navigation Links - Center Section */}
          <nav className="hidden md:flex space-x-8 absolute left-1/2 transform -translate-x-1/2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="nav-link"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA Buttons - Right Section */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/auth"
              className="px-6 py-2.5 text-accent-blue hover:text-accent-cyan font-medium transition-colors duration-200 hover:bg-accent-blue/5 rounded-lg"
            >
              Log In
            </Link>
            <Link
              href="/auth"
              className="btn-primary"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-accent-blue hover:text-accent-cyan transition-colors duration-200"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
          >
            <div className="w-6 h-6 flex flex-col justify-center items-center relative">
              {/* Top line */}
              <motion.span
                animate={isMobileMenuOpen ? { 
                  rotate: 45, 
                  y: 8,
                  width: "100%"
                } : { 
                  rotate: 0, 
                  y: 0,
                  width: "100%"
                }}
                transition={{ 
                  duration: 0.4, 
                  ease: [0.4, 0.0, 0.2, 1], // Custom cubic-bezier for ultra-smooth motion
                  rotate: { duration: 0.4, ease: [0.4, 0.0, 0.2, 1] },
                  y: { duration: 0.4, ease: [0.4, 0.0, 0.2, 1] }
                }}
                className="w-6 bg-accent-blue block absolute origin-center rounded-full"
                style={{ top: '2px', height: '3px' }}
              />
              
              {/* Middle line */}
              <motion.span
                animate={isMobileMenuOpen ? { 
                  opacity: 0, 
                  scale: 0.8,
                  x: -10
                } : { 
                  opacity: 1, 
                  scale: 1,
                  x: 0
                }}
                transition={{ 
                  duration: 0.3, 
                  ease: [0.4, 0.0, 0.2, 1],
                  opacity: { duration: 0.2, ease: "easeInOut" },
                  scale: { duration: 0.3, ease: [0.4, 0.0, 0.2, 1] },
                  x: { duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }
                }}
                className="w-6 bg-accent-blue block absolute origin-center rounded-full"
                style={{ top: '8px', height: '3px' }}
              />
              
              {/* Bottom line */}
              <motion.span
                animate={isMobileMenuOpen ? { 
                  rotate: -45, 
                  y: -8,
                  width: "100%"
                } : { 
                  rotate: 0, 
                  y: 0,
                  width: "100%"
                }}
                transition={{ 
                  duration: 0.4, 
                  ease: [0.4, 0.0, 0.2, 1],
                  rotate: { duration: 0.4, ease: [0.4, 0.0, 0.2, 1] },
                  y: { duration: 0.4, ease: [0.4, 0.0, 0.2, 1] }
                }}
                className="w-6 bg-accent-blue block absolute origin-center rounded-full"
                style={{ top: '14px', height: '3px' }}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
            className="md:hidden fixed top-20 left-0 right-0 bottom-0 glass shadow-2xl z-40"
          >
            <div className="px-4 py-6 space-y-4 h-full overflow-y-auto">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block text-light-gray hover:text-accent-cyan transition-colors duration-300 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 border-t border-dark-gray space-y-3">
                <Link
                  href="/auth"
                  className="block text-center px-6 py-2.5 text-accent-blue hover:text-accent-cyan font-medium transition-colors duration-200 hover:bg-accent-blue/5 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  href="/auth"
                  className="btn-primary block text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
