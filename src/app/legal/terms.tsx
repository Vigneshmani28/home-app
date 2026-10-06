import { LegalDocument } from '@/components/layout/legal-document';
import { TERMS_CONTENT } from '@/features/legal/terms-content';

export default function TermsAndConditionsScreen() {
  return <LegalDocument content={TERMS_CONTENT} />;
}
