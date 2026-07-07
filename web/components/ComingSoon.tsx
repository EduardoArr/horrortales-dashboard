export function ComingSoon({ feature }: { feature: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
      <h2 className="text-xl font-medium text-neutral-200">{feature}</h2>
      <p className="max-w-sm text-sm text-neutral-500">
        Próximamente. Esta sección se diseñará en una ronda de trabajo
        separada.
      </p>
    </div>
  );
}
