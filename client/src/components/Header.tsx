export function Header() {
  return (
    <header className="mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-primary p-2 rounded-lg">
            <i className="fas fa-paper-plane text-white text-xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Monad Multisender</h1>
        </div>
        <div>
          <span className="px-3 py-1 rounded-full bg-blue-100 text-xs font-medium text-blue-800">Monad Testnet</span>
        </div>
      </div>
      <p className="mt-2 text-gray-600">Efficiently send ERC-20 tokens to multiple addresses in a single transaction</p>
    </header>
  );
}
