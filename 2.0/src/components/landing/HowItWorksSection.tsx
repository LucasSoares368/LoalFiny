import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, LayoutDashboard, Target, PieChart, Wallet, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    icon: <Wallet className="h-8 w-8" />,
    title: "Ponto de Partida",
    description: "Informe seu saldo atual para que o sistema entenda sua situação inicial e trace o melhor caminho.",
    features: [
      "Visão imediata do patrimônio",
      "Ajustes rápidos e simples",
      "Transparência total desde o início"
    ]
  },
  {
    number: "02",
    icon: <LayoutDashboard className="h-8 w-8" />,
    title: "Análise de Cenário",
    description: "Veja para onde cada centavo está indo com painéis dinâmicos que organizam sua vida financeira.",
    features: [
      "Fluxo de caixa detalhado",
      "Categorização inteligente",
      "Resumos visuais práticos"
    ]
  },
  {
    number: "03",
    icon: <Target className="h-8 w-8" />,
    title: "Trajeto de Metas",
    description: "Configure seus objetivos de curto e longo prazo. Nós ajudamos você a chegar lá mais rápido.",
    features: [
      "Fundo de emergência guiado",
      "Planos de vida customizados",
      "Barra de progresso motivacional"
    ]
  },
  {
    number: "04",
    icon: <PieChart className="h-8 w-8" />,
    title: "Distribuição Ágil",
    description: "Utilize inteligência para separar seus recursos entre lazer, obrigações e investimentos automaticamente.",
    features: [
      "Divisão por porcentagem",
      "Separação de verbas simples",
      "Foco no que realmente importa"
    ]
  },
  {
    number: "05",
    icon: <TrendingUp className="h-8 w-8" />,
    title: "Trilha da Liberdade",
    description: "Comemore cada conquista desbloqueada enquanto avança no seu mapa da independência financeira.",
    features: [
      "Gameficação do progresso",
      "Recompensas simbólicas",
      "Histórico de evolução clara"
    ]
  }
];

const HowItWorksSection = () => {
  const navigate = useNavigate();

  return (
    <section id="how-it-works" className="relative py-24 sm:py-32 overflow-hidden bg-background">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-20 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wider uppercase">
            Metodologia
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Seu caminho para a <span className="text-primary">liberdade</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Abandone as planilhas confusas. Siga um método comprovado e veja seu dinheiro render mais todos os meses.
          </p>
        </motion.div>

        <div className="relative max-w-5xl mx-auto">
          {/* Vertical line - hidden on mobile */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border hidden md:block" />

          <div className="space-y-16 md:space-y-24">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8 md:gap-20`}
              >
                {/* Visual side */}
                <div className="flex-1 w-full">
                  <div className={`relative p-8 rounded-[2rem] bg-card border border-border shadow-2xl flex flex-col items-center text-center group overflow-hidden ${index % 2 === 0 ? 'md:text-right md:items-end' : 'md:text-left md:items-start'}`}>
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                      <span className="text-9xl font-black">{step.number}</span>
                    </div>
                    
                    <div className="relative mb-6 p-4 bg-primary/10 rounded-2xl text-primary group-hover:scale-110 transition-transform duration-500">
                      {step.icon}
                    </div>
                    
                    <h3 className="text-2xl font-black mb-4 tracking-tight">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                      {step.description}
                    </p>
                    
                    <div className="mt-6 flex flex-wrap gap-2 justify-center md:justify-start">
                      {step.features.map((feature, i) => (
                        <span key={i} className="px-3 py-1 bg-muted rounded-full text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Connection point */}
                <div className="relative z-10 hidden md:block">
                  <div className="w-12 h-12 rounded-full bg-background border-4 border-primary flex items-center justify-center font-black text-primary shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                    {step.number}
                  </div>
                </div>

                {/* Empty side for layout spacing on desktop */}
                <div className="flex-1 hidden md:block" />
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div 
          className="text-center mt-24"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-block p-1 bg-muted rounded-2xl mb-8">
            <div className="px-8 py-10 bg-background border border-border rounded-xl shadow-inner max-w-3xl mx-auto">
              <h3 className="text-2xl font-black mb-4">Pronto para dar o primeiro passo?</h3>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Milhares de pessoas já estão utilizando o Financeiro Pro para organizar sua vida. Junte-se a elas hoje mesmo.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button 
                  size="lg"
                  onClick={() => navigate("/auth")}
                  className="bg-primary text-white hover:bg-primary/90 h-14 px-10 rounded-xl font-black shadow-xl shadow-primary/20 transition-all active:scale-95 w-full sm:w-auto"
                >
                  Começar Jornada Agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: 'smooth' })}
                  className="h-14 px-10 rounded-xl font-bold border-2 w-full sm:w-auto"
                >
                  Saiba mais
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
