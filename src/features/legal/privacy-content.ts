import type { LegalContent } from './types';

export const PRIVACY_CONTENT: LegalContent = {
  title: 'Privacy Policy',
  updated: 'Last updated: 7 October 2026',
  icon: 'shield-checkmark-outline',
  highlights: [
    'We never sell your personal information.',
    'Location is used only to work out your district. It is matched on your phone and your exact coordinates are never sent to us or stored.',
    'Your listing details, photos and contact number are visible to other users; your contact number is shown to signed-in users only.',
    'We do not collect any payment details.',
    'Deleting a listing removes it from the app straight away, but we may keep a hidden copy for analysis and safety.',
    'Deleting your account permanently erases your profile, listings, photos and activity.',
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
            'Your favorites: the listings you save. These are private to you.',
            'Reports: if you report a listing, the reason, any details you write, and the account that sent the report.',
            'Listing views: a count of how many different people opened a listing (see "Listing Views" below).',
            'Information stored on your device: your selected district and a random device identifier (see "Information Stored on Your Device" below).',
          ],
        },
      ],
    },
    {
      title: 'Location Information',
      icon: 'location-outline',
      blocks: [
        'With your permission, the app may access your device location to identify your district in Tamil Nadu, so we can show relevant leftover and surplus material listings from your area.',
        'We ask for location when you first browse the app without a saved district, when you tap "Use my current location" (for example in the district picker, on sign-up, in your profile, or when posting a listing), and, if your district was previously detected from your location, we may quietly check it again when you open the app so it stays current. We only use approximate, foreground location while the app is open.',
        'Your coordinates are matched against district boundaries on your phone. The exact coordinates are not sent to our servers or to any third-party location service, and they are not stored. Only the resulting district name is kept, on your device and, if you choose to save it in your profile or a listing, in your account.',
        'If you decline permission, or location is turned off, you can simply pick your district yourself or browse all of Tamil Nadu. You can change or revoke location permission at any time in your device settings.',
      ],
    },
    {
      title: 'Information Stored on Your Device',
      icon: 'phone-portrait-outline',
      blocks: [
        'The app saves a few things in your phone\'s secure storage so it works smoothly the next time you open it:',
        {
          list: [
            'The district you last used (picked by you, detected from your location, or taken from your profile), so you do not have to choose it every time.',
            'A random identifier generated for your installation. It is not linked to your name, phone number or advertising ID, and it is used only to avoid counting the same device more than once on a listing\'s view count.',
          ],
        },
        'This information stays on your device until you clear the app data or uninstall the app.',
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
            'Showing sellers how many people viewed their listings.',
            'Reviewing reports and keeping the marketplace safe from fraud, spam and misuse.',
            'Sending you verification and password-reset codes by email.',
            'Maintaining the security and functionality of the app.',
            'Understanding how the marketplace is used, so we can improve it.',
          ],
        },
      ],
    },
    {
      title: 'Listing Views',
      icon: 'eye-outline',
      blocks: [
        'Sellers can see how many different people have viewed each of their listings. Each person is counted once per listing, however many times they open it.',
        'To do this, we record that a signed-in account, or for guests a random device identifier, has opened a listing. Sellers only see the total number. They cannot see who viewed their listing, and your own views of your own listings are not counted.',
      ],
    },
    {
      title: 'Reporting Listings',
      icon: 'flag-outline',
      blocks: [
        'Signed-in users can report a listing they believe is fraudulent, misleading, prohibited or otherwise inappropriate.',
        'When you report a listing, we store the listing, the reason you chose, any details you add, the time, and the account that sent the report. We use this only to review the listing and keep the marketplace safe.',
        'Reports are confidential. The seller is not told who reported their listing. Reports are visible only to people who review them for us, and to you, so the app can show that you have already reported a listing.',
        'We may keep reports for as long as needed for safety, fraud prevention and legal purposes. If you delete your account, reports you made are deleted with it.',
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
        'When you delete your account, we permanently delete your profile and account information, all listings created by you (including listings you had previously deleted), the photos you uploaded, your favorites, your reports, and the view and activity records connected to your account and listings. Your photos are removed from our storage as part of this.',
        { note: 'Account deletion is permanent and cannot be undone. Your listings will no longer be available to other marketplace users.' },
        'Some information may be retained only where required by applicable law or where necessary for legitimate security or legal purposes.',
      ],
    },
    {
      title: 'Listing Deletion',
      icon: 'trash-bin-outline',
      blocks: [
        'Sellers can delete their listings at any time. When you delete a listing, it is removed from the app immediately and is no longer visible to you or to other users.',
        'To help us understand how the marketplace is used and to protect against fraud and abuse, we may keep a hidden copy of a deleted listing, including its details and photos, in our systems. This copy is not shown to anyone in the app and cannot be restored by you.',
        'This hidden copy is permanently erased if you delete your account.',
      ],
    },
    {
      title: 'Third-Party Services',
      icon: 'server-outline',
      blocks: [
        'The app may use third-party services for functions such as authentication, hosting, storage, communication, email delivery, or other technical infrastructure. Your data is stored with our hosting and database provider.',
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
