import { Card } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";
import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Beatriz Lima",
    role: "Proprietária de E-commerce",
    avatar: "https://i.pravatar.cc/150?u=tiago",
    content: "A Financeiro Pro reestruturou minha relação com o dinheiro. Hoje tenho clareza absoluta sobre minhas margens e consigo planejar o crescimento do meu negócio com segurança.",
    rating: 5
  },
  {
    name: "Ricardo Mendes",
    role: "Programador Sênior",
    avatar: "https://i.pravatar.cc/150?u=ricardo",
    content: "Economizei quase R$ 1.000 no primeiro mês apenas cortando gastos invisíveis que a plataforma identificou. A automação das metas é o ponto alto!",
    rating: 5
  },
  {
    name: "Fernanda Rocha",
    role: "Arquiteta Freelancer",
    avatar: "https://i.pravatar.cc/150?u=lia",
    content: "Os painéis visuais são extremamente úteis. Consigo enxergar minha evolução mensal e isso me deu a motivação que faltava para investir com consistência.",
    rating: 5
  },
  {
    name: "Tiago Souza",
    role: "Produtor de Conteúdo",
    avatar: "https://i.pravatar.cc/150?u=beatriz",
    content: "Para quem tem renda variável como eu, a ferramenta de distribuição estratégica é um divisor de águas. Consigo separar meu fundo de reserva sem esforço.",
    rating: 5
  },
  {
    name: "Letícia Santos",
    role: "Consultora de Vendas",
    avatar: "https://i.pravatar.cc/150?u=leticia",
    content: "Finalmente saí do vermelho e montei minha reserva! O sistema guia você passo a passo baseado no seu custo de vida real. Simplesmente fantástico.",
    rating: 5
  },
  {
    name: "Marcos Oliveira",
    role: "Gestor de Projetos",
    avatar: "https://i.pravatar.cc/150?u=marcos",
    content: "O sistema de conquistas torna o processo divertido. Alcançar a independência financeira virou um objetivo claro e acompanhável dia após dia.",
    rating: 5
  }
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="relative py-24 sm:py-32 overflow-hidden bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-20 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wider uppercase">
            Comunidade
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Histórias de <span className="text-primary">Sucesso</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Junte-se a milhares de pessoas que decidiram retomar as rédeas de suas finanças e transformar sua realidade.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="flex"
            >
              <div className="relative p-8 rounded-[2rem] bg-card border border-border shadow-xl hover:shadow-2xl transition-all duration-500 group flex flex-col w-full">
                <div className="absolute top-6 right-8 opacity-20 group-hover:scale-110 transition-transform">
                  <Quote className="h-10 w-10 text-primary" />
                </div>

                <div className="flex items-center gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>

                <p className="text-muted-foreground leading-relaxed italic mb-8 flex-1">
                  "{testimonial.content}"
                </p>

                <div className="flex items-center gap-4 pt-6 border-t border-border/50">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/20 shadow-inner">
                    <img src={testimonial.avatar} alt={testimonial.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground tracking-tight">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
