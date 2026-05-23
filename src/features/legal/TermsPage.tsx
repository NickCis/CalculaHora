import { useTranslation } from 'react-i18next'
import { LegalPageLayout } from './LegalPageLayout'
import { LegalSection } from './LegalSection'

type LegalSectionContent = {
  title: string
  paragraphs: string[]
}

export function TermsPage() {
  const { t } = useTranslation()
  const sections = t('legal.terms.sections', {
    returnObjects: true,
  }) as LegalSectionContent[]

  return (
    <LegalPageLayout
      title={t('legal.terms.title')}
      lastUpdated={t('legal.terms.lastUpdated')}
    >
      {sections.map((section) => (
        <LegalSection
          key={section.title}
          title={section.title}
          paragraphs={section.paragraphs}
        />
      ))}
    </LegalPageLayout>
  )
}
