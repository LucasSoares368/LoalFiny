import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "O que é o Financeiro Pro?",
    answer:
      "A Financeiro Pro é um ecossistema inteligente de gestão financeira. Nosso objetivo é dar ferramentas práticas para que qualquer pessoa ou pequeno empreendedor consiga dominar seu fluxo de caixa e atingir a liberdade financeira com tecnologia de ponta.",
  },
  {
    question: "Como funciona a segurança dos meus dados?",
    answer:
      "A segurança é nosso pilar principal. Utilizamos protocolos de criptografia bancária (AES-256) e servidores blindados. Além disso, seguimos rigorosamente a LGPD para garantir que sua privacidade seja sempre respeitada.",
  },
  {
    question: "Consigo importar extratos de outros bancos?",
    answer:
      "Certamente! Você pode subir seus arquivos CSV ou OFX diretamente no sistema. Nossa inteligência artificial reconhece os padrões de gastos e faz a categorização automática para você ganhar tempo.",
  },
  {
    question: "Existe algum custo para começar?",
    answer:
      "Temos um plano gratuito vitalício com as funções essenciais para sua organização inicial. Conforme sua jornada evolui, você pode migrar para os planos Premium e desbloquear ferramentas de análise avançada e importação automática.",
  },
  {
    question: "Como entro em contato com o suporte?",
    answer:
      "Nosso suporte está disponível via e-mail (contato@financeiropro.com.br) e WhatsApp para assinantes dos planos Premium. Respondemos a todas as dúvidas em até 24 horas úteis.",
  },
  {
    question: "Posso cancelar meu plano quando quiser?",
    answer:
      "Sim, sem burocracia ou letras miúdas. Você tem total controle sobre sua assinatura e pode pausar ou cancelar diretamente pelo painel de configurações a qualquer momento.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="relative py-24 sm:py-32 overflow-hidden bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wider uppercase">
              FAQ
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              Dúvidas <span className="text-primary">Frequentes</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Tudo o que você precisa saber sobre como o Financeiro Pro funciona.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-border rounded-2xl px-6 bg-card/50 transition-all duration-300 hover:border-primary/30"
              >
                <AccordionTrigger className="text-left font-bold text-lg py-6 hover:no-underline hover:text-primary transition-colors">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base pb-6 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
