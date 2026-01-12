import Link from 'next/link'
import { ROUTES } from '../routes'

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="font-bold text-lg mb-4">Language Shadowing</h3>
            <p className="text-sm text-muted-foreground">
              The fastest way to conversational fluency through natural language shadowing.
            </p>
          </div>

          {/* Learn */}
          <div>
            <h4 className="font-semibold mb-4">Learn</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/language-shadowing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Language Shadowing
                </Link>
              </li>
              <li>
                <Link href="/learn-italian" className="text-muted-foreground hover:text-foreground transition-colors">
                  Learn Italian
                </Link>
              </li>
              <li>
                <Link href="/learn-spanish" className="text-muted-foreground hover:text-foreground transition-colors">
                  Learn Spanish
                </Link>
              </li>
              <li>
                <Link href="/learn-japanese" className="text-muted-foreground hover:text-foreground transition-colors">
                  Learn Japanese
                </Link>
              </li>
              <li>
                <Link href="/learn-english" className="text-muted-foreground hover:text-foreground transition-colors">
                  Learn English
                </Link>
              </li>
            </ul>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={ROUTES.SIGNIN} className="text-muted-foreground hover:text-foreground transition-colors">
                  Get Started
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={ROUTES.PRIVACY} className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href={ROUTES.TERMS} className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} Language Shadowing. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
