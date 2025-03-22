import { Header } from "@/components/Header";
import { NetworkStatus } from "@/components/NetworkStatus";
import { MultisenderForm } from "@/components/MultisenderForm";
import { TransactionHistory } from "@/components/TransactionHistory";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="bg-monad-bg min-h-screen text-gray-800">
      <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
        <Header />
        <main className="space-y-6">
          <NetworkStatus />
          <MultisenderForm />
          <TransactionHistory />
        </main>
        <Footer />
      </div>
    </div>
  );
}
