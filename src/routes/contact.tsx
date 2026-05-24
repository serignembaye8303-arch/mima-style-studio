import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/SiteLayout";
import { fetchWhatsAppNumber } from "@/lib/products";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/contact")({ component: Contact });

function Contact() {
  const { data: whatsapp = "+221770000000" } = useQuery({ queryKey: ["whatsapp"], queryFn: fetchWhatsAppNumber });
  const num = whatsapp.replace(/[^0-9]/g, "");

  return (
    <SiteLayout>
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center">
          <p className="tracking-luxe text-[10px] text-gold">Contact</p>
          <h1 className="mt-3 font-display text-5xl">Parlons-en</h1>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto">Une question, un conseil styling, une commande sur mesure ? Notre équipe vous répond avec plaisir.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mt-16">
          <a href={`https://wa.me/${num}`} target="_blank" rel="noreferrer" className="group p-8 border border-border hover:border-gold transition-colors">
            <MessageCircle className="h-6 w-6 text-gold" strokeWidth={1.2} />
            <h3 className="font-display text-2xl mt-4">WhatsApp</h3>
            <p className="text-sm text-muted-foreground mt-1">{whatsapp}</p>
            <p className="mt-4 tracking-luxe text-[10px] group-hover:text-gold">Écrire maintenant →</p>
          </a>
          <a href="mailto:contact@mimaboutique.com" className="p-8 border border-border hover:border-gold transition-colors group">
            <Mail className="h-6 w-6 text-gold" strokeWidth={1.2} />
            <h3 className="font-display text-2xl mt-4">Email</h3>
            <p className="text-sm text-muted-foreground mt-1">contact@mimaboutique.com</p>
            <p className="mt-4 tracking-luxe text-[10px] group-hover:text-gold">Envoyer un email →</p>
          </a>
          <div className="p-8 border border-border">
            <Phone className="h-6 w-6 text-gold" strokeWidth={1.2} />
            <h3 className="font-display text-2xl mt-4">Téléphone</h3>
            <p className="text-sm text-muted-foreground mt-1">{whatsapp}</p>
            <p className="mt-4 tracking-luxe text-[10px] text-muted-foreground">Lun-Sam · 9h-19h</p>
          </div>
          <div className="p-8 border border-border">
            <MapPin className="h-6 w-6 text-gold" strokeWidth={1.2} />
            <h3 className="font-display text-2xl mt-4">Showroom</h3>
            <p className="text-sm text-muted-foreground mt-1">Dakar, Sénégal</p>
            <p className="mt-4 tracking-luxe text-[10px] text-muted-foreground">Sur rendez-vous</p>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
