import { Link } from "react-router-dom";
import { Linkedin, Facebook, Youtube, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#DED9CD] border-t border-[#C4BFB3]">
      <div className="container mx-auto px-6 sm:px-8 py-8 sm:py-12">
        {/* Logo */}
        <div className="mb-4">
            <img src="./GDMI.png" alt="" className="w-24 h-14"/>
        </div>

        {/* Divider */}
        <div className="border-t border-[#564C35] mb-8"></div>

        {/* Navigation Links */}
        <nav className="mb-8">
          <ul className="space-y-0 text-[#564C35]">
            <li>
              <Link 
                to="/" 
                className="text-lg sm:text-xl hover:text-[#907F58] transition-colors"
              >
                Home
              </Link>
            </li>
            <li>
              <Link 
                to="/calculator" 
                className="text-lg sm:text-xl hover:text-[#907F58] transition-colors"
              >
                Automatic Calculator
              </Link>
            </li>
            <li>
              <Link 
                to="/calculator" 
                className="text-lg sm:text-xl hover:text-[#907F58] transition-colors"
              >
                Manual Calculator
              </Link>
            </li>
          </ul>
        </nav>

        {/* Contact Info */}
        <div className="mb-8 space-y-0 text-[#564C35]">
          <a 
            href="mailto:support@gdmi.com" 
            className="block text-lg sm:text-xl hover:text-[#907F58] transition-colors"
          >
            support@gdmi.com
          </a>
          <a 
            href="tel:+919971187600" 
            className="block text-lg sm:text-xl hover:text-[#907F58] transition-colors"
          >
            +91 9971187600
          </a>
        </div>

        {/* Social Media Icons */}
        <div className="flex gap-6 mb-8">
          <a 
            href="https://www.linkedin.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#564C35] hover:text-[#907F58] transition-colors"
            aria-label="LinkedIn"
          >
            <Linkedin className="h-8 w-8 sm:h-10 sm:w-10" strokeWidth={1.5} />
          </a>
          <a 
            href="https://www.facebook.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#564C35] hover:text-[#907F58] transition-colors"
            aria-label="Facebook"
          >
            <Facebook className="h-8 w-8 sm:h-10 sm:w-10" strokeWidth={1.5} />
          </a>
          <a 
            href="https://www.youtube.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#564C35] hover:text-[#907F58] transition-colors"
            aria-label="YouTube"
          >
            <Youtube className="h-8 w-8 sm:h-10 sm:w-10" strokeWidth={1.5} />
          </a>
          <a 
            href="https://twitter.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#564C35] hover:text-[#907F58] transition-colors"
            aria-label="Twitter"
          >
            <Twitter className="h-8 w-8 sm:h-10 sm:w-10" strokeWidth={1.5} />
          </a>
        </div>

        {/* Copyright */}
        <div className="text-[#6B6456] text-sm sm:text-base">
          GDMI © 2025 All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
