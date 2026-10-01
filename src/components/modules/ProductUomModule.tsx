import React, { useState, useMemo } from 'react';
import {
  Layers, Search, Plus, Filter, Edit2, Trash2, X, AlertTriangle,
  Package, CheckCircle2, Clock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductUom } from '../../types';

export const ProductUomModule: React.FC = () => {
  const {
    products,
    productUoms,
    addProductUom,
    updateProductUom,
    removeProductUom,
    addAuditLog,
    currentRole
  } = useApp();

  const canEdit = currentRole === 'ADMIN';

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('ALL');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUomId, setEditingUomId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    product_id: '',
    uom: 'Boxes',
    conversion_factor: 10,
    is_base_uom: false,
    is_order_uom: true,
    is_active: true
  });

  // Filtered List
  const filteredUoms = useMemo(() => {
    return (productUoms || []).filter(u => {
      const q = searchTerm.toLowerCase().trim();
      const prd = (products || []).find(p => p.id === u.product_id || p.product_id === u.product_id);
      const prdName = (prd?.product_name || prd?.name || '').toLowerCase();
      const prdCode = (prd?.product_code || prd?.code || '').toLowerCase();
      const uomStr = (u.uom || '').toLowerCase();

      const matchesSearch = q === '' || prdName.includes(q) || prdCode.includes(q) || uomStr.includes(q);
      const matchesPrd = selectedProductId === 'ALL' || u.product_id === selectedProductId;
      const isActive = u.is_active !== false;
      const matchesActive = activeFilter === 'ALL' || (activeFilter === 'ACTIVE' ? isActive : !isActive);

      return matchesSearch && matchesPrd && matchesActive;
    });
  }, [productUoms, products, searchTerm, selectedProductId, activeFilter]);

  // Handlers
  const handleOpenAddModal = (defaultProductId?: string) => {
    setEditingUomId(null);
    setFormData({
      product_id: defaultProductId || (products[0]?.id || ''),
      uom: 'Boxes',
      conversion_factor: 10,
      is_base_uom: false,
      is_order_uom: true,
      is_active: true
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u: ProductUom) => {
    setEditingUomId(u.product_uom_id || u.id || '');
    setFormData({
      product_id: u.product_id || u.productId || '',
      uom: u.uom || '',
      conversion_factor: u.conversion_factor ?? u.conversionFactor ?? 1,
      is_base_uom: u.is_base_uom ?? u.isBaseUom ?? false,
      is_order_uom: u.is_order_uom ?? u.isOrderUom ?? true,
      is_active: u.is_active ?? u.isActive ?? true
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.product_id) {
      setFormError('Product is mandatory.');
      return;
    }
    if (!formData.uom.trim()) {
      setFormError('UOM is mandatory.');
      return;
    }
    if (formData.conversion_factor <= 0) {
      setFormError('Conversion Factor must be greater than 0.');
      return;
    }

    const nowIso = new Date().toISOString().split('T')[0];

    if (editingUomId) {
      updateProductUom(editingUomId, {
        product_id: formData.product_id,
        uom: formData.uom.trim(),
        conversion_factor: Number(formData.conversion_factor),
        is_base_uom: formData.is_base_uom,
        is_order_uom: formData.is_order_uom,
        is_active: formData.is_active,
        updated_at: nowIso,
        // compatibility
        productId: formData.product_id,
        conversionFactor: Number(formData.conversion_factor),
        isBaseUom: formData.is_base_uom,
        isOrderUom: formData.is_order_uom,
        isActive: formData.is_active
      });
      addAuditLog('UPDATE_PRODUCT_UOM', `Updated UOM ${formData.uom} for product ${formData.product_id}`);
    } else {
      const newUom: ProductUom = {
        product_uom_id: `puom_${Date.now()}`,
        product_id: formData.product_id,
        uom: formData.uom.trim(),
        conversion_factor: Number(formData.conversion_factor),
        is_base_uom: formData.is_base_uom,
        is_order_uom: formData.is_order_uom,
        is_active: formData.is_active,
        created_at: nowIso,
        updated_at: nowIso,
        // compatibility
        id: `puom_${Date.now()}`,
        productId: formData.product_id,
        conversionFactor: Number(formData.conversion_factor),
        isBaseUom: formData.is_base_uom,
        isOrderUom: formData.is_order_uom,
        isActive: formData.is_active
      };
      addProductUom(newUom);
      addAuditLog('ADD_PRODUCT_UOM', `Created UOM ${formData.uom} for product ${formData.product_id}`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (u: ProductUom) => {
    const id = u.product_uom_id || u.id || '';
    if (window.confirm(`Are you sure you want to remove this UOM mapping (${u.uom})?`)) {
      removeProductUom(id);
      addAuditLog('DELETE_PRODUCT_UOM', `Removed UOM ${u.uom} record ${id}`);
    }
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F0FDFA', border: '1px solid #99F6E4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={22} style={{ color: '#0F766E' }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>
                Product UOM Management
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
                Client Entity: <code>PRODUCT_UOM</code> · Manage multi-UOM conversion factors and orderable unit definitions
              </p>
            </div>
          </div>
        </div>

        {canEdit && (
          <button
            onClick={() => handleOpenAddModal()}
            style={{
              padding: '10px 18px',
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
              boxShadow: '0 2px 4px rgba(15,118,110,0.2)'
            }}
          >
            <Plus size={16} /> Add Product UOM
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, marginBottom: 16, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search by product name, code, or UOM..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
          />
        </div>

        {/* Product Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Package size={15} style={{ color: '#64748B' }} />
          <select
            value={selectedProductId}
            onChange={e => setSelectedProductId(e.target.value)}
            style={{ padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, background: '#FFFFFF', fontWeight: 600, maxWidth: 220 }}
          >
            <option value="ALL">All Products</option>
            {(products || []).map(p => (
              <option key={p.id} value={p.id}>
                {p.product_code || p.code} - {p.product_name || p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Active Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={15} style={{ color: '#64748B' }} />
          <select
            value={activeFilter}
            onChange={e => setActiveFilter(e.target.value as any)}
            style={{ padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, background: '#FFFFFF', fontWeight: 600 }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 260 }}>PRODUCT</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 140 }}>UOM</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0F766E', width: 160 }}>CONVERSION FACTOR</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 120 }}>IS BASE UOM</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 130 }}>IS ORDER UOM</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 110 }}>IS ACTIVE</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 120 }}>CREATED AT</th>
                {canEdit && (
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right', width: 90 }}>ACTIONS</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredUoms.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                    <Layers size={32} style={{ color: '#94A3B8', display: 'block', margin: '0 auto 10px' }} />
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>No product UOM records found.</div>
                    <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 4 }}>Add conversion factors and orderable unit mappings.</div>
                  </td>
                </tr>
              ) : (
                filteredUoms.map(u => {
                  const prd = (products || []).find(p => p.id === u.product_id || p.product_id === u.product_id);
                  const isBase = u.is_base_uom ?? u.isBaseUom ?? false;
                  const isOrder = u.is_order_uom ?? u.isOrderUom ?? false;
                  const isActive = u.is_active ?? u.isActive ?? true;

                  return (
                    <tr key={u.product_uom_id || u.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                          {prd?.product_name || prd?.name || u.product_id}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#0F766E', fontFamily: 'monospace', fontWeight: 600 }}>
                          {prd?.product_code || prd?.code}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#334155' }}>
                        {u.uom}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 800, color: '#0F766E' }}>
                        {u.conversion_factor ?? u.conversionFactor ?? 1}x {prd?.base_uom || 'base unit'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: 4,
                          background: isBase ? '#EFF6FF' : '#F1F5F9',
                          color: isBase ? '#1D4ED8' : '#64748B',
                          border: `1px solid ${isBase ? '#BFDBFE' : '#CBD5E1'}`
                        }}>
                          {isBase ? 'YES (Base)' : 'NO'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: 4,
                          background: isOrder ? '#DCFCE7' : '#F1F5F9',
                          color: isOrder ? '#15803D' : '#64748B',
                          border: `1px solid ${isOrder ? '#86EFAC' : '#CBD5E1'}`
                        }}>
                          {isOrder ? 'YES (Orderable)' : 'NO'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: isActive ? '#DCFCE7' : '#FEE2E2',
                          color: isActive ? '#15803D' : '#B91C1C',
                          border: `1px solid ${isActive ? '#86EFAC' : '#FCA5A5'}`
                        }}>
                          {isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: '#64748B' }}>
                        {u.created_at || '—'}
                      </td>
                      {canEdit && (
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              title="Edit UOM"
                              style={{ padding: '5px 8px', borderRadius: 4, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', cursor: 'pointer' }}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(u)}
                              title="Delete UOM"
                              style={{ padding: '5px 8px', borderRadius: 4, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 12, width: '100%', maxWidth: 520, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                  {editingUomId ? 'Edit Product UOM' : 'Add Product UOM'}
                </h3>
                <span style={{ fontSize: 12, color: '#64748B' }}>Entity: PRODUCT_UOM</span>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div style={{ background: '#FEE2E2', borderBottom: '1px solid #FCA5A5', padding: '10px 24px', color: '#B91C1C', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={15} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Product *
                </label>
                <select
                  required
                  value={formData.product_id}
                  onChange={e => setFormData({ ...formData, product_id: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600 }}
                >
                  <option value="" disabled>-- Select Product * --</option>
                  {(products || []).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.product_code || p.code} - {p.product_name || p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    UOM * (Unit Name)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Box, Strip, Carton"
                    value={formData.uom}
                    onChange={e => setFormData({ ...formData, uom: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Conversion Factor *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.conversion_factor}
                    onChange={e => setFormData({ ...formData, conversion_factor: parseFloat(e.target.value) || 1 })}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #0F766E', borderRadius: 6, fontSize: 13, fontWeight: 800, color: '#0F766E' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_base_uom}
                    onChange={e => setFormData({ ...formData, is_base_uom: e.target.checked })}
                    style={{ width: 16, height: 16 }}
                  />
                  <span>Is Base UOM (Canonical standard reference unit)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_order_uom}
                    onChange={e => setFormData({ ...formData, is_order_uom: e.target.checked })}
                    style={{ width: 16, height: 16 }}
                  />
                  <span>Is Order UOM (Allow buyers to order in this packaging unit)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                    style={{ width: 16, height: 16 }}
                  />
                  <span>Is Active</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 14, borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 1px 3px rgba(15,118,110,0.2)' }}
                >
                  {editingUomId ? 'Update UOM' : 'Save UOM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
