import type { LegalContent } from './types';

export const PRIVACY_CONTENT: LegalContent = {
  title: 'Privacy Policy',
  updated: 'Last updated: 5 October 2026',
  icon: 'shield-checkmark-outline',
  highlights: [
    'We never sell your personal information.',
    'Location is only used to work out your district, not to track your movements.',
    'Your listing details, photos and contact number are visible to other users.',
    'We do not collect any payment details.',
    'Delete your account at any time and your listings and data are permanently removed.',
  ],
  sections: [
    {
      title: 'Information We Collect',
      icon: 'information-circle-outline',
      blocks: [
        'When you use our marketplace platform, we may collect information that you provide when creating an account, creating a listing, or using the features of the app.',
        {
          list: [
            'Account details: your name, email address, and optionally your phone number and district.',
            'Listing details: material descriptions, prices, quantities, locality, and photos that you choose to upload.',
            'The contact phone number you enter on a listing, so buyers can reach you.',
          ],
        },
      ],
    },
    {
      title: 'Location Information',
      icon: 'location-outline',
      blocks: [
        'With your permission, the app may access your device location to identify your approximate district or locality in Tamil Nadu. This helps us show relevant leftover and surplus material listings from your district.',
        'We use location information for marketplace discovery and do not intend to continuously track your movements. You can manage or revoke location permission through your device settings.',
      ],
    },
    {
      title: 'Listings and Photos',
      icon: 'images-outline',
      blocks: [
        'Users can create listings for leftover, surplus, reused, or available home and construction materials.',
        'You may optionally upload photos of the material when creating a listing. Listing information and uploaded photos may be visible to other users of the marketplace.',
        { note: 'Please avoid uploading photos containing sensitive personal information, identity documents, financial information, or other information that you do not want to make available to other users.' },
      ],
    },
    {
      title: 'How We Use Your Information',
      icon: 'construct-outline',
      blocks: [
        'We use the information we collect to operate and improve the marketplace, including:',
        {
          list: [
            'Showing relevant material listings based on your district.',
            'Allowing users to create and manage material listings.',
            'Displaying listing information and photos to other users.',
            'Helping buyers and sellers contact each other directly.',
            'Sending you verification and password-reset codes by email.',
            'Maintaining the security and functionality of the app.',
            'Improving the user experience and marketplace features.',
          ],
        },
      ],
    },
    {
      title: 'Phone and WhatsApp Communication',
      icon: 'logo-whatsapp',
      blocks: [
        'The app does not currently provide an internal chat or messaging system.',
        "Signed-in users may contact sellers directly using the phone or WhatsApp options available on a listing. The seller's contact number is shown only to signed-in users, and it is the number the seller entered for that listing.",
        "When you choose to call or contact someone through WhatsApp, the communication takes place through the relevant service and may be subject to that service's own privacy policy and terms.",
      ],
    },
    {
      title: 'Payments and Transactions',
      icon: 'card-outline',
      blocks: [
        'The app currently does not process payments or financial transactions.',
        'We do not collect payment card information, bank account information, or other payment details through the marketplace.',
        'Any purchase, price negotiation, payment, delivery, or other transaction between buyers and sellers is arranged directly between those users. The app currently does not act as a payment processor or transaction intermediary.',
      ],
    },
    {
      title: 'Sharing of Information',
      icon: 'people-outline',
      blocks: [
        'We do not sell your personal information to third parties.',
        'Information that you choose to publish through a listing, including material details, photos and the contact number you enter, may be visible to other marketplace users.',
        'We may disclose information when required by applicable law, legal process, or a valid request from a government or law-enforcement authority.',
      ],
    },
    {
      title: 'Data Security',
      icon: 'lock-closed-outline',
      blocks: [
        'We take reasonable measures to protect information associated with your account and listings.',
        'However, no internet-based service can guarantee complete security. Please avoid posting sensitive or confidential information in your profile, listings, photos, or other publicly visible content.',
      ],
    },
    {
      title: 'Account and Data Deletion',
      icon: 'trash-outline',
      blocks: [
        'You can delete your account at any time from the account settings available in the app if you no longer wish to use the marketplace.',
        'When you delete your account, your account information and all listings created by you will be permanently deleted from our database. This includes the listing details, uploaded photos, and other information associated with your listings.',
        { note: 'Account deletion and listing deletion are permanent and cannot be undone. Your deleted listings will no longer be available to other marketplace users.' },
        'Some information may be retained only where required by applicable law or where necessary for legitimate security or legal purposes.',
      ],
    },
    {
      title: 'Listing Deletion',
      icon: 'trash-bin-outline',
      blocks: [
        'Sellers can delete their listings at any time. When a listing is deleted, the listing and its associated photos and information are permanently removed from our database and will no longer be visible to other users.',
        'Deleted listings cannot be restored.',
      ],
    },
    {
      title: 'Third-Party Services',
      icon: 'server-outline',
      blocks: [
        'The app may use third-party services for functions such as authentication, hosting, storage, communication, email delivery, or other technical infrastructure.',
        'These services may process information as necessary to provide their respective services and may have their own privacy policies and terms.',
      ],
    },
    {
      title: "Children's Privacy",
      icon: 'happy-outline',
      blocks: [
        'This app is intended for general marketplace use and is not specifically directed toward children.',
        'We do not knowingly collect personal information from children in violation of applicable laws.',
      ],
    },
    {
      title: 'Changes to This Privacy Policy',
      icon: 'refresh-outline',
      blocks: [
        "We may update this Privacy Policy when the app's features, services, or applicable legal requirements change.",
        'When changes are made, we will update the "Last updated" date shown at the beginning of this policy.',
      ],
    },
    {
      title: 'Contact Us',
      icon: 'mail-outline',
      blocks: [
        'If you have questions, concerns, or requests regarding this Privacy Policy or your personal information, please contact us using the support contact provided in the app or the relevant app-store listing.',
      ],
    },
  ],
  footer:
    'This Privacy Policy describes the current features and data practices of the application and may be updated as new features are introduced.',
};
