import React, { useState, useMemo } from 'react';
import {
  Tag, Search, Plus, Filter, Edit2, Trash2, X, AlertTriangle,
  Package, Factory, Users, DollarSign, Calendar
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductPrice } from '../../types';

export const ProductPriceModule: React.FC = () => {
  const {
    products,
    manufacturers,
    mappings,
    customerSegments,
    productPrices,
    addProductPrice,
    updateProductPrice,
    removeProductPrice,
    addAuditLog,
    currentRole,
    productTypes,
    unifiedCategories
  } = useApp();

  const canEdit = currentRole === 'ADMIN';

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('ALL');
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Hierarchy Selection Context for Modal (Selection context only - NOT stored in PRODUCT_PRICE)
  const [modalProductTypeId, setModalProductTypeId] = useState<string>('');
  const [modalCategory, setModalCategory] = useState<string>('');
  const [modalSubCategory, setModalSubCategory] = useState<string>('');

  const [formData, setFormData] = useState({
    product_id: '',
    product_manufacturer_id: '' as string | null,
    customer_segment_id: '',
    price_type: 'FIXED' as 'FIXED' | 'TIERED' | 'CONTRACT' | 'LIST',
    currency: 'INR',
    unit_price: 10,
    minimum_quantity: 100,
    maximum_quantity: '' as number | string,
    effective_from: new Date().toISOString().split('T')[0],
    effective_to: '',
    price_status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'DRAFT'
  });

  // Available Categories in Modal (Filtered by selected Product Type)
  const modalCategories = useMemo(() => {
    if (!modalProductTypeId) return [];
    const catSet = new Set<string>();
    (unifiedCategories || []).forEach(c => {
      if (
        c.product_type_id === modalProductTypeId &&
        (c.lifecycle_status === 'ACTIVE' || (c as any).status === 'Active') &&
        c.category
      ) {
        catSet.add(c.category);
      }
    });
    return Array.from(catSet).sort();
  }, [unifiedCategories, modalProductTypeId]);

  // Available Sub-Categories in Modal (Filtered by selected Product Type & Category)
  const modalSubCategories = useMemo(() => {
    if (!modalProductTypeId || !modalCategory) return [];
    const subSet = new Set<string>();
    (unifiedCategories || []).forEach(c => {
      if (
        c.product_type_id === modalProductTypeId &&
        c.category === modalCategory &&
        (c.lifecycle_status === 'ACTIVE' || (c as any).status === 'Active') &&
        c.sub_category
      ) {
        subSet.add(c.sub_category);
      }
    });
    return Array.from(subSet).sort();
  }, [unifiedCategories, modalProductTypeId, modalCategory]);

  // Available Products in Modal (Filtered by selected Product Type, Category, and Sub-Category)
  const modalAvailableProducts = useMemo(() => {
    if (!modalProductTypeId || !modalCategory) return [];
    // If sub-categories exist for this category, require sub-category selection first
    if (modalSubCategories.length > 0 && !modalSubCategory) return [];

    return (products || []).filter(p => {
      // Find category record in unifiedCategories
      const catRecord = (unifiedCategories || []).find(c =>
        c.category_id === (p.category_id || p.categoryId) ||
        c.id === (p.category_id || p.categoryId)
      );

      // Verify Product Type
      const prdPtId = p.product_type_id || p.productTypeId || catRecord?.product_type_id;
      if (prdPtId && prdPtId !== modalProductTypeId) return false;

      // Verify Category
      const prdCat = catRecord?.category || p.category;
      if (prdCat && prdCat !== modalCategory) return false;

      // Verify Sub-Category if chosen
      if (modalSubCategory) {
        const prdSub = catRecord?.sub_category || p.subCategory || (p as any).sub_category;
        if (prdSub && prdSub !== modalSubCategory) return false;
      }

      return true;
    });
  }, [products, unifiedCategories, modalProductTypeId, modalCategory, modalSubCategory, modalSubCategories.length]);

  // Mapped manufacturers for the selected product in modal
  const modalAvailableMappings = useMemo(() => {
    if (!formData.product_id) return [];
    return (mappings || []).filter(m => m.productId === formData.product_id || m.product_id === formData.product_id);
  }, [mappings, formData.product_id]);

  // Filtered List
  const filteredPrices = useMemo(() => {
    return (productPrices || []).filter(prc => {
      const q = searchTerm.toLowerCase().trim();
      const prd = (products || []).find(p => p.id === prc.product_id || p.product_id === prc.product_id);
      const prdName = (prd?.product_name || prd?.name || '').toLowerCase();
      const prdCode = (prd?.product_code || prd?.code || '').toLowerCase();
      const seg = (customerSegments || []).find(s => s.customer_segment_id === prc.customer_segment_id || s.id === prc.customer_segment_id);
      const segName = (seg?.segment_name || seg?.name || '').toLowerCase();

      const matchesSearch = q === '' || prdName.includes(q) || prdCode.includes(q) || segName.includes(q);
      const matchesPrd = selectedProductId === 'ALL' || prc.product_id === selectedProductId;
      const matchesSeg = selectedSegmentId === 'ALL' || prc.customer_segment_id === selectedSegmentId;
      const matchesStatus = selectedStatus === 'ALL' || prc.price_status === selectedStatus;

      return matchesSearch && matchesPrd && matchesSeg && matchesStatus;
    });
  }, [productPrices, products, customerSegments, searchTerm, selectedProductId, selectedSegmentId, selectedStatus]);

  // Handlers
  const handleOpenAddModal = (defaultProductId?: string) => {
    setEditingPriceId(null);
    const firstSeg = customerSegments[0]?.customer_segment_id || customerSegments[0]?.id || '';

    if (defaultProductId) {
      const prd = (products || []).find(p => p.id === defaultProductId || p.product_id === defaultProductId);
      const catRecord = (unifiedCategories || []).find(c =>
        c.category_id === (prd?.category_id || prd?.categoryId) ||
        c.id === (prd?.category_id || prd?.categoryId)
      );
      setModalProductTypeId(prd?.product_type_id || prd?.productTypeId || catRecord?.product_type_id || '');
      setModalCategory(catRecord?.category || prd?.category || '');
      setModalSubCategory(catRecord?.sub_category || prd?.subCategory || (prd as any)?.sub_category || '');
      setFormData({
        product_id: defaultProductId,
        product_manufacturer_id: null,
        customer_segment_id: firstSeg,
        price_type: 'FIXED',
        currency: 'INR',
        unit_price: 15.00,
        minimum_quantity: 100,
        maximum_quantity: '',
        effective_from: new Date().toISOString().split('T')[0],
        effective_to: '',
        price_status: 'ACTIVE'
      });
    } else {
      setModalProductTypeId('');
      setModalCategory('');
      setModalSubCategory('');
      setFormData({
        product_id: '',
        product_manufacturer_id: null,
        customer_segment_id: firstSeg,
        price_type: 'FIXED',
        currency: 'INR',
        unit_price: 15.00,
        minimum_quantity: 100,
        maximum_quantity: '',
        effective_from: new Date().toISOString().split('T')[0],
        effective_to: '',
        price_status: 'ACTIVE'
      });
    }
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prc: ProductPrice) => {
    setEditingPriceId(prc.product_price_id || prc.id || '');
    const pId = prc.product_id || prc.productId || '';
    const prd = (products || []).find(p => p.id === pId || p.product_id === pId);
    const catRecord = (unifiedCategories || []).find(c =>
      c.category_id === (prd?.category_id || prd?.categoryId) ||
      c.id === (prd?.category_id || prd?.categoryId)
    );

    const ptId = prd?.product_type_id || prd?.productTypeId || catRecord?.product_type_id || (productTypes[0]?.product_type_id || '');
    const catName = catRecord?.category || prd?.category || '';
    const subCatName = catRecord?.sub_category || prd?.subCategory || (prd as any)?.sub_category || '';

    setModalProductTypeId(ptId);
    setModalCategory(catName);
    setModalSubCategory(subCatName);

    setFormData({
      product_id: pId,
      product_manufacturer_id: prc.product_manufacturer_id || prc.productManufacturerId || null,
      customer_segment_id: prc.customer_segment_id || prc.customerSegmentId || '',
      price_type: prc.price_type || 'FIXED',
      currency: prc.currency || 'INR',
      unit_price: prc.unit_price ?? prc.unitPrice ?? 0,
      minimum_quantity: prc.minimum_quantity ?? prc.minQuantity ?? 1,
      maximum_quantity: prc.maximum_quantity ?? prc.maxQuantity ?? '',
      effective_from: prc.effective_from || prc.effectiveFrom || '2025-01-01',
      effective_to: prc.effective_to || prc.effectiveTo || '',
      price_status: (prc.price_status || prc.status || 'ACTIVE') as any
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!modalProductTypeId) {
      setFormError('Product Type is mandatory.');
      return;
    }
    if (!modalCategory) {
      setFormError('Category is mandatory.');
      return;
    }
    if (modalSubCategories.length > 0 && !modalSubCategory) {
      setFormError('Sub-Category is mandatory for the selected category.');
      return;
    }
    if (!formData.product_id) {
      setFormError('Product is mandatory.');
      return;
    }
    if (!formData.customer_segment_id) {
      setFormError('Customer Segment is mandatory.');
      return;
    }
    if (!formData.price_type) {
      setFormError('Price Type is mandatory.');
      return;
    }
    if (!formData.currency) {
      setFormError('Currency is mandatory.');
      return;
    }
    if (formData.unit_price <= 0) {
      setFormError('Unit Price must be greater than 0.');
      return;
    }
    if (formData.minimum_quantity < 1) {
      setFormError('Minimum Quantity must be at least 1.');
      return;
    }
    if (!formData.effective_from) {
      setFormError('Effective From date is mandatory.');
      return;
    }
    if (!formData.price_status) {
      setFormError('Price Status is mandatory.');
      return;
    }

    // Validate that the product belongs to the selected hierarchy
    const selectedPrd = (products || []).find(p => p.id === formData.product_id || p.product_id === formData.product_id);
    if (!selectedPrd) {
      setFormError('Selected Product is invalid.');
      return;
    }
    const catRecord = (unifiedCategories || []).find(c =>
      c.category_id === (selectedPrd?.category_id || selectedPrd?.categoryId) ||
      c.id === (selectedPrd?.category_id || selectedPrd?.categoryId)
    );
    const prdPtId = selectedPrd.product_type_id || selectedPrd.productTypeId || catRecord?.product_type_id;
    if (prdPtId && prdPtId !== modalProductTypeId) {
      setFormError('Selected Product does not belong to the selected Product Type.');
      return;
    }
    const prdCat = catRecord?.category || selectedPrd.category;
    if (prdCat && prdCat !== modalCategory) {
      setFormError('Selected Product does not belong to the selected Category.');
      return;
    }
    if (modalSubCategory) {
      const prdSub = catRecord?.sub_category || selectedPrd.subCategory || (selectedPrd as any).sub_category;
      if (prdSub && prdSub !== modalSubCategory) {
        setFormError('Selected Product does not belong to the selected Sub-Category.');
        return;
      }
    }

    // Validate Product Manufacturer if selected
    if (formData.product_manufacturer_id) {
      const isValidMfg = modalAvailableMappings.some(m =>
        m.product_manufacturer_id === formData.product_manufacturer_id ||
        m.id === formData.product_manufacturer_id ||
        m.manufacturer_id === formData.product_manufacturer_id ||
        m.manufacturerId === formData.product_manufacturer_id
      );
      if (!isValidMfg) {
        setFormError('Selected Product Manufacturer is not mapped to this product.');
        return;
      }
    }

    const nowIso = new Date().toISOString().split('T')[0];
    const maxQtyNum = formData.maximum_quantity ? Number(formData.maximum_quantity) : null;

    if (editingPriceId) {
      updateProductPrice(editingPriceId, {
        product_id: formData.product_id,
        product_manufacturer_id: formData.product_manufacturer_id || null,
        customer_segment_id: formData.customer_segment_id,
        price_type: formData.price_type,
        currency: formData.currency,
        unit_price: Number(formData.unit_price),
        minimum_quantity: Number(formData.minimum_quantity),
        maximum_quantity: maxQtyNum,
        effective_from: formData.effective_from,
        effective_to: formData.effective_to || null,
        price_status: formData.price_status,
        updated_at: nowIso,
        // compatibility aliases
        productId: formData.product_id,
        unitPrice: Number(formData.unit_price),
        minQuantity: Number(formData.minimum_quantity),
        maxQuantity: maxQtyNum,
        status: formData.price_status
      });
      addAuditLog('UPDATE_PRODUCT_PRICE', `Updated price record for product ${formData.product_id}`);
    } else {
      const newPriceId = `prc_${Date.now()}`;
      const newPrice: ProductPrice = {
        product_price_id: newPriceId,
        product_id: formData.product_id,
        product_manufacturer_id: formData.product_manufacturer_id || null,
        customer_segment_id: formData.customer_segment_id,
        price_type: formData.price_type,
        currency: formData.currency,
        unit_price: Number(formData.unit_price),
        minimum_quantity: Number(formData.minimum_quantity),
        maximum_quantity: maxQtyNum,
        effective_from: formData.effective_from,
        effective_to: formData.effective_to || null,
        price_status: formData.price_status,
        created_at: nowIso,
        updated_at: nowIso,
        // compatibility aliases
        id: newPriceId,
        productId: formData.product_id,
        unitPrice: Number(formData.unit_price),
        minQuantity: Number(formData.minimum_quantity),
        maxQuantity: maxQtyNum,
        status: formData.price_status
      };
      addProductPrice(newPrice);
      addAuditLog('ADD_PRODUCT_PRICE', `Created price record for product ${formData.product_id}`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (prc: ProductPrice) => {
    const id = prc.product_price_id || prc.id || '';
    if (window.confirm('Are you sure you want to remove this product price record?')) {
      removeProductPrice(id);
      addAuditLog('DELETE_PRODUCT_PRICE', `Removed product price record ${id}`);
    }
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1500, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F0FDFA', border: '1px solid #99F6E4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tag size={22} style={{ color: '#0F766E' }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>
                Product Price Management
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
                Client Entity: <code>PRODUCT_PRICE</code> · Segment &amp; Manufacturer-aware commercial pricing rules
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
            <Plus size={16} /> Add Product Price
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, marginBottom: 16, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search by product name, code, or customer segment..."
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

        {/* Segment Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={15} style={{ color: '#64748B' }} />
          <select
            value={selectedSegmentId}
            onChange={e => setSelectedSegmentId(e.target.value)}
            style={{ padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, background: '#FFFFFF', fontWeight: 600 }}
          >
            <option value="ALL">All Segments</option>
            {(customerSegments || []).map(s => (
              <option key={s.customer_segment_id || s.id} value={s.customer_segment_id || s.id}>
                {s.segment_name || s.name} ({s.segment_code || s.code})
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
            <option value="EXPIRED">EXPIRED</option>
            <option value="DRAFT">DRAFT</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 1200, borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 220 }}>PRODUCT</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 180 }}>MANUFACTURER (OPTIONAL)</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 140 }}>CUSTOMER SEGMENT</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 110 }}>PRICE TYPE</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 80 }}>CURRENCY</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0F766E', width: 110 }}>UNIT PRICE</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 90 }}>MIN QTY</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 90 }}>MAX QTY</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 110 }}>EFFECTIVE FROM</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 110 }}>EFFECTIVE TO</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 100 }}>PRICE STATUS</th>
                {canEdit && (
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right', width: 90 }}>ACTIONS</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredPrices.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                    <Tag size={32} style={{ color: '#94A3B8', display: 'block', margin: '0 auto 10px' }} />
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>No product price records found.</div>
                    <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 4 }}>Add pricing for products, customer segments, and manufacturers.</div>
                  </td>
                </tr>
              ) : (
                filteredPrices.map(prc => {
                  const prd = (products || []).find(p => p.id === prc.product_id || p.product_id === prc.product_id);
                  const seg = (customerSegments || []).find(s => s.customer_segment_id === prc.customer_segment_id || s.id === prc.customer_segment_id);
                  const mfgMapping = (mappings || []).find(m => m.product_manufacturer_id === prc.product_manufacturer_id || (m as any).id === prc.product_manufacturer_id);

                  const status = prc.price_status || prc.status || 'ACTIVE';
                  const isActive = status === 'ACTIVE';

                  return (
                    <tr key={prc.product_price_id || prc.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                          {prd?.product_name || prd?.name || prc.product_id}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#0F766E', fontFamily: 'monospace', fontWeight: 600 }}>
                          {prd?.product_code || prd?.code}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12.5 }}>
                        {mfgMapping ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#0F172A', fontWeight: 600 }}>
                            <Factory size={13} style={{ color: '#0F766E' }} />
                            <span>{mfgMapping.manufacturer_name || mfgMapping.manufacturerName}</span>
                          </div>
                        ) : (
                          <span style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: 11.5 }}>All / Global</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12.5 }}>
                        <span style={{ fontWeight: 700, color: '#334155' }}>
                          {seg?.segment_name || seg?.name || prc.customer_segment_id}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                          {prc.price_type}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12.5, fontWeight: 700, color: '#475569' }}>
                        {prc.currency || 'INR'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 14, fontWeight: 900, color: '#0F766E' }}>
                        ₹{(prc.unit_price ?? prc.unitPrice ?? 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12.5, color: '#334155', fontWeight: 600 }}>
                        {prc.minimum_quantity ?? prc.minQuantity ?? 1}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12.5, color: '#64748B' }}>
                        {prc.maximum_quantity ?? prc.maxQuantity ?? '—'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: '#64748B' }}>
                        {prc.effective_from || prc.effectiveFrom || '—'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: '#64748B' }}>
                        {prc.effective_to || prc.effectiveTo || '—'}
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
                          {status}
                        </span>
                      </td>
                      {canEdit && (
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              onClick={() => handleOpenEditModal(prc)}
                              title="Edit Price"
                              style={{ padding: '5px 8px', borderRadius: 4, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', cursor: 'pointer' }}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(prc)}
                              title="Delete Price"
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
          <div style={{ background: '#FFFFFF', borderRadius: 12, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                  {editingPriceId ? 'Edit Product Price' : 'Add Product Price'}
                </h3>
                <span style={{ fontSize: 12, color: '#64748B' }}>Entity: PRODUCT_PRICE</span>
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
              {/* Step 1: Product Type * */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Product Type *
                </label>
                <select
                  required
                  value={modalProductTypeId}
                  onChange={e => {
                    const newPtId = e.target.value;
                    setModalProductTypeId(newPtId);
                    setModalCategory('');
                    setModalSubCategory('');
                    setFormData(prev => ({
                      ...prev,
                      product_id: '',
                      product_manufacturer_id: null
                    }));
                  }}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #0F766E', borderRadius: 6, fontSize: 13, fontWeight: 700, outline: 'none', background: '#F0FDFA', color: '#0F766E' }}
                >
                  <option value="" disabled>-- Select Product Type * --</option>
                  {(productTypes || []).filter(t => (t.lifecycle_status || t.status) === 'ACTIVE').map(t => (
                    <option key={t.product_type_id || t.id} value={t.product_type_id || t.id}>
                      {t.product_type_name || t.name} ({t.product_type_code || t.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Category * & Step 3: Sub-Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Category *
                  </label>
                  <select
                    required
                    disabled={!modalProductTypeId}
                    value={modalCategory}
                    onChange={e => {
                      const newCat = e.target.value;
                      setModalCategory(newCat);
                      setModalSubCategory('');
                      setFormData(prev => ({
                        ...prev,
                        product_id: '',
                        product_manufacturer_id: null
                      }));
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1px solid #CBD5E1',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      background: !modalProductTypeId ? '#F8FAFC' : '#FFFFFF',
                      color: !modalProductTypeId ? '#94A3B8' : '#0F172A',
                      cursor: !modalProductTypeId ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="" disabled>
                      {!modalProductTypeId ? '-- Select Product Type First --' : '-- Select Category * --'}
                    </option>
                    {modalCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Sub-Category {modalSubCategories.length > 0 ? <span style={{ color: '#0F766E' }}>*</span> : <span style={{ fontWeight: 400, color: '#94A3B8' }}>(Optional)</span>}
                  </label>
                  <select
                    disabled={!modalCategory || modalSubCategories.length === 0}
                    value={modalSubCategory}
                    onChange={e => {
                      const newSubCat = e.target.value;
                      setModalSubCategory(newSubCat);
                      setFormData(prev => ({
                        ...prev,
                        product_id: '',
                        product_manufacturer_id: null
                      }));
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1px solid #CBD5E1',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      background: (!modalCategory || modalSubCategories.length === 0) ? '#F8FAFC' : '#FFFFFF',
                      color: (!modalCategory || modalSubCategories.length === 0) ? '#94A3B8' : '#0F172A',
                      cursor: (!modalCategory || modalSubCategories.length === 0) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="" disabled={modalSubCategories.length > 0}>
                      {!modalCategory
                        ? '-- Select Category First --'
                        : modalSubCategories.length === 0
                        ? '-- No Sub-Categories (Direct) --'
                        : '-- Select Sub-Category --'}
                    </option>
                    {modalSubCategories.map(subCat => (
                      <option key={subCat} value={subCat}>{subCat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 4: Product * */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Product *
                </label>
                <select
                  required
                  disabled={!modalProductTypeId || !modalCategory || (modalSubCategories.length > 0 && !modalSubCategory)}
                  value={formData.product_id}
                  onChange={e => setFormData(prev => ({ ...prev, product_id: e.target.value, product_manufacturer_id: null }))}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    background: (!modalProductTypeId || !modalCategory || (modalSubCategories.length > 0 && !modalSubCategory)) ? '#F8FAFC' : '#FFFFFF',
                    color: (!modalProductTypeId || !modalCategory || (modalSubCategories.length > 0 && !modalSubCategory)) ? '#94A3B8' : '#0F172A',
                    cursor: (!modalProductTypeId || !modalCategory || (modalSubCategories.length > 0 && !modalSubCategory)) ? 'not-allowed' : 'pointer'
                  }}
                >
                  <option value="" disabled>
                    {!modalProductTypeId
                      ? '-- Select Product Type First --'
                      : !modalCategory
                      ? '-- Select Category First --'
                      : (modalSubCategories.length > 0 && !modalSubCategory)
                      ? '-- Select Sub-Category First --'
                      : modalAvailableProducts.length === 0
                      ? '-- No Products Found in Selected Hierarchy --'
                      : '-- Select Product * --'}
                  </option>
                  {modalAvailableProducts.map(p => (
                    <option key={p.id || p.product_id} value={p.id || p.product_id}>
                      {p.product_code || p.code} - {p.product_name || p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 5: Product Manufacturer (Optional) */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Product Manufacturer <span style={{ fontWeight: 400, color: '#94A3B8' }}>(Optional — NULLABLE in client model)</span>
                </label>
                <select
                  disabled={!formData.product_id}
                  value={formData.product_manufacturer_id || ''}
                  onChange={e => setFormData(prev => ({ ...prev, product_manufacturer_id: e.target.value || null }))}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: 6,
                    fontSize: 13,
                    background: !formData.product_id ? '#F8FAFC' : '#FFFFFF',
                    color: !formData.product_id ? '#94A3B8' : '#0F172A',
                    cursor: !formData.product_id ? 'not-allowed' : 'pointer'
                  }}
                >
                  <option value="">-- All Manufacturers / Global Product Price --</option>
                  {modalAvailableMappings.map(m => (
                    <option key={m.product_manufacturer_id || (m as any).id} value={m.product_manufacturer_id || (m as any).id}>
                      {m.manufacturer_name || m.manufacturerName} ({m.manufacturer_product_code || m.mfgProductCode || 'Mapped'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Customer Segment *
                  </label>
                  <select
                    required
                    value={formData.customer_segment_id}
                    onChange={e => setFormData({ ...formData, customer_segment_id: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600 }}
                  >
                    <option value="" disabled>-- Select Segment * --</option>
                    {(customerSegments || []).map(s => (
                      <option key={s.customer_segment_id || s.id} value={s.customer_segment_id || s.id}>
                        {s.segment_name || s.name} ({s.segment_code || s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Price Type *
                  </label>
                  <select
                    value={formData.price_type}
                    onChange={e => setFormData({ ...formData, price_type: e.target.value as any })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600 }}
                  >
                    <option value="FIXED">FIXED</option>
                    <option value="TIERED">TIERED</option>
                    <option value="CONTRACT">CONTRACT</option>
                    <option value="LIST">LIST</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Currency *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.currency}
                    onChange={e => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Unit Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.unit_price}
                    onChange={e => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #0F766E', borderRadius: 6, fontSize: 13, fontWeight: 800, color: '#0F766E' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Minimum Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.minimum_quantity}
                    onChange={e => setFormData({ ...formData, minimum_quantity: parseInt(e.target.value) || 1 })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Maximum Quantity <span style={{ fontWeight: 400, color: '#94A3B8' }}>(Optional)</span>
                  </label>
                  <input
                    type="number"
                    placeholder="No upper limit"
                    value={formData.maximum_quantity}
                    onChange={e => setFormData({ ...formData, maximum_quantity: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
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
                  Price Status *
                </label>
                <select
                  value={formData.price_status}
                  onChange={e => setFormData({ ...formData, price_status: e.target.value as any })}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #0F766E', borderRadius: 6, fontSize: 13, fontWeight: 700, color: '#0F766E', background: '#F0FDFA' }}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="EXPIRED">EXPIRED</option>
                  <option value="DRAFT">DRAFT</option>
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
                  {editingPriceId ? 'Update Price' : 'Save Price'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
