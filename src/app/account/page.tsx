import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AccountClient } from "@/components/account/account-client";

export const metadata = { title: "My Account" };

export default function AccountPage() {
  return (
    <>
      <Header />
      <main>
        <AccountClient />
      </main>
      <Footer />
    </>
  );
}
