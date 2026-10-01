import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductManufacturer, LifecycleStatus } from '../../types';
import {
  Link2, Search, Plus, Edit3, Power, Trash2,
  CheckCircle2, AlertCircle, X, Info, Filter, ArrowRight,
  Package, Factory, Star
} from 'lucide-react';

export const ProductManufacturerMappingModule: React.FC = () => {
  const {
    products,
    manufacturers,
    mappings,
    addMapping,
    updateMapping,
    removeMapping,
    setPreferredManufacturer,
    addAuditLog,
    setActiveTab
  } = useApp();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('ALL');
  const [selectedManufacturerId, setSelectedManufacturerId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [preferredOnly, setPreferredOnly] = useState(false);

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<ProductManufacturer | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    productId: '',
    manufacturerId: '',
    manufacturerProductCode: '',
    manufacturerPartNumber: '',
    manufacturerSku: '',
    lifecycleStatus: 'ACTIVE' as LifecycleStatus,
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: '',
    isPreferred: false
  });

  // Active Manufacturers for dropdown (only ACTIVE manufacturers eligible for new mappings)
  const activeManufacturers = useMemo(() => {
    return (manufacturers || []).filter(m =>
      m.lifecycle_status === 'ACTIVE' || (m as any).status === 'ACTIVE' || (m as any).status === 'Active'
    );
  }, [manufacturers]);

  // Resolvers
  const getProductRecord = (pid: string) => {
    return (products || []).find(p => p.id === pid || p.product_id === pid || p.code === pid);
  };

  const getManufacturerRecord = (mid: string) => {
    return (manufacturers || []).find(m => m.manufacturer_id === mid || m.id === mid);
  };

  // Status badge styling helper
  const getLifecycleBadge = (status?: string) => {
    const st = (status || 'ACTIVE').toUpperCase();
    switch (st) {
      case 'ACTIVE':
        return { label: 'ACTIVE', bg: '#DCFCE7', color: '#15803D', border: '#86EFAC' };
      case 'INACTIVE':
        return { label: 'INACTIVE', bg: '#FEE2E2', color: '#B91C1C', border: '#FCA5A5' };
      case 'SUSPENDED':
        return { label: 'SUSPENDED', bg: '#FFEDD5', color: '#C2410C', border: '#FDBA74' };
      case 'EOL':
      case 'DISCONTINUED':
        return { label: st === 'EOL' ? 'EOL' : 'DISCONTINUED', bg: '#F3E8FF', color: '#7E22CE', border: '#D8B4FE' };
      default:
        return { label: st, bg: '#F1F5F9', color: '#64748B', border: '#CBD5E1' };
    }
  };

  // Filtered Mappings List
  const filteredMappings = useMemo(() => {
    return (mappings || []).filter(m => {
      const q = searchTerm.toLowerCase().trim();
      const pid = m.product_id || m.productId || '';
      const mid = m.manufacturer_id || m.manufacturerId || '';
      const prd = getProductRecord(pid);
      const mfg = getManufacturerRecord(mid);

      const prdCode = (prd?.product_code || prd?.code || '').toLowerCase();
      const prdName = (prd?.product_name || prd?.name || m.productName || '').toLowerCase();
      const mfgName = (mfg?.manufacturer_name || mfg?.companyName || mfg?.name || m.manufacturerName || '').toLowerCase();
      const mfgCode = (mfg?.manufacturer_code || (mfg as any)?.code || m.manufacturerCode || '').toLowerCase();
      const mfgProdCode = (m.manufacturer_product_code || m.mfgProductCode || '').toLowerCase();
      const mfgPartNum = (m.manufacturer_part_number || '').toLowerCase();
      const mfgSku = (m.manufacturer_sku || '').toLowerCase();

      // Search match
      const matchesSearch =
        q === '' ||
        prdCode.includes(q) ||
        prdName.includes(q) ||
        mfgName.includes(q) ||
        mfgCode.includes(q) ||
        mfgProdCode.includes(q) ||
        mfgPartNum.includes(q) ||
        mfgSku.includes(q);

      // Product filter
      const matchesProduct = selectedProductId === 'ALL' || pid === selectedProductId;

      // Manufacturer filter
      const matchesMfg = selectedManufacturerId === 'ALL' || mid === selectedManufacturerId;

      // Lifecycle status filter
      const statusVal = (m.lifecycle_status || (m.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE')).toUpperCase();
      const matchesStatus = selectedStatus === 'ALL' || statusVal === selectedStatus;

      // Preferred filter
      const isPref = !!(m.is_preferred || m.isPreferred);
      const matchesPreferred = !preferredOnly || isPref;

      return matchesSearch && matchesProduct && matchesMfg && matchesStatus && matchesPreferred;
    });
  }, [mappings, products, manufacturers, searchTerm, selectedProductId, selectedManufacturerId, selectedStatus, preferredOnly]);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = (mappings || []).length;
    const active = (mappings || []).filter(m => (m.lifecycle_status || (m.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE')) === 'ACTIVE').length;
    const uniqueProducts = new Set((mappings || []).map(m => m.product_id || m.productId)).size;
    const preferredCount = (mappings || []).filter(m => m.is_preferred || m.isPreferred).length;
    return { total, active, uniqueProducts, preferredCount };
  }, [mappings]);

  // Modal Open Handlers
  const handleOpenAdd = () => {
    setEditingMapping(null);
    const defaultProduct = products[0]?.id || '';
    const defaultMfg = activeManufacturers[0]?.manufacturer_id || activeManufacturers[0]?.id || '';
    const prd = products[0];
    const prdCode = prd?.product_code || prd?.code || 'PRD';

    setFormData({
      productId: defaultProduct,
      manufacturerId: defaultMfg,
      manufacturerProductCode: `${prdCode}-MFG`,
      manufacturerPartNumber: `PN-${prdCode}`,
      manufacturerSku: `SKU-${prdCode}`,
      lifecycleStatus: 'ACTIVE',
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: '',
      isPreferred: false
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (mapping: ProductManufacturer) => {
    setEditingMapping(mapping);
    setFormData({
      productId: mapping.product_id || mapping.productId || '',
      manufacturerId: mapping.manufacturer_id || mapping.manufacturerId || '',
      manufacturerProductCode: mapping.manufacturer_product_code || mapping.mfgProductCode || '',
      manufacturerPartNumber: mapping.manufacturer_part_number || '',
      manufacturerSku: mapping.manufacturer_sku || '',
      lifecycleStatus: (mapping.lifecycle_status || (mapping.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE')) as LifecycleStatus,
      effectiveFrom: mapping.effective_from || mapping.effectiveFrom || '',
      effectiveTo: mapping.effective_to || mapping.effectiveTo || '',
      isPreferred: !!(mapping.is_preferred || mapping.isPreferred)
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Form Save Handler
  const handleSaveMapping = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.productId) {
      setFormError('Product is mandatory. Please select a product.');
      return;
    }
    if (!formData.manufacturerId) {
      setFormError('Manufacturer is mandatory. Please select an active manufacturer.');
      return;
    }
    if (formData.effectiveFrom && formData.effectiveTo && formData.effectiveTo < formData.effectiveFrom) {
      setFormError('Effective To date cannot be earlier than Effective From date.');
      return;
    }

    const prd = getProductRecord(formData.productId);
    const mfg = getManufacturerRecord(formData.manufacturerId);
    const prdCode = prd?.product_code || prd?.code || 'PRD';
    const prdName = prd?.product_name || prd?.name || 'Product';
    const mfgCode = mfg?.manufacturer_code || (mfg as any)?.code || 'MFG';
    const mfgName = mfg?.manufacturer_name || mfg?.companyName || mfg?.name || 'Manufacturer';
    const nowIso = new Date().toISOString().split('T')[0];

    if (editingMapping) {
      const origPid = editingMapping.product_id || editingMapping.productId || formData.productId;
      const origMid = editingMapping.manufacturer_id || editingMapping.manufacturerId || formData.manufacturerId;

      updateMapping(origPid, origMid, {
        manufacturer_product_code: formData.manufacturerProductCode.trim(),
        mfgProductCode: formData.manufacturerProductCode.trim(),
        manufacturer_part_number: formData.manufacturerPartNumber.trim(),
        manufacturer_sku: formData.manufacturerSku.trim(),
        lifecycle_status: formData.lifecycleStatus,
        status: formData.lifecycleStatus === 'ACTIVE' ? 'Active' : 'Inactive',
        effective_from: formData.effectiveFrom || nowIso,
        effectiveFrom: formData.effectiveFrom || nowIso,
        effective_to: formData.effectiveTo || null,
        effectiveTo: formData.effectiveTo || null,
        is_preferred: formData.isPreferred,
        isPreferred: formData.isPreferred,
        updated_at: nowIso
      });

      if (formData.isPreferred) {
        setPreferredManufacturer(origPid, origMid);
      }

      addAuditLog('UPDATE_PRODUCT_MANUFACTURER', `Updated mapping between ${prdName} (${prdCode}) and ${mfgName} (${mfgCode})`);
    } else {
      // Duplicate check for same product and manufacturer
      const exists = (mappings || []).some(m => {
        const matchPid = (m.product_id === formData.productId || m.productId === formData.productId);
        const matchMid = (m.manufacturer_id === formData.manufacturerId || m.manufacturerId === formData.manufacturerId);
        return matchPid && matchMid;
      });

      if (exists) {
        setFormError(`This product is already mapped to ${mfgName}. Multiple mappings to the same manufacturer are not permitted.`);
        return;
      }

      const newMapping: ProductManufacturer = {
        product_manufacturer_id: `pm_${Date.now()}`,
        product_id: formData.productId,
        productId: formData.productId,
        productName: prdName,
        manufacturer_id: formData.manufacturerId,
        manufacturerId: formData.manufacturerId,
        manufacturer_code: mfgCode,
        manufacturerCode: mfgCode,
        manufacturer_name: mfgName,
        manufacturerName: mfgName,
        manufacturer_product_code: formData.manufacturerProductCode.trim(),
        mfgProductCode: formData.manufacturerProductCode.trim(),
        manufacturer_part_number: formData.manufacturerPartNumber.trim(),
        manufacturer_sku: formData.manufacturerSku.trim(),
        lifecycle_status: formData.lifecycleStatus,
        status: formData.lifecycleStatus === 'ACTIVE' ? 'Active' : 'Inactive',
        effective_from: formData.effectiveFrom || nowIso,
        effectiveFrom: formData.effectiveFrom || nowIso,
        effective_to: formData.effectiveTo || null,
        effectiveTo: formData.effectiveTo || null,
        is_preferred: formData.isPreferred,
        isPreferred: formData.isPreferred,
        created_at: nowIso,
        updated_at: nowIso
      };

      addMapping(newMapping);

      if (formData.isPreferred) {
        setPreferredManufacturer(formData.productId, formData.manufacturerId);
      }

      addAuditLog('CREATE_PRODUCT_MANUFACTURER', `Created new mapping for product ${prdName} (${prdCode}) with manufacturer ${mfgName}`);
    }

    setIsModalOpen(false);
    setEditingMapping(null);
  };

  // Toggle Status Handler
  const handleToggleStatus = (mapping: ProductManufacturer) => {
    const pid = mapping.product_id || mapping.productId || '';
    const mid = mapping.manufacturer_id || mapping.manufacturerId || '';
    const current = (mapping.lifecycle_status || (mapping.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE')).toUpperCase();
    const nextStatus: LifecycleStatus = current === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    updateMapping(pid, mid, {
      lifecycle_status: nextStatus,
      status: nextStatus === 'ACTIVE' ? 'Active' : 'Inactive',
      updated_at: new Date().toISOString().split('T')[0]
    });

    addAuditLog('TOGGLE_PRODUCT_MANUFACTURER_STATUS', `Toggled lifecycle status to ${nextStatus} for mapping of Product ${pid} and Manufacturer ${mid}`);
  };

  // Mark Preferred Handler
  const handleSetPreferred = (mapping: ProductManufacturer) => {
    const pid = mapping.product_id || mapping.productId || '';
    const mid = mapping.manufacturer_id || mapping.manufacturerId || '';
    setPreferredManufacturer(pid, mid);
  };

  // Remove Mapping Handler
  const handleRemove = (mapping: ProductManufacturer) => {
    const pid = mapping.product_id || mapping.productId || '';
    const mid = mapping.manufacturer_id || mapping.manufacturerId || '';
    const prd = getProductRecord(pid);
    const mfg = getManufacturerRecord(mid);
    const label = `${prd?.product_name || pid} ↔ ${mfg?.manufacturer_name || mid}`;

    if (window.confirm(`Are you sure you want to remove the relationship mapping between:\n${label}?\n\nThis removes the mapping record only. Neither the Product Master nor the Manufacturer Master will be deleted.`)) {
      removeMapping(pid, mid);
      addAuditLog('REMOVE_PRODUCT_MANUFACTURER', `Removed product-manufacturer mapping for ${label}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48 }}>

      {/* ── Enterprise Header ────────────────────────────────────── */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: 24,
        boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(15, 118, 110, 0.10)',
            border: '1px solid rgba(15, 118, 110, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Link2 size={26} style={{ color: '#0F766E' }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0F766E' }}>
              CATALOG &amp; PRODUCT MANAGEMENT · RELATIONSHIP MASTER
            </div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              PRODUCT-MANUFACTURER MAPPING
            </h1>
            <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
              Map central products to eligible manufacturers. One product can have multiple manufacturers with independent SKUs and preferred supplier flags.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setActiveTab('products')}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              background: '#F8FAFC',
              color: '#334155',
              border: '1px solid #CBD5E1',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Package size={15} /> Product Catalog
          </button>
          <button
            onClick={() => setActiveTab('manufacturer-master')}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              background: '#F8FAFC',
              color: '#334155',
              border: '1px solid #CBD5E1',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Factory size={15} /> Manufacturer Master
          </button>
          <button
            onClick={handleOpenAdd}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              background: '#0F766E',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 1px 2px rgba(15,118,110,0.2)'
            }}
          >
            <Plus size={16} /> + Add Product Manufacturer Mapping
          </button>
        </div>
      </div>

      {/* ── KPI Stat Summary Cards ───────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 2px rgba(15,23,42,0.03)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Mappings</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{stats.total}</div>
          <div style={{ fontSize: 11.5, color: '#0F766E', marginTop: 2, fontWeight: 600 }}>PRODUCT_MANUFACTURER records</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 2px rgba(15,23,42,0.03)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active Relationships</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#15803D', marginTop: 4 }}>{stats.active}</div>
          <div style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }}>Eligible for active catalog supply</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 2px rgba(15,23,42,0.03)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Products Mapped</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F766E', marginTop: 4 }}>{stats.uniqueProducts}</div>
          <div style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }}>Unique central products</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 2px rgba(15,23,42,0.03)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Preferred Suppliers</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#B45309', marginTop: 4 }}>★ {stats.preferredCount}</div>
          <div style={{ fontSize: 11.5, color: '#B45309', marginTop: 2, fontWeight: 600 }}>Designated primary mappings</div>
        </div>
      </div>

      {/* ── Search & Multi-Filter Controls Bar ────────────────────── */}
      <div style={{
        padding: 18,
        background: '#FFFFFF',
        borderRadius: 12,
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>

          {/* Search Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#F8FAFC',
            border: '1px solid #CBD5E1',
            borderRadius: 8,
            padding: '10px 14px',
            flex: '1 1 280px'
          }}>
            <Search size={16} style={{ color: '#64748B', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by product code, name, manufacturer, mfg SKU or code..."
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

          {/* Filter by Product */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0F766E' }}>Product:</span>
            <select
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
              style={{
                padding: '8px 12px',
                fontSize: 12.5,
                background: selectedProductId !== 'ALL' ? '#F0FDFA' : '#FFFFFF',
                border: selectedProductId !== 'ALL' ? '1.5px solid #0F766E' : '1px solid #CBD5E1',
                borderRadius: 6,
                color: '#0F172A',
                fontWeight: 600,
                cursor: 'pointer',
                maxWidth: 220
              }}
            >
              <option value="ALL">All Products ({(products || []).length})</option>
              {(products || []).map(p => (
                <option key={p.id} value={p.id}>
                  {p.product_code || p.code} · {p.product_name || p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Manufacturer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Manufacturer:</span>
            <select
              value={selectedManufacturerId}
              onChange={e => setSelectedManufacturerId(e.target.value)}
              style={{
                padding: '8px 12px',
                fontSize: 12.5,
                background: selectedManufacturerId !== 'ALL' ? '#F0FDFA' : '#FFFFFF',
                border: selectedManufacturerId !== 'ALL' ? '1.5px solid #0F766E' : '1px solid #CBD5E1',
                borderRadius: 6,
                color: '#0F172A',
                fontWeight: 600,
                cursor: 'pointer',
                maxWidth: 220
              }}
            >
              <option value="ALL">All Manufacturers ({(manufacturers || []).length})</option>
              {(manufacturers || []).map(m => (
                <option key={m.manufacturer_id || m.id} value={m.manufacturer_id || m.id}>
                  {m.manufacturer_name || m.companyName || m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Lifecycle Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Status:</span>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              style={{
                padding: '8px 12px',
                fontSize: 12.5,
                background: selectedStatus !== 'ALL' ? '#F0FDFA' : '#FFFFFF',
                border: selectedStatus !== 'ALL' ? '1.5px solid #0F766E' : '1px solid #CBD5E1',
                borderRadius: 6,
                color: '#0F172A',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="EOL">EOL (End of Life)</option>
            </select>
          </div>

          {/* Filter: Preferred Only Toggle */}
          <button
            type="button"
            onClick={() => setPreferredOnly(!preferredOnly)}
            style={{
              padding: '8px 12px',
              fontSize: 12.5,
              fontWeight: 700,
              borderRadius: 6,
              border: preferredOnly ? '1.5px solid #F59E0B' : '1px solid #CBD5E1',
              background: preferredOnly ? '#FFFBEB' : '#FFFFFF',
              color: preferredOnly ? '#B45309' : '#475569',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Star size={14} style={{ color: preferredOnly ? '#F59E0B' : '#94A3B8', fill: preferredOnly ? '#F59E0B' : 'none' }} />
            {preferredOnly ? '★ Preferred Only' : 'Filter Preferred'}
          </button>

          {(searchTerm || selectedProductId !== 'ALL' || selectedManufacturerId !== 'ALL' || selectedStatus !== 'ALL' || preferredOnly) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedProductId('ALL');
                setSelectedManufacturerId('ALL');
                setSelectedStatus('ALL');
                setPreferredOnly(false);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#DC2626',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                padding: '4px 8px'
              }}
            >
              Reset Filters
            </button>
          )}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 12,
          color: '#64748B',
          paddingTop: 10,
          borderTop: '1px solid #F1F5F9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Info size={14} style={{ color: '#0F766E' }} />
            <span>
              Client Relationship Rule: PRODUCT does not store manufacturer fields. All manufacturer relationships, SKUs, and codes belong strictly to PRODUCT_MANUFACTURER.
            </span>
          </div>
          <div>
            Showing <strong style={{ color: '#0F766E' }}>{filteredMappings.length}</strong> of {mappings.length} mappings
          </div>
        </div>
      </div>

      {/* ── Main PRODUCT_MANUFACTURER Table ───────────────────────── */}
      <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)', overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: 1200, borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ padding: '12px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 120 }}>
                PRODUCT CODE
              </th>
              <th style={{ padding: '12px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', minWidth: 200 }}>
                PRODUCT NAME
              </th>
              <th style={{ padding: '12px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', minWidth: 200 }}>
                MANUFACTURER
              </th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 140 }}>
                MFG PRODUCT CODE
              </th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 130 }}>
                PART NUMBER
              </th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 120 }}>
                MFG SKU
              </th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 110 }}>
                STATUS
              </th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 105 }}>
                EFFECTIVE FROM
              </th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 105 }}>
                EFFECTIVE TO
              </th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 115 }}>
                PREFERRED
              </th>
              <th style={{ padding: '12px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right', width: 160 }}>
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredMappings.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                  <Link2 size={36} style={{ color: '#94A3B8', marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>No product-manufacturer mappings found.</div>
                  <div style={{ fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 18 }}>
                    Create a mapping relationship to connect a central product to its authorized manufacturer.
                  </div>
                  <button
                    onClick={handleOpenAdd}
                    style={{ padding: '9px 18px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                  >
                    + Add Product Manufacturer Mapping
                  </button>
                </td>
              </tr>
            ) : (
              filteredMappings.map(mapping => {
                const pid = mapping.product_id || mapping.productId || '';
                const mid = mapping.manufacturer_id || mapping.manufacturerId || '';
                const prd = getProductRecord(pid);
                const mfg = getManufacturerRecord(mid);

                const prdCode = prd?.product_code || prd?.code || pid;
                const prdName = prd?.product_name || prd?.name || mapping.productName || 'Central Product';
                const mfgName = mfg?.manufacturer_name || mfg?.companyName || mfg?.name || mapping.manufacturerName || 'Manufacturer';
                const mfgCode = mfg?.manufacturer_code || (mfg as any)?.code || mapping.manufacturerCode || '';

                const mfgProdCode = mapping.manufacturer_product_code || mapping.mfgProductCode || '—';
                const mfgPartNum = mapping.manufacturer_part_number || '—';
                const mfgSku = mapping.manufacturer_sku || '—';

                const isPref = !!(mapping.is_preferred || mapping.isPreferred);
                const statusVal = mapping.lifecycle_status || (mapping.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE');
                const badge = getLifecycleBadge(statusVal);
                const effFrom = mapping.effective_from || mapping.effectiveFrom || '—';
                const effTo = mapping.effective_to || mapping.effectiveTo || '—';

                return (
                  <tr
                    key={mapping.product_manufacturer_id || `${pid}_${mid}`}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      background: isPref ? '#FFFDF5' : '#FFFFFF',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = isPref ? '#FEF9E7' : '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = isPref ? '#FFFDF5' : '#FFFFFF'}
                  >
                    {/* 1. PRODUCT CODE */}
                    <td style={{ padding: '12px 12px', fontSize: 12, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {prdCode}
                    </td>

                    {/* 2. PRODUCT NAME */}
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>
                        {prdName}
                      </div>
                    </td>

                    {/* 3. MANUFACTURER */}
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                        {mfgName}
                      </div>
                      {mfgCode && (
                        <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace', marginTop: 1 }}>
                          {mfgCode}
                        </div>
                      )}
                    </td>

                    {/* 4. MANUFACTURER PRODUCT CODE */}
                    <td style={{ padding: '12px 10px', fontSize: 12, fontWeight: 700, color: '#0F766E', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {mfgProdCode}
                    </td>

                    {/* 5. MANUFACTURER PART NUMBER */}
                    <td style={{ padding: '12px 10px', fontSize: 12, color: '#334155', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {mfgPartNum}
                    </td>

                    {/* 6. MANUFACTURER SKU */}
                    <td style={{ padding: '12px 10px', fontSize: 12, color: '#334155', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {mfgSku}
                    </td>

                    {/* 7. LIFECYCLE STATUS */}
                    <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: 4,
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`
                      }}>
                        {badge.label}
                      </span>
                    </td>

                    {/* 8. EFFECTIVE FROM */}
                    <td style={{ padding: '12px 10px', fontSize: 11.5, color: '#64748B', whiteSpace: 'nowrap' }}>
                      {effFrom}
                    </td>

                    {/* 9. EFFECTIVE TO */}
                    <td style={{ padding: '12px 10px', fontSize: 11.5, color: '#64748B', whiteSpace: 'nowrap' }}>
                      {effTo}
                    </td>

                    {/* 10. PREFERRED */}
                    <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                      {isPref ? (
                        <span style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 4,
                          background: '#FEF3C7',
                          color: '#B45309',
                          border: '1px solid #FDE68A',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          ★ Preferred
                        </span>
                      ) : (
                        <span style={{ color: '#94A3B8', fontSize: 12, fontWeight: 500 }}>No</span>
                      )}
                    </td>

                    {/* 11. ACTIONS */}
                    <td style={{ padding: '12px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        {!isPref && (
                          <button
                            type="button"
                            onClick={() => handleSetPreferred(mapping)}
                            title="Set as Preferred Manufacturer for this product"
                            style={{
                              padding: '5px 8px',
                              borderRadius: 4,
                              background: '#FFFBEB',
                              border: '1px solid #FDE68A',
                              color: '#B45309',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3
                            }}
                          >
                            ★ Set Preferred
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(mapping)}
                          title="Edit Mapping Record"
                          style={{
                            padding: '5px 8px',
                            borderRadius: 4,
                            background: '#F0FDFA',
                            border: '1px solid #99F6E4',
                            color: '#0F766E',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3
                          }}
                        >
                          <Edit3 size={12} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(mapping)}
                          title={badge.label === 'ACTIVE' ? 'Deactivate Mapping' : 'Activate Mapping'}
                          style={{
                            padding: '5px 7px',
                            borderRadius: 4,
                            background: badge.label === 'ACTIVE' ? '#FEF2F2' : '#F0FDF4',
                            border: badge.label === 'ACTIVE' ? '1px solid #FECACA' : '1px solid #BBF7D0',
                            color: badge.label === 'ACTIVE' ? '#DC2626' : '#16A34A',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <Power size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(mapping)}
                          title="Remove Mapping Relationship"
                          style={{
                            padding: '5px 7px',
                            borderRadius: 4,
                            background: '#FFF',
                            border: '1px solid #CBD5E1',
                            color: '#64748B',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={12} />
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

      {/* ── ADD / EDIT PRODUCT MANUFACTURER MODAL ────────────────── */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 560,
              background: '#FFFFFF',
              borderRadius: 12,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#F8FAFC'
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0F766E' }}>
                  RELATIONSHIP ENTITY · PRODUCT_MANUFACTURER
                </div>
                <h3 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                  {editingMapping ? 'Edit Product Manufacturer Mapping' : 'Add Product-Manufacturer Mapping'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveMapping} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '80vh', overflowY: 'auto' }}>
              {formError && (
                <div style={{ padding: '10px 14px', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#B91C1C', fontSize: 12.5, fontWeight: 600 }}>
                  {formError}
                </div>
              )}

              {/* Product Selection */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Product *
                </label>
                <select
                  required
                  disabled={!!editingMapping}
                  value={formData.productId}
                  onChange={e => {
                    const chosenId = e.target.value;
                    const prd = getProductRecord(chosenId);
                    const prdCode = prd?.product_code || prd?.code || 'PRD';
                    setFormData({
                      ...formData,
                      productId: chosenId,
                      manufacturerProductCode: `${prdCode}-MFG`,
                      manufacturerPartNumber: `PN-${prdCode}`,
                      manufacturerSku: `SKU-${prdCode}`
                    });
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    background: editingMapping ? '#F1F5F9' : '#FFFFFF',
                    cursor: editingMapping ? 'not-allowed' : 'pointer'
                  }}
                >
                  <option value="" disabled>-- Select Central Product --</option>
                  {(products || []).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.product_code || p.code} · {p.product_name || p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Manufacturer Selection */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Manufacturer *
                </label>
                <select
                  required
                  disabled={!!editingMapping}
                  value={formData.manufacturerId}
                  onChange={e => setFormData({ ...formData, manufacturerId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    background: editingMapping ? '#F1F5F9' : '#FFFFFF',
                    cursor: editingMapping ? 'not-allowed' : 'pointer'
                  }}
                >
                  <option value="" disabled>-- Select Active Manufacturer --</option>
                  {(activeManufacturers || []).map(m => (
                    <option key={m.manufacturer_id || m.id} value={m.manufacturer_id || m.id}>
                      {m.manufacturer_name || m.companyName || m.name} ({m.manufacturer_code || (m as any).code})
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: 11, color: '#64748B', marginTop: 4, display: 'block' }}>
                  Only ACTIVE manufacturers from Manufacturer Master are eligible for new mappings.
                </span>
              </div>

              {/* Manufacturer Product Code & Part Number */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Manufacturer Product Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SUN-PAR-650"
                    value={formData.manufacturerProductCode}
                    onChange={e => setFormData({ ...formData, manufacturerProductCode: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Manufacturer Part Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PAR65001"
                    value={formData.manufacturerPartNumber}
                    onChange={e => setFormData({ ...formData, manufacturerPartNumber: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Manufacturer SKU */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Manufacturer SKU
                </label>
                <input
                  type="text"
                  placeholder="e.g. SB-650"
                  value={formData.manufacturerSku}
                  onChange={e => setFormData({ ...formData, manufacturerSku: e.target.value.toUpperCase() })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace', outline: 'none' }}
                />
                <span style={{ fontSize: 11, color: '#64748B', marginTop: 4, display: 'block' }}>
                  Specific to the Product-Manufacturer mapping relationship. Does NOT alter central Product Code.
                </span>
              </div>

              {/* Lifecycle Status & Preferred Flag */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Lifecycle Status *
                  </label>
                  <select
                    value={formData.lifecycleStatus}
                    onChange={e => setFormData({ ...formData, lifecycleStatus: e.target.value as LifecycleStatus })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600, background: '#FFFFFF' }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="EOL">EOL (End of Life)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Preferred Manufacturer
                  </label>
                  <select
                    value={formData.isPreferred ? 'YES' : 'NO'}
                    onChange={e => setFormData({ ...formData, isPreferred: e.target.value === 'YES' })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600, background: '#FFFFFF' }}
                  >
                    <option value="YES">Yes (Primary / Default)</option>
                    <option value="NO">No (Secondary)</option>
                  </select>
                </div>
              </div>

              {/* Effective Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Effective From
                  </label>
                  <input
                    type="date"
                    value={formData.effectiveFrom}
                    onChange={e => setFormData({ ...formData, effectiveFrom: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Effective To
                  </label>
                  <input
                    type="date"
                    value={formData.effectiveTo}
                    onChange={e => setFormData({ ...formData, effectiveTo: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 14, borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 22px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 1px 3px rgba(15,118,110,0.2)' }}
                >
                  {editingMapping ? 'Update Mapping' : 'Save Mapping'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
