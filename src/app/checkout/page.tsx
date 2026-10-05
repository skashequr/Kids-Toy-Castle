import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CheckoutClient } from "@/components/checkout/checkout-client";

export const metadata = {
  title: "Checkout",
};

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <main><CheckoutClient /></main>
      <Footer />
    </>
  );
}
