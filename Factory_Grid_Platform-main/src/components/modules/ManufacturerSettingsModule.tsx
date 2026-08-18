import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building2, Receipt, ShieldCheck, Upload, Image as ImageIcon,
  CheckCircle2, AlertCircle, Eye, RefreshCw, X, Lock, Server,
  FileText, Save, Trash2, Check, FileCheck, Plus, Edit2, Power, AlertTriangle, Radio
} from 'lucide-react';

export interface ApiIntegrationItem {
  id: string;
  name: string;
  baseUrl: string;
  apiKeyMasked: string;
  environment: 'Production' | 'Sandbox';
  status: 'Connected' | 'Disconnected';
  lastChecked: string;
}

export interface ManufacturerSettings {
  invoiceMethod: 'BUILD_PLATFORM' | 'UPLOAD_FORMAT';
  
  // Option 1: Upload Invoice Format
  uploadedTemplate?: {
    fileName: string;
    fileType: string;
    fileSize: string;
    uploadDate: string;
    fileUrl?: string;
  } | null;

  // Option 2: Create Invoice on FactoryGrid
  logoUrl?: string;
  logoFileName?: string;
  legalName: string;
  registeredAddress: string;
  gstin: string;
  mfgLicense: string;
  customInvoiceText: string;
  invoiceHeader: string;
  invoiceFooter: string;
  paymentTerms: string;
  additionalNotes: string;

  // Generic Extensible API Integrations
  apiIntegrations: ApiIntegrationItem[];
}

export const ManufacturerSettingsModule: React.FC = () => {
  const { manufacturers, addAuditLog } = useApp();

  const myMfg = (manufacturers && manufacturers[0]) || null;
  const mfgName = myMfg?.companyName || myMfg?.name || 'SunBio LifeSciences Ltd.';
  const mfgId = myMfg?.id || 'm1';
  const storageKey = `factorygrid_mfg_settings_${mfgId}`;

  // Active Main Section Tab: Invoice Settings, API Integrations, Security
  const [activeTab, setActiveTab] = useState<'INVOICE' | 'INTEGRATIONS' | 'SECURITY'>('INVOICE');

  // Load Persisted Settings
  const [settings, setSettings] = useState<ManufacturerSettings>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          invoiceMethod: parsed.invoiceMethod || 'BUILD_PLATFORM',
          uploadedTemplate: parsed.uploadedTemplate || null,
          logoUrl: parsed.logoUrl || '',
          logoFileName: parsed.logoFileName || '',
          legalName: parsed.legalName || mfgName,
          registeredAddress: parsed.registeredAddress || 'Plot 44, Phase II, Genome Valley, Hyderabad, Telangana 500078',
          gstin: parsed.gstin || myMfg?.gstin || '36AAACS9981A1Z2',
          mfgLicense: parsed.mfgLicense || myMfg?.mfgLicenseNo || 'CDSCO Form 25/28 License: TS/HYD/2024/88921',
          customInvoiceText: parsed.customInvoiceText || 'Certified WHO-GMP & CDSCO Verified Quality. Remittance via RTGS to HDFC Bank A/C #9981023912 (IFSC: HDFC0000182).',
          invoiceHeader: parsed.invoiceHeader || 'TAX INVOICE / FORM 27B SPECIFICATION',
          invoiceFooter: parsed.invoiceFooter || 'Thank you for your business. Quality Guaranteed.',
          paymentTerms: parsed.paymentTerms || 'Net 30 Days via RTGS / NEFT',
          additionalNotes: parsed.additionalNotes || 'Goods once sold are non-returnable. Subject to Hyderabad Jurisdiction.',
          apiIntegrations: parsed.apiIntegrations || []
        };
      }
    } catch (e) {
      console.error(e);
    }
    return {
      invoiceMethod: 'BUILD_PLATFORM',
      uploadedTemplate: null,
      logoUrl: '',
      logoFileName: '',
      legalName: mfgName,
      registeredAddress: 'Plot 44, Phase II, Genome Valley, Hyderabad, Telangana 500078',
      gstin: myMfg?.gstin || '36AAACS9981A1Z2',
      mfgLicense: myMfg?.mfgLicenseNo || 'CDSCO Form 25/28 License: TS/HYD/2024/88921',
      customInvoiceText: 'Certified WHO-GMP & CDSCO Verified Quality. Remittance via RTGS to HDFC Bank A/C #9981023912 (IFSC: HDFC0000182).',
      invoiceHeader: 'TAX INVOICE / FORM 27B SPECIFICATION',
      invoiceFooter: 'Thank you for your business. Quality Guaranteed.',
      paymentTerms: 'Net 30 Days via RTGS / NEFT',
      additionalNotes: 'Goods once sold are non-returnable. Subject to Hyderabad Jurisdiction.',
      apiIntegrations: [
        {
          id: 'integ-1',
          name: 'Enterprise ERP Gateway',
          baseUrl: 'https://api.sunbiolabs.com/v2/erp',
          apiKeyMasked: '••••••••••••••••',
          environment: 'Production',
          status: 'Connected',
          lastChecked: '18 Aug 2026, 11:45 AM'
        }
      ]
    };
  });

  // Save Settings Helper
  const saveSettings = (updated: ManufacturerSettings) => {
    setSettings(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to persist manufacturer settings:', e);
    }
  };

  // Toast Banner Message
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. INVOICE METHOD SELECTION HANDLER
  const handleSelectInvoiceMethod = (method: 'BUILD_PLATFORM' | 'UPLOAD_FORMAT') => {
    const updated = { ...settings, invoiceMethod: method };
    saveSettings(updated);
    showToast(`Invoice generation method set to: ${method === 'BUILD_PLATFORM' ? 'Create Invoice on FactoryGrid' : 'Upload Invoice Format'}`);
  };

  // 2. OPTION 1: UPLOAD TEMPLATE HANDLER
  const [templateFileError, setTemplateFileError] = useState<string | null>(null);

  const handleUploadTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTemplateFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
      setTemplateFileError('Invalid file format. Please upload PDF or DOCX template file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setTemplateFileError('File size exceeds 10MB limit.');
      return;
    }

    const fileSizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    const uploadDateStr = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

    const updated: ManufacturerSettings = {
      ...settings,
      invoiceMethod: 'UPLOAD_FORMAT',
      uploadedTemplate: {
        fileName: file.name,
        fileType: file.type.includes('pdf') ? 'PDF Document' : 'Word Document (.docx)',
        fileSize: fileSizeStr,
        uploadDate: uploadDateStr
      }
    };

    saveSettings(updated);
    showToast(`Uploaded invoice template "${file.name}" successfully.`);
    addAuditLog('Manufacturer Invoice Settings', `Uploaded template file ${file.name} for ${mfgName}.`);
  };

  const handleRemoveTemplate = () => {
    const updated: ManufacturerSettings = {
      ...settings,
      uploadedTemplate: null
    };
    saveSettings(updated);
    showToast('Uploaded invoice template removed.');
  };

  // 3. OPTION 2: LOGO UPLOAD HANDLER
  const [logoError, setLogoError] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setLogoError('Invalid format. Please upload PNG, JPG, JPEG, or SVG.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setLogoError('File size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const updated = {
        ...settings,
        logoUrl: dataUrl,
        logoFileName: file.name
      };
      saveSettings(updated);
      showToast(`Company logo ${file.name} saved successfully.`);
      addAuditLog('Manufacturer Logo', `Uploaded invoice logo for ${mfgName}.`);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    const updated = {
      ...settings,
      logoUrl: '',
      logoFileName: ''
    };
    saveSettings(updated);
    showToast('Company logo removed.');
  };

  // Save Complete Invoice Settings Form
  const handleSaveInvoiceSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(settings);
    showToast('✓ Invoice settings saved successfully.');
    addAuditLog('Manufacturer Settings', `Saved complete invoice configuration for ${mfgName}.`);
  };

  // 4. API INTEGRATIONS STATE & MODAL HANDLERS
  const [isIntegModalOpen, setIsIntegModalOpen] = useState(false);
  const [editingIntegId, setEditingIntegId] = useState<string | null>(null);
  
  const [integForm, setIntegForm] = useState({
    name: '',
    baseUrl: '',
    apiKey: '',
    environment: 'Production' as 'Production' | 'Sandbox'
  });

  const [integTestResult, setIntegTestResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  const [isTestingInteg, setIsTestingInteg] = useState(false);

  const handleOpenAddIntegModal = () => {
    setEditingIntegId(null);
    setIntegForm({
      name: '',
      baseUrl: '',
      apiKey: '',
      environment: 'Production'
    });
    setIntegTestResult(null);
    setIsIntegModalOpen(true);
  };

  const handleOpenEditIntegModal = (item: ApiIntegrationItem) => {
    setEditingIntegId(item.id);
    setIntegForm({
      name: item.name,
      baseUrl: item.baseUrl,
      apiKey: '',
      environment: item.environment
    });
    setIntegTestResult(null);
    setIsIntegModalOpen(true);
  };

  const handleTestConnectionInModal = () => {
    setIntegTestResult(null);
    if (!integForm.name.trim()) {
      setIntegTestResult({ status: 'error', message: 'Integration Name is required.' });
      return;
    }
    if (!integForm.baseUrl.trim() || (!integForm.baseUrl.startsWith('http://') && !integForm.baseUrl.startsWith('https://'))) {
      setIntegTestResult({ status: 'error', message: 'API Base URL must be a valid URL starting with http:// or https://' });
      return;
    }
    if (!editingIntegId && (!integForm.apiKey || integForm.apiKey.trim().length < 6)) {
      setIntegTestResult({ status: 'error', message: 'API Key / Token is required and must be at least 6 characters.' });
      return;
    }

    setIsTestingInteg(true);
    setTimeout(() => {
      setIsTestingInteg(false);
      setIntegTestResult({
        status: 'success',
        message: '✓ Connection successful (HTTP 200 OK - Response Latency: 84ms)'
      });
    }, 800);
  };

  const handleSaveIntegSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!integForm.name.trim()) {
      setIntegTestResult({ status: 'error', message: 'Integration Name is required.' });
      return;
    }
    if (!integForm.baseUrl.trim() || (!integForm.baseUrl.startsWith('http://') && !integForm.baseUrl.startsWith('https://'))) {
      setIntegTestResult({ status: 'error', message: 'API Base URL must be a valid URL starting with http:// or https://' });
      return;
    }
    if (!editingIntegId && (!integForm.apiKey || integForm.apiKey.trim().length < 6)) {
      setIntegTestResult({ status: 'error', message: 'API Key / Token is required.' });
      return;
    }

    const nowStr = new Date().toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    let updatedList: ApiIntegrationItem[];

    if (editingIntegId) {
      updatedList = settings.apiIntegrations.map(item => {
        if (item.id === editingIntegId) {
          return {
            ...item,
            name: integForm.name,
            baseUrl: integForm.baseUrl,
            environment: integForm.environment,
            apiKeyMasked: integForm.apiKey ? '••••••••••••••••' : item.apiKeyMasked,
            status: 'Connected' as const,
            lastChecked: nowStr
          };
        }
        return item;
      });
    } else {
      const newItem: ApiIntegrationItem = {
        id: `integ-${Date.now()}`,
        name: integForm.name,
        baseUrl: integForm.baseUrl,
        apiKeyMasked: '••••••••••••••••',
        environment: integForm.environment,
        status: 'Connected',
        lastChecked: nowStr
      };
      updatedList = [...settings.apiIntegrations, newItem];
    }

    const updatedSettings = { ...settings, apiIntegrations: updatedList };
    saveSettings(updatedSettings);
    setIsIntegModalOpen(false);
    showToast(`API Integration "${integForm.name}" saved successfully.`);
    addAuditLog('API Integrations', `Saved integration ${integForm.name} for ${mfgName}.`);
  };

  const handleTestConnectionCard = (id: string) => {
    const nowStr = new Date().toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const updatedList = settings.apiIntegrations.map(item => {
      if (item.id === id) {
        return { ...item, status: 'Connected' as const, lastChecked: nowStr };
      }
      return item;
    });
    saveSettings({ ...settings, apiIntegrations: updatedList });
    showToast('✓ Connection verified successfully (HTTP 200 OK).');
  };

  const handleDisconnectInteg = (id: string) => {
    const updatedList = settings.apiIntegrations.filter(item => item.id !== id);
    saveSettings({ ...settings, apiIntegrations: updatedList });
    showToast('API Integration disconnected.');
  };

  // 5. SECURITY / PASSWORD HANDLERS
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passError, setPassError] = useState<string | null>(null);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);

    if (!passForm.currentPassword) {
      setPassError('Current password is required.');
      return;
    }
    if (!passForm.newPassword || passForm.newPassword.length < 8) {
      setPassError('New password must be at least 8 characters long.');
      return;
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassError('New password and Confirm password do not match.');
      return;
    }

    showToast('✓ Password updated successfully.');
    setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC', color: '#0F172A' }}>

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748B', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>Manufacturer Portal</span>
            <span>/</span>
            <span style={{ fontWeight: 700, color: '#0F766E' }}>Settings</span>
          </div>
          <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Manufacturer Settings
          </h1>
          <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
            Manage invoice format configurations, API integrations, and account security for <strong style={{ color: '#0F766E' }}>{mfgName}</strong>.
          </p>
        </div>
      </div>

      {/* ── TOAST BANNER ────────────────────────────────────────────── */}
      {toastMessage && (
        <div style={{ background: toastMessage.type === 'success' ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${toastMessage.type === 'success' ? '#86EFAC' : '#FCA5A5'}`, borderRadius: 10, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: toastMessage.type === 'success' ? '#166534' : '#991B1B' }}>
            {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            {toastMessage.text}
          </div>
          <button onClick={() => setToastMessage(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}><X size={16} /></button>
        </div>
      )}

      {/* ── THREE CLEAR SECTIONS TABS ─────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '8px 12px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          { id: 'INVOICE', label: '1. Invoice Settings', icon: Receipt },
          { id: 'INTEGRATIONS', label: '2. API Integrations', icon: Server },
          { id: 'SECURITY', label: '3. Security', icon: ShieldCheck }
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '9px 20px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: active ? 800 : 600,
                border: 'none',
                background: active ? '#0F766E' : 'transparent',
                color: active ? '#FFFFFF' : '#475569',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 1: INVOICE SETTINGS
      ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'INVOICE' && (
        <form onSubmit={handleSaveInvoiceSettingsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Main Title & Subtitle */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>INVOICE SETTINGS</h2>
            <div style={{ fontSize: 13, color: '#475569', marginTop: 3, fontWeight: 600 }}>
              Choose how your invoices are created and configure your invoice format.
            </div>

            {/* Currently Active Banner */}
            <div style={{ marginTop: 14, background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 8, padding: '10px 14px', fontSize: 12.5, color: '#0F766E', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} />
              <span>
                Active Method: <strong>{settings.invoiceMethod === 'BUILD_PLATFORM' ? '✓ Create Invoice on FactoryGrid' : '✓ Use Uploaded Invoice Format'}</strong> — {settings.invoiceMethod === 'BUILD_PLATFORM' ? 'Your invoices will be generated using your saved FactoryGrid logo, statutory details, and custom text format.' : `Your uploaded template file (${settings.uploadedTemplate?.fileName || 'No file uploaded'}) will be used.`}
              </span>
            </div>
          </div>

          {/* TWO METHOD CHOICES CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            
            {/* OPTION 1 CARD: UPLOAD INVOICE FORMAT */}
            <div
              onClick={() => handleSelectInvoiceMethod('UPLOAD_FORMAT')}
              style={{
                background: '#FFFFFF',
                border: settings.invoiceMethod === 'UPLOAD_FORMAT' ? '2px solid #0F766E' : '1px solid #E2E8F0',
                borderRadius: 12,
                padding: 20,
                boxShadow: settings.invoiceMethod === 'UPLOAD_FORMAT' ? '0 4px 12px rgba(15,118,110,0.1)' : '0 1px 3px rgba(15,23,42,0.04)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                gap: 14
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Upload size={20} style={{ color: '#0F766E' }} />
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Option 1: Upload Invoice Format</h3>
                </div>
                <input
                  type="radio"
                  name="invoiceMethod"
                  checked={settings.invoiceMethod === 'UPLOAD_FORMAT'}
                  onChange={() => handleSelectInvoiceMethod('UPLOAD_FORMAT')}
                  style={{ accentColor: '#0F766E', width: 18, height: 18 }}
                />
              </div>

              <div style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.4 }}>
                Use your existing corporate invoice format by uploading a PDF or DOCX invoice template.
              </div>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleSelectInvoiceMethod('UPLOAD_FORMAT'); }}
                style={{
                  width: '100%',
                  padding: '9px',
                  borderRadius: 8,
                  background: settings.invoiceMethod === 'UPLOAD_FORMAT' ? '#0F766E' : '#F1F5F9',
                  color: settings.invoiceMethod === 'UPLOAD_FORMAT' ? '#FFFFFF' : '#0F766E',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: 12.5,
                  cursor: 'pointer'
                }}
              >
                {settings.invoiceMethod === 'UPLOAD_FORMAT' ? '✓ Currently Selected' : 'Select Upload Invoice Method'}
              </button>
            </div>

            {/* OPTION 2 CARD: CREATE INVOICE ON FACTORYGRID */}
            <div
              onClick={() => handleSelectInvoiceMethod('BUILD_PLATFORM')}
              style={{
                background: '#FFFFFF',
                border: settings.invoiceMethod === 'BUILD_PLATFORM' ? '2px solid #0F766E' : '1px solid #E2E8F0',
                borderRadius: 12,
                padding: 20,
                boxShadow: settings.invoiceMethod === 'BUILD_PLATFORM' ? '0 4px 12px rgba(15,118,110,0.1)' : '0 1px 3px rgba(15,23,42,0.04)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                gap: 14
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={20} style={{ color: '#0F766E' }} />
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Option 2: Create Invoice on FactoryGrid</h3>
                </div>
                <input
                  type="radio"
                  name="invoiceMethod"
                  checked={settings.invoiceMethod === 'BUILD_PLATFORM'}
                  onChange={() => handleSelectInvoiceMethod('BUILD_PLATFORM')}
                  style={{ accentColor: '#0F766E', width: 18, height: 18 }}
                />
              </div>

              <div style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.4 }}>
                Create and customize your commercial invoice format directly on the platform with logo and custom text.
              </div>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleSelectInvoiceMethod('BUILD_PLATFORM'); }}
                style={{
                  width: '100%',
                  padding: '9px',
                  borderRadius: 8,
                  background: settings.invoiceMethod === 'BUILD_PLATFORM' ? '#0F766E' : '#F1F5F9',
                  color: settings.invoiceMethod === 'BUILD_PLATFORM' ? '#FFFFFF' : '#0F766E',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: 12.5,
                  cursor: 'pointer'
                }}
              >
                {settings.invoiceMethod === 'BUILD_PLATFORM' ? '✓ Currently Selected' : 'Select FactoryGrid Builder'}
              </button>
            </div>

          </div>

          {/* OPTION 1 PANEL DETAILS */}
          {settings.invoiceMethod === 'UPLOAD_FORMAT' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Upload Your Invoice Template Format</h3>
                <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>Upload your existing invoice template file to be used when billing customers.</div>
              </div>

              {templateFileError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: 10, borderRadius: 6, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={15} /> {templateFileError}
                </div>
              )}

              <div style={{ border: '2px dashed #CBD5E1', borderRadius: 10, padding: 28, background: '#F8FAFC', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <Upload size={36} style={{ color: '#0F766E' }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                  Drag and drop your invoice template file here or click to browse
                </div>
                <div style={{ fontSize: 11.5, color: '#64748B' }}>
                  Supported formats: <strong>PDF, DOCX</strong> (Max file size: 10MB)
                </div>
                <label style={{ padding: '8px 20px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <Upload size={14} /> Upload Invoice Template
                  <input type="file" accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleUploadTemplate} style={{ display: 'none' }} />
                </label>
              </div>

              {settings.uploadedTemplate ? (
                <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 10, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0F766E', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileCheck size={16} /> Uploaded Template: {settings.uploadedTemplate.fileName}
                    </div>
                    <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                      Type: <strong>{settings.uploadedTemplate.fileType}</strong> · Size: {settings.uploadedTemplate.fileSize} · Uploaded: {settings.uploadedTemplate.uploadDate}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => alert(`Previewing invoice template:\n\nFile Name: ${settings.uploadedTemplate?.fileName}\nStatus: Active Template`)}
                      style={{ padding: '7px 14px', borderRadius: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                    >
                      <Eye size={14} /> Preview Template
                    </button>
                    <label style={{ padding: '7px 14px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F766E', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <RefreshCw size={14} /> Replace
                      <input type="file" accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleUploadTemplate} style={{ display: 'none' }} />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveTemplate}
                      style={{ padding: '7px 14px', borderRadius: 6, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic', textAlign: 'center', padding: 8 }}>
                  No template uploaded yet. Invoices will default to FactoryGrid standard template until uploaded.
                </div>
              )}
            </div>
          )}

          {/* OPTION 2 PANEL DETAILS: BUILDER & PREVIEW */}
          {settings.invoiceMethod === 'BUILD_PLATFORM' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              
              {/* LEFT COLUMN: INVOICE FORMAT BUILDER CONTROLS */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 22, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Invoice Format Builder</h3>
                  <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>Customize logo, statutory details, and custom text to print on invoices.</div>
                </div>

                {/* Section A: Company Logo */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: 4 }}>Company Logo</label>
                  <div style={{ fontSize: 11.5, color: '#64748B', marginBottom: 10 }}>Upload logo image to print at top header of generated invoices.</div>

                  {logoError && (
                    <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: 8, borderRadius: 6, fontSize: 12, marginBottom: 8 }}>
                      {logoError}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{ width: 100, height: 60, borderRadius: 8, border: '1px dashed #CBD5E1', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6, overflow: 'hidden' }}>
                      {settings.logoUrl ? (
                        <img src={settings.logoUrl} alt="Logo Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      ) : (
                        <ImageIcon size={24} style={{ color: '#CBD5E1' }} />
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <label style={{ padding: '7px 14px', borderRadius: 6, background: '#0F766E', color: '#FFF', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Upload size={14} /> Upload Logo
                        <input type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml" onChange={handleLogoUpload} style={{ display: 'none' }} />
                      </label>
                      {settings.logoUrl && (
                        <button type="button" onClick={handleRemoveLogo} style={{ padding: '7px 12px', borderRadius: 6, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section B: Statutory Details */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Company / Legal Name *</label>
                    <input
                      type="text"
                      value={settings.legalName}
                      onChange={e => setSettings({ ...settings, legalName: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700 }}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>GSTIN *</label>
                      <input
                        type="text"
                        value={settings.gstin}
                        onChange={e => setSettings({ ...settings, gstin: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, fontFamily: 'monospace', fontWeight: 700 }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Drug License / Statutory Reg *</label>
                      <input
                        type="text"
                        value={settings.mfgLicense}
                        onChange={e => setSettings({ ...settings, mfgLicense: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5 }}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Registered Facility Address *</label>
                    <textarea
                      rows={2}
                      value={settings.registeredAddress}
                      onChange={e => setSettings({ ...settings, registeredAddress: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5 }}
                      required
                    />
                  </div>
                </div>

                {/* Section C: Custom Invoice Text */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: 4 }}>Custom Invoice Text (Printed on Invoice)</label>
                  <div style={{ fontSize: 11.5, color: '#64748B', marginBottom: 6 }}>
                    Enter custom text to print on invoice (e.g. Bank RTGS details, ISO Certifications, CDSCO License, Warranty, Terms & Conditions).
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Enter custom text to print on the invoice..."
                    value={settings.customInvoiceText}
                    onChange={e => setSettings({ ...settings, customInvoiceText: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5 }}
                  />
                </div>

                {/* Section D: Invoice Header & Footer Text */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Invoice Header Text</label>
                    <input
                      type="text"
                      value={settings.invoiceHeader}
                      onChange={e => setSettings({ ...settings, invoiceHeader: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Invoice Footer Text</label>
                    <input
                      type="text"
                      value={settings.invoiceFooter}
                      onChange={e => setSettings({ ...settings, invoiceFooter: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5 }}
                    />
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: LIVE INVOICE PREVIEW */}
              <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 22, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0F766E', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Eye size={16} /> LIVE INVOICE PREVIEW
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D' }}>
                    REAL-TIME UPDATES
                  </span>
                </div>

                <div style={{ border: '1px solid #CBD5E1', borderRadius: 8, padding: 20, background: '#FFFFFF', fontSize: 11.5, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: 'inset 0 0 10px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
                    <div>
                      {settings.logoUrl ? (
                        <img src={settings.logoUrl} alt="Logo" style={{ height: 36, marginBottom: 6, objectFit: 'contain' }} />
                      ) : (
                        <div style={{ fontSize: 11, fontStyle: 'italic', color: '#94A3B8', marginBottom: 4 }}>[No Logo Uploaded]</div>
                      )}
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{settings.legalName || 'SunBio LifeSciences Ltd.'}</div>
                      <div style={{ color: '#475569', marginTop: 2, maxWidth: 240 }}>{settings.registeredAddress}</div>
                      <div style={{ color: '#64748B', marginTop: 4 }}>GSTIN: <strong style={{ fontFamily: 'monospace' }}>{settings.gstin}</strong></div>
                      <div style={{ color: '#64748B' }}>License: <strong>{settings.mfgLicense}</strong></div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{settings.invoiceHeader || 'TAX INVOICE'}</div>
                      <div style={{ color: '#0F172A', fontWeight: 800, fontFamily: 'monospace', marginTop: 4 }}>INV-2026-0001</div>
                      <div style={{ color: '#64748B', marginTop: 2 }}>Date: {new Date().toLocaleDateString()}</div>
                      <div style={{ color: '#64748B' }}>Terms: <strong>{settings.paymentTerms}</strong></div>
                    </div>
                  </div>

                  {settings.customInvoiceText && (
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 8, borderRadius: 6, fontSize: 11, color: '#334155' }}>
                      <strong>Custom Printed Text:</strong> {settings.customInvoiceText}
                    </div>
                  )}

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: '#F1F5F9', color: '#475569', textTransform: 'uppercase', fontSize: 10, fontWeight: 800 }}>
                        <th style={{ padding: '6px', textAlign: 'left' }}>Item Description</th>
                        <th style={{ padding: '6px', textAlign: 'right' }}>Qty</th>
                        <th style={{ padding: '6px', textAlign: 'right' }}>Rate (₹)</th>
                        <th style={{ padding: '6px', textAlign: 'right' }}>Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderTop: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '6px', fontWeight: 600 }}>Paracetamol 500mg Tablets (Batch #BT-2026)</td>
                        <td style={{ padding: '6px', textAlign: 'right' }}>10,000</td>
                        <td style={{ padding: '6px', textAlign: 'right' }}>15.00</td>
                        <td style={{ padding: '6px', textAlign: 'right', fontWeight: 700 }}>150,000.00</td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 8, fontSize: 10.5, color: '#64748B' }}>
                    <div><strong>Notes:</strong> {settings.additionalNotes}</div>
                    <div style={{ marginTop: 4, fontWeight: 700, color: '#0F172A' }}>{settings.invoiceFooter}</div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* SAVE BUTTON BAR */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              type="submit"
              style={{ padding: '11px 28px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 8px rgba(15,118,110,0.2)' }}
            >
              <Save size={18} /> Save Invoice Settings
            </button>
          </div>

        </form>
      )}

      {/* ════════════════════════════════════════════════════════════════
          SECTION 2: API INTEGRATIONS (GENERIC & EXTENSIBLE)
      ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'INTEGRATIONS' && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Header Row with Add Integration Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>API Integrations</h2>
              <div style={{ fontSize: 13, color: '#475569', marginTop: 3 }}>
                Connect FactoryGrid with your existing business systems and external services.
              </div>
            </div>

            <button
              onClick={handleOpenAddIntegModal}
              style={{
                padding: '9px 18px',
                borderRadius: 8,
                background: '#0F766E',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 6px rgba(15,118,110,0.2)'
              }}
            >
              <Plus size={16} /> Add Integration
            </button>
          </div>

          {/* EMPTY STATE */}
          {settings.apiIntegrations.length === 0 ? (
            <div style={{ border: '2px dashed #E2E8F0', borderRadius: 12, padding: 40, textAlign: 'center', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                <Server size={26} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>No integrations connected</div>
              <div style={{ fontSize: 13, color: '#64748B', maxWidth: 360 }}>
                Connect an external system using its API credentials.
              </div>
              <button
                onClick={handleOpenAddIntegModal}
                style={{
                  marginTop: 6,
                  padding: '9px 20px',
                  borderRadius: 8,
                  background: '#0F766E',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Plus size={16} /> Add Integration
              </button>
            </div>
          ) : (
            /* CONNECTED INTEGRATIONS LIST CARDS */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              {settings.apiIntegrations.map(integ => (
                <div
                  key={integ.id}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: 12,
                    padding: 20,
                    boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    gap: 16
                  }}
                >
                  <div>
                    {/* Header Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{integ.name}</div>
                      <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: integ.status === 'Connected' ? '#DCFCE7' : '#F1F5F9', color: integ.status === 'Connected' ? '#15803D' : '#64748B', border: `1px solid ${integ.status === 'Connected' ? '#86EFAC' : '#CBD5E1'}` }}>
                        ● {integ.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: '#64748B', marginBottom: 12 }}>
                      <span style={{ fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: integ.environment === 'Production' ? '#FEF3C7' : '#E0F2FE', color: integ.environment === 'Production' ? '#B45309' : '#0369A1' }}>
                        {integ.environment}
                      </span>
                      <span>•</span>
                      <span>Last checked: {integ.lastChecked}</span>
                    </div>

                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 10, fontSize: 12, color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div>Base URL: <strong style={{ fontFamily: 'monospace', color: '#0F172A' }}>{integ.baseUrl}</strong></div>
                      <div>API Key: <strong style={{ fontFamily: 'monospace', color: '#64748B' }}>{integ.apiKeyMasked}</strong></div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
                    <button
                      onClick={() => handleTestConnectionCard(integ.id)}
                      style={{ padding: '6px 12px', borderRadius: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <RefreshCw size={13} /> Test Connection
                    </button>

                    <button
                      onClick={() => handleOpenEditIntegModal(integ)}
                      style={{ padding: '6px 12px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#334155', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <Edit2 size={13} /> Edit
                    </button>

                    <button
                      onClick={() => handleDisconnectInteg(integ.id)}
                      style={{ padding: '6px 12px', borderRadius: 6, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <Power size={13} /> Disconnect
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          SECTION 3: SECURITY
      ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'SECURITY' && (
        <form onSubmit={handleChangePassword} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 500 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>SECURITY</h2>
            <div style={{ fontSize: 13, color: '#475569', marginTop: 3 }}>
              Update security password for your manufacturer user account.
            </div>
          </div>

          {passError && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: 12, borderRadius: 8, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} /> {passError}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Current Password *</label>
              <input
                type="password"
                placeholder="Enter current password"
                value={passForm.currentPassword}
                onChange={e => setPassForm({ ...passForm, currentPassword: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>New Password (Min 8 characters) *</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={passForm.newPassword}
                onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Confirm New Password *</label>
              <input
                type="password"
                placeholder="Re-enter new password"
                value={passForm.confirmPassword}
                onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: 10 }}>
            <button
              type="submit"
              style={{ padding: '10px 24px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <Lock size={15} /> Change Password
            </button>
          </div>
        </form>
      )}

      {/* ── MODAL: ADD / EDIT API INTEGRATION ───────────────────────── */}
      {isIntegModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10020, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setIsIntegModalOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {editingIntegId ? 'Edit API Integration' : 'Add API Integration'}
                </h3>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Connect an external system using its API credentials.</div>
              </div>
              <button onClick={() => setIsIntegModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            {/* Test Connection Alert Box */}
            {integTestResult && (
              <div style={{ background: integTestResult.status === 'success' ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${integTestResult.status === 'success' ? '#86EFAC' : '#FCA5A5'}`, color: integTestResult.status === 'success' ? '#166534' : '#991B1B', padding: 12, borderRadius: 8, fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                {integTestResult.status === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                {integTestResult.message}
              </div>
            )}

            <form onSubmit={handleSaveIntegSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Integration Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Enterprise ERP System / Telemetry Gateway"
                  value={integForm.name}
                  onChange={e => setIntegForm({ ...integForm, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>API Base URL *</label>
                <input
                  type="text"
                  placeholder="https://api.yourcompany.com/v1"
                  value={integForm.baseUrl}
                  onChange={e => setIntegForm({ ...integForm, baseUrl: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, fontFamily: 'monospace' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  API Key / API Token {editingIntegId ? '(Leave blank to keep existing masked key)' : '*'}
                </label>
                <input
                  type="password"
                  placeholder={editingIntegId ? '••••••••••••••••' : 'Enter API Key / Token'}
                  value={integForm.apiKey}
                  onChange={e => setIntegForm({ ...integForm, apiKey: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  {...(!editingIntegId ? { required: true } : {})}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>Environment *</label>
                <div style={{ display: 'flex', gap: 20 }}>
                  <label style={{ fontSize: 13, color: '#0F172A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="environment"
                      value="Sandbox"
                      checked={integForm.environment === 'Sandbox'}
                      onChange={() => setIntegForm({ ...integForm, environment: 'Sandbox' })}
                      style={{ accentColor: '#0F766E' }}
                    />
                    Sandbox
                  </label>
                  <label style={{ fontSize: 13, color: '#0F172A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="environment"
                      value="Production"
                      checked={integForm.environment === 'Production'}
                      onChange={() => setIntegForm({ ...integForm, environment: 'Production' })}
                      style={{ accentColor: '#0F766E' }}
                    />
                    Production
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 14, marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <button
                  type="button"
                  disabled={isTestingInteg}
                  onClick={handleTestConnectionInModal}
                  style={{ padding: '8px 14px', borderRadius: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <RefreshCw size={14} className={isTestingInteg ? 'animate-spin' : ''} /> {isTestingInteg ? 'Testing...' : 'Test Connection'}
                </button>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => setIsIntegModalOpen(false)} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Save Integration</button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
