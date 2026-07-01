import LegalLayout from "@/components/layout/LegalLayout";

const Privacy = () => {
  return (
    <LegalLayout title="Política de Privacidade">
      <section className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground italic">Última atualização: 13 de maio de 2026</p>
        </div>

        <div>
          <h2 className="text-2xl font-bold">1. Introdução</h2>
          <p>
            O LocalFiny valoriza a sua privacidade. Esta Política de Privacidade explica como coletamos, usamos, protegemos e compartilhamos suas informações pessoais ao utilizar nossa plataforma.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold">2. Informações que Coletamos</h2>
          <p>Coletamos informações que você nos fornece diretamente:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Dados de Conta:</strong> Nome completo, endereço de email e senha (criptografada).</li>
            <li><strong>Dados Financeiros:</strong> Transações, saldos, categorias de gastos e metas financeiras que você insere manualmente ou via importação.</li>
            <li><strong>Comunicações:</strong> Informações enviadas ao nosso suporte ou em pesquisas de satisfação.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold">3. Como Usamos Seus Dados</h2>
          <p>Utilizamos os dados coletados para:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Fornecer, manter e melhorar as funcionalidades da plataforma.</li>
            <li>Processar transações e enviar notificações relacionadas à sua conta.</li>
            <li>Gerar relatórios e insights financeiros personalizados para você.</li>
            <li>Personalizar sua experiência e oferecer suporte técnico.</li>
            <li>Garantir a segurança e prevenir fraudes.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold">4. Segurança dos Dados</h2>
          <p>
            Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações, incluindo:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Uso de criptografia SSL/TLS em todas as comunicações.</li>
            <li>Armazenamento seguro em servidores de alta confiabilidade (Supabase/AWS).</li>
            <li>Criptografia de senhas e dados sensíveis.</li>
            <li>Monitoramento contínuo contra acessos não autorizados.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold">5. Compartilhamento de Dados</h2>
          <p>
            <strong>Nós não vendemos seus dados pessoais para terceiros.</strong> Podemos compartilhar informações apenas nas seguintes situações:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Com provedores de serviços que nos auxiliam na operação da plataforma (ex: processadores de pagamento, serviços de email).</li>
            <li>Se exigido por lei ou autoridade competente.</li>
            <li>Em caso de fusão, venda ou aquisição da empresa, mantendo os compromissos de privacidade.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold">6. Seus Direitos</h2>
          <p>De acordo com a LGPD e outras leis de proteção de dados, você tem o direito de:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Acessar, corrigir ou atualizar seus dados pessoais.</li>
            <li>Solicitar a exclusão permanente de sua conta e todos os dados associados.</li>
            <li>Exportar seus dados em formato estruturado.</li>
            <li>Retirar seu consentimento para o processamento de dados a qualquer momento.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold">7. Cookies e Tecnologias de Rastreamento</h2>
          <p>
            Usamos cookies para manter sua sessão ativa e entender como você interage com a plataforma. Você pode gerenciar as preferências de cookies através das configurações do seu navegador.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold">8. Alterações nesta Política</h2>
          <p>
            Podemos atualizar esta política periodicamente. Notificaremos você sobre quaisquer mudanças postando a nova Política de Privacidade nesta página e atualizando a data de "Última atualização".
          </p>
        </div>

        <div className="pt-8 border-t">
          <p>
            Para questões relacionadas à privacidade, entre em contato pelo email: contato@localfiny.com
          </p>
        </div>
      </section>
    </LegalLayout>
  );
};

export default Privacy;