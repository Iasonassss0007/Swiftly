'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const { user, loading } = useAuth()

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        closeMobileMenu()
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  // Focus management for accessibility
  useEffect(() => {
    if (isMobileMenuOpen && mobileMenuRef.current) {
      const firstLink = mobileMenuRef.current.querySelector('a')
      if (firstLink) {
        (firstLink as HTMLElement).focus()
      }
    }
  }, [isMobileMenuOpen])

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        closeMobileMenu()
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileMenuOpen])

  return (
    <div className="min-h-screen bg-[#F8FAFC] overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/90 backdrop-blur-sm border-b border-[#ADB3BD]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-[#111C59] to-[#4F5F73] bg-clip-text text-transparent">
              Swiftly
            </Link>

            {/* Desktop Navigation - Centered */}
            <nav className="hidden sm:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
              <Link href="#home" className="text-[#0F1626] hover:text-[#111C59] transition-colors duration-300 relative font-medium">Home</Link>
              <Link href="#features" className="text-[#0F1626] hover:text-[#111C59] transition-colors duration-300 relative font-medium">Features</Link>
              <Link href="#pricing" className="text-[#0F1626] hover:text-[#111C59] transition-colors duration-300 relative font-medium">Pricing</Link>
              <Link href="#about" className="text-[#0F1626] hover:text-[#111C59] transition-colors duration-300 relative font-medium">About</Link>
            </nav>

            {/* CTA Buttons */}
            <div className="hidden sm:flex items-center space-x-4">
              {loading ? (
                // Loading state - show skeleton buttons
                <>
                  <div className="w-20 h-12 bg-gray-200 animate-pulse rounded-lg"></div>
                  <div className="w-24 h-12 bg-gray-200 animate-pulse rounded-lg"></div>
                </>
              ) : user ? (
                // User is logged in - show Dashboard button only
                <Link href="/dashboard" className="bg-[#111C59] text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:bg-[#0F1626] hover:scale-105 shadow-lg">
                  Dashboard
                </Link>
              ) : (
                // User is not logged in - show Log In and Sign Up buttons
                <>
                  <Link href="/auth" className="border-2 border-[#111C59] text-[#111C59] px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:bg-[#111C59] hover:text-white">Log In</Link>
                  <Link href="/auth" className="bg-[#111C59] text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:bg-[#0F1626] hover:scale-105 shadow-lg">Sign Up</Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden flex flex-col justify-center items-center w-8 h-8 relative z-50"
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span 
                className={`w-6 h-0.5 bg-[#111C59] transition-all duration-300 ease-in-out ${
                  isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''
                }`}
              />
              <span 
                className={`w-6 h-0.5 bg-[#111C59] transition-all duration-300 ease-in-out mt-1.5 ${
                  isMobileMenuOpen ? 'opacity-0' : ''
                }`}
              />
              <span 
                className={`w-6 h-0.5 bg-[#111C59] transition-all duration-300 ease-in-out mt-1.5 ${
                  isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
              onClick={closeMobileMenu}
            />
            
            {/* Menu Panel */}
            <motion.div
              ref={mobileMenuRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ 
                type: "spring", 
                damping: 25, 
                stiffness: 200,
                duration: 0.4
              }}
              className="fixed inset-0 bg-white z-50 md:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation menu"
            >
              {/* Menu Header */}
              <div className="flex items-center justify-between p-8 border-b border-[#ADB3BD]/20">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-[#111C59] to-[#4F5F73] bg-clip-text text-transparent">
                  Swiftly
                </h3>
                <button
                  onClick={closeMobileMenu}
                  className="p-3 hover:bg-[#ADB3BD]/20 rounded-lg transition-colors duration-200"
                  aria-label="Close mobile menu"
                >
                  <svg className="w-8 h-8 text-[#111C59]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 flex flex-col justify-center p-8">
                <ul className="space-y-8 text-center">
                  {[
                    { href: '#home', label: 'Home' },
                    { href: '#features', label: 'Features' },
                    { href: '#pricing', label: 'Pricing' },
                    { href: '#about', label: 'About' }
                  ].map((link, index) => (
                    <motion.li
                      key={link.href}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        duration: 0.4, 
                        delay: 0.1 * index,
                        ease: "easeOut"
                      }}
                    >
                      <a
                        href={link.href}
                        onClick={closeMobileMenu}
                        className="block text-2xl font-medium text-[#0F1626] hover:text-[#111C59] transition-colors duration-200 py-3"
                      >
                        {link.label}
                      </a>
                    </motion.li>
                  ))}
                </ul>

                {/* Mobile CTA Buttons */}
                <div className="mt-12 space-y-4 px-8">
                  {loading ? (
                    // Loading state - show skeleton buttons
                    <>
                      <div className="w-full h-16 bg-gray-200 animate-pulse rounded-lg"></div>
                      <div className="w-full h-16 bg-gray-200 animate-pulse rounded-lg"></div>
                    </>
                  ) : user ? (
                    // User is logged in - show Dashboard button only
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.5 }}
                    >
                      <Link
                        href="/dashboard"
                        onClick={closeMobileMenu}
                        className="block w-full text-center bg-[#111C59] text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 hover:bg-[#0F1626] text-lg"
                      >
                        Dashboard
                      </Link>
                    </motion.div>
                  ) : (
                    // User is not logged in - show Log In and Sign Up buttons
                    <>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.5 }}
                      >
                        <Link
                          href="/auth"
                          onClick={closeMobileMenu}
                          className="block w-full text-center border-2 border-[#111C59] text-[#111C59] px-8 py-4 rounded-lg font-semibold transition-all duration-300 hover:bg-[#111C59] hover:text-white text-lg"
                        >
                          Log In
                        </Link>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.6 }}
                      >
                        <Link
                          href="/auth"
                          onClick={closeMobileMenu}
                          className="block w-full text-center bg-[#111C59] text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 hover:bg-[#0F1626] text-lg"
                        >
                          Sign Up
                        </Link>
                      </motion.div>
                    </>
                  )}
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-20 bg-gradient-to-br from-[#0F1626] via-[#111C59] to-[#4F5F73] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <g fill="none" fillRule="evenodd">
              <g fill="#ffffff" fillOpacity="0.1">
                <circle cx="30" cy="30" r="1"/>
              </g>
            </g>
          </svg>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 right-20 w-32 h-32 bg-[#ADB3BD]/30 rounded-full blur-xl"
            style={{ transform: 'translateZ(0)' }}
          />
          <motion.div
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-40 left-20 w-24 h-24 bg-[#4F5F73]/30 rounded-full blur-xl"
            style={{ transform: 'translateZ(0)' }}
          />
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 4 }}
            className="absolute bottom-40 right-40 w-20 h-20 bg-[#111C59]/30 rounded-full blur-xl"
            style={{ transform: 'translateZ(0)' }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl md:text-7xl font-bold text-white mb-6"
            >
              AI-Powered Admin Life{' '}
              <span className="text-[#ADB3BD]">Concierge</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto"
            >
              Simplify scheduling, task management, reminders, and productivity optimization with Swiftly&apos;s intelligent automation.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto sm:max-w-none"
            >
              <Link href="/dashboard" className="w-full sm:w-auto bg-white text-[#0F1626] px-8 py-4 rounded-lg font-semibold transition-all duration-300 hover:bg-[#F8FAFC] hover:scale-105 shadow-lg text-lg text-center">
                Get Started Free
              </Link>
              <Link href="#features" className="w-full sm:w-auto border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-[#0F1626] transition-all duration-300 text-lg text-center">
                Learn More
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#0F1626] mb-6">
              Everything you need to{' '}
              <span className="bg-gradient-to-r from-[#111C59] to-[#4F5F73] bg-clip-text text-transparent">stay organized</span>
            </h2>
            <p className="text-xl text-[#4F5F73] max-w-3xl mx-auto">
              From smart scheduling to intelligent task management, Swiftly handles the details so you can focus on what matters most.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {[
              {
                icon: (
                  <svg className="w-12 h-12 text-[#111C59]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
                title: 'Smart Scheduling',
                description: 'AI-powered calendar management that learns your preferences and optimizes your schedule automatically.'
              },
              {
                icon: (
                  <svg className="w-12 h-12 text-[#111C59]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                ),
                title: 'Task Management',
                description: 'Organize, prioritize, and track tasks with intelligent categorization and deadline management.'
              },
              {
                icon: (
                  <svg className="w-12 h-12 text-[#111C59]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                ),
                title: 'Smart Reminders',
                description: 'Context-aware notifications that remind you of important tasks at the right time and place.'
              },
              {
                icon: (
                  <svg className="w-12 h-12 text-[#111C59]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: 'Productivity Analytics',
                description: 'Track your productivity patterns and get insights to optimize your workflow and habits.'
              },
              {
                icon: (
                  <svg className="w-12 h-12 text-[#111C59]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
                title: 'Team Collaboration',
                description: 'Seamlessly coordinate with your team through shared calendars, task assignments, and real-time updates.'
              },
              {
                icon: (
                  <svg className="w-12 h-12 text-[#111C59]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                ),
                title: 'AI Insights',
                description: 'Get personalized recommendations and insights to improve your productivity and time management.'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white border border-[#ADB3BD]/30 rounded-xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-[#111C59]/50 text-center flex flex-col h-full"
              >
                <div className="mb-6 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-[#0F1626] mb-4 leading-tight">
                  {feature.title}
                </h3>
                <p className="text-[#4F5F73] flex-grow leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#0F1626] mb-6">
              Choose the plan that fits your{' '}
              <span className="bg-gradient-to-r from-[#111C59] to-[#4F5F73] bg-clip-text text-transparent">workflow</span>
            </h2>
            <p className="text-xl text-[#4F5F73] max-w-3xl mx-auto">
              Start free and scale as you grow. All plans include our core features with no hidden fees.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                name: 'Starter Plan',
                price: '$11.99',
                period: '/month',
                description: 'Access to fundamental task management features.',
                features: [
                  'Access to fundamental task management features',
                  'Calendar overview for basic scheduling',
                  'Up to 20 AI-generated suggestions per month',
                  'Standard email support'
                ],
                cta: 'Start Free Trial',
                popular: true
              },
              {
                name: 'Pro Plan',
                price: '$29.99',
                period: '/month',
                description: 'Unlimited tasks and project management capabilities.',
                features: [
                  'Unlimited tasks and project management capabilities',
                  'Comprehensive calendar integration',
                  'Up to 200 AI-generated suggestions per month',
                  'Priority email support',
                  'Custom reminders and notifications'
                ],
                cta: 'Start Free Trial',
                popular: false
              },
              {
                name: 'Enterprise Plan',
                price: 'Custom',
                period: '',
                description: 'Contact the sales team to obtain a tailored solution.',
                features: [
                  'Includes all features of the Pro Plan',
                  'Advanced team collaboration tools',
                  'Unlimited AI-generated suggestions',
                  'Dedicated account manager for account support',
                  'Priority assistance'
                ],
                cta: 'Contact Sales',
                popular: false
              }
            ].map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative bg-white border-2 rounded-xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col h-full ${
                  plan.popular
                    ? 'ring-2 ring-[#111C59] shadow-xl border-[#111C59]'
                    : 'border-[#ADB3BD]/30 hover:border-[#111C59]/50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[#111C59] text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-[#0F1626] mb-4 leading-tight">
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-[#0F1626]">
                      {plan.price}
                    </span>
                    <span className="text-lg text-[#4F5F73]">
                      {plan.period}
                    </span>
                  </div>
                  <p className="text-[#4F5F73] leading-relaxed">
                    {plan.description}
                  </p>
                </div>
                
                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start text-[#0F1626]">
                      <svg className="w-5 h-5 text-[#4F5F73] mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-auto">
                  <button className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                    plan.popular
                      ? 'bg-[#111C59] text-white hover:bg-[#0F1626] shadow-lg'
                      : 'bg-[#4F5F73] text-white hover:bg-[#111C59] shadow-md'
                  }`}>
                    {plan.cta}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <p className="text-[#4F5F73] mb-4">
              All plans include a 14-day free trial • No credit card required
            </p>
            <p className="text-[#4F5F73]">
              Need a custom plan?{' '}
              <a href="#contact" className="text-[#111C59] hover:text-[#0F1626] font-medium">
                Contact our sales team
              </a>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-20 bg-gradient-to-r from-[#111C59] to-[#4F5F73]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to transform your{' '}
              <span className="text-[#ADB3BD]">productivity</span>?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
              Join thousands of professionals who have already streamlined their workflow with Swiftly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto sm:max-w-none">
              <Link href="/auth" className="w-full sm:w-auto bg-white text-[#0F1626] px-8 py-4 rounded-lg font-semibold hover:bg-[#F8FAFC] transition-all duration-300 text-lg text-center shadow-lg">
                Start Your Free Trial
              </Link>
              <Link href="#features" className="w-full sm:w-auto border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-[#0F1626] transition-all duration-300 text-lg text-center">
                See How It Works
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0F1626] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-[#ADB3BD] to-[#4F5F73] bg-clip-text text-transparent mb-4">Swiftly</h3>
              <p className="text-[#ADB3BD] mb-6 max-w-md">
                AI-powered admin life concierge that simplifies your daily workflow and boosts productivity.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-[#ADB3BD] hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-[#ADB3BD] hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-[#ADB3BD] hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-[#ADB3BD] hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-[#ADB3BD] hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-[#ADB3BD] hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-[#4F5F73] mt-12 pt-8 text-center">
            <p className="text-[#ADB3BD]">
              © 2025 Swiftly. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
