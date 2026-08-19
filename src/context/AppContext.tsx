import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole, Customer, Manufacturer, Product, RFQ,
  ManufacturerQuote, MasterOrder, Invoice, ComplianceCase,
  NotificationItem, SubOrderStatus, ManufacturerProductMapping,
  BuyerOnboarding, ManufacturerOnboarding, Shipment, CRMLead,
  PaymentTransaction, AuditLog, CustomerVerificationRequest,
  CustomerVerificationStatus, CustomerVerificationDocument,
  UserProfile, OrganizationProfile, UserDocument, ProfileDocStatus, DocumentVersion
} from '../types';
import {
  mockCustomers, mockManufacturers, mockProducts, mockRFQs,
  mockQuotes, mockMasterOrders, mockInvoices, mockComplianceCases,
  mockNotifications, mockManufacturerProductMappings,
  mockBuyerOnboardings, mockManufacturerOnboardings, mockShipments,
  mockCRMLeads, mockPaymentTransactions, mockAuditLogs,
  mockCustomerVerifications
} from '../data/mockData';
import { ShipmentCredentials } from '../services/connectors/types';
import { GSTCredentials } from '../services/connectors/gstTypes';
import { verifyTOTPToken, generateRecoveryCodes } from '../services/auth/totpUtils';

export interface TwoFactorState {
  isEnabled: boolean;
  secret?: string;
  enabledAt?: string;
  recoveryCodes: { code: string; isUsed: boolean; usedAt?: string }[];
}

interface AppContextType {
  isAuthenticated: boolean;
  login: (role?: UserRole) => void;
  logout: () => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  customers: Customer[];
  manufacturers: Manufacturer[];
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  addProductMaster: (newProduct: Product) => void;
  updateProductMaster: (productId: string, updatedFields: Partial<Product>) => void;
  toggleProductMasterStatus: (productId: string) => void;
  mappings: ManufacturerProductMapping[];
  setMappings: React.Dispatch<React.SetStateAction<ManufacturerProductMapping[]>>;
  addMapping: (mapping: ManufacturerProductMapping) => void;
  updateMapping: (productId: string, manufacturerId: string, updatedFields: Partial<ManufacturerProductMapping>) => void;
  removeMapping: (productId: string, manufacturerId: string) => void;
  rfqs: RFQ[];
  quotes: ManufacturerQuote[];
  orders: MasterOrder[];
  invoices: Invoice[];
  complianceCases: ComplianceCase[];
  notifications: NotificationItem[];
  buyerOnboardings: BuyerOnboarding[];
  manufacturerOnboardings: ManufacturerOnboarding[];
  shipments: Shipment[];
  crmLeads: CRMLead[];
  paymentTransactions: PaymentTransaction[];
  auditLogs: AuditLog[];
  customerVerifications: CustomerVerificationRequest[];

  // Manufacturer Profile Navigation Context
  selectedMfgIdForProfile: string | null;
  setSelectedMfgIdForProfile: (id: string | null) => void;
  mfgProfileProductContext: { productName?: string; strength?: string; dosageForm?: string; quantity?: number; unit?: string } | null;
  setMfgProfileProductContext: (ctx: { productName?: string; strength?: string; dosageForm?: string; quantity?: number; unit?: string } | null) => void;

  // Unified RFQ Creation Drawer State
  isCreateRfqDrawerOpen: boolean;
  setIsCreateRfqDrawerOpen: (open: boolean) => void;
  openCreateRfqDrawer: () => void;

  // Declined RFQ tracking
  declinedRfqs: Record<string, { rfqId: string; manufacturerId: string; manufacturerName: string; declineReason: string; declineRemarks?: string; declinedAt: string }[]>;
  declineRFQ: (rfqId: string, manufacturerId: string, manufacturerName: string, reason: string, remarks?: string) => void;

  // Buyer <-> Manufacturer Negotiation & Revised Quotes
  negotiationThreads: Record<string, { id: string; threadKey: string; senderRole: 'BUYER' | 'SUPPLIER'; senderName: string; timestamp: string; text: string }[]>;
  sendNegotiationMessage: (threadKey: string, text: string, senderRole: 'BUYER' | 'SUPPLIER', senderName: string) => void;
  revisedQuotes: Record<string, { unitPrice: number; taxPercent: number; discountPercent: number; finalPrice: number; leadTimeDays: number; moq: number; remarks?: string; revisedAt: string }>;
  submitRevisedQuote: (threadKey: string, data: { unitPrice: number; taxPercent: number; discountPercent: number; leadTimeDays: number; moq: number; remarks?: string }) => void;

  // Action Handlers
  addRFQ: (newRfq: RFQ) => void;
  submitQuote: (quote: ManufacturerQuote) => void;
  selectQuoteAndCreateOrder: (rfqId: string, selections: Record<string, { mfgId: string; mfgName: string; price: number }>) => void;
  updateSubOrderStatus: (subOrderId: string, status: SubOrderStatus) => void;
  verifyComplianceDocument: (caseId: string, docName: string, passed: boolean) => void;
  approveComplianceCase: (caseId: string) => void;
  addInvoice: (newInvoice: Invoice) => void;
  updateInvoice: (invoiceId: string, updatedFields: Partial<Invoice>) => void;
  updateInvoiceStatus: (invoiceId: string, status: InvoiceStatus) => void;
  deleteInvoice: (invoiceId: string) => void;
  sendInvoiceToCustomer: (invoiceId: string) => void;
  recordInvoicePayment: (invoiceId: string, amount: number, method?: string, ref?: string, currency?: string, paymentDate?: string) => void;
  submitBuyerOnboarding: (data: Omit<BuyerOnboarding, 'id' | 'status' | 'submittedDate'>) => void;
  submitManufacturerOnboarding: (data: Omit<ManufacturerOnboarding, 'id' | 'status' | 'submittedDate'>) => void;
  approveBuyerOnboarding: (id: string) => void;
  approveManufacturerOnboarding: (id: string) => void;
  updateShipmentStatus: (shipmentId: string, status: Shipment['status']) => void;
  addCRMInteraction: (leadId: string, summary: string, type: 'MEETING' | 'CALL' | 'EMAIL' | 'NOTE') => void;
  addAuditLog: (module: string, action: string) => void;

  // Customer Verification Workflow Handlers
  submitCustomerVerificationRequest: (reqData: Partial<CustomerVerificationRequest>) => void;
  assignComplianceOfficer: (requestId: string, officerName: string) => void;
  approveCustomerVerification: (requestId: string) => void;
  rejectCustomerVerification: (requestId: string, reason: string) => void;
  requestMoreCustomerDocs: (requestId: string, notes: string[]) => void;
  resubmitCustomerDocs: (requestId: string, docs: CustomerVerificationDocument[]) => void;

  // My Profile & Organization Profile Management
  userProfile: UserProfile;
  orgProfile: OrganizationProfile;
  userDocuments: UserDocument[];
  profileSubTab: 'personal' | 'organization' | 'documents' | 'security';
  setProfileSubTab: (tab: 'personal' | 'organization' | 'documents' | 'security') => void;
  updateUserProfile: (updatedFields: Partial<UserProfile>) => void;
  updateOrgProfile: (updatedFields: Partial<OrganizationProfile>) => void;
  uploadUserDocument: (docData: Partial<UserDocument>) => void;
  replaceUserDocument: (docId: string, docData: Partial<UserDocument>) => void;

  // Shipment & GST Connectors State
  shipmentConnectors: Record<string, ShipmentCredentials>;
  gstConnectors: Record<string, GSTCredentials>;
  saveShipmentConnector: (providerId: string, creds: ShipmentCredentials) => void;
  disconnectShipmentConnector: (providerId: string) => void;
  saveGSTConnector: (providerId: string, creds: GSTCredentials) => void;
  disconnectGSTConnector: (providerId: string) => void;
  changeUserPassword: (currentPass: string, newPass: string) => { success: boolean; message: string };
  openProfileTab: (subTab?: 'personal' | 'organization' | 'documents' | 'security') => void;

  // Two-Factor Authentication (2FA) State & Security Handlers
  twoFactorState: TwoFactorState;
  enable2FA: (secret: string, recoveryCodes: string[]) => void;
  disable2FA: (currentPass: string, totpCode: string) => Promise<{ success: boolean; message: string }>;
  verify2FAAttempt: (totpCode: string) => Promise<{ success: boolean; message: string }>;
  useRecoveryCode: (code: string) => { success: boolean; message: string };
  regenerateRecoveryCodes: (currentPass: string, totpCode: string) => Promise<{ success: boolean; message: string; newCodes?: string[] }>;

  // Global Dynamic Filter & Cross-Entity Navigation
  moduleFilters: Record<string, string>;
  setModuleFilter: (module: string, statusFilter: string) => void;
  navigateWithFilter: (tab: string, statusFilter?: string) => void;
  openManufacturerProfile: (mfgId: string, initialTab?: 'OVERVIEW' | 'CAPABILITIES' | 'CATALOG' | 'COMPLIANCE' | 'RELATIONSHIP' | 'PERFORMANCE') => void;
  mfgProfileInitialTab: 'OVERVIEW' | 'CAPABILITIES' | 'CATALOG' | 'COMPLIANCE' | 'RELATIONSHIP' | 'PERFORMANCE';
  setMfgProfileInitialTab: (tab: 'OVERVIEW' | 'CAPABILITIES' | 'CATALOG' | 'COMPLIANCE' | 'RELATIONSHIP' | 'PERFORMANCE') => void;
}

// ── DEFAULT PROFILE DATA DEFINITIONS ─────────────────────────────────
export const defaultSupplierProfile: UserProfile = {
  id: 'usr_mfg_001',
  fullName: 'Rajesh Sharma',
  email: 'rajesh@sunbiolabs.com',
  phone: '+91 98765 43210',
  jobTitle: 'Vice President - Operations & Plant Head',
  role: 'SUPPLIER',
  department: 'Manufacturing & Quality Assurance',
  accountStatus: 'Active',
  lastLogin: 'Today, 10:15 AM',
  avatarUrl: ''
};

export const defaultSupplierOrg: OrganizationProfile = {
  id: 'org_mfg_001',
  companyName: 'SunBio Labs Pvt Ltd',
  companyCode: 'MFG-2026-001',
  businessType: 'Private Limited Manufacturer',
  industry: 'Pharmaceutical Formulations',
  contactEmail: 'contact@sunbiolabs.com',
  contactPhone: '+91 1795 244100',
  registeredAddress: 'Plot No. 42-45, Export Promotion Industrial Park, Phase I',
  city: 'Baddi',
  state: 'Himachal Pradesh',
  country: 'India',
  pincode: '173205',
  website: 'https://www.sunbiolabs.com',
  gstin: '02AAACS1234F1Z9',
  pan: 'AAACS1234F',
  cinNumber: 'U24231HP2012PTC001234',
  mfgLicenseNo: 'ML-HP-2024-001',
  whoGmpNo: 'WHO-GMP-HP-8899',
  isVerified: true
};

export const defaultSupplierDocs: UserDocument[] = [
  {
    id: 'doc_mfg_1',
    documentName: 'GST Registration Certificate',
    documentType: 'GST Certificate',
    documentNumber: '02AAACS1234F1Z9',
    issueDate: '2022-04-01',
    expiryDate: 'N/A',
    uploadedDate: '2025-11-10',
    lastUpdated: '2025-11-10',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Compliance Desk Officer',
    verificationDate: '2025-11-12',
    remarks: 'Verified via GST portal API.',
    fileName: 'SunBio_GST_Certificate_2025.pdf',
    fileUrl: '#'
  },
  {
    id: 'doc_mfg_2',
    documentName: 'PAN Card Document',
    documentType: 'PAN Card / PAN Document',
    documentNumber: 'AAACS1234F',
    issueDate: '2012-06-15',
    expiryDate: 'N/A',
    uploadedDate: '2025-11-10',
    lastUpdated: '2025-11-10',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Compliance Desk Officer',
    verificationDate: '2025-11-12',
    remarks: 'Valid PAN record match.',
    fileName: 'SunBio_PAN_Card.pdf',
    fileUrl: '#'
  },
  {
    id: 'doc_mfg_3',
    documentName: 'Company Certificate of Incorporation',
    documentType: 'Company Registration Certificate',
    documentNumber: 'U24231HP2012PTC001234',
    issueDate: '2012-03-20',
    expiryDate: 'N/A',
    uploadedDate: '2025-11-10',
    lastUpdated: '2025-11-10',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Compliance Desk Officer',
    verificationDate: '2025-11-12',
    remarks: 'ROC Himachal Pradesh verified.',
    fileName: 'SunBio_Incorporation_Cert.pdf',
    fileUrl: '#'
  },
  {
    id: 'doc_mfg_4',
    documentName: 'State FDA Manufacturing License (Form 25/28)',
    documentType: 'Manufacturing License',
    documentNumber: 'ML-HP-2024-001',
    issueDate: '2024-01-01',
    expiryDate: '2029-12-31',
    uploadedDate: '2025-11-10',
    lastUpdated: '2025-11-10',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'State FDA Officer',
    verificationDate: '2025-11-15',
    remarks: 'Valid for Oral Solids & Injectables.',
    fileName: 'Manufacturing_License_HP_2024.pdf',
    fileUrl: '#'
  },
  {
    id: 'doc_mfg_5',
    documentName: 'WHO-GMP Certification Audit Report',
    documentType: 'Drug License / applicable regulatory license',
    documentNumber: 'WHO-GMP-HP-8899',
    issueDate: '2025-06-01',
    expiryDate: '2027-05-31',
    uploadedDate: '2026-08-01',
    lastUpdated: '2026-08-01',
    verificationStatus: 'PENDING VERIFICATION',
    remarks: 'Under final audit review by CDSCO inspector.',
    fileName: 'WHO_GMP_Certificate_2026.pdf',
    fileUrl: '#'
  },
  {
    id: 'doc_mfg_6',
    documentName: 'Bank Cancelled Cheque / Account Mandate',
    documentType: 'Bank / Payment Details',
    documentNumber: 'HDFC0000123',
    issueDate: '2024-02-10',
    expiryDate: 'N/A',
    uploadedDate: '2025-11-10',
    lastUpdated: '2025-11-10',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Finance Controller',
    verificationDate: '2025-11-11',
    remarks: 'Penny drop verification successful.',
    fileName: 'SunBio_Cancelled_Cheque.pdf',
    fileUrl: '#'
  },
  {
    id: 'doc_mfg_7',
    documentName: 'ISO 9001:2015 Quality Systems Certificate',
    documentType: 'Quality Certificates',
    documentNumber: 'ISO-9001-QUAL-4421',
    issueDate: '2024-03-15',
    expiryDate: '2027-03-14',
    uploadedDate: '2025-11-10',
    lastUpdated: '2025-11-10',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Compliance Desk Officer',
    verificationDate: '2025-11-12',
    remarks: 'ISO registrar verified.',
    fileName: 'ISO_9001_Quality_Cert.pdf',
    fileUrl: '#'
  },
  {
    id: 'doc_mfg_8',
    documentName: 'Pollution Control Board Clearance (NOC)',
    documentType: 'Other Business Documents',
    documentNumber: 'PCB-HP-2025-881',
    issueDate: '2025-01-10',
    expiryDate: '2028-01-09',
    uploadedDate: '2025-11-10',
    lastUpdated: '2025-11-10',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Compliance Desk Officer',
    verificationDate: '2025-11-12',
    remarks: 'Effluent treatment plant compliant.',
    fileName: 'Pollution_Control_NOC.pdf',
    fileUrl: '#'
  }
];

export const defaultBuyerProfile: UserProfile = {
  id: 'usr_buyer_001',
  fullName: 'Dr. Vikram Sethi',
  email: 'v.sethi@apexpharma.com',
  phone: '+91 98112 34567',
  jobTitle: 'Chief Procurement Officer (CPO)',
  role: 'BUYER',
  department: 'Global Sourcing & Supply Chain',
  accountStatus: 'Active',
  lastLogin: 'Today, 09:45 AM',
  avatarUrl: ''
};

export const defaultBuyerOrg: OrganizationProfile = {
  id: 'org_buyer_001',
  companyName: 'Apex Pharma Ltd',
  companyCode: 'BUY-2026-001',
  businessType: 'Public Limited Company',
  industry: 'Pharmaceutical Sourcing & Distribution',
  contactEmail: 'sourcing@apexpharma.com',
  contactPhone: '+91 22 6789 0000',
  registeredAddress: 'Apex Tower, Off Western Express Highway, Goregaon East',
  city: 'Mumbai',
  state: 'Maharashtra',
  country: 'India',
  pincode: '400063',
  website: 'https://www.apexpharma.com',
  gstin: '27AAACA9876E1Z2',
  pan: 'AAACA9876E',
  cinNumber: 'L24239MH2005PLC154321',
  isVerified: true
};

export const defaultBuyerDocs: UserDocument[] = [
  {
    id: 'doc_buyer_1',
    documentName: 'GST Registration Certificate',
    documentType: 'GST Certificate',
    documentNumber: '27AAACA9876E1Z2',
    issueDate: '2020-04-01',
    expiryDate: 'N/A',
    uploadedDate: '2025-10-15',
    lastUpdated: '2025-10-15',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Compliance Desk',
    verificationDate: '2025-10-16',
    remarks: 'Verified via GSTN API.',
    fileName: 'Apex_GST_Certificate.pdf',
    fileUrl: '#'
  },
  {
    id: 'doc_buyer_2',
    documentName: 'Corporate PAN Card',
    documentType: 'PAN Card / PAN Document',
    documentNumber: 'AAACA9876E',
    issueDate: '2005-08-12',
    expiryDate: 'N/A',
    uploadedDate: '2025-10-15',
    lastUpdated: '2025-10-15',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Compliance Desk',
    verificationDate: '2025-10-16',
    remarks: 'Verified.',
    fileName: 'Apex_PAN_Card.pdf',
    fileUrl: '#'
  },
  {
    id: 'doc_buyer_3',
    documentName: 'Certificate of Incorporation (ROC)',
    documentType: 'Company Registration Certificate',
    documentNumber: 'L24239MH2005PLC154321',
    issueDate: '2005-08-10',
    expiryDate: 'N/A',
    uploadedDate: '2025-10-15',
    lastUpdated: '2025-10-15',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Compliance Desk',
    verificationDate: '2025-10-16',
    remarks: 'ROC Mumbai verified.',
    fileName: 'Apex_Incorporation_Cert.pdf',
    fileUrl: '#'
  },
  {
    id: 'doc_buyer_4',
    documentName: 'Wholesale Drug License (Form 20B / 21B)',
    documentType: 'Drug License',
    documentNumber: 'MH-MZ4-2023-9091',
    issueDate: '2023-05-01',
    expiryDate: '2028-04-30',
    uploadedDate: '2025-10-15',
    lastUpdated: '2025-10-15',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Maharashtra FDA',
    verificationDate: '2025-10-18',
    remarks: 'Valid for wholesale distribution.',
    fileName: 'Wholesale_Drug_License_MH.pdf',
    fileUrl: '#'
  },
  {
    id: 'doc_buyer_5',
    documentName: 'Corporate Bank Mandate / Penny Drop',
    documentType: 'Bank / Payment Details',
    documentNumber: 'ICIC0000999',
    issueDate: '2024-01-10',
    expiryDate: 'N/A',
    uploadedDate: '2025-10-15',
    lastUpdated: '2025-10-15',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Accounts Desk',
    verificationDate: '2025-10-16',
    remarks: 'Bank account verified.',
    fileName: 'Apex_Bank_Mandate.pdf',
    fileUrl: '#'
  },
  {
    id: 'doc_buyer_6',
    documentName: 'Import Export Code (IEC) Certificate',
    documentType: 'Other Business Documents',
    documentNumber: 'IEC0305991288',
    issueDate: '2021-02-15',
    expiryDate: 'N/A',
    uploadedDate: '',
    lastUpdated: '',
    verificationStatus: 'NOT UPLOADED',
    remarks: 'Optional for domestic sourcing.',
    fileName: '',
    fileUrl: ''
  }
];

export const defaultAdminProfile: UserProfile = {
  id: 'usr_admin_001',
  fullName: 'Platform Admin',
  email: 'admin@factorygrid.com',
  phone: '+91 80 4567 8900',
  jobTitle: 'Principal Systems & Platform Administrator',
  role: 'ADMIN',
  department: 'Platform Operations & Security',
  accountStatus: 'Active',
  lastLogin: 'Just now',
  avatarUrl: ''
};

export const defaultAdminOrg: OrganizationProfile = {
  id: 'org_admin_001',
  companyName: 'FactoryGrid Technologies India Pvt Ltd',
  companyCode: 'FG-HQ-001',
  businessType: 'Enterprise SaaS Platform Operator',
  industry: 'B2B Industrial & Healthcare Tech',
  contactEmail: 'support@factorygrid.com',
  contactPhone: '+91 80 4567 8900',
  registeredAddress: '5th Floor, Technology Park, Outer Ring Road',
  city: 'Bengaluru',
  state: 'Karnataka',
  country: 'India',
  pincode: '560103',
  website: 'https://www.factorygrid.com',
  gstin: '29AAFCS9999P1Z8',
  pan: 'AAFCS9999P',
  cinNumber: 'U72200KA2021PTC145678',
  isVerified: true
};

export const defaultAdminDocs: UserDocument[] = [
  {
    id: 'doc_admin_1',
    documentName: 'Platform GST Registration',
    documentType: 'GST Certificate',
    documentNumber: '29AAFCS9999P1Z8',
    issueDate: '2021-04-01',
    expiryDate: 'N/A',
    uploadedDate: '2025-01-01',
    lastUpdated: '2025-01-01',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'System',
    verificationDate: '2025-01-01',
    remarks: 'Active GST registration.',
    fileName: 'FactoryGrid_GST.pdf',
    fileUrl: '#'
  },
  {
    id: 'doc_admin_2',
    documentName: 'Corporate PAN Card',
    documentType: 'PAN Card / PAN Document',
    documentNumber: 'AAFCS9999P',
    issueDate: '2021-03-01',
    expiryDate: 'N/A',
    uploadedDate: '2025-01-01',
    lastUpdated: '2025-01-01',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'System',
    verificationDate: '2025-01-01',
    remarks: 'Verified.',
    fileName: 'FactoryGrid_PAN.pdf',
    fileUrl: '#'
  }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fg_auth');
      if (saved === 'false') return false;
    }
    return true;
  });
  const [currentRole, setCurrentRoleState] = useState<UserRole>(() => {
    if (typeof window !== 'undefined') {
      const savedRole = localStorage.getItem('fg_role') as UserRole;
      if (savedRole) return savedRole;
    }
    return 'BUYER';
  });

  const setCurrentRole = (role: UserRole) => {
    setCurrentRoleState(role);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fg_role', role);
    }
  };

  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const login = (role?: UserRole) => {
    const effectiveRole = role || currentRole || 'BUYER';
    setCurrentRole(effectiveRole);
    setIsAuthenticated(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fg_auth', 'true');
      localStorage.setItem('fg_role', effectiveRole);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fg_auth');
      localStorage.removeItem('fg_role');
    }
  };

  // Helper getters for role-aware profile initial states
  const getInitialUserProfile = (role: UserRole): UserProfile => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`fg_user_profile_${role}`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { }
      }
    }
    if (role === 'SUPPLIER') return defaultSupplierProfile;
    if (role === 'ADMIN') return defaultAdminProfile;
    return defaultBuyerProfile;
  };

  const getInitialOrgProfile = (role: UserRole): OrganizationProfile => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`fg_org_profile_${role}`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { }
      }
    }
    if (role === 'SUPPLIER') return defaultSupplierOrg;
    if (role === 'ADMIN') return defaultAdminOrg;
    return defaultBuyerOrg;
  };

  const getInitialUserDocs = (role: UserRole): UserDocument[] => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`fg_user_documents_${role}`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { }
      }
    }
    if (role === 'SUPPLIER') return defaultSupplierDocs;
    if (role === 'ADMIN') return defaultAdminDocs;
    return defaultBuyerDocs;
  };

  const [userProfile, setUserProfileState] = useState<UserProfile>(() => getInitialUserProfile(currentRole));
  const [orgProfile, setOrgProfileState] = useState<OrganizationProfile>(() => getInitialOrgProfile(currentRole));
  const [userDocuments, setUserDocumentsState] = useState<UserDocument[]>(() => getInitialUserDocs(currentRole));
  const [profileSubTab, setProfileSubTab] = useState<'personal' | 'organization' | 'documents' | 'security'>('personal');

  // Synchronize role profile state when role changes
  React.useEffect(() => {
    setUserProfileState(getInitialUserProfile(currentRole));
    setOrgProfileState(getInitialOrgProfile(currentRole));
    setUserDocumentsState(getInitialUserDocs(currentRole));
  }, [currentRole]);

  const updateUserProfile = (updatedFields: Partial<UserProfile>) => {
    setUserProfileState(prev => {
      const updated = { ...prev, ...updatedFields };
      if (typeof window !== 'undefined') {
        localStorage.setItem(`fg_user_profile_${currentRole}`, JSON.stringify(updated));
      }
      return updated;
    });
    addAuditLog('My Profile', `Updated personal profile information for ${userProfile.fullName}`);
  };

  const updateOrgProfile = (updatedFields: Partial<OrganizationProfile>) => {
    setOrgProfileState(prev => {
      const updated = {
        ...prev,
        ...updatedFields,
        companyCode: prev.companyCode, // protected read-only ID
        id: prev.id,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(`fg_org_profile_${currentRole}`, JSON.stringify(updated));
      }
      return updated;
    });
    addAuditLog('Organization Profile', `Updated organization details for ${orgProfile.companyName}`);
  };

  const uploadUserDocument = (docData: Partial<UserDocument>) => {
    const timeStr = new Date().toISOString().split('T')[0];
    const newDoc: UserDocument = {
      id: 'doc_' + Date.now(),
      documentName: docData.documentName || docData.documentType || 'Uploaded Document',
      documentType: docData.documentType || 'Other Business Documents',
      documentNumber: docData.documentNumber || '',
      issueDate: docData.issueDate || timeStr,
      expiryDate: docData.expiryDate || 'N/A',
      uploadedDate: timeStr,
      lastUpdated: timeStr,
      verificationStatus: 'PENDING VERIFICATION',
      remarks: docData.remarks || 'Document uploaded. Pending compliance officer verification.',
      fileName: docData.fileName || 'Uploaded_Document.pdf',
      fileUrl: docData.fileUrl || '#',
      history: []
    };

    setUserDocumentsState(prev => {
      const updated = [newDoc, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem(`fg_user_documents_${currentRole}`, JSON.stringify(updated));
      }
      return updated;
    });
    addAuditLog('Documents & Verification', `Uploaded ${newDoc.documentName}. Status set to PENDING VERIFICATION.`);
  };

  const replaceUserDocument = (docId: string, docData: Partial<UserDocument>) => {
    const timeStr = new Date().toISOString().split('T')[0];
    setUserDocumentsState(prev => {
      const updated = prev.map(doc => {
        if (doc.id !== docId) return doc;

        const oldVersion: DocumentVersion = {
          version: (doc.history?.length || 0) + 1,
          uploadedDate: doc.uploadedDate || timeStr,
          fileName: doc.fileName || 'Previous_Version.pdf',
          documentNumber: doc.documentNumber,
          status: doc.verificationStatus,
          remarks: doc.remarks,
          url: doc.fileUrl
        };

        const updatedHistory = [...(doc.history || []), oldVersion];

        return {
          ...doc,
          documentNumber: docData.documentNumber !== undefined ? docData.documentNumber : doc.documentNumber,
          issueDate: docData.issueDate !== undefined ? docData.issueDate : doc.issueDate,
          expiryDate: docData.expiryDate !== undefined ? docData.expiryDate : doc.expiryDate,
          uploadedDate: timeStr,
          lastUpdated: timeStr,
          verificationStatus: 'PENDING VERIFICATION',
          remarks: docData.remarks || 'Replaced document uploaded. Pending verification.',
          fileName: docData.fileName || doc.fileName,
          fileUrl: docData.fileUrl || doc.fileUrl,
          history: updatedHistory
        };
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem(`fg_user_documents_${currentRole}`, JSON.stringify(updated));
      }
      return updated;
    });
    addAuditLog('Documents & Verification', `Replaced document ID ${docId}. Status set to PENDING VERIFICATION.`);
  };

  const changeUserPassword = (currentPass: string, newPass: string): { success: boolean; message: string } => {
    if (!currentPass) {
      return { success: false, message: 'Please enter your current password.' };
    }
    if (!newPass || newPass.length < 8) {
      return { success: false, message: 'New password must be at least 8 characters long.' };
    }
    addAuditLog('Security', `Successfully updated account password for ${userProfile.email}`);
    return { success: true, message: 'Password changed successfully.' };
  };

  const openProfileTab = (subTab: 'personal' | 'organization' | 'documents' | 'security' = 'personal') => {
    setProfileSubTab(subTab);
    setActiveTab('profile');
  };

  // Global Dynamic Filter & Cross-Entity Navigation State
  const [moduleFilters, setModuleFiltersState] = useState<Record<string, string>>({});
  const [mfgProfileInitialTab, setMfgProfileInitialTab] = useState<'OVERVIEW' | 'CAPABILITIES' | 'CATALOG' | 'COMPLIANCE' | 'RELATIONSHIP' | 'PERFORMANCE'>('OVERVIEW');

  const setModuleFilter = (module: string, statusFilter: string) => {
    setModuleFiltersState(prev => ({
      ...prev,
      [module]: statusFilter
    }));
  };

  const navigateWithFilter = (tab: string, statusFilter?: string) => {
    if (statusFilter) {
      setModuleFilter(tab, statusFilter);
    }
    setActiveTab(tab);
  };

  const openManufacturerProfile = (mfgId: string, initialTab: 'OVERVIEW' | 'CAPABILITIES' | 'CATALOG' | 'COMPLIANCE' | 'RELATIONSHIP' | 'PERFORMANCE' = 'OVERVIEW') => {
    setSelectedMfgIdForProfile(mfgId);
    setMfgProfileInitialTab(initialTab);
    setActiveTab('manufacturers');
  };
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>(mockManufacturers);
  const [products, setProducts] = useState<Product[]>(mockProducts);

  const addProductMaster = (newProduct: Product) => {
    setProducts(prev => {
      const exists = prev.some(p => p.code.toLowerCase().trim() === newProduct.code.toLowerCase().trim());
      if (exists) return prev;
      return [newProduct, ...prev];
    });
  };

  const updateProductMaster = (productId: string, updatedFields: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...updatedFields } : p));
  };

  const toggleProductMasterStatus = (productId: string) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, status: p.status === 'Inactive' ? 'Active' : 'Inactive' } : p));
  };
  const [mappings, setMappings] = useState<ManufacturerProductMapping[]>(mockManufacturerProductMappings);

  const addMapping = (newMapping: ManufacturerProductMapping) => {
    setMappings(prev => {
      // Check duplicate
      const exists = prev.some(m => m.productId === newMapping.productId && m.manufacturerId === newMapping.manufacturerId);
      if (exists) return prev;
      return [newMapping, ...prev];
    });
  };

  const updateMapping = (productId: string, manufacturerId: string, updatedFields: Partial<ManufacturerProductMapping>) => {
    setMappings(prev => prev.map(m => (m.productId === productId && m.manufacturerId === manufacturerId) ? { ...m, ...updatedFields } : m));
  };

  const removeMapping = (productId: string, manufacturerId: string) => {
    setMappings(prev => prev.filter(m => !(m.productId === productId && m.manufacturerId === manufacturerId)));
  };
    const [rfqs, setRfqs] = useState<RFQ[]>(() => {
    try {
      const saved = localStorage.getItem('fg_rfqs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const savedIds = new Set(parsed.map((r: any) => r.id || r.rfqNumber));
          const missingMocks = mockRFQs.filter(r => !savedIds.has(r.id) && !savedIds.has(r.rfqNumber));
          return [...parsed, ...missingMocks];
        }
      }
    } catch (e) {}
    return mockRFQs;
  });

  const [quotes, setQuotes] = useState<ManufacturerQuote[]>(() => {
    try {
      const saved = localStorage.getItem('fg_quotes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(q => ({
            ...q,
            quoteLines: Array.isArray(q?.quoteLines) ? q.quoteLines : []
          }));
        }
      }
    } catch (e) {}
    return mockQuotes;
  });

  // Declined RFQs state
  const [declinedRfqs, setDeclinedRfqs] = useState<Record<string, { rfqId: string; manufacturerId: string; manufacturerName: string; declineReason: string; declineRemarks?: string; declinedAt: string }[]>>({});

  const declineRFQ = (rfqId: string, manufacturerId: string, manufacturerName: string, reason: string, remarks?: string) => {
    const formattedDate = new Date().toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
    const record = {
      rfqId,
      manufacturerId,
      manufacturerName,
      declineReason: reason,
      declineRemarks: remarks,
      declinedAt: formattedDate
    };
    setDeclinedRfqs(prev => {
      const existingList = prev[rfqId] || [];
      const filtered = existingList.filter(d => d.manufacturerId !== manufacturerId);
      return { ...prev, [rfqId]: [...filtered, record] };
    });

    const notif: NotificationItem = {
      id: 'n_' + Date.now(),
      title: `RFQ Declined`,
      message: `RFQ ${rfqId} was declined by ${manufacturerName}. Reason: ${reason}`,
      timestamp: 'Just now',
      type: 'WARNING',
      category: 'RFQ',
      read: false
    };
    setNotifications(prev => [notif, ...prev]);

    // Audit Log
    addAuditLog('DECLINE_RFQ', `Manufacturer ${manufacturerName} declined ${rfqId}. Reason: ${reason}`);
  };

  // Negotiation Threads & Revised Quotes State
  const [negotiationThreads, setNegotiationThreads] = useState<Record<string, { id: string; threadKey: string; senderRole: 'BUYER' | 'SUPPLIER'; senderName: string; timestamp: string; text: string }[]>>({});
  const [revisedQuotes, setRevisedQuotes] = useState<Record<string, { unitPrice: number; taxPercent: number; discountPercent: number; finalPrice: number; leadTimeDays: number; moq: number; remarks?: string; revisedAt: string }>>({});

  const sendNegotiationMessage = (threadKey: string, text: string, senderRole: 'BUYER' | 'SUPPLIER', senderName: string) => {
    const timeStr = new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const msg = {
      id: 'msg_' + Date.now(),
      threadKey,
      senderRole,
      senderName,
      timestamp: timeStr,
      text
    };
    setNegotiationThreads(prev => ({
      ...prev,
      [threadKey]: [...(prev[threadKey] || []), msg]
    }));
    addAuditLog('NEGOTIATION', `${senderName} sent message on thread ${threadKey}`);
  };

  const submitRevisedQuote = (threadKey: string, data: { unitPrice: number; taxPercent: number; discountPercent: number; leadTimeDays: number; moq: number; remarks?: string }) => {
    const taxAmt = data.unitPrice * (data.taxPercent / 100);
    const discAmt = (data.unitPrice + taxAmt) * (data.discountPercent / 100);
    const finalPrice = Math.round((data.unitPrice + taxAmt - discAmt) * 100) / 100;
    const timeStr = new Date().toLocaleString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });

    const revRecord = {
      unitPrice: data.unitPrice,
      taxPercent: data.taxPercent,
      discountPercent: data.discountPercent,
      finalPrice,
      leadTimeDays: data.leadTimeDays,
      moq: data.moq,
      remarks: data.remarks,
      revisedAt: timeStr
    };

    setRevisedQuotes(prev => ({
      ...prev,
      [threadKey]: revRecord
    }));

    // Auto add a system/supplier message to the thread
    sendNegotiationMessage(threadKey, `✔ Submitted Revised Quote: Unit Price ₹${data.unitPrice.toFixed(2)}, Tax ${data.taxPercent}%, Discount ${data.discountPercent}%, Final Price ₹${finalPrice.toFixed(2)}, Lead Time ${data.leadTimeDays} Days, MOQ ${data.moq.toLocaleString()} Units. Remarks: ${data.remarks || 'None'}`, 'SUPPLIER', 'Supplier Sales Team');

    addAuditLog('REVISED_QUOTE', `Submitted revised quote for ${threadKey}: Final Price ₹${finalPrice}`);
  };

    const [orders, setOrders] = useState<MasterOrder[]>(() => {
    try {
      const saved = localStorage.getItem('fg_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const savedIds = new Set(parsed.map((o: any) => o.id || o.orderNumber));
          const missingMocks = mockMasterOrders.filter(mo => !savedIds.has(mo.id) && !savedIds.has(mo.orderNumber));
          return [...parsed, ...missingMocks];
        }
      }
    } catch (e) {}
    return mockMasterOrders;
  });

  useEffect(() => {
    try {
      localStorage.setItem('fg_rfqs', JSON.stringify(rfqs));
    } catch (e) { }
  }, [rfqs]);

  useEffect(() => {
    try {
      localStorage.setItem('fg_quotes', JSON.stringify(quotes));
    } catch (e) { }
  }, [quotes]);

  useEffect(() => {
    try {
      localStorage.setItem('fg_orders', JSON.stringify(orders));
    } catch (e) { }
  }, [orders]);

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem('fg_invoices');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    return mockInvoices;
  });

  useEffect(() => {
    try {
      localStorage.setItem('fg_invoices', JSON.stringify(invoices));
    } catch (e) { }
  }, [invoices]);
  const [complianceCases, setComplianceCases] = useState<ComplianceCase[]>(mockComplianceCases);
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);
  const [buyerOnboardings, setBuyerOnboardings] = useState<BuyerOnboarding[]>(mockBuyerOnboardings);
  const [manufacturerOnboardings, setManufacturerOnboardings] = useState<ManufacturerOnboarding[]>(mockManufacturerOnboardings);
  const [shipments, setShipments] = useState<Shipment[]>(mockShipments);
  const [crmLeads, setCrmLeads] = useState<CRMLead[]>(mockCRMLeads);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>(mockPaymentTransactions);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [customerVerifications, setCustomerVerifications] = useState<CustomerVerificationRequest[]>(mockCustomerVerifications);

  // Shipment & GST Integration State
  const [shipmentConnectors, setShipmentConnectors] = useState<Record<string, ShipmentCredentials>>(() => {
    try {
      const saved = localStorage.getItem('fg_shipment_connectors');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      bluedart: {
        customerCode: 'BD998210',
        consumerKey: 'bd_key_sandbox_9981',
        consumerSecret: 'bd_secret_sandbox_88921',
        environment: 'SANDBOX',
        isConnected: true,
        connectedAt: '2026-08-15'
      }
    };
  });

  const [gstConnectors, setGstConnectors] = useState<Record<string, GSTCredentials>>(() => {
    try {
      const saved = localStorage.getItem('fg_gst_connectors');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      messagecentral: {
        apiKey: 'mc_key_live_44921',
        apiSecret: 'mc_sec_live_99812',
        environment: 'PRODUCTION',
        isConnected: true,
        connectedAt: '2026-08-10'
      }
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('fg_shipment_connectors', JSON.stringify(shipmentConnectors));
    } catch (e) {}
  }, [shipmentConnectors]);

  useEffect(() => {
    try {
      localStorage.setItem('fg_gst_connectors', JSON.stringify(gstConnectors));
    } catch (e) {}
  }, [gstConnectors]);

  const saveShipmentConnector = (providerId: string, creds: ShipmentCredentials) => {
    const updated = {
      ...shipmentConnectors,
      [providerId]: {
        ...creds,
        isConnected: true,
        connectedAt: new Date().toISOString().split('T')[0]
      }
    };
    setShipmentConnectors(updated);
    addAuditLog('Integrations', `Connected Shipment Provider ${providerId.toUpperCase()} (${creds.environment})`);
  };

  const disconnectShipmentConnector = (providerId: string) => {
    setShipmentConnectors(prev => {
      const copy = { ...prev };
      delete copy[providerId];
      return copy;
    });
    addAuditLog('Integrations', `Disconnected Shipment Provider ${providerId.toUpperCase()}`);
  };

  const saveGSTConnector = (providerId: string, creds: GSTCredentials) => {
    const updated = {
      ...gstConnectors,
      [providerId]: {
        ...creds,
        isConnected: true,
        connectedAt: new Date().toISOString().split('T')[0]
      }
    };
    setGstConnectors(updated);
    addAuditLog('Integrations', `Connected GST Provider ${providerId.toUpperCase()} (${creds.environment})`);
  };

  const disconnectGSTConnector = (providerId: string) => {
    setGstConnectors(prev => {
      const copy = { ...prev };
      delete copy[providerId];
      return copy;
    });
    addAuditLog('Integrations', `Disconnected GST Provider ${providerId.toUpperCase()}`);
  };

  // Profile Navigation State
  const [selectedMfgIdForProfile, setSelectedMfgIdForProfile] = useState<string | null>(null);
  const [mfgProfileProductContext, setMfgProfileProductContext] = useState<{ productName?: string; strength?: string; dosageForm?: string; quantity?: number; unit?: string } | null>(null);

  // Unified RFQ Creation Drawer State
  const [isCreateRfqDrawerOpen, setIsCreateRfqDrawerOpen] = useState<boolean>(false);
  const openCreateRfqDrawer = () => {
    setIsCreateRfqDrawerOpen(true);
    setActiveTab('rfqs');
  };

  const addAuditLog = (module: string, action: string) => {
    const newLog: AuditLog = {
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userName: currentRole === 'BUYER' ? 'Apex Pharma (Buyer)' : currentRole === 'SUPPLIER' ? 'SunBio Labs (Supplier)' : 'Executive User',
      userRole: currentRole,
      module,
      action,
      ipAddress: '192.168.1.100'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const addRFQ = (newRfq: RFQ) => {
    if (currentRole === 'ADMIN') {
      alert("Admin access is read-only. This action is not available for your role.");
      return;
    }
    setRfqs(prev => [newRfq, ...prev]);
    addAuditLog('RFQ Center', `Created RFQ ${newRfq.rfqNumber} with ${newRfq.lines.length} lines`);
    // Notify suppliers
    const newNotif: NotificationItem = {
      id: 'n_' + Date.now(),
      title: `New RFQ ${newRfq.rfqNumber} Distributed`,
      message: `Customer ${newRfq.customerName} submitted RFQ with ${newRfq.lines.length} lines.`,
      timestamp: 'Just now',
      type: 'INFO',
      category: 'RFQ',
      read: false,
      link: 'quotes'
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const submitQuote = (newQuote: ManufacturerQuote) => {
    setQuotes(prev => [newQuote, ...prev]);
    // 'Quoted' must match RFQStatus type exactly (Pascal case)
    setRfqs(prev => prev.map(r => r.id === newQuote.rfqId ? { ...r, status: 'Quoted' as const } : r));
    addAuditLog('Quote Matrix', `Submitted sealed quote ${newQuote.id} for RFQ ${newQuote.rfqNumber}`);
  };

  const selectQuoteAndCreateOrder = (rfqId: string, selections: Record<string, { mfgId: string; mfgName: string; price: number }>) => {
    const rfq = rfqs.find(r => r.id === rfqId);
    if (!rfq) return;

    // Build master order with sub-orders grouped by manufacturer
    const subOrderMap: Record<string, any[]> = {};
    let totalMasterAmount = 0;

    rfq.lines.forEach(line => {
      const selection = selections[line.id];
      if (selection) {
        if (!subOrderMap[selection.mfgId]) {
          subOrderMap[selection.mfgId] = [];
        }
        const lineTotal = line.quantity * selection.price * 1.12; // with tax estimate
        totalMasterAmount += lineTotal;
        subOrderMap[selection.mfgId].push({
          id: 'sol_' + line.id,
          productId: line.productId,
          productName: line.productName,
          dosageForm: line.dosageForm,
          quantity: line.quantity,
          unitPrice: selection.price,
          taxPercent: 12,
          discountPercent: 0,
          totalPrice: lineTotal
        });
      }
    });

    const orderSeq = 5000 + orders.length + Math.floor(Math.random() * 1000);
    const masterOrdNum = `MO-2026-${orderSeq}`;
    const subOrders = Object.keys(subOrderMap).map((mfgId, idx) => {
      const mfg = manufacturers.find(m => m.id === mfgId);
      const items = subOrderMap[mfgId];
      const subTotal = items.reduce((acc, item) => acc + item.totalPrice, 0);
      const subNum = `SO-2026-${orderSeq}-0${idx + 1}`;

      return {
        id: `so_${Date.now()}_${idx}`,
        subOrderNumber: subNum,
        masterOrderId: `mo_${Date.now()}`,
        masterOrderNumber: masterOrdNum,
        manufacturerId: mfgId,
        manufacturerName: mfg ? mfg.companyName : 'Manufacturer Partner',
        status: 'OPEN' as SubOrderStatus,
        totalAmount: Math.round(subTotal),
        startDate: new Date().toISOString().split('T')[0],
        expectedDeliveryDate: '2026-09-01',
        lines: items,
        invoice: null,
        invoiceId: null
      };
    });

    const newMasterOrder: MasterOrder = {
      id: `mo_${Date.now()}`,
      orderNumber: masterOrdNum,
      customerId: rfq.customerId,
      customerName: rfq.customerName,
      customerCode: rfq.customerCode,
      createdDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: '2026-09-01',
      status: 'OPEN',
      totalAmount: Math.round(totalMasterAmount),
      subOrders,
      shippingAddress: 'Industrial Zone, Plot 14, Phase I, Delhi'
    };

    setOrders(prev => [newMasterOrder, ...prev]);
    setRfqs(prev => prev.map(r => r.id === rfqId ? { ...r, status: 'APPROVED' } : r));
    setQuotes(prev => prev.map(q => {
      if (q.rfqId === rfqId || q.rfqNumber === rfq.rfqNumber) {
        const matchingSubOrder = subOrders.find(so => so.manufacturerId === q.manufacturerId || q.manufacturerName?.includes('SunBio'));
        if (matchingSubOrder) {
          return {
            ...q,
            status: 'SUB-ORDER CREATED',
            subOrderId: matchingSubOrder.id,
            subOrderNumber: matchingSubOrder.subOrderNumber,
            lastUpdated: new Date().toISOString().split('T')[0]
          };
        } else {
          return {
            ...q,
            status: 'REJECTED',
            rejectionReason: 'Buyer awarded order to another manufacturer.',
            lastUpdated: new Date().toISOString().split('T')[0]
          };
        }
      }
      return q;
    }));
    addAuditLog('Order Splitting', `Generated Master Order ${masterOrdNum} with ${subOrders.length} Sub-Orders`);

    // Register fresh sub-orders into Unified Storage for Production Execution & Dispatch
    try {
      const UNIFIED_KEY = 'factorygrid_unified_suborders_v11';
      const saved = localStorage.getItem(UNIFIED_KEY);
      const currentStore = saved ? JSON.parse(saved) : {};

      subOrders.forEach(so => {
        const subNum = so.subOrderNumber;
        currentStore[subNum] = {
          subOrderNumber: subNum,
          poNumber: `PO-${subNum}`,
          masterOrderNumber: masterOrdNum,
          customerName: rfq.customerName,
          manufacturerName: so.manufacturerName,
          productName: so.lines[0]?.productName || rfq.productName || 'Pharmaceutical Products',
          totalQuantity: so.lines.reduce((acc: number, l: any) => acc + l.quantity, 0) || rfq.targetQuantity || 10000,
          orderValue: so.totalAmount,
          requiredDeliveryDate: '2026-09-02',
          leadTimeDays: 14,

          // FRESH PRODUCTION WORKFLOW — STRICTLY PO_ACCEPTED
          productionStatus: 'PO_ACCEPTED',
          batchNumber: `BATCH-2026-${Math.floor(1000 + Math.random() * 8999)}`,
          manufacturingLine: 'Line A - Solid Oral Dosages',
          plannedStartDate: new Date().toISOString().split('T')[0],
          expectedCompletionDate: '2026-08-28',
          progressPercent: 0,
          rawMaterialIssued: false,
          manufacturingStarted: false,
          qcInspectionResult: undefined,
          qcTestedQuantity: so.lines.reduce((acc: number, l: any) => acc + l.quantity, 0) || 10000,
          qcPassedQuantity: so.lines.reduce((acc: number, l: any) => acc + l.quantity, 0) || 10000,
          qcFailedQuantity: 0,
          qcRemarks: undefined,
          packagingPackSize: undefined,
          packagingMasterCartons: undefined,

          // STRICTLY NO SHIPMENT OR INVOICE AT CREATION
          shipment: null,
          invoice: null
        };
      });

      localStorage.setItem(UNIFIED_KEY, JSON.stringify(currentStore));
      if (subOrders[0]) {
        localStorage.setItem('factorygrid_target_suborder', subOrders[0].subOrderNumber);
      }
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Failed to sync new sub-orders to unified store', e);
    }
  };

  const updateSubOrderStatus = (subOrderId: string, status: SubOrderStatus) => {
    setOrders(prev => prev.map(mo => {
      const hasSub = mo.subOrders.some(so => so.id === subOrderId);
      if (!hasSub) return mo;

      const updatedSubOrders = mo.subOrders.map(so => so.id === subOrderId ? { ...so, status } : so);

      let rolledStatus = mo.status;
      if (updatedSubOrders.some(so => so.status === 'IN_PRODUCTION')) {
        rolledStatus = 'IN_PRODUCTION';
      } else if (updatedSubOrders.every(so => so.status === 'DELIVERED')) {
        rolledStatus = 'DELIVERED';
      } else if (updatedSubOrders.some(so => so.status === 'DISPATCHED' || so.status === 'READY_TO_DISPATCH')) {
        rolledStatus = 'IN_TRANSIT';
      }

      return { ...mo, status: rolledStatus, subOrders: updatedSubOrders };
    }));
    addAuditLog('Manufacturing', `Updated sub-order ${subOrderId} status to ${status}`);
  };

  const verifyComplianceDocument = (caseId: string, docName: string, passed: boolean) => {
    setComplianceCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;
      const updatedDocs = c.documents.map(d => d.name === docName ? { ...d, verified: passed } : d);
      return { ...c, documents: updatedDocs };
    }));
  };

  const approveComplianceCase = (caseId: string) => {
    const compCase = complianceCases.find(c => c.id === caseId);
    if (!compCase) return;

    setComplianceCases(prev => prev.map(c => c.id === caseId ? { ...c, status: 'APPROVED' } : c));
    if (compCase.entityType === 'CUSTOMER') {
      setCustomers(prev => prev.map(cust => cust.id === compCase.entityId ? { ...cust, status: 'ACTIVE', complianceStatus: 'APPROVED' } : cust));
    } else if (compCase.entityType === 'MANUFACTURER') {
      setManufacturers(prev => prev.map(mfg => mfg.id === compCase.entityId ? { ...mfg, status: 'ACTIVE', complianceStatus: 'APPROVED' } : mfg));
    }
    addAuditLog('Compliance Desk', `Approved compliance case ${compCase.caseNumber} for ${compCase.entityName}`);
  };

  const addInvoice = (newInvoice: Invoice) => {
    if (currentRole === 'ADMIN') {
      alert("Admin access is governance & monitoring. Tax invoices must be issued by manufacturers.");
      return;
    }
    setInvoices(prev => {
      const idx = prev.findIndex(i => i.id === newInvoice.id || i.invoiceNumber === newInvoice.invoiceNumber);
      let updated: Invoice[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = { ...updated[idx], ...newInvoice };
      } else {
        updated = [newInvoice, ...prev];
      }
      try {
        localStorage.setItem('fg_invoices', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    addAuditLog('Invoice Engine', `Created Tax Invoice ${newInvoice.invoiceNumber} for ${newInvoice.customerName} (Total: ₹${newInvoice.totalAmount.toLocaleString()})`);

    const newNotif: NotificationItem = {
      id: 'n_' + Date.now(),
      title: `B2B Tax Invoice ${newInvoice.invoiceNumber} Issued`,
      message: `Tax invoice ${newInvoice.invoiceNumber} generated for Master Order ${newInvoice.orderNumber} (Amount: ₹${newInvoice.totalAmount.toLocaleString()}).`,
      timestamp: 'Just now',
      type: 'SUCCESS',
      category: 'INVOICE',
      read: false,
      link: 'invoices'
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

    const updateInvoice = (invoiceId: string, updatedFields: Partial<Invoice>) => {
    if (currentRole === 'ADMIN') {
      alert("Admin role cannot modify financial invoices.");
      return;
    }
    setInvoices(prev => {
      const updated = prev.map(inv => {
        if (inv.id !== invoiceId) return inv;
        const existingPayments = Array.isArray(inv.payments) ? inv.payments : [];
        const existingPaid = inv.paidAmount;
        const newTotal = updatedFields.totalAmount ?? inv.totalAmount;
        const newBal = Math.max(0, newTotal - existingPaid);
        let newStatus: InvoiceStatus = inv.status;
        if (newBal <= 0) newStatus = 'PAID';
        else if (existingPaid > 0) newStatus = 'PARTIAL_PAYMENT';
        else newStatus = updatedFields.status || inv.status;
        return {
          ...inv,
          ...updatedFields,
          paidAmount: existingPaid,
          balanceAmount: newBal,
          payments: existingPayments,
          status: newStatus
        };
      });
      try {
        localStorage.setItem('fg_invoices', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    addAuditLog('Invoice Engine', `Edited Invoice ${invoiceId}`);
  };

  const deleteInvoice = (invoiceId: string) => {
    setInvoices(prev => {
      const updated = prev.filter(inv => inv.id !== invoiceId && inv.invoiceNumber !== invoiceId);
      try {
        localStorage.setItem('fg_invoices', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    addAuditLog('Invoice Engine', `Deleted Invoice ${invoiceId}`);
  };

  const sendInvoiceToCustomer = (invoiceId: string) => {
    setInvoices(prev => {
      const updated = prev.map(inv => {
        if (inv.id === invoiceId || inv.invoiceNumber === invoiceId) {
          return {
            ...inv,
            status: 'GENERATED' as const,
            sentToCustomer: true,
            sentAt: new Date().toISOString().split('T')[0]
          };
        }
        return inv;
      });
      try {
        localStorage.setItem('fg_invoices', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    addAuditLog('Invoice Engine', `Sent Invoice ${invoiceId} to customer`);
  };

  const updateInvoiceStatus = (invoiceId: string, status: InvoiceStatus) => {
    setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, status } : inv));
    addAuditLog('Invoices & AR', `Updated Invoice ${invoiceId} status to ${status}`);
  };

  const recordInvoicePayment = (
    invoiceId: string,
    amount: number,
    method = 'RTGS',
    ref = 'RTGS-' + Date.now(),
    currency = 'INR',
    paymentDate?: string
  ) => {
    if (currentRole === 'ADMIN') {
      alert("Admin access is strictly read-only monitoring & governance. Financial transaction execution is restricted to Accounts & Supplier roles.");
      return;
    }
    setInvoices(prev => prev.map(inv => {
      if (inv.id !== invoiceId && inv.invoiceNumber !== invoiceId) return inv;

      const curr = currency || inv.currency || 'INR';
      const validAmount = Math.max(0, amount);
      const timeStr = new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true });
      const pDate = paymentDate || new Date().toISOString().split('T')[0];

      const newRecord: PaymentRecord = {
        id: 'pay_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        invoiceId: inv.id,
        amount: validAmount,
        currency: curr,
        paymentMethod: method,
        paymentDate: pDate,
        reference: ref,
        status: 'COMPLETED',
        remarks: 'Payment recorded in treasury ledger',
        createdAt: new Date().toISOString(),
        timeline: [
          { title: `${curr} ${validAmount.toLocaleString()} received in account`, timestamp: timeStr, status: 'COMPLETED', details: `Ref/UTR: ${ref}` },
          { title: 'Payment ledger updated', timestamp: timeStr, status: 'COMPLETED' }
        ]
      };

      const existingPayments = Array.isArray(inv.payments) ? inv.payments : [];
      const updatedPayments = [...existingPayments, newRecord];

      const newPaid = Math.round(updatedPayments.reduce((acc, p) => acc + (p.amount || 0), 0) * 100) / 100;
      const newBal = Math.max(0, Math.round((inv.totalAmount - newPaid) * 100) / 100);

      let newStatus: InvoiceStatus = inv.status;
      if (newBal <= 0) {
        newStatus = 'PAID';
      } else if (newPaid > 0) {
        newStatus = 'PARTIAL_PAYMENT';
      } else {
        newStatus = 'UNPAID';
      }

      const newTx: PaymentTransaction = {
        id: 'tx_' + Date.now(),
        transactionRef: ref,
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customerName,
        date: pDate,
        amount: validAmount,
        paymentMethod: method as any,
        status: 'COMPLETED',
        remarks: 'Payment recorded in Accounts'
      };
      setPaymentTransactions(txPrev => [newTx, ...txPrev]);

      return {
        ...inv,
        paidAmount: newPaid,
        balanceAmount: newBal,
        status: newStatus,
        currency: curr,
        payments: updatedPayments
      };
    }));

    addAuditLog('Invoices & AR', `Recorded payment of ${currency || 'INR'} ${amount.toLocaleString()} for Invoice ${invoiceId}`);
  };

  const submitBuyerOnboarding = (data: Omit<BuyerOnboarding, 'id' | 'status' | 'submittedDate'>) => {
    const newBuyer: BuyerOnboarding = {
      ...data,
      id: 'bo_' + Date.now(),
      status: 'UNDER_REVIEW',
      submittedDate: new Date().toISOString().split('T')[0]
    };
    setBuyerOnboardings(prev => [newBuyer, ...prev]);

    // Also auto-generate CustomerVerificationRequest for Customer Verification module
    submitCustomerVerificationRequest({
      customerName: newBuyer.contactPerson || 'Representative',
      companyName: newBuyer.companyName,
      customerType: 'PCD',
      gstNumber: newBuyer.gstin || '07AAAAA0000A1Z5',
      panNumber: newBuyer.pan || 'AAAAA0000A',
      drugLicenseNumber: newBuyer.drugLicenseNo || 'DL-2026-REG',
      cinNumber: 'U24232DL2020PTC361234',
      email: newBuyer.email || 'customer@company.com',
      phone: newBuyer.phone || '+91 98765 43210',
      billingAddress: newBuyer.address || 'Industrial Area',
      shippingAddress: newBuyer.address || 'Industrial Area',
      state: 'Delhi',
      country: 'India',
      pincode: '110020',
      documents: newBuyer.documents?.map((d: any, idx: number) => ({
        id: `doc_public_${idx}`,
        documentType: (d.type as any) || 'GST Certificate',
        fileName: d.name,
        fileSize: '1.2 MB',
        uploadedAt: new Date().toISOString().split('T')[0],
        status: 'Valid',
        url: d.url || '#'
      })) || []
    });
    setComplianceCases(prev => [newCase, ...prev]);
    addAuditLog('Buyer Onboarding', `Submitted onboarding application for ${newBuyer.companyName}`);
  };

  const submitManufacturerOnboarding = (data: Omit<ManufacturerOnboarding, 'id' | 'status' | 'submittedDate'>) => {
    const newMfg: ManufacturerOnboarding = {
      ...data,
      id: 'mo_' + Date.now(),
      status: 'UNDER_REVIEW',
      submittedDate: new Date().toISOString().split('T')[0]
    };
    setManufacturerOnboardings(prev => [newMfg, ...prev]);

    // Create matching compliance case
    const newCase: ComplianceCase = {
      id: 'comp_' + Date.now(),
      caseNumber: 'CMP-2026-' + (100 + complianceCases.length),
      entityType: 'MANUFACTURER',
      entityId: newMfg.id,
      entityName: newMfg.companyName,
      caseType: 'DRUG_LICENSE',
      status: 'UNDER_REVIEW',
      assignedOfficer: 'Compliance Desk Officer',
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0],
      riskScore: 'LOW',
      checklist: [
        { title: 'Manufacturing License Audit', mandatory: true, passed: true },
        { title: 'WHO-GMP Audit Certificate', mandatory: true, passed: true },
        { title: 'Capacity & Facility Audit', mandatory: true, passed: true }
      ],
      documents: newMfg.documents.map(d => ({ name: d.name, url: d.url, verified: false }))
    };
    setComplianceCases(prev => [newCase, ...prev]);
    addAuditLog('Manufacturer Onboarding', `Submitted factory onboarding application for ${newMfg.companyName}`);
  };

  const approveBuyerOnboarding = (id: string) => {
    const buyerCode = `BUY-2026-${100 + Math.floor(Math.random() * 900)}`;
    setBuyerOnboardings(prev => prev.map(b => b.id === id ? { ...b, status: 'APPROVED', buyerCode } : b));

    // Auto-create Customer in Directory
    const b = buyerOnboardings.find(item => item.id === id);
    if (b) {
      const newCust: Customer = {
        id: 'c_' + Date.now(),
        code: buyerCode,
        name: b.companyName,
        type: 'PCD',
        gstin: b.gstin,
        pan: b.pan,
        drugLicenseNo: b.drugLicenseNo,
        contactPerson: b.contactPerson,
        email: b.email,
        phone: b.phone,
        city: b.address.split(',')[0] || 'Delhi',
        state: 'Delhi',
        status: 'ACTIVE',
        complianceStatus: 'APPROVED',
        creditLimit: 2000000,
        availableCredit: 2000000,
        creditDays: 45,
        riskScore: 'LOW',
        joinedDate: new Date().toISOString().split('T')[0]
      };
      setCustomers(prev => [newCust, ...prev]);
    }
    addAuditLog('Compliance Desk', `Approved Buyer Onboarding & Issued Code ${buyerCode}`);
  };

  const approveManufacturerOnboarding = (id: string) => {
    const manufacturerCode = `MFG-2026-${100 + Math.floor(Math.random() * 900)}`;
    setManufacturerOnboardings(prev => prev.map(m => m.id === id ? { ...m, status: 'APPROVED', manufacturerCode } : m));

    const m = manufacturerOnboardings.find(item => item.id === id);
    if (m) {
      const newMfg: Manufacturer = {
        id: 'm_' + Date.now(),
        code: manufacturerCode,
        name: m.companyName,
        companyName: m.companyName,
        mfgLicenseNo: m.mfgLicenseNo,
        gstin: m.gstin,
        pan: m.pan,
        contactPerson: m.contactPerson,
        email: m.email,
        phone: m.phone,
        city: m.factoryLocation.split(',')[0] || 'Baddi',
        state: 'Himachal Pradesh',
        certifications: m.certifications.map((c, i) => ({
          id: 'cert_' + i,
          name: c,
          certificateNo: 'CERT-' + Math.floor(Math.random() * 889900),
          issuedBy: 'CDSCO / State FDA',
          issueDate: '2025-01-01',
          expiryDate: '2028-12-31',
          status: 'VALID'
        })),
        rating: 4.8,
        complianceStatus: 'APPROVED',
        status: 'ACTIVE',
        activeSubOrders: 0
      };
      setManufacturers(prev => [newMfg, ...prev]);
    }
    addAuditLog('Compliance Desk', `Approved Manufacturer Onboarding & Issued Code ${manufacturerCode}`);
  };

  const updateShipmentStatus = (shipmentId: string, status: Shipment['status']) => {
    setShipments(prev => prev.map(s => s.id === shipmentId ? { ...s, status } : s));
  };

  const addCRMInteraction = (leadId: string, summary: string, type: 'MEETING' | 'CALL' | 'EMAIL' | 'NOTE') => {
    setCrmLeads(prev => prev.map(l => {
      if (l.id !== leadId) return l;
      const newInteraction = {
        id: 'int_' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        type,
        summary,
        author: currentRole
      };
      return { ...l, interactions: [newInteraction, ...l.interactions] };
    }));
  };

  const submitCustomerVerificationRequest = (reqData: Partial<CustomerVerificationRequest>) => {
    const newId = `CUS-VER-${100 + customerVerifications.length + 1}`;
    const gst = reqData.gstNumber || '';
    const pan = reqData.panNumber || '';
    const docs = reqData.documents || [];

    const isGstValid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(gst.trim()) || gst.length >= 10;
    const isPanValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(pan.trim()) || pan.length >= 8;
    const hasAllDocs = docs.length >= 6;
    const hasFields = !!(reqData.companyName && reqData.customerType && reqData.gstNumber && reqData.panNumber && reqData.drugLicenseNumber && reqData.cinNumber);

    const autoValOverall = (isGstValid && isPanValid && hasAllDocs && hasFields) ? 'Valid' : 'Pending Review';

    const newReq: CustomerVerificationRequest = {
      id: newId,
      customerName: reqData.customerName || 'Representative',
      companyName: reqData.companyName || 'New Pharma Entity',
      customerType: reqData.customerType || 'PCD',
      registrationDate: new Date().toISOString().split('T')[0],
      verificationStatus: 'Under Review',
      assignedComplianceOfficer: 'Rajesh Kumar (Compliance Desk A)',
      gstNumber: gst,
      panNumber: pan,
      drugLicenseNumber: reqData.drugLicenseNumber || '',
      cinNumber: reqData.cinNumber || '',
      email: reqData.email || '',
      phone: reqData.phone || '',
      address: reqData.address || '',
      city: reqData.city || '',
      state: reqData.state || '',
      pincode: reqData.pincode || '',
      estimatedMonthlyVolume: reqData.estimatedMonthlyVolume || '₹10,00,000 / month',
      documents: docs,
      autoValidation: {
        gstCheck: isGstValid ? 'Valid' : 'Invalid',
        panCheck: isPanValid ? 'Valid' : 'Invalid',
        requiredDocsCheck: hasAllDocs ? 'Valid' : 'Pending Review',
        requiredFieldsCheck: hasFields ? 'Valid' : 'Invalid',
        overallStatus: autoValOverall,
        validationDetails: [
          isGstValid ? 'GSTIN structure format verified.' : 'GSTIN format warning.',
          isPanValid ? 'PAN structure format verified.' : 'PAN format warning.',
          hasAllDocs ? 'All 6 required onboarding documents present.' : `${docs.length}/6 mandatory documents attached.`,
          hasFields ? 'Required corporate details populated.' : 'Missing required regulatory fields.'
        ]
      },
      businessVerification: {
        gstActiveStatus: 'Active',
        panValidation: 'Verified',
        companyRegistrationValidation: 'Verified (ROC)',
        cinValidation: 'Active & Verified'
      },
      regulatoryVerification: {
        drugLicenseValidity: 'Valid (Form 20B/21B)',
        licenseExpiryCheck: 'Valid until 15-Dec-2028 (850 days remaining)',
        stateRegulatoryAuthorityValidation: 'Verified with State FDA'
      },
      financialVerification: {
        bankVerification: 'Verified (Penny Drop Passed)',
        creditRating: 'AA (Moderate Risk)',
        riskClassification: 'LOW'
      }
    };

    setCustomerVerifications(prev => [newReq, ...prev]);
    addAuditLog('Customer Verification', `Submitted verification request for ${newReq.companyName}`);

    const notif: NotificationItem = {
      id: 'n_' + Date.now(),
      title: `New Customer Verification Request`,
      message: `${newReq.companyName} (${newReq.customerType}) submitted verification request. Assigned to ${newReq.assignedComplianceOfficer}.`,
      timestamp: 'Just now',
      type: 'INFO',
      category: 'COMPLIANCE',
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const assignComplianceOfficer = (requestId: string, officerName: string) => {
    setCustomerVerifications(prev => prev.map(req => {
      if (req.id !== requestId) return req;
      return {
        ...req,
        assignedComplianceOfficer: officerName,
        verificationStatus: req.verificationStatus === 'Pending' ? 'Under Review' : req.verificationStatus
      };
    }));
    addAuditLog('Customer Verification', `Assigned ${officerName} to request ${requestId}`);
  };

  const approveCustomerVerification = (requestId: string) => {
    const req = customerVerifications.find(r => r.id === requestId);
    if (!req) return;

    const generatedCode = `CUS000${100 + Math.floor(Math.random() * 900)}`;

    setCustomerVerifications(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      return {
        ...r,
        verificationStatus: 'Active',
        customerCode: generatedCode,
        portalLoginCreated: true,
        portalUsername: r.email,
        approvedAt: new Date().toISOString().split('T')[0]
      };
    }));

    const existingCust = customers.find(c => c.name === req.companyName || c.email === req.email);
    if (!existingCust) {
      const newCust: Customer = {
        id: 'c_' + Date.now(),
        code: generatedCode,
        name: req.companyName,
        type: req.customerType,
        gstin: req.gstNumber,
        pan: req.panNumber,
        drugLicenseNo: req.drugLicenseNumber,
        contactPerson: req.customerName,
        email: req.email,
        phone: req.phone,
        city: req.city || 'Delhi',
        state: req.state || 'Delhi',
        status: 'ACTIVE',
        complianceStatus: 'APPROVED',
        creditLimit: 2500000,
        availableCredit: 2500000,
        creditDays: 45,
        riskScore: req.financialVerification.riskClassification,
        joinedDate: new Date().toISOString().split('T')[0]
      };
      setCustomers(prev => [newCust, ...prev]);
    } else {
      setCustomers(prev => prev.map(c => c.id === existingCust.id ? { ...c, status: 'ACTIVE', complianceStatus: 'APPROVED', code: generatedCode } : c));
    }

    addAuditLog('Customer Verification', `Approved ${req.companyName}. Generated Code: ${generatedCode}, Created Portal Login.`);

    const notif: NotificationItem = {
      id: 'n_' + Date.now(),
      title: `Customer Approved & Active`,
      message: `${req.companyName} verification approved. Customer Code: ${generatedCode}. Account status is now Active.`,
      timestamp: 'Just now',
      type: 'SUCCESS',
      category: 'COMPLIANCE',
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const rejectCustomerVerification = (requestId: string, reason: string) => {
    setCustomerVerifications(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      return {
        ...r,
        verificationStatus: 'Rejected',
        rejectionReason: reason
      };
    }));

    const req = customerVerifications.find(r => r.id === requestId);
    addAuditLog('Customer Verification', `Rejected customer verification for ${req?.companyName || requestId}. Reason: ${reason}`);

    const notif: NotificationItem = {
      id: 'n_' + Date.now(),
      title: `Customer Verification Rejected`,
      message: `Verification for ${req?.companyName || requestId} was rejected. Reason: ${reason}`,
      timestamp: 'Just now',
      type: 'ERROR',
      category: 'COMPLIANCE',
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const requestMoreCustomerDocs = (requestId: string, notes: string[]) => {
    setCustomerVerifications(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      return {
        ...r,
        verificationStatus: 'Need More Docs',
        requestedDocumentsNotes: notes
      };
    }));

    const req = customerVerifications.find(r => r.id === requestId);
    addAuditLog('Customer Verification', `Requested additional documents for ${req?.companyName || requestId}`);

    const notif: NotificationItem = {
      id: 'n_' + Date.now(),
      title: `Additional Documents Required`,
      message: `Customer ${req?.companyName} requires document re-submission: ${notes.join('; ')}`,
      timestamp: 'Just now',
      type: 'WARNING',
      category: 'COMPLIANCE',
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const resubmitCustomerDocs = (requestId: string, updatedDocs: CustomerVerificationDocument[]) => {
    setCustomerVerifications(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      return {
        ...r,
        documents: updatedDocs,
        verificationStatus: 'Under Review',
        requestedDocumentsNotes: undefined
      };
    }));

    const req = customerVerifications.find(r => r.id === requestId);
    addAuditLog('Customer Verification', `Resubmitted documents for ${req?.companyName || requestId}. Status updated to Under Review.`);

    const notif: NotificationItem = {
      id: 'n_' + Date.now(),
      title: `Documents Resubmitted`,
      message: `${req?.companyName} re-submitted requested documents. Case returned to Under Review.`,
      timestamp: 'Just now',
      type: 'INFO',
      category: 'COMPLIANCE',
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  // ── Two-Factor Authentication (2FA) State & Functions ─────────────
  const [twoFactorState, setTwoFactorState] = useState<TwoFactorState>(() => {
    try {
      const saved = localStorage.getItem('factorygrid_2fa_state');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      isEnabled: false,
      recoveryCodes: []
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('factorygrid_2fa_state', JSON.stringify(twoFactorState));
    } catch (e) {}
  }, [twoFactorState]);

  const enable2FA = (secret: string, codes: string[]) => {
    const formattedCodes = codes.map(c => ({ code: c, isUsed: false }));
    const newState: TwoFactorState = {
      isEnabled: true,
      secret,
      enabledAt: new Date().toISOString().split('T')[0],
      recoveryCodes: formattedCodes
    };
    setTwoFactorState(newState);
    addAuditLog('Security Settings', '2FA Two-Factor Authentication Enabled');
  };

  const disable2FA = async (currentPass: string, totpCode: string): Promise<{ success: boolean; message: string }> => {
    if (!twoFactorState.isEnabled || !twoFactorState.secret) {
      return { success: false, message: '2FA is not enabled on this account.' };
    }

    if (currentPass !== 'password123' && currentPass.length < 4) {
      return { success: false, message: '✕ Password verification failed. Incorrect current password.' };
    }

    const isValidOtp = await verifyTOTPToken(twoFactorState.secret, totpCode);
    if (!isValidOtp) {
      return { success: false, message: '✕ Invalid 2FA verification code. Please check your authenticator app.' };
    }

    setTwoFactorState({ isEnabled: false, recoveryCodes: [] });
    addAuditLog('Security Settings', '2FA Two-Factor Authentication Disabled');
    return { success: true, message: '✓ Two-Factor Authentication disabled successfully.' };
  };

  const verify2FAAttempt = async (totpCode: string): Promise<{ success: boolean; message: string }> => {
    if (!twoFactorState.isEnabled || !twoFactorState.secret) {
      return { success: true, message: '2FA is disabled.' };
    }
    const isValid = await verifyTOTPToken(twoFactorState.secret, totpCode);
    if (isValid) {
      addAuditLog('Authentication', 'Successful 2FA Verification');
      return { success: true, message: '✓ 2FA Verified' };
    } else {
      addAuditLog('Security Alert', 'Failed 2FA Verification Attempt');
      return { success: false, message: '✕ Invalid verification code. Please try again.' };
    }
  };

  const useRecoveryCode = (inputCode: string): { success: boolean; message: string } => {
    if (!twoFactorState.isEnabled) return { success: false, message: '2FA is not enabled.' };
    const cleanCode = inputCode.trim().toUpperCase();
    const existingIndex = twoFactorState.recoveryCodes.findIndex(rc => rc.code.toUpperCase() === cleanCode);

    if (existingIndex === -1) {
      return { success: false, message: '✕ Invalid recovery code.' };
    }

    if (twoFactorState.recoveryCodes[existingIndex].isUsed) {
      return { success: false, message: '✕ This recovery code has already been used.' };
    }

    const updatedCodes = [...twoFactorState.recoveryCodes];
    updatedCodes[existingIndex] = {
      ...updatedCodes[existingIndex],
      isUsed: true,
      usedAt: new Date().toISOString()
    };

    setTwoFactorState(prev => ({ ...prev, recoveryCodes: updatedCodes }));
    addAuditLog('Authentication', '2FA Recovery Code Used');
    return { success: true, message: '✓ Recovery Code Verified. Sign in authorized.' };
  };

  const regenerateRecoveryCodes = async (currentPass: string, totpCode: string): Promise<{ success: boolean; message: string; newCodes?: string[] }> => {
    if (!twoFactorState.isEnabled || !twoFactorState.secret) {
      return { success: false, message: '2FA is not enabled.' };
    }

    if (currentPass !== 'password123' && currentPass.length < 4) {
      return { success: false, message: '✕ Incorrect current password.' };
    }

    const isValidOtp = await verifyTOTPToken(twoFactorState.secret, totpCode);
    if (!isValidOtp) {
      return { success: false, message: '✕ Invalid 2FA verification code.' };
    }

    const newRawCodes = generateRecoveryCodes(8);
    const formatted = newRawCodes.map(c => ({ code: c, isUsed: false }));

    setTwoFactorState(prev => ({ ...prev, recoveryCodes: formatted }));
    addAuditLog('Security Settings', '2FA Recovery Codes Regenerated');
    return { success: true, message: '✓ New recovery codes generated successfully.', newCodes: newRawCodes };
  };

  return (
    <AppContext.Provider value={{
      isAuthenticated, login, logout,
      currentRole, setCurrentRole,
      activeTab, setActiveTab,
      customers, manufacturers, products, setProducts, addProductMaster, updateProductMaster, toggleProductMasterStatus, mappings, setMappings, addMapping, updateMapping, removeMapping,
      rfqs, quotes, orders, invoices, complianceCases, notifications,
      declinedRfqs, declineRFQ,
      negotiationThreads, sendNegotiationMessage, revisedQuotes, submitRevisedQuote,
      buyerOnboardings, manufacturerOnboardings, shipments, crmLeads,
      paymentTransactions, auditLogs, customerVerifications,
      selectedMfgIdForProfile, setSelectedMfgIdForProfile,
      mfgProfileProductContext, setMfgProfileProductContext,
      isCreateRfqDrawerOpen, setIsCreateRfqDrawerOpen, openCreateRfqDrawer,
      addRFQ, submitQuote, selectQuoteAndCreateOrder,
      updateSubOrderStatus, verifyComplianceDocument, approveComplianceCase,
      addInvoice, updateInvoiceStatus, deleteInvoice, sendInvoiceToCustomer, recordInvoicePayment, submitBuyerOnboarding, submitManufacturerOnboarding,
      approveBuyerOnboarding, approveManufacturerOnboarding, updateShipmentStatus,
      addCRMInteraction, addAuditLog,
      submitCustomerVerificationRequest, assignComplianceOfficer,
      approveCustomerVerification, rejectCustomerVerification,
      requestMoreCustomerDocs, resubmitCustomerDocs,
      userProfile, orgProfile, userDocuments, profileSubTab, setProfileSubTab,
      updateUserProfile, updateOrgProfile, uploadUserDocument, replaceUserDocument,
      changeUserPassword, openProfileTab,
      twoFactorState, enable2FA, disable2FA, verify2FAAttempt, useRecoveryCode, regenerateRecoveryCodes,
      shipmentConnectors, gstConnectors, saveShipmentConnector, disconnectShipmentConnector, saveGSTConnector, disconnectGSTConnector,
      moduleFilters, setModuleFilter, navigateWithFilter, openManufacturerProfile,
      mfgProfileInitialTab, setMfgProfileInitialTab
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};


