export function Footer() {
  return (
    <footer className="mt-8 py-4 border-t border-gray-200">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm text-gray-500">© {new Date().getFullYear()} Monad Multisender</p>
        <div className="flex items-center space-x-4">
          <a href="https://github.com/monad-labs/multisender" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors">
            <i className="fab fa-github"></i>
          </a>
          <a href="https://discord.gg/monad" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors">
            <i className="fab fa-discord"></i>
          </a>
          <a href="https://twitter.com/monadlabs" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors">
            <i className="fab fa-twitter"></i>
          </a>
        </div>
      </div>
    </footer>
  );
}
