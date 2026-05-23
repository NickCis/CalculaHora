import { useTranslation } from 'react-i18next'
import { LegalPageLayout } from './LegalPageLayout'
import { LegalSection } from './LegalSection'

type LegalSectionContent = {
  title: string
  paragraphs: string[]
}

export function PrivacyPage() {
  const { t } = useTranslation()
  const sections = t('legal.privacy.sections', {
    returnObjects: true,
  }) as LegalSectionContent[]

  return (
    <LegalPageLayout
      title={t('legal.privacy.title')}
      lastUpdated={t('legal.privacy.lastUpdated')}
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
