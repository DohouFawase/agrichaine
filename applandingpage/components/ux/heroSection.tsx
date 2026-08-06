import { Button } from "../ui/button";

export default function HeroSection() {
  return (
    <section className="hero">
      <h1>Onabaya — le pont direct entre le champ et votre panier</h1>
      <p>
        L&apos;application qui connecte producteurs, acheteurs et transporteurs pour
        un commerce vivrier plus rapide, plus sûr et plus juste. Fini les
        intermédiaires, les prix gonflés et les livraisons incertaine
      </p>
      <div className="">
        <Button>Je réserve ma place</Button>
      </div>
      <p>
        Aucune carte bancaire requise. 30 secondes suffisent. Vous serez parmi
        les premiers à tester l&apos;app avant tout le monde.
      </p>
    </section>
  );
}
