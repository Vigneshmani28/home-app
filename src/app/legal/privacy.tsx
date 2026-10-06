import { LegalDocument } from '@/components/layout/legal-document';
import { PRIVACY_CONTENT } from '@/features/legal/privacy-content';

export default function PrivacyPolicyScreen() {
  return <LegalDocument content={PRIVACY_CONTENT} />;
}
