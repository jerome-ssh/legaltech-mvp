// Comprehensive dropdown data for the client intake form

// Title options
export const titleOptions = [
  { value: 'Mr', label: 'Mr.' },
  { value: 'Mrs', label: 'Mrs.' },
  { value: 'Ms', label: 'Ms.' },
  { value: 'Dr', label: 'Dr.' },
  { value: 'Prof', label: 'Prof.' },
  { value: 'Judge', label: 'Judge' },
  { value: 'Justice', label: 'Justice' },
  { value: 'Atty', label: 'Atty.' },
  { value: 'Hon', label: 'Hon.' },
  { value: 'Rev', label: 'Rev.' },
  { value: 'Capt', label: 'Capt.' },
  { value: 'Col', label: 'Col.' },
  { value: 'Gen', label: 'Gen.' },
  { value: 'Other', label: 'Other' }
];

// Client type options (expanded)
export const clientTypeOptions = [
  { value: 'Individual', label: 'Individual' },
  { value: 'Corporation', label: 'Corporation' },
  { value: 'LLC', label: 'Limited Liability Company (LLC)' },
  { value: 'Partnership', label: 'Partnership' },
  { value: 'LLP', label: 'Limited Liability Partnership (LLP)' },
  { value: 'Trust', label: 'Trust' },
  { value: 'Estate', label: 'Estate' },
  { value: 'Government', label: 'Government Agency' },
  { value: 'NonProfit', label: 'Non-Profit Organization' },
  { value: 'NGO', label: 'Non-Governmental Organization (NGO)' },
  { value: 'Joint_Venture', label: 'Joint Venture' },
  { value: 'Sole_Proprietorship', label: 'Sole Proprietorship' },
  { value: 'Association', label: 'Association' },
  { value: 'Foundation', label: 'Foundation' },
  { value: 'Charity', label: 'Charity' },
  { value: 'Educational', label: 'Educational Institution' },
  { value: 'Religious', label: 'Religious Organization' },
  { value: 'Cooperative', label: 'Cooperative' },
  { value: 'Public_Company', label: 'Public Company' },
  { value: 'Private_Company', label: 'Private Company' },
  { value: 'Union', label: 'Union' },
  { value: 'Other', label: 'Other' }
];

// Language options (ISO 639-1 codes with English names)
export const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ru', label: 'Russian' },
  { value: 'zh', label: 'Chinese (Mandarin)' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' },
  { value: 'bn', label: 'Bengali' },
  { value: 'pa', label: 'Punjabi' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
  { value: 'ml', label: 'Malayalam' },
  { value: 'th', label: 'Thai' },
  { value: 'vi', label: 'Vietnamese' },
  { value: 'id', label: 'Indonesian' },
  { value: 'ms', label: 'Malay' },
  { value: 'tr', label: 'Turkish' },
  { value: 'nl', label: 'Dutch' },
  { value: 'sv', label: 'Swedish' },
  { value: 'no', label: 'Norwegian' },
  { value: 'da', label: 'Danish' },
  { value: 'fi', label: 'Finnish' },
  { value: 'pl', label: 'Polish' },
  { value: 'cs', label: 'Czech' },
  { value: 'sk', label: 'Slovak' },
  { value: 'hu', label: 'Hungarian' },
  { value: 'ro', label: 'Romanian' },
  { value: 'bg', label: 'Bulgarian' },
  { value: 'el', label: 'Greek' },
  { value: 'he', label: 'Hebrew' },
  { value: 'ur', label: 'Urdu' },
  { value: 'fa', label: 'Persian' },
  { value: 'am', label: 'Amharic' },
  { value: 'sw', label: 'Swahili' },
  { value: 'so', label: 'Somali' },
  { value: 'ha', label: 'Hausa' },
  { value: 'yo', label: 'Yoruba' },
  { value: 'ig', label: 'Igbo' },
  { value: 'af', label: 'Afrikaans' },
  { value: 'zu', label: 'Zulu' },
  { value: 'xh', label: 'Xhosa' },
  { value: 'uk', label: 'Ukrainian' },
  { value: 'be', label: 'Belarusian' },
  { value: 'sr', label: 'Serbian' },
  { value: 'hr', label: 'Croatian' }
];

// Matter types and their sub-types
export const matterTypes = [
  {
    value: 'Corporate',
    label: 'Corporate Law',
    subTypes: [
      { value: 'Formation', label: 'Business Formation' },
      { value: 'Mergers', label: 'Mergers & Acquisitions' },
      { value: 'Corporate_Governance', label: 'Corporate Governance' },
      { value: 'Securities', label: 'Securities Compliance' },
      { value: 'Corporate_Finance', label: 'Corporate Finance' },
      { value: 'Restructuring', label: 'Corporate Restructuring' },
      { value: 'Joint_Ventures', label: 'Joint Ventures' },
      { value: 'Shareholder_Disputes', label: 'Shareholder Disputes' },
      { value: 'Corporate_Dissolution', label: 'Corporate Dissolution' }
    ]
  },
  {
    value: 'Contracts',
    label: 'Contract Law',
    subTypes: [
      { value: 'Drafting', label: 'Contract Drafting' },
      { value: 'Review', label: 'Contract Review' },
      { value: 'Negotiation', label: 'Contract Negotiation' },
      { value: 'Breach', label: 'Breach of Contract' },
      { value: 'Commercial_Agreements', label: 'Commercial Agreements' },
      { value: 'Licensing', label: 'Licensing Agreements' },
      { value: 'Distribution', label: 'Distribution Agreements' },
      { value: 'Service_Agreements', label: 'Service Agreements' },
      { value: 'Employment_Contracts', label: 'Employment Contracts' }
    ]
  },
  {
    value: 'Litigation',
    label: 'Litigation',
    subTypes: [
      { value: 'Civil_Litigation', label: 'Civil Litigation' },
      { value: 'Commercial_Litigation', label: 'Commercial Litigation' },
      { value: 'Class_Action', label: 'Class Action' },
      { value: 'Appellate', label: 'Appellate Practice' },
      { value: 'Alternative_Dispute', label: 'Alternative Dispute Resolution' },
      { value: 'Arbitration', label: 'Arbitration' },
      { value: 'Mediation', label: 'Mediation' },
      { value: 'Injunctions', label: 'Injunctions' },
      { value: 'Judgement_Enforcement', label: 'Judgment Enforcement' }
    ]
  },
  {
    value: 'RealEstate',
    label: 'Real Estate Law',
    subTypes: [
      { value: 'Property_Acquisition', label: 'Property Acquisition' },
      { value: 'Leasing', label: 'Leasing' },
      { value: 'Development', label: 'Development' },
      { value: 'Zoning', label: 'Zoning & Land Use' },
      { value: 'Construction', label: 'Construction' },
      { value: 'Foreclosure', label: 'Foreclosure' },
      { value: 'Title_Issues', label: 'Title Issues' },
      { value: 'Property_Management', label: 'Property Management' },
      { value: 'Real_Estate_Finance', label: 'Real Estate Finance' }
    ]
  },
  {
    value: 'IP',
    label: 'Intellectual Property',
    subTypes: [
      { value: 'Patent', label: 'Patent' },
      { value: 'Trademark', label: 'Trademark' },
      { value: 'Copyright', label: 'Copyright' },
      { value: 'Trade_Secret', label: 'Trade Secret' },
      { value: 'IP_Licensing', label: 'IP Licensing' },
      { value: 'IP_Litigation', label: 'IP Litigation' },
      { value: 'IP_Portfolio_Management', label: 'IP Portfolio Management' },
      { value: 'IP_Due_Diligence', label: 'IP Due Diligence' },
      { value: 'Domain_Disputes', label: 'Domain Name Disputes' }
    ]
  },
  {
    value: 'Employment',
    label: 'Employment Law',
    subTypes: [
      { value: 'Discrimination', label: 'Discrimination' },
      { value: 'Harassment', label: 'Harassment' },
      { value: 'Wrongful_Termination', label: 'Wrongful Termination' },
      { value: 'Employment_Contracts', label: 'Employment Contracts' },
      { value: 'Labor_Relations', label: 'Labor Relations' },
      { value: 'Benefits', label: 'Employee Benefits' },
      { value: 'EEOC', label: 'EEOC Compliance' },
      { value: 'Workplace_Safety', label: 'Workplace Safety' },
      { value: 'Employment_Policy', label: 'Employment Policy Development' }
    ]
  },
  {
    value: 'Tax',
    label: 'Tax Law',
    subTypes: [
      { value: 'Corporate_Tax', label: 'Corporate Tax' },
      { value: 'Individual_Tax', label: 'Individual Tax' },
      { value: 'International_Tax', label: 'International Tax' },
      { value: 'Tax_Planning', label: 'Tax Planning' },
      { value: 'Tax_Litigation', label: 'Tax Litigation' },
      { value: 'State_Local_Tax', label: 'State & Local Tax' },
      { value: 'Tax_Exempt', label: 'Tax-Exempt Organizations' },
      { value: 'Estate_Tax', label: 'Estate Tax Planning' },
      { value: 'Sales_Tax', label: 'Sales & Use Tax' }
    ]
  },
  {
    value: 'Immigration',
    label: 'Immigration Law',
    subTypes: [
      { value: 'Business_Immigration', label: 'Business Immigration' },
      { value: 'Family_Immigration', label: 'Family Immigration' },
      { value: 'Asylum', label: 'Asylum' },
      { value: 'Deportation_Defense', label: 'Deportation Defense' },
      { value: 'Citizenship', label: 'Citizenship & Naturalization' },
      { value: 'Visa_Applications', label: 'Visa Applications' },
      { value: 'Green_Cards', label: 'Green Cards' },
      { value: 'Immigration_Appeals', label: 'Immigration Appeals' },
      { value: 'Immigration_Compliance', label: 'Immigration Compliance' }
    ]
  },
  {
    value: 'Environmental',
    label: 'Environmental Law',
    subTypes: [
      { value: 'Compliance', label: 'Environmental Compliance' },
      { value: 'Permitting', label: 'Environmental Permitting' },
      { value: 'Litigation', label: 'Environmental Litigation' },
      { value: 'Due_Diligence', label: 'Environmental Due Diligence' },
      { value: 'Remediation', label: 'Remediation' },
      { value: 'Climate_Change', label: 'Climate Change' },
      { value: 'Natural_Resources', label: 'Natural Resources' },
      { value: 'Waste_Management', label: 'Waste Management' },
      { value: 'Water_Rights', label: 'Water Rights' }
    ]
  },
  {
    value: 'Family',
    label: 'Family Law',
    subTypes: [
      { value: 'Divorce', label: 'Divorce' },
      { value: 'Child_Custody', label: 'Child Custody' },
      { value: 'Child_Support', label: 'Child Support' },
      { value: 'Alimony', label: 'Alimony' },
      { value: 'Prenuptial', label: 'Prenuptial Agreements' },
      { value: 'Adoption', label: 'Adoption' },
      { value: 'Guardianship', label: 'Guardianship' },
      { value: 'Domestic_Violence', label: 'Domestic Violence' },
      { value: 'Paternity', label: 'Paternity' }
    ]
  },
  {
    value: 'Criminal',
    label: 'Criminal Law',
    subTypes: [
      { value: 'Criminal_Defense', label: 'Criminal Defense' },
      { value: 'White_Collar', label: 'White Collar Crime' },
      { value: 'Drug_Offenses', label: 'Drug Offenses' },
      { value: 'DUI', label: 'DUI/DWI' },
      { value: 'Felonies', label: 'Felonies' },
      { value: 'Misdemeanors', label: 'Misdemeanors' },
      { value: 'Juvenile', label: 'Juvenile Crime' },
      { value: 'Appeals', label: 'Criminal Appeals' },
      { value: 'Expungement', label: 'Expungement' }
    ]
  },
  {
    value: 'Estate',
    label: 'Estate Planning & Probate',
    subTypes: [
      { value: 'Wills', label: 'Wills' },
      { value: 'Trusts', label: 'Trusts' },
      { value: 'Probate_Admin', label: 'Probate Administration' },
      { value: 'Estate_Admin', label: 'Estate Administration' },
      { value: 'Elder_Law', label: 'Elder Law' },
      { value: 'Powers_Attorney', label: 'Powers of Attorney' },
      { value: 'Healthcare_Directives', label: 'Healthcare Directives' },
      { value: 'Estate_Litigation', label: 'Estate Litigation' },
      { value: 'Guardianship', label: 'Guardianship' }
    ]
  },
  {
    value: 'BankruptcyInsolvency',
    label: 'Bankruptcy & Insolvency',
    subTypes: [
      { value: 'Chapter_7', label: 'Chapter 7 Bankruptcy' },
      { value: 'Chapter_11', label: 'Chapter 11 Bankruptcy' },
      { value: 'Chapter_13', label: 'Chapter 13 Bankruptcy' },
      { value: 'Creditor_Rights', label: 'Creditor Rights' },
      { value: 'Restructuring', label: 'Restructuring' },
      { value: 'Insolvency_Proceedings', label: 'Insolvency Proceedings' },
      { value: 'Liquidation', label: 'Liquidation' },
      { value: 'Bankruptcy_Litigation', label: 'Bankruptcy Litigation' },
      { value: 'Foreclosure_Defense', label: 'Foreclosure Defense' }
    ]
  },
  {
    value: 'HealthcareMedical',
    label: 'Healthcare & Medical',
    subTypes: [
      { value: 'Regulatory_Compliance', label: 'Regulatory Compliance' },
      { value: 'Medical_Malpractice', label: 'Medical Malpractice' },
      { value: 'Healthcare_Transactions', label: 'Healthcare Transactions' },
      { value: 'HIPAA', label: 'HIPAA Compliance' },
      { value: 'Provider_Issues', label: 'Provider Issues' },
      { value: 'Insurance_Coverage', label: 'Insurance Coverage' },
      { value: 'Clinical_Research', label: 'Clinical Research' },
      { value: 'Healthcare_Licensing', label: 'Healthcare Licensing' },
      { value: 'FDA_Matters', label: 'FDA Matters' }
    ]
  },
  {
    value: 'TechnologyData',
    label: 'Technology & Data Privacy',
    subTypes: [
      { value: 'Data_Privacy', label: 'Data Privacy' },
      { value: 'Cybersecurity', label: 'Cybersecurity' },
      { value: 'Technology_Transactions', label: 'Technology Transactions' },
      { value: 'Software_Licensing', label: 'Software Licensing' },
      { value: 'Technology_Development', label: 'Technology Development' },
      { value: 'E-Commerce', label: 'E-Commerce' },
      { value: 'Blockchain', label: 'Blockchain & Cryptocurrency' },
      { value: 'Cloud_Computing', label: 'Cloud Computing' },
      { value: 'Digital_Media', label: 'Digital Media & Entertainment' }
    ]
  },
  {
    value: 'International',
    label: 'International Law',
    subTypes: [
      { value: 'International_Trade', label: 'International Trade' },
      { value: 'International_Contracts', label: 'International Contracts' },
      { value: 'Foreign_Investment', label: 'Foreign Investment' },
      { value: 'International_Arbitration', label: 'International Arbitration' },
      { value: 'International_Dispute', label: 'International Dispute Resolution' },
      { value: 'Sanctions_Compliance', label: 'Sanctions Compliance' },
      { value: 'Export_Controls', label: 'Export Controls' },
      { value: 'Foreign_Corrupt_Practices', label: 'Foreign Corrupt Practices Act' },
      { value: 'International_IP', label: 'International IP Protection' }
    ]
  },
  {
    value: 'PersonalInjury',
    label: 'Personal Injury',
    subTypes: [
      { value: 'Auto_Accidents', label: 'Auto Accidents' },
      { value: 'Slip_Fall', label: 'Slip and Fall' },
      { value: 'Medical_Malpractice', label: 'Medical Malpractice' },
      { value: 'Product_Liability', label: 'Product Liability' },
      { value: 'Wrongful_Death', label: 'Wrongful Death' },
      { value: 'Workplace_Injuries', label: 'Workplace Injuries' },
      { value: 'Premises_Liability', label: 'Premises Liability' },
      { value: 'Assault_Battery', label: 'Assault & Battery' },
      { value: 'Catastrophic_Injuries', label: 'Catastrophic Injuries' }
    ]
  },
  {
    value: 'Entertainment',
    label: 'Entertainment & Media Law',
    subTypes: [
      { value: 'Entertainment_Contracts', label: 'Entertainment Contracts' },
      { value: 'Film_Television', label: 'Film & Television' },
      { value: 'Music', label: 'Music' },
      { value: 'Digital_Media', label: 'Digital Media' },
      { value: 'Publishing', label: 'Publishing' },
      { value: 'Sports_Law', label: 'Sports Law' },
      { value: 'Gaming', label: 'Gaming' },
      { value: 'Talent_Representation', label: 'Talent Representation' },
      { value: 'Entertainment_Litigation', label: 'Entertainment Litigation' }
    ]
  },
  {
    value: 'AdministrativeRegulatory',
    label: 'Administrative & Regulatory',
    subTypes: [
      { value: 'Administrative_Proceedings', label: 'Administrative Proceedings' },
      { value: 'Regulatory_Compliance', label: 'Regulatory Compliance' },
      { value: 'Regulatory_Investigations', label: 'Regulatory Investigations' },
      { value: 'Licensing', label: 'Licensing' },
      { value: 'Administrative_Appeals', label: 'Administrative Appeals' },
      { value: 'Government_Relations', label: 'Government Relations' },
      { value: 'Lobbying', label: 'Lobbying' },
      { value: 'Administrative_Hearings', label: 'Administrative Hearings' },
      { value: 'Agency_Rulemaking', label: 'Agency Rulemaking' }
    ]
  }
];

// Currency options with ISO 4217 codes
export const currencyOptions = [
  { value: 'USD', label: 'USD - US Dollar ($)' },
  { value: 'EUR', label: 'EUR - Euro (€)' },
  { value: 'GBP', label: 'GBP - British Pound (£)' },
  { value: 'JPY', label: 'JPY - Japanese Yen (¥)' },
  { value: 'AUD', label: 'AUD - Australian Dollar (A$)' },
  { value: 'CAD', label: 'CAD - Canadian Dollar (C$)' },
  { value: 'CHF', label: 'CHF - Swiss Franc (Fr)' },
  { value: 'CNY', label: 'CNY - Chinese Yuan (¥)' },
  { value: 'HKD', label: 'HKD - Hong Kong Dollar (HK$)' },
  { value: 'NZD', label: 'NZD - New Zealand Dollar (NZ$)' },
  { value: 'SEK', label: 'SEK - Swedish Krona (kr)' },
  { value: 'KRW', label: 'KRW - South Korean Won (₩)' },
  { value: 'SGD', label: 'SGD - Singapore Dollar (S$)' },
  { value: 'NOK', label: 'NOK - Norwegian Krone (kr)' },
  { value: 'MXN', label: 'MXN - Mexican Peso ($)' },
  { value: 'INR', label: 'INR - Indian Rupee (₹)' },
  { value: 'RUB', label: 'RUB - Russian Ruble (₽)' },
  { value: 'ZAR', label: 'ZAR - South African Rand (R)' },
  { value: 'TRY', label: 'TRY - Turkish Lira (₺)' },
  { value: 'BRL', label: 'BRL - Brazilian Real (R$)' },
  { value: 'PLN', label: 'PLN - Polish Złoty (zł)' },
  { value: 'PHP', label: 'PHP - Philippine Peso (₱)' },
  { value: 'THB', label: 'THB - Thai Baht (฿)' },
  { value: 'IDR', label: 'IDR - Indonesian Rupiah (Rp)' },
  { value: 'TWD', label: 'TWD - New Taiwan Dollar (NT$)' },
  { value: 'CZK', label: 'CZK - Czech Koruna (Kč)' },
  { value: 'AED', label: 'AED - UAE Dirham (د.إ)' },
  { value: 'DKK', label: 'DKK - Danish Krone (kr)' },
  { value: 'HUF', label: 'HUF - Hungarian Forint (Ft)' },
  { value: 'CLP', label: 'CLP - Chilean Peso ($)' },
  { value: 'ILS', label: 'ILS - Israeli New Shekel (₪)' },
  { value: 'ARS', label: 'ARS - Argentine Peso ($)' },
  { value: 'SAR', label: 'SAR - Saudi Riyal (﷼)' },
  { value: 'MYR', label: 'MYR - Malaysian Ringgit (RM)' },
  { value: 'COP', label: 'COP - Colombian Peso ($)' },
  { value: 'NGN', label: 'NGN - Nigerian Naira (₦)' },
  { value: 'PKR', label: 'PKR - Pakistani Rupee (₨)' },
  { value: 'EGP', label: 'EGP - Egyptian Pound (£)' },
  { value: 'KES', label: 'KES - Kenyan Shilling (KSh)' },
  { value: 'QAR', label: 'QAR - Qatari Rial (﷼)' },
  { value: 'RON', label: 'RON - Romanian Leu (lei)' },
  { value: 'PEN', label: 'PEN - Peruvian Sol (S/)' },
  { value: 'VND', label: 'VND - Vietnamese Dong (₫)' },
  { value: 'BHD', label: 'BHD - Bahraini Dinar (.د.ب)' },
  { value: 'BGN', label: 'BGN - Bulgarian Lev (лв)' },
  { value: 'HRK', label: 'HRK - Croatian Kuna (kn)' },
  { value: 'MAD', label: 'MAD - Moroccan Dirham (د.م.)' },
  { value: 'ISK', label: 'ISK - Icelandic Króna (kr)' },
  { value: 'JMD', label: 'JMD - Jamaican Dollar (J$)' },
  { value: 'KWD', label: 'KWD - Kuwaiti Dinar (د.ك)' }
];

// Billing method options
export const billingMethodOptions = [
  { value: 'Hourly', label: 'Hourly Rate' },
  { value: 'Flat Fee', label: 'Flat Fee' },
  { value: 'Contingency', label: 'Contingency' },
  { value: 'Retainer', label: 'Retainer' },
  { value: 'Pro Bono', label: 'Pro Bono' },
  { value: 'Other', label: 'Other' }
];
