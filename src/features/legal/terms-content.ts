import type { LegalContent } from './types';

export const TERMS_CONTENT: LegalContent = {
  title: 'Terms & Conditions',
  updated: 'Last updated: 7 October 2026',
  icon: 'document-text-outline',
  highlights: [
    'We are a marketplace. We do not sell, store, ship or deliver materials ourselves.',
    'Price, payment, pickup and delivery are agreed directly between buyer and seller.',
    'Only list materials you are allowed to sell, with honest details and real photos.',
    'You can report listings that look wrong. We may remove listings or restrict accounts that break these terms.',
    'You can delete your listings or your account at any time. Deleting your account permanently erases your data.',
  ],
  sections: [
    {
      title: 'Acceptance of Terms',
      icon: 'checkmark-done-outline',
      blocks: [
        'By accessing or using this application, you agree to be bound by these Terms & Conditions. If you do not agree with these terms, please do not use the application.',
      ],
    },
    {
      title: 'About the Platform',
      icon: 'storefront-outline',
      blocks: [
        'This application is a marketplace platform that allows users to discover, list, and connect with other users regarding leftover, surplus, reused, and available home and construction materials.',
        'The platform currently operates as a listing and communication service. We do not directly sell, purchase, store, transport, or deliver materials listed by users.',
      ],
    },
    {
      title: 'User Accounts',
      icon: 'person-circle-outline',
      blocks: [
        'You are responsible for providing accurate information when creating your account and for keeping your account information up to date.',
        'You are responsible for activities performed through your account. You should not share your account credentials with other people or allow others to misuse your account.',
      ],
    },
    {
      title: 'Location and District',
      icon: 'location-outline',
      blocks: [
        'The application uses your district to show you relevant listings. You can allow the app to detect your district from your device location, or choose it yourself, and you can change it at any time.',
        'When you post a listing, you are responsible for entering the correct district and locality of the material. How location is used is explained in our Privacy Policy.',
      ],
    },
    {
      title: 'Creating Listings',
      icon: 'create-outline',
      blocks: [
        'Users may create listings for materials that they are legally permitted to sell or give away.',
        'When creating a listing, you agree to provide accurate and reasonably complete information about the material, including its condition, quantity, description, location, and other relevant details.',
        'The price you enter is the total price for the whole quantity you are offering. Photos uploaded to a listing should accurately represent the material being offered.',
      ],
    },
    {
      title: 'Prohibited Listings',
      icon: 'ban-outline',
      blocks: [
        'You must not use the platform to list or promote illegal, stolen, counterfeit, dangerous, hazardous, or otherwise prohibited goods or materials.',
        'You must not use the platform to post content that is fraudulent, misleading, abusive, threatening, defamatory, sexually explicit, or otherwise unlawful.',
        { note: 'We reserve the right to remove listings or restrict accounts that violate these Terms & Conditions or applicable laws.' },
      ],
    },
    {
      title: 'Buying and Selling',
      icon: 'swap-horizontal-outline',
      blocks: [
        'The platform only provides a place for users to discover materials and connect with sellers.',
        'Any agreement regarding the price, condition, quantity, payment, pickup, delivery, or exchange of materials is made directly between the buyer and seller.',
        'We are not a party to transactions between users and do not guarantee that a transaction will be completed.',
      ],
    },
    {
      title: 'Payments',
      icon: 'card-outline',
      blocks: [
        'The application currently does not process payments or financial transactions.',
        'We do not currently collect or process credit card, debit card, bank account, UPI, or other payment information through the marketplace.',
        'Users are responsible for deciding how and when payment is made directly between themselves.',
      ],
    },
    {
      title: 'Communication Between Users',
      icon: 'call-outline',
      blocks: [
        'The application does not currently provide an internal chat system.',
        'Signed-in users may contact sellers directly using the phone or WhatsApp options provided on listings. Sellers\' contact numbers are shown to signed-in users only, and the number is the one the seller enters on the listing.',
        'Users are responsible for their communications and interactions with other users. We recommend exercising appropriate caution when sharing personal information or arranging meetings and transactions.',
      ],
    },
    {
      title: 'User Responsibilities',
      icon: 'shield-checkmark-outline',
      blocks: [
        'You agree to use the application only for lawful purposes and in accordance with these Terms & Conditions.',
        {
          list: [
            'Do not create false or misleading listings.',
            'Do not upload content that you do not have permission to use.',
            'Do not impersonate another person or business.',
            "Do not attempt to access another user's account.",
            'Do not use the platform for fraudulent or illegal activities.',
            'Do not misuse, abuse, or interfere with the operation of the application.',
          ],
        },
      ],
    },
    {
      title: 'Listing Accuracy',
      icon: 'clipboard-outline',
      blocks: [
        'Sellers are solely responsible for the accuracy of their listings, including the description, condition, quantity, photos, price, availability, and location of the material.',
        'We do not independently verify every listing or guarantee the accuracy, quality, condition, authenticity, legality, or availability of materials listed by users.',
      ],
    },
    {
      title: 'Transactions and User Interactions',
      icon: 'alert-circle-outline',
      blocks: [
        'We are not responsible for disputes, losses, damages, fraud, misrepresentation, failed transactions, payment issues, delivery problems, or disagreements between buyers and sellers.',
        { note: 'Always verify the material, seller, price, condition, quantity, and other relevant details yourself before entering into any transaction.' },
      ],
    },
    {
      title: 'Content Ownership',
      icon: 'images-outline',
      blocks: [
        'You retain ownership of the photos, descriptions, and other content that you upload to the platform.',
        'By uploading content, you grant us permission to store, display, and use that content as necessary to operate and provide the marketplace service.',
      ],
    },
    {
      title: 'Listing and Account Removal',
      icon: 'trash-outline',
      blocks: [
        'You can delete your own listings through the available features in the application. A deleted listing is removed from the app immediately and is no longer available to you or to other users. We may keep a hidden copy of it, including its details and photos, for analysis, security and record-keeping purposes, as described in our Privacy Policy.',
        'You can also delete your account if you no longer wish to use the platform. When your account is deleted, your account information, your listings (including previously deleted ones) and their photos, and your related activity are permanently deleted, subject to any information that we may be required to retain by law.',
        { note: 'Deleted accounts cannot be restored, and deleted listings cannot be restored by users.' },
        'We may also remove listings, or suspend or terminate accounts, that violate these Terms & Conditions.',
      ],
    },
    {
      title: 'Reporting and Moderation',
      icon: 'flag-outline',
      blocks: [
        'Signed-in users can report listings that appear fraudulent, misleading, already sold, prohibited, offensive or otherwise in breach of these Terms & Conditions.',
        'Please report only in good faith. Knowingly submitting false or abusive reports, or using reports to harass another user, is a violation of these terms and may lead to restrictions on your account.',
        'We review reports at our discretion. We may remove or hide a listing, ask for changes, or suspend or terminate an account that breaches these terms or applicable law, with or without notice. Reviewing a report does not mean we have verified a listing, and we do not guarantee that we will act on every report or respond to every reporter.',
        'We keep the identity of people who report listings confidential from the sellers concerned.',
      ],
    },
    {
      title: 'Platform Availability',
      icon: 'cloud-outline',
      blocks: [
        'We aim to keep the application available and functional, but we do not guarantee that the service will always be available, uninterrupted, secure, or error-free.',
        'We may temporarily suspend or modify parts of the application for maintenance, security, updates, or other operational reasons.',
      ],
    },
    {
      title: 'Limitation of Responsibility',
      icon: 'scale-outline',
      blocks: [
        'The platform is provided as a marketplace and communication service. We do not guarantee the quality, safety, legality, authenticity, availability, or suitability of materials listed by users.',
        'To the extent permitted by applicable law, we are not responsible for losses or damages arising from transactions, communications, meetings, payments, deliveries, or other interactions between users.',
      ],
    },
    {
      title: 'Changes to These Terms',
      icon: 'refresh-outline',
      blocks: [
        'We may update these Terms & Conditions when the application, services, or applicable legal requirements change.',
        'When significant changes are made, we may update the terms shown within the application and update the "Last updated" date.',
      ],
    },
    {
      title: 'Governing Law',
      icon: 'earth-outline',
      blocks: [
        'These Terms & Conditions are intended to be governed by the applicable laws of India, subject to the jurisdiction of the appropriate courts and authorities.',
      ],
    },
    {
      title: 'Contact Us',
      icon: 'mail-outline',
      blocks: [
        'If you have questions regarding these Terms & Conditions or the operation of the marketplace, please contact us using the support contact provided in the application or the relevant app-store listing.',
      ],
    },
  ],
  footer:
    'These Terms & Conditions describe the current functionality of the application and may be updated as new features and services are introduced.',
};
