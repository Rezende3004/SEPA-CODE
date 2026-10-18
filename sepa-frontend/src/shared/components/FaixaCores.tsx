/**
 * Faixa de identidade do SEPA: azul, laranja, amarelo e branco.
 * Fica no topo dos layouts para tornar a paleta visível em todas as telas.
 */
export function FaixaCores({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`flex h-1.5 w-full ${className}`}>
      <span className="flex-1 bg-primary" />
      <span className="flex-1 bg-secondary" />
      <span className="flex-1 bg-accent" />
      <span className="flex-1 border-x border-line bg-surface" />
    </div>
  );
}
