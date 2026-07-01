import LegalLayout from "@/components/layout/LegalLayout";

const Terms = () => {
  return (
    <LegalLayout title="Termos de Serviço">
      <section className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground italic">Última atualização: 13 de maio de 2026</p>
        </div>

        <div>
          <h2 className="text-2xl font-bold">1. Aceitação dos Termos</h2>
          <p>
            Ao acessar e usar o LocalFiny ("Nós", "Nosso", "Plataforma"), você concorda em cumprir e estar vinculado a estes Termos de Serviço. Se você não concordar com qualquer parte destes termos, você não poderá acessar o serviço.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold">2. Descrição do Serviço</h2>
          <p>
            O LocalFiny é uma plataforma de gestão financeira pessoal que oferece ferramentas para controle de transações, orçamentos, investimentos e análise de dados financeiros.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold">3. Cadastro e Conta</h2>
          <p>
            Para utilizar a plataforma, você deve criar uma conta fornecendo informações precisas e completas. Você é o único responsável por manter a confidencialidade de sua senha e por todas as atividades que ocorrem em sua conta.
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Você deve ter pelo menos 18 anos de idade.</li>
            <li>Você concorda em nos notificar imediatamente sobre qualquer uso não autorizado de sua conta.</li>
            <li>Não é permitido compartilhar contas entre múltiplos usuários.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold">4. Assinaturas e Pagamentos</h2>
          <p>
            Algumas funcionalidades do LocalFiny são oferecidas mediante assinatura.
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Os preços e planos estão sujeitos a alterações mediante aviso prévio.</li>
            <li>Cancelamentos podem ser feitos a qualquer momento, mas não haverá reembolso para períodos já pagos, salvo indicação em contrário por lei.</li>
            <li>Falhas no pagamento podem resultar na suspensão do acesso às funcionalidades premium.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold">5. Uso Aceitável</h2>
          <p>Você concorda em não:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Usar o serviço para qualquer finalidade ilegal ou não autorizada.</li>
            <li>Tentar hackear, desestabilizar ou copiar o código-fonte da plataforma.</li>
            <li>Carregar vírus ou qualquer código malicioso.</li>
            <li>Interferir no uso e aproveitamento do serviço por outros usuários.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold">6. Propriedade Intelectual</h2>
          <p>
            Todo o conteúdo da plataforma, incluindo logotipos, design, textos, gráficos e software, é de propriedade exclusiva do LocalFiny ou de seus licenciadores e está protegido por leis de direitos autorais.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold">7. Limitação de Responsabilidade</h2>
          <p>
            O LocalFiny fornece ferramentas de auxílio financeiro, mas não oferece consultoria financeira, jurídica ou contábil profissional. As decisões tomadas com base nas informações da plataforma são de sua inteira responsabilidade.
          </p>
          <p className="mt-2">
            Em nenhuma circunstância seremos responsáveis por quaisquer danos indiretos, incidentais ou consequentes resultantes do uso do serviço.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold">8. Modificações nos Termos</h2>
          <p>
            Reservamos o direito de modificar estes termos a qualquer momento. Notificaremos os usuários sobre mudanças significativas através do email cadastrado ou de avisos na plataforma. O uso continuado após as alterações constitui aceitação dos novos termos.
          </p>
        </div>

        <div className="pt-8 border-t">
          <p>
            Se você tiver dúvidas sobre estes Termos, entre em contato conosco através do email contato@localfiny.com.
          </p>
        </div>
      </section>
    </LegalLayout>
  );
};

export default Terms;