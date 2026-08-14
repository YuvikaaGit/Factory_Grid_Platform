import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Manufacturer, Product, ManufacturerProductMapping } from '../../types';
import {
  Search, Eye, Package, Plus, X, Edit3, Trash2, ShieldCheck, CheckCircle2, AlertTriangle, Filter, Check
} from 'lucide-react';

interface ManufacturerProductCatalogTabProps {
  manufacturer: Manufacturer;
  mappings?: ManufacturerProductMapping[];
  products?: Product[];
  onSelectProductForDetail?: (product: Product) => void;
}

export const ManufacturerProductCatalogTab: React.FC<ManufacturerProductCatalogTabProps> = ({
  manufacturer,
  onSelectProductForDetail
}) => {
  const {
    products: contextProducts,
    mappings: contextMappings,
    addMapping,
    updateMapping,
    removeMapping,
    addAuditLog
  } = useApp();

  const mfgDisplayName = manufacturer?.companyName || manufacturer?.name || 'this facility';
  const mfgId = manufacturer?.id;
  const mfgCode = manufacturer?.code || 'MFG000401';

  // Compute products mapped to THIS manufacturer
  const mfgMappings = useMemo(() => {
    if (!mfgId) return [];
    return (contextMappings || []).filter(m =>
      (m.manufacturerId && m.manufacturerId === mfgId) ||
      (m.manufacturerCode && m.manufacturerCode === mfgCode) ||
      (m.manufacturerName && m.manufacturerName.toLowerCase() === mfgDisplayName.toLowerCase())
    );
  }, [contextMappings, mfgId, mfgCode, mfgDisplayName]);

  // Map each mapping to its central ProductMaster
  const mappedProductsList = useMemo(() => {
    return mfgMappings.map(m => {
      const prd = (contextProducts || []).find(p => p.id === m.productId || p.code === m.mfgProductCode);
      // Fallback if product identity exists in mapping
      const fallbackPrd: Product = prd || {
        id: m.productId || `prd_${m.mfgProductCode}`,
        code: m.mfgProductCode || 'PRD-0001',
        name: m.mfgProductCode || 'Pharmaceutical Formulation',
        genericName: 'Compendial Formulation',
        saltCombination: 'Active Pharmaceutical Ingredient',
        dosageForm: 'Tablet',
        strength: 'Standard',
        packSize: '10 x 10 Strip',
        uom: 'Strip',
        category: 'Analgesics',
        description: 'Standard product specification',
        manufacturersCount: 1
      };
      return {
        mapping: m,
        product: fallbackPrd,
        status: (m as any).status || 'Active'
      };
    });
  }, [mfgMappings, contextProducts]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDosage, setSelectedDosage] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return mappedProductsList.filter(({ product, mapping, status }) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        (product.name || '').toLowerCase().includes(q) ||
        (product.genericName || '').toLowerCase().includes(q) ||
        (product.saltCombination || '').toLowerCase().includes(q) ||
        (product.code || '').toLowerCase().includes(q) ||
        (mapping.mfgProductCode || '').toLowerCase().includes(q);

      const matchesCat = selectedCategory === 'ALL' || product.category === selectedCategory;
      const matchesDosage = selectedDosage === 'ALL' || product.dosageForm === selectedDosage;
      const matchesStatus = selectedStatus === 'ALL' || status === selectedStatus;

      return matchesSearch && matchesCat && matchesDosage && matchesStatus;
    });
  }, [mappedProductsList, searchQuery, selectedCategory, selectedDosage, selectedStatus]);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCentralProduct, setSelectedCentralProduct] = useState<Product | null>(null);
  const [centralSearchQuery, setCentralSearchQuery] = useState('');
  const [addFormError, setAddFormError] = useState<string | null>(null);

  // Mapping Form State
  const [mappingFormData, setMappingFormData] = useState({
    mfgProductCode: '',
    moq: 1000,
    standardLeadTimeDays: 14,
    certificationsStr: 'WHO-GMP, CDSCO Applicable',
    status: 'Active'
  });

  // View / Edit Drawer State
  const [activeDrawerItem, setActiveDrawerItem] = useState<{ mapping: ManufacturerProductMapping; product: Product; status: string } | null>(null);
  const [isEditingInDrawer, setIsEditingInDrawer] = useState(false);
  const [editFormData, setEditFormData] = useState({
    mfgProductCode: '',
    moq: 1000,
    standardLeadTimeDays: 14,
    certificationsStr: 'WHO-GMP, CDSCO Applicable',
    status: 'Active'
  });

  // Open "+ Add Product" Modal
  const handleOpenAddModal = () => {
    setSelectedCentralProduct(null);
    setCentralSearchQuery('');
    setAddFormError(null);
    setMappingFormData({
      mfgProductCode: '',
      moq: 1000,
      standardLeadTimeDays: 14,
      certificationsStr: 'WHO-GMP, CDSCO Applicable',
      status: 'Active'
    });
    setIsAddModalOpen(true);
  };

  // Search Central Products for Modal
  const centralProductResults = useMemo(() => {
    const q = centralSearchQuery.toLowerCase().trim();
    if (!q) return contextProducts;
    return (contextProducts || []).filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.genericName.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.saltCombination.toLowerCase().includes(q)
    );
  }, [contextProducts, centralSearchQuery]);

  // Select a Central Product Master in Modal
  const handleSelectCentralProduct = (prd: Product) => {
    // Check if duplicate mapping exists for this manufacturer
    const isAlreadyMapped = mfgMappings.some(m => m.productId === prd.id);
    if (isAlreadyMapped) {
      setAddFormError(`Product "${prd.name}" already exists in ${mfgDisplayName}'s catalog.`);
      return;
    }

    setAddFormError(null);
    setSelectedCentralProduct(prd);
    const codePrefix = mfgCode.length > 4 ? mfgCode.substring(0, 4) : mfgCode;
    const prdSlug = prd.code.replace(/[^a-zA-Z0-9]/g, '');
    setMappingFormData({
      mfgProductCode: `${codePrefix}-${prdSlug}`,
      moq: prd.moq || 1000,
      standardLeadTimeDays: 14,
      certificationsStr: (prd.regulatoryInfo || ['WHO-GMP', 'CDSCO Applicable']).join(', '),
      status: 'Active'
    });
  };

  // Save New Manufacturer Mapping
  const handleSaveAddMapping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCentralProduct) {
      setAddFormError('Please select an existing Product Master product.');
      return;
    }

    if (!mappingFormData.mfgProductCode.trim()) {
      setAddFormError('Manufacturer Product Code is required.');
      return;
    }
    if (!mappingFormData.moq || mappingFormData.moq <= 0) {
      setAddFormError('Valid Minimum Order Quantity (MOQ) is required.');
      return;
    }
    if (!mappingFormData.standardLeadTimeDays || mappingFormData.standardLeadTimeDays <= 0) {
      setAddFormError('Valid Standard Lead Time (Days) is required.');
      return;
    }

    const certsArray = mappingFormData.certificationsStr.split(',').map(c => c.trim()).filter(Boolean);

    const newMapping: ManufacturerProductMapping = {
      productId: selectedCentralProduct.id,
      manufacturerId: mfgId,
      manufacturerCode: mfgCode,
      manufacturerName: mfgDisplayName,
      mfgProductCode: mappingFormData.mfgProductCode,
      moq: mappingFormData.moq,
      standardLeadTimeDays: mappingFormData.standardLeadTimeDays,
      productSpecificCertifications: certsArray,
      ...( { status: mappingFormData.status } as any )
    };

    addMapping(newMapping);
    addAuditLog('MAP_MANUFACTURER_PRODUCT', `Mapped ${selectedCentralProduct.name} to ${mfgDisplayName}`);
    setIsAddModalOpen(false);
  };

  // Open View Drawer
  const handleOpenDrawer = (item: { mapping: ManufacturerProductMapping; product: Product; status: string }) => {
    setActiveDrawerItem(item);
    setIsEditingInDrawer(false);
    setEditFormData({
      mfgProductCode: item.mapping.mfgProductCode,
      moq: item.mapping.moq,
      standardLeadTimeDays: item.mapping.standardLeadTimeDays,
      certificationsStr: item.mapping.productSpecificCertifications ? item.mapping.productSpecificCertifications.join(', ') : 'WHO-GMP, CDSCO Applicable',
      status: item.status || 'Active'
    });
  };

  // Save Edit Mapping
  const handleSaveEditMapping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDrawerItem) return;

    const certsArray = editFormData.certificationsStr.split(',').map(c => c.trim()).filter(Boolean);

    updateMapping(activeDrawerItem.product.id, mfgId, {
      mfgProductCode: editFormData.mfgProductCode,
      moq: editFormData.moq,
      standardLeadTimeDays: editFormData.standardLeadTimeDays,
      productSpecificCertifications: certsArray,
      ...( { status: editFormData.status } as any )
    });

    addAuditLog('EDIT_MANUFACTURER_MAPPING', `Updated mapping for ${activeDrawerItem.product.name} at ${mfgDisplayName}`);

    setActiveDrawerItem(prev => prev ? {
      ...prev,
      mapping: {
        ...prev.mapping,
        mfgProductCode: editFormData.mfgProductCode,
        moq: editFormData.moq,
        standardLeadTimeDays: editFormData.standardLeadTimeDays,
        productSpecificCertifications: certsArray
      },
      status: editFormData.status
    } : null);

    setIsEditingInDrawer(false);
  };

  // Remove Mapping from Catalog
  const handleRemoveMapping = () => {
    if (!activeDrawerItem) return;
    if (window.confirm(`Are you sure you want to remove "${activeDrawerItem.product.name}" from ${mfgDisplayName}'s catalog?\n\nNote: This will ONLY remove the manufacturer mapping. The centralized Product Master will remain intact.`)) {
      removeMapping(activeDrawerItem.product.id, mfgId);
      addAuditLog('REMOVE_MANUFACTURER_MAPPING', `Removed ${activeDrawerItem.product.name} from ${mfgDisplayName}'s catalog`);
      setActiveDrawerItem(null);
    }
  };

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      {/* ── Enterprise Catalog Header ───────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={22} style={{ color: '#0F766E' }} />
            PRODUCT CATALOG
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
            Products manufactured by <strong>{mfgDisplayName}</strong>.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          style={{ padding: '10px 18px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 1px 2px rgba(15,118,110,0.2)' }}
        >
          <Plus size={16} /> + Add Product
        </button>
      </div>

      {/* ── Search & Filter Controls ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 14, alignItems: 'center', background: '#F8FAFC', padding: 14, borderRadius: 10, border: '1px solid #E2E8F0' }}>
        
        {/* Search Input */}
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
          <input
            type="text"
            placeholder="Search manufacturer products..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              fontSize: 13,
              borderRadius: 6,
              border: '1px solid #CBD5E1',
              outline: 'none',
              background: '#FFFFFF',
              color: '#0F172A'
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0 }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Category:</span>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            style={{ padding: '8px 12px', fontSize: 12.5, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontWeight: 600, cursor: 'pointer' }}
          >
            <option value="ALL">All Categories</option>
            <option value="Antibiotics">Antibiotics</option>
            <option value="Analgesic">Analgesic & Antipyretic</option>
            <option value="Analgesics">Analgesics</option>
            <option value="Gastroenterology">Gastroenterology</option>
            <option value="Diabetology">Diabetology</option>
            <option value="Nutraceuticals">Nutraceuticals</option>
          </select>
        </div>

        {/* Dosage Form Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Dosage:</span>
          <select
            value={selectedDosage}
            onChange={e => setSelectedDosage(e.target.value)}
            style={{ padding: '8px 12px', fontSize: 12.5, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontWeight: 600, cursor: 'pointer' }}
          >
            <option value="ALL">All Dosage Forms</option>
            <option value="Tablet">Tablet</option>
            <option value="Capsule">Capsule</option>
            <option value="Syrup">Syrup</option>
            <option value="Injection">Injection</option>
            <option value="Ointment">Ointment</option>
            <option value="Suspension">Suspension</option>
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Status:</span>
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            style={{ padding: '8px 12px', fontSize: 12.5, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontWeight: 600, cursor: 'pointer' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Pending Compliance">Pending Compliance</option>
          </select>
        </div>
      </div>

      {/* ── Table View ────────────────────────────────────────────── */}
      <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #E2E8F0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>PRODUCT</th>
              <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>CATEGORY</th>
              <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>DOSAGE FORM & STRENGTH</th>
              <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>PACKAGING</th>
              <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>MANUFACTURER PRODUCT CODE</th>
              <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>STANDARD MOQ</th>
              <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>TYPICAL LEAD TIME</th>
              <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>STATUS</th>
              <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right', paddingRight: 16 }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B', background: '#F8FAFC' }}>
                  <Package size={32} style={{ color: '#94A3B8', marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>No products found in this manufacturer's catalog.</div>
                  <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 4, marginBottom: 14 }}>
                    Click "+ Add Product" to map existing central Product Master products to {mfgDisplayName}.
                  </div>
                  <button
                    onClick={handleOpenAddModal}
                    style={{ padding: '8px 16px', borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
                  >
                    + Add Product
                  </button>
                </td>
              </tr>
            ) : (
              filteredProducts.map((item, idx) => {
                const { product, mapping, status } = item;
                return (
                  <tr
                    key={product.id || idx}
                    onClick={() => handleOpenDrawer(item)}
                    style={{ cursor: 'pointer', borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                  >
                    {/* 1. PRODUCT */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>{product.name}</div>
                      <div style={{ fontSize: 11, color: '#0F766E', fontWeight: 700, marginTop: 2, fontFamily: 'monospace' }}>
                        Central Code: {product.code}
                      </div>
                    </td>

                    {/* 2. CATEGORY */}
                    <td style={{ padding: '12px 14px', fontSize: 12.5, fontWeight: 600, color: '#334155' }}>
                      {product.category}
                    </td>

                    {/* 3. DOSAGE FORM & STRENGTH */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                          {product.dosageForm}
                        </span>
                        <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0F766E' }}>
                          {product.strength}
                        </span>
                      </div>
                    </td>

                    {/* 4. PACKAGING */}
                    <td style={{ padding: '12px 14px', fontSize: 12.5, color: '#475569', fontWeight: 500 }}>
                      {product.packSize}
                    </td>

                    {/* 5. MANUFACTURER PRODUCT CODE */}
                    <td style={{ padding: '12px 14px', fontSize: 12.5, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                      {mapping.mfgProductCode}
                    </td>

                    {/* 6. STANDARD MOQ */}
                    <td style={{ padding: '12px 14px', fontSize: 12.5, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                      {mapping.moq.toLocaleString()} Units
                    </td>

                    {/* 7. TYPICAL LEAD TIME */}
                    <td style={{ padding: '12px 14px', fontSize: 12.5, fontWeight: 800, color: '#0F766E' }}>
                      {mapping.standardLeadTimeDays} Days
                    </td>

                    {/* 8. STATUS */}
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                        background: status === 'Active' ? '#DCFCE7' : status === 'Inactive' ? '#F3F4F6' : '#FEF3C7',
                        color: status === 'Active' ? '#15803D' : status === 'Inactive' ? '#4B5563' : '#B45309',
                        border: status === 'Active' ? '1px solid #86EFAC' : status === 'Inactive' ? '1px solid #D1D5DB' : '1px solid #FDE68A'
                      }}>
                        {status}
                      </span>
                    </td>

                    {/* 9. ACTION */}
                    <td onClick={e => e.stopPropagation()} style={{ padding: '12px 14px', textAlign: 'right', paddingRight: 16 }}>
                      <button
                        onClick={() => handleOpenDrawer(item)}
                        style={{ padding: '5px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: 'rgba(15, 118, 110, 0.08)', border: '1px solid rgba(15, 118, 110, 0.25)', color: '#0F766E', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── MODAL: ADD PRODUCT TO CATALOG ─────────────────────────── */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setIsAddModalOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Add Product to Catalog</h3>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Map existing Central Product Master to <strong>{mfgDisplayName}</strong>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* Error Alert */}
            {addFormError && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#B91C1C', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={16} />
                  <span>{addFormError}</span>
                </div>
              </div>
            )}

            {/* STEP 1: SELECT CENTRAL PRODUCT */}
            {!selectedCentralProduct ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em' }}>
                  SELECT PRODUCT MASTER
                </div>

                <div style={{ position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                  <input
                    type="text"
                    placeholder="Search product name, generic name or product code..."
                    value={centralSearchQuery}
                    onChange={e => setCentralSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13, outline: 'none', background: '#F8FAFC' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
                  {centralProductResults.map(prd => {
                    const isAlreadyMapped = mfgMappings.some(m => m.productId === prd.id);
                    return (
                      <div
                        key={prd.id}
                        onClick={() => handleSelectCentralProduct(prd)}
                        style={{
                          padding: 12,
                          borderRadius: 8,
                          border: isAlreadyMapped ? '1px solid #E2E8F0' : '1px solid #CBD5E1',
                          background: isAlreadyMapped ? '#F8FAFC' : '#FFFFFF',
                          cursor: isAlreadyMapped ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          opacity: isAlreadyMapped ? 0.7 : 1,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>{prd.name}</div>
                          <div style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }}>
                            <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{prd.code}</strong> · {prd.genericName} · {prd.dosageForm} ({prd.strength})
                          </div>
                        </div>

                        {isAlreadyMapped ? (
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#B45309', background: '#FEF3C7', padding: '3px 8px', borderRadius: 4 }}>
                            Already Mapped
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleSelectCentralProduct(prd); }}
                            style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', cursor: 'pointer' }}
                          >
                            Select →
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* STEP 2: ENTER MANUFACTURER-SPECIFIC DETAILS FOR MAPPING */
              <form onSubmit={handleSaveAddMapping} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                {/* READ-ONLY CENTRAL PRODUCT INFO */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em' }}>
                      PRODUCT INFORMATION (READ-ONLY MASTER)
                    </div>
                    <button type="button" onClick={() => setSelectedCentralProduct(null)} style={{ background: 'none', border: 'none', color: '#0F766E', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      Change Product
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12.5 }}>
                    <div>Product Code: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{selectedCentralProduct.code}</strong></div>
                    <div>Product Name: <strong style={{ color: '#0F172A' }}>{selectedCentralProduct.name}</strong></div>
                    <div>Generic Name: <strong>{selectedCentralProduct.genericName}</strong></div>
                    <div>Dosage & Strength: <strong>{selectedCentralProduct.dosageForm} {selectedCentralProduct.strength}</strong></div>
                  </div>
                </div>

                {/* EDITABLE MANUFACTURER PRODUCT DETAILS */}
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em' }}>
                  MANUFACTURER PRODUCT DETAILS
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Manufacturer</label>
                  <input type="text" readOnly value={mfgDisplayName} style={{ width: '100%', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 13, background: '#F1F5F9', color: '#334155', fontWeight: 700 }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Manufacturer Product Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SUN-PCM-650"
                      value={mappingFormData.mfgProductCode}
                      onChange={e => setMappingFormData({ ...mappingFormData, mfgProductCode: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace', outline: 'none' }}
                    />
                    <span style={{ fontSize: 10.5, color: '#64748B', marginTop: 2, display: 'block' }}>Does not replace central code {selectedCentralProduct.code}</span>
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Status</label>
                    <select
                      value={mappingFormData.status}
                      onChange={e => setMappingFormData({ ...mappingFormData, status: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600 }}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Pending Compliance">Pending Compliance</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Minimum Order Quantity (MOQ) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={mappingFormData.moq}
                      onChange={e => setMappingFormData({ ...mappingFormData, moq: Number(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Standard Lead Time (Days) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={mappingFormData.standardLeadTimeDays}
                      onChange={e => setMappingFormData({ ...mappingFormData, standardLeadTimeDays: Number(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Product-Specific Certifications</label>
                  <input
                    type="text"
                    placeholder="WHO-GMP, CDSCO Applicable, ISO 9001:2015"
                    value={mappingFormData.certificationsStr}
                    onChange={e => setMappingFormData({ ...mappingFormData, certificationsStr: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10, paddingTop: 14, borderTop: '1px solid #E2E8F0' }}>
                  <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Save to Product Catalog</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── VIEW / EDIT MAPPING DRAWER ────────────────────────────── */}
      {activeDrawerItem && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end' }} onClick={() => setActiveDrawerItem(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, height: '100%', background: '#FFFFFF', borderLeft: '1px solid #CBD5E1', display: 'flex', flexDirection: 'column', boxShadow: '-12px 0 32px rgba(15, 23, 42, 0.15)' }}>
            
            {/* Drawer Header */}
            <div style={{ padding: '20px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                  Central Code: {activeDrawerItem.product.code} · {activeDrawerItem.product.category}
                </span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                  {activeDrawerItem.product.name}
                </h3>
              </div>
              <button onClick={() => setActiveDrawerItem(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ padding: 24, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* SECTION 1 — CENTRAL PRODUCT INFORMATION */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 12, letterSpacing: '0.06em' }}>
                  PRODUCT INFORMATION (CENTRAL MASTER)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5 }}>
                  <div><span style={{ color: '#64748B' }}>Product Code:</span> <strong style={{ color: '#0F766E', fontFamily: 'monospace', display: 'block' }}>{activeDrawerItem.product.code}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Product Name:</span> <strong style={{ color: '#0F172A', display: 'block' }}>{activeDrawerItem.product.name}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Generic Name:</span> <strong style={{ color: '#1E293B', display: 'block' }}>{activeDrawerItem.product.genericName}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Salt Combination:</span> <strong style={{ color: '#334155', display: 'block' }}>{activeDrawerItem.product.saltCombination}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Strength:</span> <strong style={{ color: '#0F766E', display: 'block' }}>{activeDrawerItem.product.strength}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Dosage Form:</span> <strong style={{ color: '#0F172A', display: 'block' }}>{activeDrawerItem.product.dosageForm}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Pack Size:</span> <strong style={{ color: '#334155', display: 'block' }}>{activeDrawerItem.product.packSize}</strong></div>
                  <div><span style={{ color: '#64748B' }}>UOM:</span> <strong style={{ color: '#0F172A', display: 'block' }}>{activeDrawerItem.product.uom || 'Strip'}</strong></div>
                </div>
                {activeDrawerItem.product.description && (
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #E2E8F0', fontSize: 12, color: '#475569' }}>
                    <strong style={{ color: '#0F172A' }}>Description:</strong> {activeDrawerItem.product.description}
                  </div>
                )}
              </div>

              {/* SECTION 2 — MANUFACTURER DETAILS */}
              <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 10, padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em' }}>
                    MANUFACTURER DETAILS
                  </div>
                  {!isEditingInDrawer && (
                    <button onClick={() => setIsEditingInDrawer(true)} style={{ background: 'none', border: 'none', color: '#0F766E', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Edit3 size={13} /> Edit Details
                    </button>
                  )}
                </div>

                {!isEditingInDrawer ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5 }}>
                      <div><span style={{ color: '#64748B' }}>Manufacturer:</span> <strong style={{ color: '#0F172A', display: 'block' }}>{mfgDisplayName}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Manufacturer Product Code:</span> <strong style={{ color: '#0F766E', fontFamily: 'monospace', display: 'block' }}>{activeDrawerItem.mapping.mfgProductCode}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Minimum Order Quantity (MOQ):</span> <strong style={{ color: '#0F172A', fontFamily: 'monospace', display: 'block' }}>{activeDrawerItem.mapping.moq.toLocaleString()} Units</strong></div>
                      <div><span style={{ color: '#64748B' }}>Standard Lead Time:</span> <strong style={{ color: '#0F766E', display: 'block' }}>{activeDrawerItem.mapping.standardLeadTimeDays} Days</strong></div>
                      <div><span style={{ color: '#64748B' }}>Status:</span> <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: activeDrawerItem.status === 'Active' ? '#DCFCE7' : '#FEF3C7', color: activeDrawerItem.status === 'Active' ? '#15803D' : '#B45309' }}>{activeDrawerItem.status}</span></div>
                    </div>

                    {activeDrawerItem.mapping.productSpecificCertifications && (
                      <div style={{ marginTop: 8, paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B' }}>Product-Specific Certifications:</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                          {activeDrawerItem.mapping.productSpecificCertifications.map(cert => (
                            <span key={cert} style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', background: '#DCFCE7', padding: '3px 8px', borderRadius: 4, border: '1px solid #86EFAC' }}>
                              ✓ {cert}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* EDIT FORM IN DRAWER */
                  <form onSubmit={handleSaveEditMapping} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Manufacturer Product Code *</label>
                      <input type="text" required value={editFormData.mfgProductCode} onChange={e => setEditFormData({ ...editFormData, mfgProductCode: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, fontFamily: 'monospace' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>MOQ *</label>
                        <input type="number" min="1" required value={editFormData.moq} onChange={e => setEditFormData({ ...editFormData, moq: Number(e.target.value) || 0 })} style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5 }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Lead Time (Days) *</label>
                        <input type="number" min="1" required value={editFormData.standardLeadTimeDays} onChange={e => setEditFormData({ ...editFormData, standardLeadTimeDays: Number(e.target.value) || 0 })} style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5 }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Status</label>
                      <select value={editFormData.status} onChange={e => setEditFormData({ ...editFormData, status: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5 }}>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Pending Compliance">Pending Compliance</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Product Certifications</label>
                      <input type="text" value={editFormData.certificationsStr} onChange={e => setEditFormData({ ...editFormData, certificationsStr: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5 }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                      <button type="button" onClick={() => setIsEditingInDrawer(false)} style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF' }}>Cancel</button>
                      <button type="submit" style={{ padding: '6px 14px', fontSize: 12, borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontWeight: 700 }}>Save Mapping</button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div style={{ padding: 16, background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={handleRemoveMapping}
                style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #FCA5A5', background: '#FEE2E2', color: '#B91C1C', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Trash2 size={14} /> Remove from Catalog
              </button>

              <button
                onClick={() => setActiveDrawerItem(null)}
                style={{ padding: '8px 18px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
