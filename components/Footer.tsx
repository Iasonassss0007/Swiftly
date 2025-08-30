'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const footerLinks = {
  Support: [
    { name: 'Contact Support', href: '#contact-support' },
    { name: 'FAQ / Help Center', href: '#faq' },
    { name: 'Live Chat', href: '#live-chat' },
  ],
  Legal: [
    { name: 'Terms of Service', href: '#terms' },
    { name: 'Privacy Policy', href: '#privacy' },
    { name: 'GDPR / Data Protection', href: '#gdpr' },
  ]
}

export default function Footer() {
  return (
    <footer className="bg-charcoal text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Brand Section */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex items-center space-x-3"
            >
            
              <span className="text-2xl font-bold">Swiftly</span>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-light-gray max-w-md leading-relaxed"
            >
              AI-powered admin life concierge that streamlines your daily tasks, 
              manages your schedule, and provides intelligent assistance.
            </motion.p>
          </div>

          {/* Links Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Support Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h3 className="text-lg font-semibold mb-4 text-white">Support</h3>
              <ul className="space-y-3">
                {footerLinks.Support.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-light-gray hover:text-white transition-colors duration-200 group"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="group-hover:text-accent-cyan transition-colors duration-200">
                          {link.name}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Legal Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <h3 className="text-lg font-semibold mb-4 text-white">Legal</h3>
              <ul className="space-y-3">
                {footerLinks.Legal.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-light-gray hover:text-white transition-colors duration-200 group"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="group-hover:text-accent-cyan transition-colors duration-200">
                          {link.name}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="border-t border-gray-700 mt-12 pt-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-light-gray text-sm">
              © 2025 Swiftly. All rights reserved.
            </p>
            <p className="text-light-gray text-sm">
              Built with ❤️ for better productivity
            </p>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
