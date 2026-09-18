import { Link } from "react-router-dom";
import { FileText, Mail, Twitter, Linkedin, Instagram } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl">
                Research<span className="text-primary">Connect</span>
              </span>
            </Link>
            <p className="text-background/60 text-sm">
              Connecting Nigerian student researchers with verified participants for quality academic research.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-background/60 hover:text-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-background/60 hover:text-primary transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-background/60 hover:text-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-display font-semibold mb-4">Platform</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/researchers" className="text-background/60 hover:text-background text-sm transition-colors">
                  For Researchers
                </Link>
              </li>
              <li>
                <Link to="/participants" className="text-background/60 hover:text-background text-sm transition-colors">
                  For Participants
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-background/60 hover:text-background text-sm transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/universities" className="text-background/60 hover:text-background text-sm transition-colors">
                  Universities
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-display font-semibold mb-4">Resources</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/help" className="text-background/60 hover:text-background text-sm transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/guides" className="text-background/60 hover:text-background text-sm transition-colors">
                  Research Guides
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-background/60 hover:text-background text-sm transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/ethics" className="text-background/60 hover:text-background text-sm transition-colors">
                  Research Ethics
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-display font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/privacy" className="text-background/60 hover:text-background text-sm transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-background/60 hover:text-background text-sm transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/data-protection" className="text-background/60 hover:text-background text-sm transition-colors">
                  Data Protection
                </Link>
              </li>
              <li>
                <a href="mailto:support@researchconnect.ng" className="text-background/60 hover:text-background text-sm transition-colors flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-background/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-background/40 text-sm">
              © 2025 Research Connect NG. All rights reserved.
            </p>
            <p className="text-background/40 text-sm">
              Made with 💚 for Nigerian Students
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
