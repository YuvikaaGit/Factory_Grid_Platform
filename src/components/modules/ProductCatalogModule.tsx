import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, Manufacturer, ManufacturerProductMapping } from '../../types';
import { ManufacturerProductCatalogTab } from './ManufacturerProductCatalogTab';
import {
  Package, Search, Filter, Factory, CheckCircle2,
  Info, X, Layers, Clock, AlertCircle, Sparkles, Check, ChevronRight,
  ShieldCheck, Plus, Download, Edit3, ArrowRight, Eye, Tag, AlertTriangle, RefreshCw, Power
} from 'lucide-react';

export const ProductCatalogModule: React.FC = () => {
  const {
    currentRole,
    products,
    manufacturers,
    mappings,
    addProductMaster,
    updateProductMaster,
    toggleProductMasterStatus,
    addAuditLog
  } = useApp();

  // If viewed by Manufacturer role, render "My Product Catalog" for the logged-in manufacturer
  if (currentRole === 'SUPPLIER') {
    const loggedInMfg = manufacturers[0];
    return <ManufacturerProductCatalogTab manufacturer={loggedInMfg} />;
  }

  // ── ADMIN / PLATFORM CENTRAL PRODUCT MASTER CATALOG ────────────────

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDosage, setSelectedDosage] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedMfgId, setSelectedMfgId] = useState<string>('ALL');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');

  // Interactive Product Detail Drawer State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Add / Edit Product Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [modalFormError, setModalFormError] = useState<string | null>(null);

  // Form Data State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    genericName: '',
    saltCombination: '',
    strength: '',
    dosageForm: 'Tablet',
    packSize: '10 × 1 × 10 Strip',
    uom: 'Units',
    category: 'Antibiotics',
    tagsStr: 'Tablet, OTC, Antibiotics',
    description: '',
    status: 'Active' as 'Active' | 'Inactive'
  });

  // Filtered Central Product List Calculation
  const filteredProducts = useMemo(() => {
    return (products || []).filter(p => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        (p.code || '').toLowerCase().includes(q) ||
        (p.name || '').toLowerCase().includes(q) ||
        (p.genericName || '').toLowerCase().includes(q) ||
        (p.saltCombination || '').toLowerCase().includes(q) ||
        (p.strength || '').toLowerCase().includes(q) ||
        (p.dosageForm || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q);

      const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchesDosage = selectedDosage === 'ALL' || p.dosageForm === selectedDosage;
      const matchesStatus = selectedStatus === 'ALL' || (p.status || 'Active') === selectedStatus;

      // Filter by mapped manufacturer
      let matchesMfg = true;
      if (selectedMfgId !== 'ALL') {
        const pMappings = (mappings || []).filter(m => m.productId === p.id);
        matchesMfg = pMappings.some(m => m.manufacturerId === selectedMfgId);
      }

      // Filter by Tag
      let matchesTag = true;
      if (selectedTag !== 'ALL') {
        matchesTag = !!p.tags && p.tags.includes(selectedTag);
      }

      return matchesSearch && matchesCat && matchesDosage && matchesStatus && matchesMfg && matchesTag;
    });
  }, [products, mappings, searchTerm, selectedCategory, selectedDosage, selectedStatus, selectedMfgId, selectedTag]);

  // Unique Categories & Tags options
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    (products || []).forEach(p => { if (p.category) set.add(p.category); });
    return Array.from(set);
  }, [products]);

  // Open Modal to Add Central Product
  const handleOpenAddModal = () => {
    setEditingProductId(null);
    const nextCodeNum = products.length + 1;
    setFormData({
      code: `PRD001${nextCodeNum < 10 ? '00' + nextCodeNum : nextCodeNum < 100 ? '0' + nextCodeNum : nextCodeNum}`,
      name: '',
      genericName: '',
      saltCombination: '',
      strength: '',
      dosageForm: 'Tablet',
      packSize: '10 × 1 × 10 Strip',
      uom: 'Units',
      category: 'Antibiotics',
      tagsStr: 'Tablet, OTC',
      description: '',
      status: 'Active'
    });
    setModalFormError(null);
    setIsAddModalOpen(true);
  };

  // Open Modal to Edit Central Product
  const handleOpenEditModal = (prd: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingProductId(prd.id);
    setFormData({
      code: prd.code,
      name: prd.name,
      genericName: prd.genericName,
      saltCombination: prd.saltCombination,
      strength: prd.strength,
      dosageForm: prd.dosageForm,
      packSize: prd.packSize,
      uom: prd.uom || 'Units',
      category: prd.category,
      tagsStr: prd.tags ? prd.tags.join(', ') : 'Tablet, OTC',
      description: prd.description || '',
      status: prd.status || 'Active'
    });
    setModalFormError(null);
    setIsAddModalOpen(true);
  };

  // Save Central Product Handler
  const handleSaveProductMaster = (e: React.FormEvent) => {
    e.preventDefault();

    // Mandatory Fields Validation
    if (!formData.code.trim()) { setModalFormError('Product Code is mandatory.'); return; }
    if (!formData.name.trim()) { setModalFormError('Product Name is mandatory.'); return; }
    if (!formData.genericName.trim()) { setModalFormError('Generic Name is mandatory.'); return; }
    if (!formData.saltCombination.trim()) { setModalFormError('Salt Combination is mandatory.'); return; }
    if (!formData.strength.trim()) { setModalFormError('Strength is mandatory.'); return; }
    if (!formData.dosageForm.trim()) { setModalFormError('Dosage Form is mandatory.'); return; }
    if (!formData.packSize.trim()) { setModalFormError('Pack Size is mandatory.'); return; }
    if (!formData.uom.trim()) { setModalFormError('UOM is mandatory.'); return; }
    if (!formData.category.trim()) { setModalFormError('Category is mandatory.'); return; }

    // Unique Product Code Check
    const isDuplicateCode = (products || []).some(p =>
      p.id !== editingProductId &&
      p.code.toLowerCase().trim() === formData.code.toLowerCase().trim()
    );

    if (isDuplicateCode) {
      setModalFormError(`Product Code "${formData.code}" already exists. Product Code must be unique across the central master catalog.`);
      return;
    }

    const tagsArray = formData.tagsStr.split(',').map(t => t.trim()).filter(Boolean);

    if (editingProductId) {
      // Edit existing product master
      updateProductMaster(editingProductId, {
        code: formData.code,
        name: formData.name,
        genericName: formData.genericName,
        saltCombination: formData.saltCombination,
        strength: formData.strength,
        dosageForm: formData.dosageForm,
        packSize: formData.packSize,
        uom: formData.uom,
        category: formData.category,
        tags: tagsArray,
        description: formData.description,
        status: formData.status
      });
      addAuditLog('EDIT_CENTRAL_PRODUCT', `Updated Central Product Master: ${formData.name} (${formData.code})`);
    } else {
      // Create new central product master
      const newPrd: Product = {
        id: `p_${Date.now()}`,
        code: formData.code,
        name: formData.name,
        genericName: formData.genericName,
        saltCombination: formData.saltCombination,
        strength: formData.strength,
        dosageForm: formData.dosageForm,
        packSize: formData.packSize,
        uom: formData.uom,
        category: formData.category,
        tags: tagsArray,
        description: formData.description,
        status: formData.status,
        manufacturersCount: 0
      };
      addProductMaster(newPrd);
      addAuditLog('CREATE_CENTRAL_PRODUCT', `Created Central Product Master: ${formData.name} (${formData.code})`);
    }

    setIsAddModalOpen(false);
  };

  // Toggle Product Status (Activate / Deactivate)
  const handleToggleStatus = (prd: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStatus = prd.status === 'Inactive' ? 'Active' : 'Inactive';
    toggleProductMasterStatus(prd.id);
    addAuditLog('TOGGLE_PRODUCT_STATUS', `Set Central Product ${prd.code} status to ${newStatus}`);
    if (selectedProduct && selectedProduct.id === prd.id) {
      setSelectedProduct(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  // Mapped manufacturers for selected product drawer
  const mappedItemsForSelected = useMemo(() => {
    if (!selectedProduct) return [];
    const pMappings = (mappings || []).filter(m => m.productId === selectedProduct.id);
    return pMappings.map(map => {
      const mfg = (manufacturers || []).find(m => m.id === map.manufacturerId);
      return {
        mapping: map,
        manufacturer: mfg || {
          id: map.manufacturerId,
          code: map.manufacturerCode,
          name: map.manufacturerName,
          companyName: map.manufacturerName,
          city: 'Hyderabad',
          state: 'Telangana'
        }
      };
    });
  }, [selectedProduct, mappings, manufacturers]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48 }}>

      {/* ── Enterprise Header ────────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(15, 118, 110, 0.10)', border: '1px solid rgba(15, 118, 110, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Package size={24} style={{ color: '#0F766E' }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0F766E' }}>MASTER DATA / CENTRAL PRODUCT MASTER</div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>PRODUCT CATALOG</h1>
            <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
              Centralized pharmaceutical product master used across the FactoryGrid platform.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          style={{ padding: '10px 20px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 1px 2px rgba(15,118,110,0.2)' }}
        >
          <Plus size={16} /> + Add Product
        </button>
      </div>

      {/* ── Search & Multi-Filter Controls Bar ──────────────────────── */}
      <div style={{ padding: 18, background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', gap: 14, alignItems: 'center' }}>
          
          {/* Main Search Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 8, padding: '10px 14px' }}>
            <Search size={16} style={{ color: '#64748B', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by product code, product name, generic name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ border: 'none', padding: 0, background: 'transparent', width: '100%', fontSize: 13.5, color: '#0F172A', outline: 'none' }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0 }}>
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
              {categoryOptions.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
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
            </select>
          </div>

          {/* Manufacturer Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Manufacturer:</span>
            <select
              value={selectedMfgId}
              onChange={e => setSelectedMfgId(e.target.value)}
              style={{ padding: '8px 12px', fontSize: 12.5, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontWeight: 600, cursor: 'pointer' }}
            >
              <option value="ALL">All Manufacturers</option>
              {(manufacturers || []).map(m => (
                <option key={m.id} value={m.id}>{m.companyName || m.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Informative Notice */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#475569', paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Info size={14} style={{ color: '#0F766E' }} />
            <span>Central Product Master is the single source of truth for product identity. Manufacturers map to these records.</span>
          </div>
          <span>Showing <strong style={{ color: '#0F766E' }}>{filteredProducts.length}</strong> central products</span>
        </div>
      </div>

      {/* ── Admin Central Product Master Table ──────────────────────── */}
      <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>PRODUCT CODE</th>
              <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>PRODUCT NAME</th>
              <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>GENERIC NAME</th>
              <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>SALT COMBINATION</th>
              <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>STRENGTH</th>
              <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>DOSAGE FORM</th>
              <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>PACK SIZE</th>
              <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>UOM</th>
              <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>CATEGORY</th>
              <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>STATUS</th>
              <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right', paddingRight: 20 }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                  <Package size={36} style={{ color: '#94A3B8', marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>No central products found.</div>
                  <div style={{ fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 18 }}>
                    Create a standardized product master record to begin manufacturer mapping.
                  </div>
                  <button
                    onClick={handleOpenAddModal}
                    style={{ padding: '9px 18px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                  >
                    + Add Product
                  </button>
                </td>
              </tr>
            ) : (
              filteredProducts.map((prd) => {
                const statusStr = prd.status || 'Active';
                return (
                  <tr
                    key={prd.id}
                    onClick={() => setSelectedProduct(prd)}
                    style={{ cursor: 'pointer', borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                  >
                    {/* 1. PRODUCT CODE */}
                    <td style={{ padding: '14px 16px', fontSize: 12.5, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                      {prd.code}
                    </td>

                    {/* 2. PRODUCT NAME */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>{prd.name}</div>
                    </td>

                    {/* 3. GENERIC NAME */}
                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
                      {prd.genericName}
                    </td>

                    {/* 4. SALT COMBINATION */}
                    <td style={{ padding: '14px 16px', fontSize: 12.5, color: '#475569', maxWidth: 220, lineHeight: 1.4 }}>
                      {prd.saltCombination}
                    </td>

                    {/* 5. STRENGTH */}
                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 800, color: '#0F766E' }}>
                      {prd.strength}
                    </td>

                    {/* 6. DOSAGE FORM */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                        {prd.dosageForm}
                      </span>
                    </td>

                    {/* 7. PACK SIZE */}
                    <td style={{ padding: '14px 16px', fontSize: 12.5, color: '#334155', fontWeight: 600 }}>
                      {prd.packSize}
                    </td>

                    {/* 8. UOM */}
                    <td style={{ padding: '14px 16px', fontSize: 12.5, color: '#475569' }}>
                      {prd.uom || 'Units'}
                    </td>

                    {/* 9. CATEGORY */}
                    <td style={{ padding: '14px 16px', fontSize: 12.5, fontWeight: 600, color: '#334155' }}>
                      {prd.category}
                    </td>

                    {/* 10. STATUS */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                        background: statusStr === 'Active' ? '#DCFCE7' : '#F3F4F6',
                        color: statusStr === 'Active' ? '#15803D' : '#4B5563',
                        border: statusStr === 'Active' ? '1px solid #86EFAC' : '1px solid #D1D5DB'
                      }}>
                        {statusStr}
                      </span>
                    </td>

                    {/* 11. ACTIONS */}
                    <td onClick={e => e.stopPropagation()} style={{ padding: '14px 16px', textAlign: 'right', paddingRight: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          onClick={() => setSelectedProduct(prd)}
                          style={{ padding: '5px 10px', fontSize: 11.5, fontWeight: 700, borderRadius: 6, background: 'rgba(15, 118, 110, 0.08)', border: '1px solid rgba(15, 118, 110, 0.25)', color: '#0F766E', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Eye size={12} /> View
                        </button>
                        <button
                          onClick={(e) => handleOpenEditModal(prd, e)}
                          style={{ padding: '5px 8px', fontSize: 11.5, fontWeight: 600, borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                          title="Edit Product Master"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          onClick={(e) => handleToggleStatus(prd, e)}
                          style={{ padding: '5px 8px', fontSize: 11.5, fontWeight: 600, borderRadius: 6, background: statusStr === 'Active' ? '#FEE2E2' : '#DCFCE7', border: statusStr === 'Active' ? '1px solid #FCA5A5' : '1px solid #86EFAC', color: statusStr === 'Active' ? '#B91C1C' : '#15803D', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                          title={statusStr === 'Active' ? 'Deactivate Product' : 'Activate Product'}
                        >
                          <Power size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── PRODUCT MASTER DETAIL DRAWER ─────────────────────── */}
      {selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end' }} onClick={() => setSelectedProduct(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 620, height: '100%', background: '#FFFFFF', borderLeft: '1px solid #CBD5E1', display: 'flex', flexDirection: 'column', boxShadow: '-12px 0 32px rgba(15, 23, 42, 0.15)' }}>
            
            {/* Drawer Header */}
            <div style={{ padding: '20px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: '#0F766E', fontWeight: 800, fontFamily: 'monospace' }}>{selectedProduct.code}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: selectedProduct.status === 'Inactive' ? '#F3F4F6' : '#DCFCE7', color: selectedProduct.status === 'Inactive' ? '#4B5563' : '#15803D', border: selectedProduct.status === 'Inactive' ? '1px solid #D1D5DB' : '1px solid #86EFAC' }}>
                    {selectedProduct.status || 'Active'}
                  </span>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.3 }}>{selectedProduct.name}</h2>
              </div>
              <button onClick={() => setSelectedProduct(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ padding: 24, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* PRODUCT INFORMATION */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 12, letterSpacing: '0.06em' }}>
                  PRODUCT INFORMATION
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5 }}>
                  <div><span style={{ color: '#64748B' }}>Product Code:</span> <strong style={{ color: '#0F766E', fontFamily: 'monospace', display: 'block' }}>{selectedProduct.code}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Product Name:</span> <strong style={{ color: '#0F172A', display: 'block' }}>{selectedProduct.name}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Generic Name:</span> <strong style={{ color: '#1E293B', display: 'block' }}>{selectedProduct.genericName}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Category:</span> <strong style={{ color: '#334155', display: 'block' }}>{selectedProduct.category}</strong></div>
                </div>

                {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Tags</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {selectedProduct.tags.map(t => (
                        <span key={t} style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#E2E8F0', color: '#334155' }}>
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* COMPOSITION */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 12, letterSpacing: '0.06em' }}>
                  COMPOSITION
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5 }}>
                  <div><span style={{ color: '#64748B' }}>Salt Combination:</span> <strong style={{ color: '#0F172A', display: 'block' }}>{selectedProduct.saltCombination}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Strength:</span> <strong style={{ color: '#0F766E', display: 'block' }}>{selectedProduct.strength}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Dosage Form:</span> <strong style={{ color: '#0F172A', display: 'block' }}>{selectedProduct.dosageForm}</strong></div>
                </div>
              </div>

              {/* PACKAGING */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 12, letterSpacing: '0.06em' }}>
                  PACKAGING
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5 }}>
                  <div><span style={{ color: '#64748B' }}>Pack Size:</span> <strong style={{ color: '#334155', display: 'block' }}>{selectedProduct.packSize}</strong></div>
                  <div><span style={{ color: '#64748B' }}>UOM:</span> <strong style={{ color: '#0F172A', display: 'block' }}>{selectedProduct.uom || 'Units'}</strong></div>
                </div>
              </div>

              {/* DESCRIPTION */}
              {selectedProduct.description && (
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 6, letterSpacing: '0.06em' }}>
                    DESCRIPTION
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                    {selectedProduct.description}
                  </p>
                </div>
              )}

              {/* MANUFACTURER MAPPINGS */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 10, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Factory size={15} /> MANUFACTURER MAPPINGS ({mappedItemsForSelected.length})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {mappedItemsForSelected.length === 0 ? (
                    <div style={{ padding: 16, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12.5, color: '#64748B', textAlign: 'center' }}>
                      No manufacturer mappings recorded for this central product master yet.
                    </div>
                  ) : (
                    mappedItemsForSelected.map(({ mapping, manufacturer }) => (
                      <div
                        key={`${mapping.productId}_${mapping.manufacturerId}`}
                        style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>
                            {manufacturer.companyName || manufacturer.name}
                          </div>
                          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                            Mfg Code: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{mapping.mfgProductCode}</strong> · MOQ: {mapping.moq.toLocaleString()} Units · Lead: {mapping.standardLeadTimeDays} Days
                          </div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D' }}>
                          Active
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Drawer Footer Actions */}
            <div style={{ padding: 16, background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => handleOpenEditModal(selectedProduct)}
                style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#0F172A', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Edit3 size={14} /> Edit Product Master
              </button>

              <button
                onClick={() => handleToggleStatus(selectedProduct)}
                style={{ padding: '9px 16px', borderRadius: 6, border: selectedProduct.status === 'Inactive' ? '1px solid #86EFAC' : '1px solid #FCA5A5', background: selectedProduct.status === 'Inactive' ? '#DCFCE7' : '#FEE2E2', color: selectedProduct.status === 'Inactive' ? '#15803D' : '#B91C1C', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Power size={14} /> {selectedProduct.status === 'Inactive' ? 'Activate Product' : 'Deactivate Product'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── CREATE / EDIT CENTRAL PRODUCT MODAL ────────────────── */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setIsAddModalOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {editingProductId ? 'EDIT CENTRAL PRODUCT' : 'CREATE CENTRAL PRODUCT'}
                </h3>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Create a standardized product master record.
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* Inline Error Alert */}
            {modalFormError && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#B91C1C', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{modalFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProductMaster} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {/* SECTION A: PRODUCT IDENTITY */}
              <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em' }}>
                A. PRODUCT IDENTITY
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Product Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="PRD001001"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AmoxyClav 625mg Tablets"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Generic Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amoxicillin + Potassium Clavulanate"
                    value={formData.genericName}
                    onChange={e => setFormData({ ...formData, genericName: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Category *</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600 }}
                  >
                    <option value="Antibiotics">Antibiotics</option>
                    <option value="Analgesic">Analgesic & Antipyretic</option>
                    <option value="Gastroenterology">Gastroenterology</option>
                    <option value="Diabetology">Diabetology</option>
                    <option value="Nutraceuticals">Nutraceuticals</option>
                    <option value="Cardiology">Cardiology</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="Tablet, OTC, Antibiotic"
                  value={formData.tagsStr}
                  onChange={e => setFormData({ ...formData, tagsStr: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                />
              </div>

              {/* SECTION B: PRODUCT COMPOSITION */}
              <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em', marginTop: 6 }}>
                B. PRODUCT COMPOSITION
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Salt Combination *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amoxicillin Trihydrate 500mg + Clavulanic Acid 125mg"
                    value={formData.saltCombination}
                    onChange={e => setFormData({ ...formData, saltCombination: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Strength *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 625mg"
                    value={formData.strength}
                    onChange={e => setFormData({ ...formData, strength: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Dosage Form *</label>
                <select
                  value={formData.dosageForm}
                  onChange={e => setFormData({ ...formData, dosageForm: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600 }}
                >
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Syrup">Syrup</option>
                  <option value="Injection">Injection</option>
                  <option value="Ointment">Ointment</option>
                  <option value="Suspension">Suspension</option>
                  <option value="Powder">Powder</option>
                </select>
              </div>

              {/* SECTION C: PACKAGING */}
              <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em', marginTop: 6 }}>
                C. PACKAGING
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Pack Size *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10 × 1 × 10 Strip"
                    value={formData.packSize}
                    onChange={e => setFormData({ ...formData, packSize: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>UOM *</label>
                  <select
                    value={formData.uom}
                    onChange={e => setFormData({ ...formData, uom: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600 }}
                  >
                    <option value="Units">Units</option>
                    <option value="Boxes">Boxes</option>
                    <option value="Strips">Strips</option>
                    <option value="Vials">Vials</option>
                    <option value="Bottles">Bottles</option>
                  </select>
                </div>
              </div>

              {/* SECTION D: DESCRIPTION */}
              <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em', marginTop: 6 }}>
                D. DESCRIPTION
              </div>

              <div>
                <textarea
                  rows={2}
                  placeholder="Detailed standardized product master notes..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none', resize: 'none' }}
                />
              </div>

              {/* SECTION E: STATUS */}
              <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em', marginTop: 6 }}>
                E. STATUS
              </div>

              <div>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600 }}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10, paddingTop: 14, borderTop: '1px solid #E2E8F0' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'cursor' }}>Cancel</button>
                <button type="submit" style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Create Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
