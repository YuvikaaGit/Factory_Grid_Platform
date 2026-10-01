import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AttributeMaster, AttributeDataType } from '../../types';
import {
  Sparkles, Search, Plus, Edit3, Power, Trash2,
  CheckCircle2, AlertCircle, X, Info, Filter, ArrowRight,
  Package, Check, Tag, Hash, FileText
} from 'lucide-react';

const DATA_TYPES: AttributeDataType[] = ['TEXT', 'NUMBER', 'DECIMAL', 'LIST', 'BOOLEAN', 'DATE'];

export const AttributeMasterModule: React.FC = () => {
  const {
    attributeMasters,
    addAttributeMaster,
    updateAttributeMaster,
    productAttributes,
    products,
    addAuditLog,
    setActiveTab
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDataType, setSelectedDataType] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState<AttributeMaster | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    attributeCode: '',
    attributeName: '',
    dataType: 'TEXT' as AttributeDataType,
    unitOfMeasure: '',
    isFilterable: true,
    isSearchable: true,
    isRequired: false,
    isActive: true
  });

  // Filtered attribute list
  const filteredAttributes = useMemo(() => {
    return (attributeMasters || []).filter(attr => {
      const q = searchTerm.toLowerCase().trim();
      const code = (attr.attribute_code || attr.code || '').toLowerCase();
      const name = (attr.attribute_name || attr.name || '').toLowerCase();
      const uom = (attr.unit_of_measure || '').toLowerCase();

      const matchesSearch = q === '' || code.includes(q) || name.includes(q) || uom.includes(q);
      const matchesType = selectedDataType === 'ALL' || attr.data_type === selectedDataType;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && attr.is_active) ||
        (statusFilter === 'INACTIVE' && !attr.is_active);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [attributeMasters, searchTerm, selectedDataType, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = (attributeMasters || []).length;
    const active = (attributeMasters || []).filter(a => a.is_active).length;
    const searchable = (attributeMasters || []).filter(a => a.is_searchable).length;
    const filterable = (attributeMasters || []).filter(a => a.is_filterable).length;
    const assignedCount = (productAttributes || []).length;
    return { total, active, searchable, filterable, assignedCount };
  }, [attributeMasters, productAttributes]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingAttr(null);
    setFormData({
      attributeCode: '',
      attributeName: '',
      dataType: 'TEXT',
      unitOfMeasure: '',
      isFilterable: true,
      isSearchable: true,
      isRequired: false,
      isActive: true
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (attr: AttributeMaster) => {
    setEditingAttr(attr);
    setFormData({
      attributeCode: attr.attribute_code || attr.code || '',
      attributeName: attr.attribute_name || attr.name || '',
      dataType: attr.data_type || 'TEXT',
      unitOfMeasure: attr.unit_of_measure || '',
      isFilterable: attr.is_filterable ?? true,
      isSearchable: attr.is_searchable ?? true,
      isRequired: attr.is_required ?? false,
      isActive: attr.is_active ?? true
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Save Modal
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = formData.attributeCode.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const cleanName = formData.attributeName.trim();

    if (!cleanCode) {
      setFormError('Attribute Code is mandatory.');
      return;
    }
    if (!cleanName) {
      setFormError('Attribute Name is mandatory.');
      return;
    }

    // Uniqueness validation on code
    const isDuplicate = (attributeMasters || []).some(a => {
      const aId = a.attribute_id || a.id;
      const editingId = editingAttr ? (editingAttr.attribute_id || editingAttr.id) : null;
      if (editingId && aId === editingId) return false;
      const aCode = (a.attribute_code || a.code || '').toUpperCase().trim();
      return aCode === cleanCode;
    });

    if (isDuplicate) {
      setFormError(`Attribute Code "${cleanCode}" already exists. Attribute codes must be unique.`);
      return;
    }

    const nowIso = new Date().toISOString().split('T')[0];

    if (editingAttr) {
      const targetId = editingAttr.attribute_id || editingAttr.id!;
      updateAttributeMaster(targetId, {
        attribute_name: cleanName,
        name: cleanName,
        attribute_code: cleanCode,
        code: cleanCode,
        data_type: formData.dataType,
        dataType: formData.dataType,
        unit_of_measure: formData.unitOfMeasure.trim() || undefined,
        is_filterable: formData.isFilterable,
        is_searchable: formData.isSearchable,
        is_required: formData.isRequired,
        is_active: formData.isActive,
        updated_at: nowIso
      });
      addAuditLog('UPDATE_ATTRIBUTE_MASTER', `Updated attribute master ${cleanName} (${cleanCode})`);
    } else {
      const newAttr: AttributeMaster = {
        attribute_id: `attr_${cleanCode.toLowerCase()}`,
        id: `attr_${cleanCode.toLowerCase()}`,
        attribute_code: cleanCode,
        code: cleanCode,
        attribute_name: cleanName,
        name: cleanName,
        data_type: formData.dataType,
        dataType: formData.dataType,
        unit_of_measure: formData.unitOfMeasure.trim() || undefined,
        is_filterable: formData.isFilterable,
        is_searchable: formData.isSearchable,
        is_required: formData.isRequired,
        is_active: formData.isActive,
        created_at: nowIso,
        updated_at: nowIso
      };
      addAttributeMaster(newAttr);
      addAuditLog('CREATE_ATTRIBUTE_MASTER', `Created attribute master ${cleanName} (${cleanCode})`);
    }

    setIsModalOpen(false);
    setEditingAttr(null);
  };

  // Toggle active status
  const handleToggleStatus = (attr: AttributeMaster) => {
    const targetId = attr.attribute_id || attr.id!;
    const nextStatus = !attr.is_active;
    updateAttributeMaster(targetId, {
      is_active: nextStatus,
      updated_at: new Date().toISOString().split('T')[0]
    });
    addAuditLog('TOGGLE_ATTRIBUTE_STATUS', `Toggled attribute ${attr.attribute_name} to ${nextStatus ? 'ACTIVE' : 'INACTIVE'}`);
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
            <Sparkles size={26} style={{ color: '#0F766E' }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0F766E' }}>
              CATALOG &amp; PRODUCT MANAGEMENT · SPECIFICATION METADATA
            </div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              PRODUCT ATTRIBUTE MASTER
            </h1>
            <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
              Define generic and industry-specific attributes (Generic Name, Salt Combination, Strength, Dosage Form, Storage, Shelf Life). Dynamic values are stored via PRODUCT_ATTRIBUTE.
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
            <Package size={15} /> Product Catalog Master
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
            <Plus size={16} /> + Add Attribute Master
          </button>
        </div>
      </div>

      {/* ── KPI Stat Summary Cards ───────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 2px rgba(15,23,42,0.03)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Attributes</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{stats.total}</div>
          <div style={{ fontSize: 11.5, color: '#0F766E', marginTop: 2, fontWeight: 600 }}>ATTRIBUTE_MASTER records</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 2px rgba(15,23,42,0.03)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active Attributes</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#15803D', marginTop: 4 }}>{stats.active}</div>
          <div style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }}>Enabled for catalogue assignment</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 2px rgba(15,23,42,0.03)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Searchable / Filterable</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F766E', marginTop: 4 }}>{stats.searchable} / {stats.filterable}</div>
          <div style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }}>Search index &amp; faceted filters</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 2px rgba(15,23,42,0.03)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Assigned Values</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#6366F1', marginTop: 4 }}>{stats.assignedCount}</div>
          <div style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }}>PRODUCT_ATTRIBUTE entries</div>
        </div>
      </div>

      {/* ── Search & Filter Controls ─────────────────────────────── */}
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
              placeholder="Search by attribute code, name, or unit of measure..."
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0F766E' }}>Data Type:</span>
            <select
              value={selectedDataType}
              onChange={e => setSelectedDataType(e.target.value)}
              style={{
                padding: '8px 12px',
                fontSize: 12.5,
                background: selectedDataType !== 'ALL' ? '#F0FDFA' : '#FFFFFF',
                border: selectedDataType !== 'ALL' ? '1.5px solid #0F766E' : '1px solid #CBD5E1',
                borderRadius: 6,
                color: '#0F172A',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Data Types</option>
              {DATA_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              style={{
                padding: '8px 12px',
                fontSize: 12.5,
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: 6,
                color: '#0F172A',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
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
              Architecture Rule: Attributes defined here are stored dynamically via PRODUCT_ATTRIBUTE, keeping the core PRODUCT entity generic.
            </span>
          </div>
          <div>
            Showing <strong style={{ color: '#0F766E' }}>{filteredAttributes.length}</strong> of {attributeMasters.length} attributes
          </div>
        </div>
      </div>

      {/* ── Main ATTRIBUTE_MASTER Table ───────────────────────────── */}
      <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)', overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: 1050, borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 220 }}>
                ATTRIBUTE CODE
              </th>
              <th style={{ padding: '12px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', minWidth: 200 }}>
                ATTRIBUTE NAME
              </th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 120 }}>
                DATA TYPE
              </th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 180 }}>
                UNIT OF MEASURE
              </th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 95 }}>
                FILTERABLE
              </th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 95 }}>
                SEARCHABLE
              </th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 90 }}>
                REQUIRED
              </th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 100 }}>
                STATUS
              </th>
              <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right', width: 120 }}>
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAttributes.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                  <Sparkles size={36} style={{ color: '#94A3B8', marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>No attribute masters found.</div>
                  <div style={{ fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 18 }}>
                    Define specification attributes to capture dynamic product properties without altering the core PRODUCT schema.
                  </div>
                  <button
                    onClick={handleOpenAdd}
                    style={{ padding: '9px 18px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                  >
                    + Add Attribute Master
                  </button>
                </td>
              </tr>
            ) : (
              filteredAttributes.map(attr => {
                const code = attr.attribute_code || attr.code || '';
                const name = attr.attribute_name || attr.name || '';
                const uom = attr.unit_of_measure || '—';
                const isActive = attr.is_active;

                return (
                  <tr
                    key={attr.attribute_id || attr.id}
                    style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                  >
                    {/* 1. CODE */}
                    <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {code}
                    </td>

                    {/* 2. NAME */}
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{name}</div>
                    </td>

                    {/* 3. DATA TYPE */}
                    <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1' }}>
                        {attr.data_type}
                      </span>
                    </td>

                    {/* 4. UNIT OF MEASURE */}
                    <td style={{ padding: '12px 10px', fontSize: 12, color: '#475569' }}>
                      {uom}
                    </td>

                    {/* 5. FILTERABLE */}
                    <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: attr.is_filterable ? '#DCFCE7' : '#F1F5F9',
                        color: attr.is_filterable ? '#15803D' : '#64748B',
                        border: attr.is_filterable ? '1px solid #86EFAC' : '1px solid #CBD5E1'
                      }}>
                        {attr.is_filterable ? 'YES' : 'NO'}
                      </span>
                    </td>

                    {/* 6. SEARCHABLE */}
                    <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: attr.is_searchable ? '#DCFCE7' : '#F1F5F9',
                        color: attr.is_searchable ? '#15803D' : '#64748B',
                        border: attr.is_searchable ? '1px solid #86EFAC' : '1px solid #CBD5E1'
                      }}>
                        {attr.is_searchable ? 'YES' : 'NO'}
                      </span>
                    </td>

                    {/* 7. REQUIRED */}
                    <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: attr.is_required ? '#FEF3C7' : '#F1F5F9',
                        color: attr.is_required ? '#B45309' : '#64748B',
                        border: attr.is_required ? '1px solid #FDE68A' : '1px solid #CBD5E1'
                      }}>
                        {attr.is_required ? 'YES' : 'OPTIONAL'}
                      </span>
                    </td>

                    {/* 8. STATUS */}
                    <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: 4,
                        background: isActive ? '#DCFCE7' : '#FEE2E2',
                        color: isActive ? '#15803D' : '#B91C1C',
                        border: isActive ? '1px solid #86EFAC' : '1px solid #FCA5A5'
                      }}>
                        {isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>

                    {/* 9. ACTIONS */}
                    <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(attr)}
                          title="Edit Attribute Definition"
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
                          onClick={() => handleToggleStatus(attr)}
                          title={isActive ? 'Deactivate Attribute' : 'Activate Attribute'}
                          style={{
                            padding: '5px 8px',
                            borderRadius: 4,
                            background: isActive ? '#FEF2F2' : '#F0FDF4',
                            border: isActive ? '1px solid #FECACA' : '1px solid #BBF7D0',
                            color: isActive ? '#DC2626' : '#16A34A',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
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

      {/* ── ADD / EDIT ATTRIBUTE MASTER MODAL ─────────────────────── */}
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
              maxWidth: 540,
              background: '#FFFFFF',
              borderRadius: 12,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
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
                  SPECIFICATION DEFINITION · ATTRIBUTE_MASTER
                </div>
                <h3 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                  {editingAttr ? 'Edit Attribute Master' : 'Add Attribute Master'}
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
            <form onSubmit={handleSave} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {formError && (
                <div style={{ padding: '10px 14px', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#B91C1C', fontSize: 12.5, fontWeight: 600 }}>
                  {formError}
                </div>
              )}

              {/* Attribute Name * */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Attribute Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Storage Temperature, Shelf Life, Material Grade"
                  value={formData.attributeName}
                  onChange={e => {
                    const name = e.target.value;
                    const autoCode = name.toUpperCase().trim().replace(/[^A-Z0-9]/g, '_');
                    setFormData({
                      ...formData,
                      attributeName: name,
                      attributeCode: editingAttr ? formData.attributeCode : autoCode
                    });
                  }}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                />
              </div>

              {/* Attribute Code * */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Attribute Code * <span style={{ fontSize: 11, fontWeight: 400, color: '#94A3B8' }}>(Unique identifier)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STORAGE_TEMP, SHELF_LIFE"
                  value={formData.attributeCode}
                  onChange={e => setFormData({ ...formData, attributeCode: e.target.value.toUpperCase() })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace', outline: 'none' }}
                />
              </div>

              {/* Data Type & Unit of Measure */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Data Type *
                  </label>
                  <select
                    value={formData.dataType}
                    onChange={e => setFormData({ ...formData, dataType: e.target.value as AttributeDataType })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600, background: '#FFFFFF' }}
                  >
                    {DATA_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Unit of Measure <span style={{ fontWeight: 400, color: '#94A3B8' }}>(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. °C, Months, mg, %"
                    value={formData.unitOfMeasure}
                    onChange={e => setFormData({ ...formData, unitOfMeasure: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              {/* Flags: Filterable, Searchable, Required, Active */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '12px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isFilterable}
                    onChange={e => setFormData({ ...formData, isFilterable: e.target.checked })}
                    style={{ width: 16, height: 16 }}
                  />
                  <span>Is Filterable</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isSearchable}
                    onChange={e => setFormData({ ...formData, isSearchable: e.target.checked })}
                    style={{ width: 16, height: 16 }}
                  />
                  <span>Is Searchable</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isRequired}
                    onChange={e => setFormData({ ...formData, isRequired: e.target.checked })}
                    style={{ width: 16, height: 16 }}
                  />
                  <span>Is Required</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    style={{ width: 16, height: 16 }}
                  />
                  <span>Is Active</span>
                </label>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10, borderTop: '1px solid #E2E8F0' }}>
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
                  {editingAttr ? 'Update Attribute' : 'Save Attribute'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
