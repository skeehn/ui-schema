import Link from 'next/link';
import { Github } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t-2 mt-24">
      <div className="container px-4 py-16">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">UISchema</h3>
            <p className="text-sm text-muted-foreground">
              Standards-Aligned, Token-Efficient Generative UI IR
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Documentation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/docs" className="text-muted-foreground hover:text-foreground">
                  Getting Started
                </Link>
              </li>
              <li>
                <Link href="/docs/architecture" className="text-muted-foreground hover:text-foreground">
                  Architecture
                </Link>
              </li>
              <li>
                <Link href="/docs/api-reference" className="text-muted-foreground hover:text-foreground">
                  API Reference
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/demo/examples" className="text-muted-foreground hover:text-foreground">
                  Examples
                </Link>
              </li>
              <li>
                <Link href="/demo/playground" className="text-muted-foreground hover:text-foreground">
                  Playground
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/skeehn/ui-schema"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Community</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/docs/contributing" className="text-muted-foreground hover:text-foreground">
                  Contributing
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/skeehn/ui-schema/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Issues
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} UISchema. MIT License.</p>
        </div>
      </div>
    </footer>
  );
}
