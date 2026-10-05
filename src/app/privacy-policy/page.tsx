import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata = { title: "Privacy Policy" };

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="font-serif text-xl font-bold mb-3">{title}</h2>
      <div className="text-muted text-sm leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main>
        <div className="bg-navy py-12 px-4 text-center">
          <h1 className="font-serif text-4xl font-bold text-ivory">Privacy Policy</h1>
          <p className="text-ivory/60 mt-2 text-sm">Last updated: June 6, 2026</p>
        </div>
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <PolicySection title="1. Information We Collect">
            <p>We collect information you provide directly to us, such as your name, email address, phone number, and shipping address when you create an account, make a purchase, or contact us.</p>
            <p>We automatically collect certain information when you use our website, including IP address, browser type, operating system, referring URLs, and pages viewed.</p>
          </PolicySection>
          <PolicySection title="2. How We Use Your Information">
            <p>We use the information we collect to: process your orders and payments; send you order confirmations and shipping updates; provide customer support; send marketing communications (with your consent); improve our website and services; detect and prevent fraud.</p>
          </PolicySection>
          <PolicySection title="3. Information Sharing">
            <p>We do not sell, trade, or rent your personal information to third parties. We may share your information with trusted service providers who help us operate our website, conduct our business, or service you, so long as they agree to keep this information confidential.</p>
          </PolicySection>
          <PolicySection title="4. Data Security">
            <p>We implement industry-standard security measures to protect your personal information. All payment transactions are encrypted using SSL technology. However, no method of transmission over the internet is 100% secure.</p>
          </PolicySection>
          <PolicySection title="5. Cookies">
            <p>We use cookies and similar tracking technologies to enhance your experience. You can control cookie settings through your browser. Disabling cookies may affect certain features of our website.</p>
          </PolicySection>
          <PolicySection title="6. Your Rights">
            <p>You have the right to access, correct, or delete your personal information. To exercise these rights, please contact us at privacy@luxen.com.bd.</p>
          </PolicySection>
          <PolicySection title="7. Contact Us">
            <p>If you have any questions about this Privacy Policy, please contact us at privacy@luxen.com.bd or call +880 1700-000000.</p>
          </PolicySection>
        </div>
      </main>
      <Footer />
    </>
  );
}
