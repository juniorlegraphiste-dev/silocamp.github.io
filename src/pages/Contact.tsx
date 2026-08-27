import { ContactForm } from "@/components/contact/ContactForm";
import { ContactHero } from "@/components/contact/ContactHero";
import { ContactInfo } from "@/components/contact/ContactInfo";
import { ContactMap } from "@/components/contact/ContactMap";
import { ContactCTA } from "@/components/contact/CTA";
import { ContactFAQ } from "@/components/contact/FAQ";


export default function Contact() {
  return (
    <>
      <ContactHero />

      <div className="container-px mx-auto max-w-7xl py-24 space-y-24">
        <ContactInfo />

        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <ContactForm />
          <ContactMap />
        </div>

        <ContactFAQ />
      </div>

      <ContactCTA />
    </>
  );
}