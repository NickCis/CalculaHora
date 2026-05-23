type LegalSectionProps = {
  title: string
  paragraphs: string[]
}

export function LegalSection({ title, paragraphs }: LegalSectionProps) {
  return (
    <section>
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-muted-foreground">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </section>
  )
}
