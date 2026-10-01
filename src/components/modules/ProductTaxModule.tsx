import React, { useState, useMemo } from 'react';
import {
  Receipt, Search, Plus, Filter, Edit2, Trash2, X, AlertTriangle,
  Package, Percent, Calendar
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductTax } from '../../types';

export const ProductTaxModule: React.FC = () => {
  const {
    products,
    productTaxes,
    addProductTax,
    updateProductTax,
    removeProductTax,
    addAuditLog,
    currentRole
  } = useApp();

  const canEdit = currentRole === 'ADMIN';

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaxId, setEditingTaxId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    product_id: '',
    tax_code: 'HSN-3004-90',
    tax_rate: 12,
    effective_from: new Date().toISOString().split('T')[0],
    effective_to: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });

  // Filtered List
  const filteredTaxes = useMemo(() => {
    return (productTaxes || []).filter(tax => {
      const q = searchTerm.toLowerCase().trim();
      const prd = (products || []).find(p => p.id === tax.product_id || p.product_id === tax.product_id);
      const prdName = (prd?.product_name || prd?.name || '').toLowerCase();
      const prdCode = (prd?.product_code || prd?.code || '').toLowerCase();
      const taxCode = (tax.tax_code || tax.taxCode || '').toLowerCase();

      const matchesSearch = q === '' || prdName.includes(q) || prdCode.includes(q) || taxCode.includes(q);
      const matchesPrd = selectedProductId === 'ALL' || tax.product_id === selectedProductId;
      const matchesStatus = selectedStatus === 'ALL' || tax.status === selectedStatus;

      return matchesSearch && matchesPrd && matchesStatus;
    });
  }, [productTaxes, products, searchTerm, selectedProductId, selectedStatus]);

  // Handlers
  const handleOpenAddModal = (defaultProductId?: string) => {
    setEditingTaxId(null);
    setFormData({
      product_id: defaultProductId || (products[0]?.id || ''),
      tax_code: 'HSN-3004-90',
      tax_rate: 12,
      effective_from: new Date().toISOString().split('T')[0],
      effective_to: '',
      status: 'ACTIVE'
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tax: ProductTax) => {
    setEditingTaxId(tax.product_tax_id || tax.id || '');
    setFormData({
      product_id: tax.product_id || tax.productId || '',
      tax_code: tax.tax_code || tax.taxCode || '',
      tax_rate: tax.tax_rate ?? tax.taxRate ?? 0,
      effective_from: tax.effective_from || tax.effectiveFrom || '2025-01-01',
      effective_to: tax.effective_to || tax.effectiveTo || '',
      status: tax.status || 'ACTIVE'
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
    if (!formData.tax_code.trim()) {
      setFormError('Tax Code is mandatory.');
      return;
    }
    if (formData.tax_rate < 0) {
      setFormError('Tax Rate cannot be negative.');
      return;
    }

    const nowIso = new Date().toISOString().split('T')[0];

    if (editingTaxId) {
      updateProductTax(editingTaxId, {
        product_id: formData.product_id,
        tax_code: formData.tax_code.trim().toUpperCase(),
        tax_rate: Number(formData.tax_rate),
        effective_from: formData.effective_from,
        effective_to: formData.effective_to || null,
        status: formData.status,
        updated_at: nowIso,
        // compatibility
        productId: formData.product_id,
        taxCode: formData.tax_code.trim().toUpperCase(),
        taxRate: Number(formData.tax_rate)
      });
      addAuditLog('UPDATE_PRODUCT_TAX', `Updated tax record for product ${formData.product_id}`);
    } else {
      const newTax: ProductTax = {
        product_tax_id: `ptax_${Date.now()}`,
        product_id: formData.product_id,
        tax_code: formData.tax_code.trim().toUpperCase(),
        tax_rate: Number(formData.tax_rate),
        effective_from: formData.effective_from,
        effective_to: formData.effective_to || null,
        status: formData.status,
        created_at: nowIso,
        updated_at: nowIso,
        // compatibility
        id: `ptax_${Date.now()}`,
        productId: formData.product_id,
        taxCode: formData.tax_code.trim().toUpperCase(),
        taxRate: Number(formData.tax_rate)
      };
      addProductTax(newTax);
      addAuditLog('ADD_PRODUCT_TAX', `Created tax record for product ${formData.product_id}`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (tax: ProductTax) => {
    const id = tax.product_tax_id || tax.id || '';
    if (window.confirm('Are you sure you want to remove this product tax record?')) {
      removeProductTax(id);
      addAuditLog('DELETE_PRODUCT_TAX', `Removed product tax record ${id}`);
    }
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F0FDFA', border: '1px solid #99F6E4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={22} style={{ color: '#0F766E' }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>
                Product Tax Management
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
                Client Entity: <code>PRODUCT_TAX</code> · Standardized tax rates and codes linked to products
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
            <Plus size={16} /> Add Product Tax
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, marginBottom: 16, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search by product name, code, or tax code..."
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

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={15} style={{ color: '#64748B' }} />
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            style={{ padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, background: '#FFFFFF', fontWeight: 600 }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
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
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 180 }}>TAX CODE</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0F766E', width: 140 }}>TAX RATE (%)</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 130 }}>EFFECTIVE FROM</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 130 }}>EFFECTIVE TO</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 110 }}>STATUS</th>
                {canEdit && (
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right', width: 90 }}>ACTIONS</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredTaxes.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                    <Receipt size={32} style={{ color: '#94A3B8', display: 'block', margin: '0 auto 10px' }} />
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>No product tax records found.</div>
                    <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 4 }}>Add tax codes and rates for compliance and invoicing.</div>
                  </td>
                </tr>
              ) : (
                filteredTaxes.map(tax => {
                  const prd = (products || []).find(p => p.id === tax.product_id || p.product_id === tax.product_id);
                  const isActive = tax.status === 'ACTIVE';

                  return (
                    <tr key={tax.product_tax_id || tax.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                          {prd?.product_name || prd?.name || tax.product_id}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#0F766E', fontFamily: 'monospace', fontWeight: 600 }}>
                          {prd?.product_code || prd?.code}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13, fontFamily: 'monospace', fontWeight: 800, color: '#334155' }}>
                        {tax.tax_code || tax.taxCode}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 14, fontWeight: 900, color: '#0F766E' }}>
                        {tax.tax_rate ?? tax.taxRate ?? 0}%
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: '#64748B' }}>
                        {tax.effective_from || tax.effectiveFrom || '—'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: '#64748B' }}>
                        {tax.effective_to || tax.effectiveTo || '—'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: isActive ? '#DCFCE7' : '#F1F5F9',
                          color: isActive ? '#15803D' : '#64748B',
                          border: `1px solid ${isActive ? '#86EFAC' : '#CBD5E1'}`
                        }}>
                          {tax.status}
                        </span>
                      </td>
                      {canEdit && (
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              onClick={() => handleOpenEditModal(tax)}
                              title="Edit Tax"
                              style={{ padding: '5px 8px', borderRadius: 4, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', cursor: 'pointer' }}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(tax)}
                              title="Delete Tax"
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
          <div style={{ background: '#FFFFFF', borderRadius: 12, width: '100%', maxWidth: 540, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                  {editingTaxId ? 'Edit Product Tax' : 'Add Product Tax'}
                </h3>
                <span style={{ fontSize: 12, color: '#64748B' }}>Entity: PRODUCT_TAX</span>
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
                    Tax Code * (e.g. HSN)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HSN-3004-90"
                    value={formData.tax_code}
                    onChange={e => setFormData({ ...formData, tax_code: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace', fontWeight: 800 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Tax Rate (%) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    value={formData.tax_rate}
                    onChange={e => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #0F766E', borderRadius: 6, fontSize: 13, fontWeight: 800, color: '#0F766E' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Effective From *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.effective_from}
                    onChange={e => setFormData({ ...formData, effective_from: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Effective To <span style={{ fontWeight: 400, color: '#94A3B8' }}>(Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.effective_to}
                    onChange={e => setFormData({ ...formData, effective_to: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #0F766E', borderRadius: 6, fontSize: 13, fontWeight: 700, color: '#0F766E', background: '#F0FDFA' }}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
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
                  {editingTaxId ? 'Update Tax' : 'Save Tax'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
