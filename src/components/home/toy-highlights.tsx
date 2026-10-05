import Link from "next/link";
import { ArrowRight, BadgeCheck, Gift, Heart, Truck } from "lucide-react";

const collections = [
  { emoji: "🏰", title: "কল্পনার রাজ্য", text: "টেন্ট, প্লে-হাউস ও রোল-প্লে খেলনা", color: "bg-[#ffe5f0]" },
  { emoji: "🧱", title: "বানাও ও শেখো", text: "বিল্ডিং ব্লক ও ক্রিয়েটিভ সেট", color: "bg-[#e4f5ff]" },
  { emoji: "🧸", title: "ছোট্ট বন্ধু", text: "সফট টয় ও আরামদায়ক প্লে-টাইম", color: "bg-[#fff0c9]" },
  { emoji: "🎨", title: "রঙের আনন্দ", text: "আর্ট, ক্রাফট ও শেখার খেলনা", color: "bg-[#e9f8d5]" },
];

const promises = [
  { icon: BadgeCheck, title: "শিশুবান্ধব বাছাই", text: "খেলার আনন্দ ও আরামের কথা ভেবে নির্বাচিত" },
  { icon: Truck, title: "দ্রুত ডেলিভারি", text: "আপনার দরজায় পৌঁছে যাবে প্রিয় খেলনা" },
  { icon: Gift, title: "উপহারের জন্য দারুণ", text: "জন্মদিন ও বিশেষ দিনের হাসিমুখের উপহার" },
];

export function ToyHighlights() {
  return (
    <>
      <section className="bg-white py-14 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-9 max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[.18em] text-[#ff6da8]">পছন্দের কালেকশন</span>
            <h2 className="mt-3 font-serif text-3xl font-bold text-[#175a9f] sm:text-4xl">খেলার জন্য নতুন নতুন জগৎ</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {collections.map((collection) => (
              <Link key={collection.title} href="/new-arrivals" className={`${collection.color} group rounded-3xl p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lg`}>
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-3xl shadow-sm">{collection.emoji}</span>
                <h3 className="mt-6 text-lg font-bold text-[#175a9f]">{collection.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#56708d]">{collection.text}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-[#ff579a]">দেখুন <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      
    </>
  );
}
