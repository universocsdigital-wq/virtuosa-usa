import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Entregas e Trocas | Virtuosa USA",
  description: "Política de envio e trocas da Virtuosa USA.",
};

export default function ShippingAndReturnsPage() {
  return (
    <>
      <Navbar />
      <main className="bg-[#F7F1E8]">
        <section className="container-virtuosa py-14 lg:py-20">
          <div className="mx-auto max-w-3xl">
            <div className="space-y-12 rounded-[2px] border border-[#D9C8B5] bg-white/45 p-7 shadow-[0_24px_70px_rgba(42,23,18,0.07)] lg:p-10">
              <PolicySection title="Política de Envio">
                <p>A Virtuosa USA realiza envios para clientes localizados nos Estados Unidos.</p>

                <h2>Frete</h2>
                <p>O valor do frete é de US$ 12 por pedido, independentemente da quantidade de peças adquiridas.</p>
                <p>Clientes que optarem pela retirada local não terão cobrança de frete.</p>

                <h2>Processamento dos Pedidos</h2>
                <p>Após a confirmação do pagamento, o pedido será separado, embalado e preparado para envio.</p>

                <h2>Envio</h2>
                <p>Os pedidos são enviados através da USPS (United States Postal Service).</p>

                <h2>Rastreamento</h2>
                <p>Após a postagem, a cliente receberá o código de rastreamento para acompanhamento da entrega.</p>

                <h2>Entrega</h2>
                <p>O prazo de entrega varia de acordo com a localidade de destino e os prazos da transportadora.</p>

                <h2>Informações de Endereço</h2>
                <p>É responsabilidade da cliente fornecer corretamente os dados de entrega.</p>
                <p>Caso o pedido seja devolvido por endereço incorreto ou incompleto, poderá ser necessário o pagamento de um novo frete para reenvio.</p>
              </PolicySection>

              <PolicySection title="Política de Trocas">
                <p>Na Virtuosa USA, queremos que você tenha uma excelente experiência de compra. Caso seja necessário realizar uma troca, siga as orientações abaixo.</p>

                <h2>Prazo para Solicitação</h2>
                <p>A solicitação de troca deve ser realizada em até 7 dias corridos após o recebimento do pedido.</p>

                <h2>Como Solicitar uma Troca</h2>
                <p>Para iniciar o processo, entre em contato com nossa equipe através do WhatsApp:</p>
                <p>
                  <Link href="https://wa.me/17742043628" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#4F2107] underline underline-offset-4">
                    +1 (774) 204-3628
                  </Link>
                </p>
                <p>Informe:</p>
                <ul>
                  <li>Nome completo;</li>
                  <li>Número do pedido;</li>
                  <li>Produto que deseja trocar;</li>
                  <li>Motivo da solicitação.</li>
                </ul>
                <p>Após o recebimento da solicitação, nossa equipe realizará a análise e retornará em até 7 dias corridos com as orientações para continuidade do processo.</p>

                <h2>Condições para Aprovação</h2>
                <p>Para ser elegível à troca, o produto deverá:</p>
                <ul>
                  <li>Estar sem sinais de uso;</li>
                  <li>Estar sem manchas, odores ou alterações;</li>
                  <li>Possuir etiquetas originais;</li>
                  <li>Ser enviado nas mesmas condições em que foi recebido.</li>
                </ul>
                <p>Produtos que não atenderem a essas condições poderão ter a solicitação recusada.</p>

                <h2>Frete da Troca</h2>
                <p>O custo do envio da peça para troca é de responsabilidade da cliente.</p>
                <p>Em casos de defeito de fabricação ou erro no envio do pedido, a Virtuosa USA assumirá os custos necessários para a correção da ocorrência.</p>

                <h2>Produtos Não Elegíveis</h2>
                <p>Não aceitamos trocas de:</p>
                <ul>
                  <li>Produtos em promoção ou liquidação;</li>
                  <li>Últimas unidades adquiridas em lives;</li>
                  <li>Produtos com sinais de uso;</li>
                  <li>Produtos sem etiqueta original.</li>
                </ul>

                <h2>Opções Disponíveis</h2>
                <p>Após o recebimento e aprovação do produto enviado, a cliente poderá optar por:</p>
                <ul>
                  <li>Troca por outro tamanho do mesmo produto, quando disponível;</li>
                  <li>Troca por outro produto disponível na loja;</li>
                  <li>Crédito em loja correspondente ao valor pago pelo produto.</li>
                </ul>

                <h2>Crédito em Loja</h2>
                <p>Caso não haja disponibilidade do tamanho ou produto desejado, será disponibilizado crédito em loja correspondente ao valor pago pelo item enviado.</p>
                <p>O crédito poderá ser utilizado em futuras compras na Virtuosa USA.</p>
              </PolicySection>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="policy-content">
      <h2 className="mb-5 font-serif text-[#2A1712]" style={{ fontSize: "clamp(1.8rem, 3vw, 2.45rem)", lineHeight: 1.12 }}>
        {title}
      </h2>
      <div className="space-y-4 font-sans text-[14px] leading-relaxed text-[#5F4537]">
        {children}
      </div>
    </section>
  );
}
