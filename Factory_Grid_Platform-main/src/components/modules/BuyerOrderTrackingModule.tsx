import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShoppingBag, CheckCircle2, Clock, Truck, FileText, Download, 
  Package, ChevronRight, Eye, AlertCircle, ShieldCheck, X, Search, Filter,
  ArrowLeft, ArrowRight, Building2, Calendar, DollarSign, Receipt, Check, FileCheck, Layers, AlertTriangle, Upload, File
} from 'lucide-react';;
import { MasterOrder, Invoice } from '../../types';
import { UNIFIED_STORAGE_KEY } from './ProductionExecutionModule';

interface BuyerOrderTrackingModuleProps {
  initialViewMode?: 'ORDERS_LIST' | 'TRACKING_DETAIL';
}

export const BuyerOrderTrackingModule: React.FC<BuyerOrderTrackingModuleProps> = ({ initialViewMode = 'ORDERS_LIST' }) => {
  const { orders, invoices, addAuditLog, currentRole } = useApp();
  const [viewMode, setViewMode] = useState<'ORDERS_LIST' | 'TRACKING_DETAIL'>(initialViewMode);
  const [selectedOrder, setSelectedOrder] = useState<MasterOrder | null>(orders[0] || null);

  // Filters & Search State for Buyer Orders
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // View Invoice Modal State
  const [targetInvoiceModal, setTargetInvoiceModal] = useState<Invoice | null>(null);

  // Success Toast Banner State
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Goods Received Modal State
  const [goodsReceivedContext, setGoodsReceivedContext] = useState<{
    subCode: string;
    masterOrder: MasterOrder;
    subOrder: any;
    shipment: any;
  } | null>(null);

  const [receivedQtyInput, setReceivedQtyInput] = useState<number>(0);
  const [damagedQtyInput, setDamagedQtyInput] = useState<number>(0);
  const [receivedDateInput, setReceivedDateInput] = useState<string>(new Date().toISOString().split('T')[0]);
  const [conditionInput, setConditionInput] = useState<string>('Good / Accepted');
  const [receivingRemarksInput, setReceivingRemarksInput] = useState<string>('All cartons received in good condition.');
  const [grnFile, setGrnFile] = useState<File | null>(null);
  const [grnFormError, setGrnFormError] = useState<string | null>(null);

  const handleOpenGoodsReceivedModal = (subCode: string, masterOrder: MasterOrder, subOrder: any, shipment: any) => {
    const totalQty = subOrder.totalQuantity || shipment.totalQuantity || 12000;
    setGoodsReceivedContext({ subCode, masterOrder, subOrder, shipment });
    setReceivedQtyInput(totalQty);
    setDamagedQtyInput(0);
    setReceivedDateInput(new Date().toISOString().split('T')[0]);
    setConditionInput('Good / Accepted');
    setReceivingRemarksInput('All cartons received in good condition and verified at warehouse.');
    setGrnFile(null);
    setGrnFormError(null);
  };

  const handleConfirmGoodsReceivedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGrnFormError(null);

    if (!goodsReceivedContext) return;

    const { subCode, shipment } = goodsReceivedContext;
    const orderedQty = goodsReceivedContext.subOrder.totalQuantity || shipment.totalQuantity || 12000;
    const deliveredQty = shipment.podDetails?.deliveredQuantity || orderedQty;

    // Ensure shipment status is Delivered or POD Confirmed
    if (shipment.shipmentStatus !== 'DELIVERED' && shipment.shipmentStatus !== 'POD_CONFIRMED' && shipment.shipmentStatus !== 'CLOSED') {
      setGrnFormError('Goods Received confirmation is not allowed until shipment has reached Delivered or POD Confirmed state.');
      return;
    }

    if (receivedQtyInput < 0 || receivedQtyInput > deliveredQty) {
      setGrnFormError(`Received Quantity (${receivedQtyInput.toLocaleString()}) cannot exceed Delivered Quantity (${deliveredQty.toLocaleString()}).`);
      return;
    }

    if (damagedQtyInput < 0 || damagedQtyInput > receivedQtyInput) {
      setGrnFormError(`Damaged quantity cannot exceed received quantity.`);
      return;
    }

    if (receivedQtyInput < deliveredQty && (!receivingRemarksInput || receivingRemarksInput.trim().length === 0)) {
      setGrnFormError('Remarks are required when received quantity is less than delivered quantity.');
      return;
    }

    if ((conditionInput === 'Damaged' || conditionInput === 'Short Quantity') && (!receivingRemarksInput || receivingRemarksInput.trim().length === 0)) {
      setGrnFormError(`Remarks are required when condition is selected as ${conditionInput}.`);
      return;
    }

    const missingQty = Math.max(orderedQty - receivedQtyInput, 0);

    let receiptStatus: 'FULLY_RECEIVED' | 'PARTIALLY_RECEIVED' | 'RECEIVED_WITH_ISSUES' = 'FULLY_RECEIVED';
    if (receivedQtyInput < orderedQty) {
      receiptStatus = 'PARTIALLY_RECEIVED';
    } else if (damagedQtyInput > 0 || conditionInput === 'Damaged') {
      receiptStatus = 'RECEIVED_WITH_ISSUES';
    }

    const timeStr = receivedDateInput || new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

    const newStore = {
      ...subOrdersStore,
      [subCode]: {
        ...subOrdersStore[subCode],
        shipment: {
          ...shipment,
          goodsReceipt: {
            status: receiptStatus,
            receivedQuantity: receivedQtyInput,
            damagedQuantity: damagedQtyInput,
            missingQuantity: missingQty,
            condition: conditionInput,
            receivingRemarks: receivingRemarksInput || 'All cartons received and verified at warehouse.',
            receivedDate: timeStr,
            receivedBy: 'Buyer / Warehouse User',
            grnDocumentName: grnFile ? grnFile.name : 'GRN_RECEIPT_VERIFIED.pdf'
          }
        }
      }
    };

    setSubOrdersStore(newStore);
    try {
      localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(newStore));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error(err);
    }

    addAuditLog('Goods Receipt', `Buyer confirmed Goods Receipt for Sub-Order ${subCode}. Status: ${receiptStatus}. Received: ${receivedQtyInput} units, Missing: ${missingQty} units.`);
    
    setGoodsReceivedContext(null);
    setSuccessBanner(`✓ Goods Received successfully confirmed for Sub-Order ${subCode}.`);
  };

  // Dynamic Sub-Orders Store Synced with AppContext Master Orders
  const syncSubOrdersWithContext = (saved: any) => {
    const store: Record<string, any> = { ...(saved || {}) };

    store['SO-2026-5228-01'] = {
      subOrderNumber: 'SO-2026-5228-01',
      poNumber: 'PO-SO-2026-5228-01',
      masterOrderNumber: 'MO-2026-5228',
      customerName: 'Apex Pharma PCD Franchise',
      manufacturerName: 'SunBio LifeSciences Ltd',
      productName: 'Azithromycin 500mg Tablets',
      totalQuantity: 2000,
      orderValue: 26880,
      requiredDeliveryDate: '2026-08-28',
      productionStatus: 'COMPLETED',
      category: 'DELIVERED',
      batchNumber: 'BATCH-2026-8801',
      manufacturingLine: 'Line A - Solid Oral Dosages',
      plannedStartDate: '2026-08-20',
      expectedCompletionDate: '2026-08-24',
      progressPercent: 100,
      shipment: {
        id: 'SHP-5228-01',
        trackingNumber: 'TRK-COL-88963',
        subOrderNumber: 'SO-2026-5228-01',
        masterOrderNumber: 'MO-2026-5228',
        poNumber: 'PO-SO-2026-5228-01',
        customerName: 'Apex Pharma PCD Franchise',
        manufacturerName: 'SunBio LifeSciences Ltd',
        productName: 'Azithromycin 500mg Tablets',
        totalQuantity: 2000,
        transporterName: 'ColdEx Logistics',
        vehicleNumber: 'HP 12 B 8801',
        driverName: 'Gurpreet Singh',
        driverPhone: '+91 98765 00112',
        dispatchDate: '2026-08-25',
        expectedDeliveryDate: '2026-08-28',
        actualDeliveryDate: '2026-08-28',
        shipmentStatus: 'DELIVERED',
        podStatus: 'CONFIRMED',
        temperatureStatus: 'Normal / Compliant (2°C - 8°C)',
        currentTemp: '4.2°C',
        demoGpsLocation: 'Consignee Warehouse - New Delhi',
        podReceiverName: 'Buyer Warehouse Manager',
        podDeliveryDate: '2026-08-28',
        podRemarks: 'All cartons received in good condition and verified at warehouse.',
        podDocName: 'POD_STAMP_SIGNED_SO-2026-5228-01.pdf',
        goodsReceipt: {
          status: 'FULLY_RECEIVED',
          receivedQuantity: 2000,
          damagedQuantity: 0,
          missingQuantity: 0,
          condition: 'Good / Accepted',
          receivingRemarks: 'All cartons received in good condition and verified at warehouse.',
          receivedDate: '2026-08-28',
          receivedBy: 'Buyer Warehouse Manager'
        },
        activityHistory: [
          { id: 'act_5228_1_3', timestamp: '28 Aug 04:30 PM', eventTitle: 'POD Verified & Delivered', actor: 'Buyer Warehouse Manager', details: 'Confirmed 2,000 units received in pristine cold chain condition.' },
          { id: 'act_5228_1_2', timestamp: '27 Aug 11:00 AM', eventTitle: 'Arrived at Destination Hub', actor: 'ColdEx Logistics', details: 'Arrived at New Delhi Distribution Hub.' },
          { id: 'act_5228_1_1', timestamp: '25 Aug 09:30 AM', eventTitle: 'Shipment Dispatched', actor: 'SunBio LifeSciences Ltd', details: 'Dispatched via ColdEx Logistics (Vehicle: HP 12 B 8801, AWB: TRK-COL-88963)' }
        ]
      }
    };

    store['SO-2026-5228-02'] = {
      subOrderNumber: 'SO-2026-5228-02',
      poNumber: 'PO-SO-2026-5228-02',
      masterOrderNumber: 'MO-2026-5228',
      customerName: 'Apex Pharma PCD Franchise',
      manufacturerName: 'Cipla Partner Formulations Ltd',
      productName: 'Pantoprazole 40mg + Domperidone 30mg SR Capsules',
      totalQuantity: 3000,
      orderValue: 48720,
      requiredDeliveryDate: '2026-09-01',
      productionStatus: 'COMPLETED',
      category: 'IN_TRANSIT',
      batchNumber: 'BATCH-2026-8802',
      manufacturingLine: 'Line B - Capsule Encapsulation',
      plannedStartDate: '2026-08-21',
      expectedCompletionDate: '2026-08-26',
      progressPercent: 100,
      shipment: {
        id: 'SHP-5228-02',
        trackingNumber: 'TRK-BLU-77421',
        subOrderNumber: 'SO-2026-5228-02',
        masterOrderNumber: 'MO-2026-5228',
        poNumber: 'PO-SO-2026-5228-02',
        customerName: 'Apex Pharma PCD Franchise',
        manufacturerName: 'Cipla Partner Formulations Ltd',
        productName: 'Pantoprazole 40mg + Domperidone 30mg SR Capsules',
        totalQuantity: 3000,
        transporterName: 'BlueDart Express',
        vehicleNumber: 'DL 01 CD 7742',
        driverName: 'Vikram Singh',
        driverPhone: '+91 98112 77421',
        dispatchDate: '2026-08-27',
        expectedDeliveryDate: '2026-09-01',
        shipmentStatus: 'IN_TRANSIT',
        podStatus: 'PENDING',
        temperatureStatus: 'Normal / Compliant (15°C - 25°C)',
        currentTemp: '21.5°C',
        demoGpsLocation: 'Delhi Distribution Hub - En Route',
        activityHistory: [
          { id: 'act_5228_2_2', timestamp: '27 Aug 02:15 PM', eventTitle: 'In Transit - En Route', actor: 'BlueDart Express', details: 'Shipment departed Delhi Distribution Hub.' },
          { id: 'act_5228_2_1', timestamp: '27 Aug 09:00 AM', eventTitle: 'Shipment Dispatched', actor: 'Cipla Partner Formulations Ltd', details: 'Dispatched via BlueDart Express (Vehicle: DL 01 CD 7742, AWB: TRK-BLU-77421)' }
        ]
      }
    };

    store['SO-2026-5229-01'] = {
      subOrderNumber: 'SO-2026-5229-01',
      poNumber: 'PO-SO-2026-5229-01',
      masterOrderNumber: 'MO-2026-5229',
      customerName: 'Apex Pharma PCD Franchise',
      manufacturerName: 'SunBio LifeSciences Ltd',
      productName: 'Paracetamol 650mg ER Tablets',
      totalQuantity: 10000,
      orderValue: 128800,
      requiredDeliveryDate: '2026-08-25',
      productionStatus: 'COMPLETED',
      category: 'DELIVERED',
      batchNumber: 'BATCH-2026-5229',
      manufacturingLine: 'Line A - Solid Oral Dosages',
      plannedStartDate: '2026-08-14',
      expectedCompletionDate: '2026-08-20',
      progressPercent: 100,
      shipment: {
        id: 'SHP-5229-01',
        trackingNumber: 'TRK-SAF-99412',
        subOrderNumber: 'SO-2026-5229-01',
        masterOrderNumber: 'MO-2026-5229',
        poNumber: 'PO-SO-2026-5229-01',
        customerName: 'Apex Pharma PCD Franchise',
        manufacturerName: 'SunBio LifeSciences Ltd',
        productName: 'Paracetamol 650mg ER Tablets',
        totalQuantity: 10000,
        transporterName: 'Safexpress Cold Fleet',
        vehicleNumber: 'HP 12 B 9941',
        driverName: 'Ramesh Verma',
        driverPhone: '+91 98765 99412',
        dispatchDate: '2026-08-20',
        expectedDeliveryDate: '2026-08-25',
        actualDeliveryDate: '2026-08-25',
        shipmentStatus: 'DELIVERED',
        podStatus: 'CONFIRMED',
        temperatureStatus: 'Normal / Compliant (15°C - 25°C)',
        currentTemp: '20.1°C',
        demoGpsLocation: 'Apex Central Warehouse New Delhi',
        podReceiverName: 'Warehouse Stores Manager',
        podDeliveryDate: '2026-08-25',
        podRemarks: 'Delivered in good condition and stock logged.',
        podDocName: 'POD_STAMP_SIGNED_SO-2026-5229-01.pdf',
        activityHistory: [
          { id: 'act_5229_1_2', timestamp: '25 Aug 03:00 PM', eventTitle: 'Delivered & Verified', actor: 'Safexpress Cold Fleet', details: 'Delivered to Apex Central Warehouse.' },
          { id: 'act_5229_1_1', timestamp: '20 Aug 10:00 AM', eventTitle: 'Shipment Dispatched', actor: 'SunBio LifeSciences Ltd', details: 'Dispatched via Safexpress Cold Fleet (Vehicle: HP 12 B 9941, AWB: TRK-SAF-99412)' }
        ]
      }
    };

    store['SO-2026-5230-01'] = {
      subOrderNumber: 'SO-2026-5230-01',
      poNumber: 'PO-SO-2026-5230-01',
      masterOrderNumber: 'MO-2026-5230',
      customerName: 'Apex Pharma PCD Franchise',
      manufacturerName: 'SunBio LifeSciences Ltd',
      productName: 'Amoxyclav 625mg Tablets',
      totalQuantity: 5000,
      orderValue: 252000,
      requiredDeliveryDate: '2026-09-05',
      productionStatus: 'IN_PRODUCTION',
      category: 'IN_PRODUCTION',
      batchNumber: 'BATCH-2026-5230',
      manufacturingLine: 'Line A - Solid Oral Dosages',
      plannedStartDate: '2026-08-18',
      expectedCompletionDate: '2026-09-05',
      progressPercent: 70,
      shipment: null
    };

    store['SO-2026-5231-01'] = {
      subOrderNumber: 'SO-2026-5231-01',
      poNumber: 'PO-SO-2026-5231-01',
      masterOrderNumber: 'MO-2026-5231',
      customerName: 'Apex Pharma PCD Franchise',
      manufacturerName: 'Cipla Partner Formulations Ltd',
      productName: 'Ciprofloxacin 500mg Tablets',
      totalQuantity: 8000,
      orderValue: 161280,
      requiredDeliveryDate: '2026-08-30',
      productionStatus: 'READY_TO_DISPATCH',
      category: 'READY_TO_DISPATCH',
      batchNumber: 'BATCH-2026-5231',
      manufacturingLine: 'Line B - High Speed Tablet Press',
      plannedStartDate: '2026-08-18',
      expectedCompletionDate: '2026-08-26',
      progressPercent: 100,
      shipment: {
        id: 'SHP-5231-01',
        trackingNumber: 'TRK-BD-9940128',
        subOrderNumber: 'SO-2026-5231-01',
        masterOrderNumber: 'MO-2026-5231',
        poNumber: 'PO-SO-2026-5231-01',
        customerName: 'Apex Pharma PCD Franchise',
        manufacturerName: 'Cipla Partner Formulations Ltd',
        productName: 'Ciprofloxacin 500mg Tablets',
        totalQuantity: 8000,
        transporterName: 'BlueDart Surface',
        vehicleNumber: 'DL 01 CD 9940',
        driverName: 'Sanjay Kumar',
        driverPhone: '+91 98112 99401',
        dispatchDate: '2026-08-26',
        expectedDeliveryDate: '2026-08-30',
        shipmentStatus: 'DISPATCHED',
        podStatus: 'PENDING',
        temperatureStatus: 'Normal / Compliant (15°C - 25°C)',
        currentTemp: '22.0°C',
        demoGpsLocation: 'Cipla Logistics Bay - Baddi',
        activityHistory: [
          { id: 'act_5231_1_1', timestamp: '26 Aug 05:00 PM', eventTitle: 'Shipment Dispatched', actor: 'Cipla Partner Formulations Ltd', details: 'Dispatched via BlueDart Surface (Vehicle: DL 01 CD 9940, AWB: TRK-BD-9940128)' }
        ]
      }
    };

    store['SO-2026-5232-01'] = {
      subOrderNumber: 'SO-2026-5232-01',
      poNumber: 'PO-SO-2026-5232-01',
      masterOrderNumber: 'MO-2026-5232',
      customerName: 'Apex Pharma PCD Franchise',
      manufacturerName: 'SunBio LifeSciences Ltd',
      productName: 'Ceftriaxone 1g Injection',
      totalQuantity: 1200,
      orderValue: 114240,
      requiredDeliveryDate: '2026-08-27',
      productionStatus: 'COMPLETED',
      category: 'PENDING_RECEIPT',
      batchNumber: 'BATCH-2026-5232',
      manufacturingLine: 'Line C - Sterile Liquid Injectables',
      plannedStartDate: '2026-08-16',
      expectedCompletionDate: '2026-08-22',
      progressPercent: 100,
      shipment: {
        id: 'SHP-5232-01',
        trackingNumber: 'TRK-TCI-88102',
        subOrderNumber: 'SO-2026-5232-01',
        masterOrderNumber: 'MO-2026-5232',
        poNumber: 'PO-SO-2026-5232-01',
        customerName: 'Apex Pharma PCD Franchise',
        manufacturerName: 'SunBio LifeSciences Ltd',
        productName: 'Ceftriaxone 1g Injection',
        totalQuantity: 1200,
        transporterName: 'TCI Express',
        vehicleNumber: 'HP 12 B 8810',
        driverName: 'Harpreet Singh',
        driverPhone: '+91 98765 88102',
        dispatchDate: '2026-08-23',
        expectedDeliveryDate: '2026-08-27',
        actualDeliveryDate: '2026-08-27',
        shipmentStatus: 'POD_CONFIRMED',
        podStatus: 'CONFIRMED',
        temperatureStatus: 'Normal / Compliant (2°C - 8°C)',
        currentTemp: '4.5°C',
        demoGpsLocation: 'Consignee Receiving Bay - New Delhi',
        podReceiverName: 'Receiving Dock Officer',
        podDeliveryDate: '2026-08-27',
        podRemarks: 'Delivered. Awaiting buyer GRN log entry.',
        podDocName: 'POD_STAMP_SIGNED_SO-2026-5232-01.pdf',
        activityHistory: [
          { id: 'act_5232_1_2', timestamp: '27 Aug 02:00 PM', eventTitle: 'POD Confirmed', actor: 'TCI Express', details: 'Delivered at Consignee Receiving Bay.' },
          { id: 'act_5232_1_1', timestamp: '23 Aug 11:00 AM', eventTitle: 'Shipment Dispatched', actor: 'SunBio LifeSciences Ltd', details: 'Dispatched via TCI Express (Vehicle: HP 12 B 8810, AWB: TRK-TCI-88102)' }
        ]
      }
    };

    store['SO-2026-5233-01'] = {
      subOrderNumber: 'SO-2026-5233-01',
      poNumber: 'PO-SO-2026-5233-01',
      masterOrderNumber: 'MO-2026-5233',
      customerName: 'Apex Pharma PCD Franchise',
      manufacturerName: 'Cipla Partner Formulations Ltd',
      productName: 'Metformin 500mg SR Tablets',
      totalQuantity: 20000,
      orderValue: 145600,
      requiredDeliveryDate: '2026-08-26',
      productionStatus: 'COMPLETED',
      category: 'GOODS_RECEIVED',
      batchNumber: 'BATCH-2026-5233',
      manufacturingLine: 'Line B - High Speed Tablet Press',
      plannedStartDate: '2026-08-12',
      expectedCompletionDate: '2026-08-20',
      progressPercent: 100,
      shipment: {
        id: 'SHP-5233-01',
        trackingNumber: 'TRK-COL-99012',
        subOrderNumber: 'SO-2026-5233-01',
        masterOrderNumber: 'MO-2026-5233',
        poNumber: 'PO-SO-2026-5233-01',
        customerName: 'Apex Pharma PCD Franchise',
        manufacturerName: 'Cipla Partner Formulations Ltd',
        productName: 'Metformin 500mg SR Tablets',
        totalQuantity: 20000,
        transporterName: 'ColdEx Express Fleet',
        vehicleNumber: 'DL 01 CD 9901',
        driverName: 'Amit Kumar',
        driverPhone: '+91 98112 99012',
        dispatchDate: '2026-08-22',
        expectedDeliveryDate: '2026-08-26',
        actualDeliveryDate: '2026-08-26',
        shipmentStatus: 'CLOSED',
        podStatus: 'CONFIRMED',
        temperatureStatus: 'Normal / Compliant (15°C - 25°C)',
        currentTemp: '19.8°C',
        demoGpsLocation: 'Apex Central Warehouse New Delhi',
        podReceiverName: 'Apex Warehouse Lead',
        podDeliveryDate: '2026-08-26',
        podRemarks: 'Full shipment received and stock logged into ERP.',
        podDocName: 'POD_STAMP_SIGNED_SO-2026-5233-01.pdf',
        goodsReceipt: {
          status: 'FULLY_RECEIVED',
          receivedQuantity: 20000,
          damagedQuantity: 0,
          missingQuantity: 0,
          condition: 'Good / Accepted',
          receivingRemarks: 'Full shipment received and stock logged into ERP.',
          receivedDate: '2026-08-26',
          receivedBy: 'Apex Warehouse Lead'
        },
        activityHistory: [
          { id: 'act_5233_1_3', timestamp: '26 Aug 04:00 PM', eventTitle: 'Shipment Closed & Archived', actor: 'System', details: 'Goods receipt verified. Shipment closed.' },
          { id: 'act_5233_1_2', timestamp: '26 Aug 11:30 AM', eventTitle: 'Delivered', actor: 'ColdEx Express Fleet', details: 'Delivered at Apex Central Warehouse.' },
          { id: 'act_5233_1_1', timestamp: '22 Aug 09:00 AM', eventTitle: 'Shipment Dispatched', actor: 'Cipla Partner Formulations Ltd', details: 'Dispatched via ColdEx Express Fleet (Vehicle: DL 01 CD 9901, AWB: TRK-COL-99012)' }
        ]
      }
    };

    store['SO-2026-5234-01'] = {
      subOrderNumber: 'SO-2026-5234-01',
      poNumber: 'PO-SO-2026-5234-01',
      masterOrderNumber: 'MO-2026-5234',
      customerName: 'Apex Pharma PCD Franchise',
      manufacturerName: 'SunBio LifeSciences Ltd',
      productName: 'Telmisartan 40mg Tablets',
      totalQuantity: 15000,
      orderValue: 154560,
      requiredDeliveryDate: '2026-08-24',
      productionStatus: 'COMPLETED',
      category: 'CLOSED',
      batchNumber: 'BATCH-2026-5234',
      manufacturingLine: 'Line A - Solid Oral Dosages',
      plannedStartDate: '2026-08-08',
      expectedCompletionDate: '2026-08-18',
      progressPercent: 100,
      shipment: {
        id: 'SHP-5234-01',
        trackingNumber: 'TRK-TCI-77129',
        subOrderNumber: 'SO-2026-5234-01',
        masterOrderNumber: 'MO-2026-5234',
        poNumber: 'PO-SO-2026-5234-01',
        customerName: 'Apex Pharma PCD Franchise',
        manufacturerName: 'SunBio LifeSciences Ltd',
        productName: 'Telmisartan 40mg Tablets',
        totalQuantity: 15000,
        transporterName: 'TCI Express Cold Fleet',
        vehicleNumber: 'HP 12 B 7712',
        driverName: 'Kuldeep Singh',
        driverPhone: '+91 98765 77129',
        dispatchDate: '2026-08-20',
        expectedDeliveryDate: '2026-08-24',
        actualDeliveryDate: '2026-08-24',
        shipmentStatus: 'CLOSED',
        podStatus: 'CONFIRMED',
        temperatureStatus: 'Normal / Compliant (15°C - 25°C)',
        currentTemp: '21.0°C',
        demoGpsLocation: 'Apex Central Warehouse New Delhi',
        podReceiverName: 'Apex Warehouse Manager',
        podDeliveryDate: '2026-08-24',
        podRemarks: 'Verified full quantity 15,000 units. Invoice paid.',
        podDocName: 'POD_STAMP_SIGNED_SO-2026-5234-01.pdf',
        goodsReceipt: {
          status: 'FULLY_RECEIVED',
          receivedQuantity: 15000,
          damagedQuantity: 0,
          missingQuantity: 0,
          condition: 'Good / Accepted',
          receivingRemarks: 'Verified full quantity 15,000 units. Invoice paid.',
          receivedDate: '2026-08-24',
          receivedBy: 'Apex Warehouse Manager'
        },
        activityHistory: [
          { id: 'act_5234_1_3', timestamp: '24 Aug 05:00 PM', eventTitle: 'Shipment Closed & Archived', actor: 'System', details: 'Lifecycle completed and archived.' },
          { id: 'act_5234_1_2', timestamp: '24 Aug 02:00 PM', eventTitle: 'Delivered', actor: 'TCI Express Cold Fleet', details: 'Delivered to Apex Central Warehouse.' },
          { id: 'act_5234_1_1', timestamp: '20 Aug 10:00 AM', eventTitle: 'Shipment Dispatched', actor: 'SunBio LifeSciences Ltd', details: 'Dispatched via TCI Express Cold Fleet (Vehicle: HP 12 B 7712, AWB: TRK-TCI-77129)' }
        ]
      }
    };

    store['SO-1001-01'] = {
      subOrderNumber: 'SO-1001-01',
      poNumber: 'PO-2026-1001-01',
      masterOrderNumber: 'MO-2026-1001',
      customerName: 'Apex Pharma PCD Franchise',
      manufacturerName: 'SunBio LifeSciences Ltd',
      productName: 'Paracetamol 500mg & Azithromycin 500mg Tablets',
      totalQuantity: 12000,
      orderValue: 195300,
      productionStatus: 'READY_TO_DISPATCH',
      category: 'IN_TRANSIT',
      shipment: {
        id: 'SHP-COLD-5027',
        trackingNumber: 'BD502730757IN',
        subOrderNumber: 'SO-1001-01',
        masterOrderNumber: 'MO-2026-1001',
        poNumber: 'PO-2026-1001-01',
        customerName: 'Apex Pharma PCD Franchise',
        manufacturerName: 'SunBio LifeSciences Ltd',
        productName: 'Paracetamol 500mg & Azithromycin 500mg Tablets',
        totalQuantity: 12000,
        transporterName: 'ColdEx Logistics Telemetry Fleet',
        vehicleNumber: 'HP 12 B 9021',
        driverName: 'Gurpreet Singh',
        driverPhone: '+91 98765 00112',
        dispatchDate: '2026-08-18',
        expectedDeliveryDate: '2026-08-28',
        shipmentStatus: 'IN_TRANSIT',
        temperatureStatus: 'Normal / Compliant (2°C - 8°C)',
        currentTemp: '4.1°C',
        demoGpsLocation: 'NH44 Highway — En route to Consignee (Hyderabad Hub)',
        podStatus: 'PENDING',
        pickupRefNumber: 'PU-BD-88912',
        activityHistory: [
          { id: 'act_1', timestamp: '18 Aug 10:00 AM', eventTitle: 'Shipment Entered In Transit', actor: 'ColdEx Logistics Telemetry Fleet', details: 'Shipment BD502730757IN entered transit route via vehicle HP 12 B 9021' },
          { id: 'act_0', timestamp: '18 Aug 08:30 AM', eventTitle: 'Shipment Dispatched', actor: 'SunBio LifeSciences Ltd', details: 'Dispatched via ColdEx Logistics Telemetry Fleet (Vehicle: HP 12 B 9021, AWB: BD502730757IN)' }
        ]
      }
    };

    if (Array.isArray(orders)) {
      orders.forEach(mo => {
        if (Array.isArray(mo.subOrders)) {
          mo.subOrders.forEach(so => {
            const subNum = so.subOrderNumber;
            if (subNum && !store[subNum]) {
              store[subNum] = {
                subOrderNumber: subNum,
                poNumber: `PO-${subNum}`,
                masterOrderNumber: mo.orderNumber,
                customerName: mo.customerName,
                manufacturerName: so.manufacturerName || 'SunBio LifeSciences Ltd.',
                productName: so.lines?.[0]?.productName || 'Pharmaceutical Formulation Product',
                totalQuantity: so.lines?.reduce((sum: number, l: any) => sum + l.quantity, 0) || 10000,
                orderValue: so.totalAmount || 150000,
                requiredDeliveryDate: mo.expectedDeliveryDate || '2026-09-02',
                productionStatus: 'PO_ACCEPTED',
                batchNumber: `BATCH-${Date.now().toString().slice(-6)}`,
                shipment: null
              };
            }
          });
        }
      });
    }
    return store;
  };

  // Read Unified Store
  const [subOrdersStore, setSubOrdersStore] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem(UNIFIED_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : {};
      return syncSubOrdersWithContext(parsed);
    } catch (e) {
      console.error(e);
      return syncSubOrdersWithContext({});
    }
  });

  // Keep synced with localStorage & AppContext Orders
  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const saved = localStorage.getItem(UNIFIED_STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : {};
        const merged = syncSubOrdersWithContext(parsed);
        setSubOrdersStore(merged);
      } catch (e) { console.error(e); }
    };

    syncFromStorage();
    window.addEventListener('storage', syncFromStorage);
    window.addEventListener('focus', syncFromStorage);
    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener('focus', syncFromStorage);
    };
  }, [orders]);

    // Centralized Sub-Order Status Categorization
  const getSubOrderDetailedStatus = (sub: any) => {
    const subCode = sub.subOrderNumber === 'SO-2026-1001-01' ? 'SO-1001-01' : sub.subOrderNumber;
    const storeRec = subOrdersStore[subCode] || sub;
    const shp = storeRec?.shipment;
    const prodSt = storeRec?.productionStatus || sub.status || 'PO_ACCEPTED';
    const explicitCat = storeRec?.category || sub?.category;

    if (explicitCat) {
      if (explicitCat === 'CLOSED' || explicitCat === 'COMPLETED') {
        return { subCode, category: 'CLOSED', displayStatus: 'Completed', badgeStyle: { bg: '#F1F5F9', border: '#CBD5E1', color: '#475569' } };
      }
      if (explicitCat === 'GOODS_RECEIVED') {
        return { subCode, category: 'GOODS_RECEIVED', displayStatus: 'Goods Received ✓', badgeStyle: { bg: '#DCFCE7', border: '#86EFAC', color: '#15803D' } };
      }
      if (explicitCat === 'PENDING_RECEIPT' || explicitCat === 'PENDING_GOODS_RECEIPT') {
        return { subCode, category: 'PENDING_RECEIPT', displayStatus: 'Pending Goods Receipt', badgeStyle: { bg: '#FEF3C7', border: '#FDE68A', color: '#B45309' } };
      }
      if (explicitCat === 'DELIVERED') {
        return { subCode, category: 'DELIVERED', displayStatus: 'Delivered', badgeStyle: { bg: '#DCFCE7', border: '#86EFAC', color: '#15803D' } };
      }
      if (explicitCat === 'IN_TRANSIT') {
        return { subCode, category: 'IN_TRANSIT', displayStatus: 'In Transit', badgeStyle: { bg: '#E0F2FE', border: '#BAE6FD', color: '#0369A1' } };
      }
      if (explicitCat === 'READY_TO_DISPATCH') {
        return { subCode, category: 'READY_TO_DISPATCH', displayStatus: 'Ready To Dispatch', badgeStyle: { bg: '#F3E8FF', border: '#E9D5FF', color: '#6B21A8' } };
      }
      if (explicitCat === 'IN_PRODUCTION') {
        return { subCode, category: 'IN_PRODUCTION', displayStatus: 'In Production', badgeStyle: { bg: '#FEF3C7', border: '#FDE68A', color: '#B45309' } };
      }
    }

    if (shp) {
      const shpSt = shp.shipmentStatus;
      const podSt = shp.podStatus;
      const gRec = shp.goodsReceipt;

      if (gRec || shpSt === 'CLOSED') {
        if (shpSt === 'CLOSED') {
          return { subCode, category: 'CLOSED', displayStatus: 'Completed', badgeStyle: { bg: '#F1F5F9', border: '#CBD5E1', color: '#475569' } };
        }
        return { subCode, category: 'GOODS_RECEIVED', displayStatus: 'Goods Received ✓', badgeStyle: { bg: '#DCFCE7', border: '#86EFAC', color: '#15803D' } };
      }

      if (shpSt === 'DELIVERED' || shpSt === 'POD_CONFIRMED') {
        if (podSt === 'CONFIRMED' || shpSt === 'POD_CONFIRMED') {
          return { subCode, category: 'PENDING_RECEIPT', displayStatus: 'Pending Goods Receipt', badgeStyle: { bg: '#FEF3C7', border: '#FDE68A', color: '#B45309' } };
        }
        return { subCode, category: 'DELIVERED', displayStatus: 'Delivered', badgeStyle: { bg: '#DCFCE7', border: '#86EFAC', color: '#15803D' } };
      }

      if (shpSt === 'IN_TRANSIT' || shpSt === 'OUT_FOR_DELIVERY' || shpSt === 'DISPATCHED') {
        return { subCode, category: 'IN_TRANSIT', displayStatus: 'In Transit', badgeStyle: { bg: '#E0F2FE', border: '#BAE6FD', color: '#0369A1' } };
      }
    }

    if (prodSt === 'READY_TO_DISPATCH' || prodSt === 'READY TO DISPATCH') {
      return { subCode, category: 'READY_TO_DISPATCH', displayStatus: 'Ready To Dispatch', badgeStyle: { bg: '#F3E8FF', border: '#E9D5FF', color: '#6B21A8' } };
    }

    if (prodSt === 'SCHEDULED' || prodSt === 'IN_PRODUCTION' || prodSt === 'IN PRODUCTION' || prodSt === 'QUALITY_INSPECTION' || prodSt === 'PACKAGING') {
      return { subCode, category: 'IN_PRODUCTION', displayStatus: 'In Production', badgeStyle: { bg: '#FEF3C7', border: '#FDE68A', color: '#B45309' } };
    }

    if (prodSt === 'DELIVERED') {
      return { subCode, category: 'DELIVERED', displayStatus: 'Delivered', badgeStyle: { bg: '#DCFCE7', border: '#86EFAC', color: '#15803D' } };
    }
    if (prodSt === 'CLOSED' || prodSt === 'COMPLETED') {
      return { subCode, category: 'CLOSED', displayStatus: 'Completed', badgeStyle: { bg: '#F1F5F9', border: '#CBD5E1', color: '#475569' } };
    }
    if (prodSt === 'GOODS_RECEIVED') {
      return { subCode, category: 'GOODS_RECEIVED', displayStatus: 'Goods Received ✓', badgeStyle: { bg: '#DCFCE7', border: '#86EFAC', color: '#15803D' } };
    }

    return { subCode, category: 'ACTIVE', displayStatus: 'PO Accepted', badgeStyle: { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8' } };
  };

  // Calculate Master Order Overall Status dynamically from sub-orders
  const getMasterOrderStatus = (ord: MasterOrder): string => {
    if (!ord.subOrders || ord.subOrders.length === 0) return ord.status || 'PO ACCEPTED';
    
    const subStatuses = ord.subOrders.map(sub => getSubOrderDetailedStatus(sub));
    const categories = subStatuses.map(s => s.category);

    if (categories.every(c => c === 'CLOSED')) return 'COMPLETED';
    if (categories.every(c => c === 'GOODS_RECEIVED' || c === 'CLOSED')) return 'GOODS RECEIVED';
    if (categories.every(c => c === 'DELIVERED' || c === 'PENDING_RECEIPT' || c === 'GOODS_RECEIVED' || c === 'CLOSED')) return 'DELIVERED';
    if (categories.some(c => c === 'IN_TRANSIT')) return 'IN TRANSIT';
    if (categories.some(c => c === 'READY_TO_DISPATCH')) return 'READY TO DISPATCH';
    if (categories.some(c => c === 'IN_PRODUCTION')) return 'IN PRODUCTION';
    if (categories.every(c => c === 'ACTIVE')) return 'PO ACCEPTED';
    
    return 'IN PROGRESS';
  };

  // Calculate Dynamic Status Counts for Filter Badges
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: 0,
      ACTIVE: 0,
      IN_PRODUCTION: 0,
      READY_TO_DISPATCH: 0,
      IN_TRANSIT: 0,
      DELIVERED: 0,
      PENDING_RECEIPT: 0,
      GOODS_RECEIVED: 0,
      CLOSED: 0,
    };

    orders.forEach(ord => {
      counts.ALL++;
      const subStatuses = (ord.subOrders || []).map(sub => getSubOrderDetailedStatus(sub));
      const categories = new Set(subStatuses.map(s => s.category));

      categories.forEach(cat => {
        if (counts[cat] !== undefined) {
          counts[cat]++;
        }
      });
    });

    return counts;
  }, [orders, subOrdersStore]);

  // Sub-Order Level Filtered Orders for Buyer
  const filteredOrders = useMemo(() => {
    return orders.filter(ord => {
      const subDetails = (ord.subOrders || []).map(sub => getSubOrderDetailedStatus(sub));
      
      let matchesStatus = true;
      if (statusFilter === 'ALL') {
        matchesStatus = true;
      } else if (statusFilter === 'ACTIVE') {
        matchesStatus = subDetails.some(s => s.category === 'ACTIVE');
      } else if (statusFilter === 'IN_PRODUCTION') {
        matchesStatus = subDetails.some(s => s.category === 'IN_PRODUCTION');
      } else if (statusFilter === 'READY_TO_DISPATCH') {
        matchesStatus = subDetails.some(s => s.category === 'READY_TO_DISPATCH');
      } else if (statusFilter === 'IN_TRANSIT') {
        matchesStatus = subDetails.some(s => s.category === 'IN_TRANSIT');
      } else if (statusFilter === 'DELIVERED') {
        matchesStatus = subDetails.some(s => s.category === 'DELIVERED');
      } else if (statusFilter === 'PENDING_RECEIPT') {
        matchesStatus = subDetails.some(s => s.category === 'PENDING_RECEIPT');
      } else if (statusFilter === 'GOODS_RECEIVED') {
        matchesStatus = subDetails.some(s => s.category === 'GOODS_RECEIVED');
      } else if (statusFilter === 'CLOSED') {
        matchesStatus = subDetails.some(s => s.category === 'CLOSED');
      }

      const q = searchQuery.toLowerCase().trim();
      let matchesSearch = true;
      if (q) {
        const matchOrdNum = ord.orderNumber.toLowerCase().includes(q);
        const matchCust = ord.customerName.toLowerCase().includes(q);
        const matchMfg = ord.subOrders.some(s => s.manufacturerName.toLowerCase().includes(q));
        const matchProd = ord.subOrders.some(s => s.lines.some(l => l.productName.toLowerCase().includes(q)));
        const matchDate = ord.createdDate.toLowerCase().includes(q);
        matchesSearch = matchOrdNum || matchCust || matchMfg || matchProd || matchDate;
      }

      return matchesStatus && matchesSearch;
    });
  }, [orders, subOrdersStore, statusFilter, searchQuery]);

  const activeMasterOrder = selectedOrder || orders[0];
  const activeMasterStatus = activeMasterOrder ? getMasterOrderStatus(activeMasterOrder) : 'PO ACCEPTED';

  // 15-Stage Unified Order Lifecycle Stepper Configuration
  const UNIFIED_TIMELINE_STAGES = [
    { key: 'ORDER_CREATED', label: 'Order Created', group: 'Order' },
    { key: 'QUOTE_APPROVED', label: 'Quote Approved', group: 'Order' },
    { key: 'PO_ACCEPTED', label: 'PO Accepted', group: 'Mfg' },
    { key: 'SCHEDULED', label: 'Scheduled', group: 'Mfg' },
    { key: 'IN_PRODUCTION', label: 'In Production', group: 'Mfg' },
    { key: 'QUALITY_INSPECTION', label: 'QC Inspection', group: 'Mfg' },
    { key: 'PACKAGING', label: 'Packaging', group: 'Mfg' },
    { key: 'READY_TO_DISPATCH', label: 'Ready To Dispatch', group: 'Mfg' },
    { key: 'DISPATCHED', label: 'Dispatched', group: 'Logistics' },
    { key: 'IN_TRANSIT', label: 'In Transit', group: 'Logistics' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out For Delivery', group: 'Logistics' },
    { key: 'DELIVERED', label: 'Delivered', group: 'Logistics' },
    { key: 'POD_CONFIRMED', label: 'POD Confirmed', group: 'Logistics' },
    { key: 'GOODS_RECEIVED', label: 'Goods Received', group: 'Buyer' },
    { key: 'CLOSED', label: 'Closed & Archived', group: 'Finance' }
  ];

  const getStageCurrentIndex = (statusStr: string): number => {
    switch (statusStr) {
      case 'ORDER_CREATED': return 0;
      case 'QUOTE_APPROVED': return 1;
      case 'PO_ACCEPTED': case 'PO ACCEPTED': return 2;
      case 'SCHEDULED': return 3;
      case 'IN_PRODUCTION': case 'IN PRODUCTION': return 4;
      case 'QUALITY_INSPECTION': return 5;
      case 'PACKAGING': return 6;
      case 'READY_TO_DISPATCH': case 'READY TO DISPATCH': return 7;
      case 'DISPATCHED': return 8;
      case 'IN_TRANSIT': case 'IN TRANSIT': return 9;
      case 'OUT_FOR_DELIVERY': case 'OUT FOR DELIVERY': return 10;
      case 'DELIVERED': return 11;
      case 'POD_CONFIRMED': case 'POD CONFIRMED': return 12;
      case 'GOODS_RECEIVED': case 'GOODS RECEIVED': return 13;
      case 'CLOSED': return 14;
      default: return 4;
    }
  };

  const activeStageIdx = getStageCurrentIndex(activeMasterStatus);

  const getStatusBadgeStyle = (st: string) => {
    switch (st) {
      case 'CLOSED':
        return { bg: '#F1F5F9', border: '#CBD5E1', color: '#475569', icon: CheckCircle2 };
      case 'DELIVERED': case 'POD CONFIRMED':
        return { bg: '#DCFCE7', border: '#86EFAC', color: '#15803D', icon: CheckCircle2 };
      case 'IN TRANSIT': case 'DISPATCHED':
        return { bg: '#E0F2FE', border: '#BAE6FD', color: '#0369A1', icon: Truck };
      case 'READY TO DISPATCH':
        return { bg: '#F3E8FF', border: '#E9D5FF', color: '#6B21A8', icon: Package };
      case 'IN PRODUCTION': case 'SCHEDULED':
        return { bg: '#FEF3C7', border: '#FDE68A', color: '#B45309', icon: Clock };
      default:
        return { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8', icon: ShoppingBag };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC', color: '#0F172A' }}>

      {/* ── COMMAND HEADER & VIEW SWITCHER ────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Buyer Portal / Order Fulfillment & Tracking History
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '2px 0 0' }}>
            {viewMode === 'ORDERS_LIST' ? 'My Orders & Order History' : `Order Details & Tracking #${activeMasterOrder?.orderNumber}`}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setViewMode('ORDERS_LIST')}
            style={{
              padding: '9px 18px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              border: viewMode === 'ORDERS_LIST' ? '1px solid #0F766E' : '1px solid #CBD5E1',
              background: viewMode === 'ORDERS_LIST' ? '#F0FDFA' : '#FFFFFF',
              color: viewMode === 'ORDERS_LIST' ? '#0F766E' : '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <ShoppingBag size={16} /> My Orders List ({orders.length})
          </button>

          <button
            onClick={() => setViewMode('TRACKING_DETAIL')}
            style={{
              padding: '9px 18px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              border: viewMode === 'TRACKING_DETAIL' ? '1px solid #0F766E' : '1px solid #CBD5E1',
              background: viewMode === 'TRACKING_DETAIL' ? '#F0FDFA' : '#FFFFFF',
              color: viewMode === 'TRACKING_DETAIL' ? '#0F766E' : '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <FileCheck size={16} /> Unified Tracking View
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          VIEW 1: MY ORDERS & ORDER HISTORY LIST (BUYER FILTERABLE)
         ───────────────────────────────────────────────────────────────── */}
      {viewMode === 'ORDERS_LIST' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Search & Filter Toolbar */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              
              {/* Filter Tabs */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'ACTIVE', label: 'In Progress' },
                  { id: 'IN_PRODUCTION', label: 'In Production' },
                  { id: 'READY_TO_DISPATCH', label: 'Ready To Dispatch' },
                  { id: 'IN_TRANSIT', label: 'In Transit' },
                  { id: 'DELIVERED', label: 'Delivered' },
                  { id: 'PENDING_RECEIPT', label: 'Pending Goods Receipt' },
                  { id: 'GOODS_RECEIVED', label: 'Goods Received' },
                  { id: 'CLOSED', label: 'Completed' },
                ].map(tab => {
                  const active = statusFilter === tab.id;
                  const count = filterCounts[tab.id] || 0;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setStatusFilter(tab.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: active ? 800 : 600,
                        cursor: 'pointer',
                        border: active ? '1px solid #0F766E' : '1px solid #E2E8F0',
                        background: active ? '#F0FDFA' : '#F8FAFC',
                        color: active ? '#0F766E' : '#64748B',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <span>{tab.label}</span>
                      <span style={{ fontSize: 10.5, fontWeight: 800, padding: '1px 6px', borderRadius: 10, background: active ? '#0F766E' : '#E2E8F0', color: active ? '#FFFFFF' : '#475569' }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', width: 280 }}>
                <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Search order #, product, mfg..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '7px 12px 7px 32px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5 }}
                />
              </div>
            </div>
          </div>

          {/* Orders Cards Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filteredOrders.length === 0 ? (
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 32, textAlign: 'center', color: '#64748B' }}>
                <AlertCircle size={28} style={{ color: '#94A3B8', marginBottom: 8 }} />
                <div style={{ fontSize: 14, fontWeight: 700 }}>No orders match your filter criteria.</div>
              </div>
            ) : (
              filteredOrders.map(ord => {
                const calculatedStatus = getMasterOrderStatus(ord);
                const badge = getStatusBadgeStyle(calculatedStatus);
                const StatusIcon = badge.icon;
                const isSelected = activeMasterOrder?.id === ord.id;

                return (
                  <div
                    key={ord.id}
                    style={{
                      background: '#FFFFFF',
                      border: `1px solid ${isSelected ? '#99F6E4' : '#E2E8F0'}`,
                      borderRadius: 12,
                      padding: 20,
                      boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Header Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 16, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                            {ord.orderNumber}
                          </span>
                          <span style={{ fontSize: 11.5, fontWeight: 800, padding: '3px 10px', borderRadius: 6, background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <StatusIcon size={13} /> {calculatedStatus}
                          </span>
                        </div>
                        <div style={{ fontSize: 12.5, color: '#475569', marginTop: 4 }}>
                          Buyer: <strong style={{ color: '#0F172A' }}>{ord.customerName}</strong> · Order Date: <strong>{ord.createdDate}</strong> · Expected Delivery: <strong>{ord.expectedDeliveryDate}</strong>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Order Value</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                          ₹{ord.totalAmount.toLocaleString()}
                        </div>
                      </div>
                    </div>

                                        {/* Sub-Orders Breakdown Summary Row */}
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                      <div style={{ fontSize: 12, color: '#334155', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                          <div>PO #: <strong style={{ fontFamily: 'monospace', color: '#0F766E' }}>{ord.poNumber || `PO-${ord.orderNumber}`}</strong></div>
                          <div>•</div>
                          <div>Sub-Orders: <strong>{ord.subOrders.length}</strong></div>
                          <div>•</div>
                          <div>Payment Terms: <strong>{ord.paymentTerms || 'Net 30'}</strong></div>
                          <div>•</div>
                          <div>Currency: <strong>{ord.currency || 'INR (₹)'}</strong></div>
                          <div>•</div>
                          <div>Updated: <strong>{ord.updatedDate || ord.createdDate}</strong></div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, fontSize: 11.5, color: '#64748B', flexWrap: 'wrap' }}>
                          <div>Delivery: <span style={{ color: '#334155' }}>{ord.shippingAddress}</span></div>
                          <div>•</div>
                          <div>Billing: <span style={{ color: '#334155' }}>{ord.billingAddress || 'Apex Corporate Office, Barakhamba Road, Connaught Place, New Delhi - 110001'}</span></div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedOrder(ord);
                          setViewMode('TRACKING_DETAIL');
                        }}
                        style={{
                          padding: '8px 18px',
                          borderRadius: 6,
                          background: '#0F766E',
                          color: '#FFFFFF',
                          border: 'none',
                          fontWeight: 800,
                          fontSize: 12.5,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        View Order Details & Tracking →
                      </button>
                    </div>

                    {/* Sub-Order Manufacturer Breakdown Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                      {ord.subOrders.map(sub => {
                        const subCode = sub.subOrderNumber === 'SO-2026-1001-01' ? 'SO-1001-01' : sub.subOrderNumber;
                        const subDetailed = getSubOrderDetailedStatus(sub);
                        const storeRec = subOrdersStore[subCode] || sub;
                        const shpObj = storeRec?.shipment;
                        const poNum = sub.poNumber || `PO-${subCode}`;
                        const prodName = sub.lines?.[0]?.productName || sub.productName || 'Pharmaceutical Product';
                        const totalQty = sub.totalQuantity || sub.lines?.reduce((s: number, l: any) => s + l.quantity, 0) || 10000;
                        const delivQty = shpObj?.goodsReceipt?.receivedQuantity || shpObj?.podDetails?.deliveredQuantity || (shpObj?.shipmentStatus === 'DELIVERED' || shpObj?.shipmentStatus === 'POD_CONFIRMED' || shpObj?.shipmentStatus === 'CLOSED' ? totalQty : 0);

                        return (
                          <div
                            key={sub.id || subCode}
                            onClick={() => {
                              setSelectedOrder(ord);
                              setViewMode('TRACKING_DETAIL');
                            }}
                            style={{
                              background: '#FFF',
                              border: `1px solid ${subDetailed.badgeStyle.border}`,
                              borderRadius: 8,
                              padding: 12,
                              fontSize: 12,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 6,
                              cursor: 'pointer',
                              boxShadow: '0 1px 2px rgba(15,23,42,0.03)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{subCode}</span>
                              <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: subDetailed.badgeStyle.bg, border: `1px solid ${subDetailed.badgeStyle.border}`, color: subDetailed.badgeStyle.color }}>
                                {subDetailed.displayStatus}
                              </span>
                            </div>

                            <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{prodName}</div>
                            
                            <div style={{ color: '#475569', fontSize: 11.5 }}>
                              Manufacturer: <strong style={{ color: '#0F766E' }}>{sub.manufacturerName}</strong>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: 11, borderTop: '1px solid #F1F5F9', paddingTop: 6, marginTop: 2 }}>
                              <div>PO #: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{poNum}</span></div>
                              <div>Qty: <span style={{ fontWeight: 700, color: '#0F172A' }}>{totalQty.toLocaleString()}</span> (Delivered: {delivQty.toLocaleString()})</div>
                            </div>

                            {shpObj?.trackingNumber && (
                              <div style={{ fontSize: 11, color: '#0F766E', fontWeight: 700, fontFamily: 'monospace' }}>
                                Tracking #: {shpObj.trackingNumber}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          VIEW 2: UNIFIED ORDER DETAILS & LIFECYCLE TRACKING
         ───────────────────────────────────────────────────────────────── */}
      {viewMode === 'TRACKING_DETAIL' && activeMasterOrder && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* 1. ORDER SUMMARY CARD */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 22, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <button onClick={() => setViewMode('ORDERS_LIST')} style={{ background: 'none', border: 'none', color: '#0F766E', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                  <ArrowLeft size={14} /> Back to My Orders List
                </button>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Master Order Summary</div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '2px 0 0' }}>{activeMasterOrder.orderNumber}</h2>
                <div style={{ fontSize: 12.5, color: '#475569', marginTop: 4 }}>
                  Consignee Buyer: <strong style={{ color: '#0F172A' }}>{activeMasterOrder.customerName}</strong> | Delivery Address: {activeMasterOrder.shippingAddress}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Order Value</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>₹{activeMasterOrder.totalAmount.toLocaleString()}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Expected Delivery: <strong>{activeMasterOrder.expectedDeliveryDate}</strong></div>
              </div>
            </div>

            {/* Read-Only Status Indicator */}
            <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: '#0F766E' }}>
                <ShieldCheck size={18} /> Overall Master Order Status: <span style={{ color: '#0F172A', textTransform: 'uppercase' }}>{activeMasterStatus}</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#0F766E', fontWeight: 600 }}>
                ✓ Synchronized Real-Time Buyer Telemetry (Read-Only)
              </div>
            </div>
          </div>

          {/* 2. UNIFIED 14-STAGE LIFECYCLE STEPPER */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 22, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Layers size={16} style={{ color: '#0F766E' }} /> UNIFIED END-TO-END ORDER LIFECYCLE TIMELINE
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
              {UNIFIED_TIMELINE_STAGES.map((st, idx) => {
                const isDone = idx <= activeStageIdx;
                const isCurrent = idx === activeStageIdx;
                const isPending = idx > activeStageIdx;

                return (
                  <div
                    key={st.key}
                    style={{
                      background: isCurrent ? '#F0FDFA' : isDone ? '#FFFFFF' : '#F8FAFC',
                      border: isCurrent ? '2px solid #0F766E' : isDone ? '1px solid #86EFAC' : '1px solid #CBD5E1',
                      borderRadius: 8,
                      padding: 10,
                      textAlign: 'center',
                      boxShadow: isCurrent ? '0 2px 8px rgba(15,118,110,0.15)' : 'none',
                      opacity: isPending ? 0.65 : 1
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 800, color: isCurrent ? '#0F766E' : isDone ? '#16A34A' : '#94A3B8' }}>
                      {isDone ? '✓' : `🔒 STEP ${idx + 1}`}
                    </div>
                    <div style={{ fontSize: 11.5, fontWeight: isCurrent || isDone ? 800 : 600, color: isCurrent ? '#0F766E' : isDone ? '#0F172A' : '#64748B', marginTop: 4, lineHeight: 1.3 }}>
                      {st.label}
                    </div>
                    {isCurrent && (
                      <div style={{ fontSize: 9.5, fontWeight: 800, background: '#0F766E', color: '#FFF', padding: '1px 6px', borderRadius: 4, marginTop: 6, display: 'inline-block' }}>
                        CURRENT STAGE
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. MANUFACTURER SUB-ORDERS BREAKDOWN */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 22 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 16 }}>
              Manufacturer Sub-Orders Breakdown ({activeMasterOrder.subOrders.length} Allocated Units)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {activeMasterOrder.subOrders.map(sub => {
                const subCode = sub.subOrderNumber === 'SO-2026-1001-01' ? 'SO-1001-01' : sub.subOrderNumber;
                const storeRec = subOrdersStore[subCode] || null;
                const prodStatus = storeRec?.productionStatus || 'PO_ACCEPTED';
                const shpObj = storeRec?.shipment;

                // Find Invoice if generated
                const connectedInvoice: Invoice | undefined = storeRec?.invoice || invoices.find(inv => inv.subOrderNumber === subCode);

                return (
                  <div key={sub.id} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 2px 4px rgba(15,23,42,0.03)' }}>
                    
                    {/* Sub-Order Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{subCode}</span>
                          <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: '#FEF3C7', color: '#B45309' }}>
                            MANUFACTURING: {prodStatus.replace(/_/g, ' ')}
                          </span>
                          {shpObj && (
                            <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D' }}>
                              LOGISTICS: {shpObj.shipmentStatus.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginTop: 3 }}>
                          Manufacturer: <span style={{ color: '#0F766E' }}>{sub.manufacturerName}</span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>₹{sub.totalAmount.toLocaleString()}</div>
                        <div style={{ fontSize: 11.5, color: '#64748B' }}>Target Delivery: {sub.expectedDeliveryDate}</div>
                      </div>
                    </div>

                    {/* Manufacturing Progress Card */}
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Building2 size={15} /> MANUFACTURING EXECUTION STATUS
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, fontSize: 12 }}>
                        <div>Production Status: <strong style={{ color: '#0F766E' }}>{prodStatus.replace(/_/g, ' ')}</strong></div>
                        <div>Batch Number: <strong style={{ fontFamily: 'monospace' }}>{storeRec?.batchNumber || 'BATCH-2026-8801'}</strong></div>
                        <div>QC Clearance: <strong>{storeRec?.qcInspectionResult === 'PASS' ? 'PASSED ✓' : 'In Progress'}</strong></div>
                        <div>Packaging Status: <strong>{storeRec?.packagingStatus || 'Standard Unit Box'}</strong></div>
                      </div>
                    </div>

                    {/* Logistics Shipment Card (If Dispatched) */}
                    {shpObj ? (
                      <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Truck size={15} /> DISPATCH & SHIPMENT TELEMETRY
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, fontSize: 12 }}>
                          <div>Tracking #: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{shpObj.trackingNumber}</strong></div>
                          <div>Transporter: <strong>{shpObj.transporterName}</strong></div>
                          <div>Vehicle #: <strong style={{ fontFamily: 'monospace' }}>{shpObj.vehicleNumber}</strong></div>
                          <div>Driver: <strong>{shpObj.driverName} ({shpObj.driverPhone})</strong></div>
                          <div>Dispatch Date: <strong>{shpObj.dispatchDate}</strong></div>
                          <div>Logistics Status: <strong style={{ color: '#16A34A' }}>{shpObj.shipmentStatus}</strong></div>
                        </div>

                        {/* POD Document info if available */}
                        {shpObj.podDocName && (
                          <div style={{ marginTop: 6, paddingTop: 8, borderTop: '1px solid #CCFBF1', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              Proof of Delivery: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>✓ {shpObj.podDocName}</strong> (Received by: {shpObj.podReceiverName || 'Stores'})
                            </div>
                            <span style={{ fontSize: 10.5, fontWeight: 800, background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: 4 }}>
                              POD CONFIRMED
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: 11.5, color: '#64748B', background: '#F8FAFC', border: '1px dashed #CBD5E1', padding: 10, borderRadius: 6 }}>
                        Logistics shipment has not been dispatched yet. Order is currently in manufacturing execution.
                      </div>
                    )}

                    {/* GOODS RECEIPT CARD (BUYER PORTAL) */}
                    {shpObj && shpObj.goodsReceipt ? (
                      <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 800, color: '#166534', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Package size={16} /> GOODS RECEIPT CONFIRMATION
                          </span>
                          <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                            ✓ {shpObj.goodsReceipt.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, fontSize: 12 }}>
                          <div>Received Qty: <strong style={{ color: '#166534', fontFamily: 'monospace' }}>{shpObj.goodsReceipt.receivedQuantity.toLocaleString()} Units</strong></div>
                          <div>Missing Qty: <strong style={{ color: shpObj.goodsReceipt.missingQuantity > 0 ? '#DC2626' : '#64748B', fontFamily: 'monospace' }}>{shpObj.goodsReceipt.missingQuantity.toLocaleString()} Units</strong></div>
                          <div>Damaged Qty: <strong style={{ color: shpObj.goodsReceipt.damagedQuantity > 0 ? '#DC2626' : '#64748B', fontFamily: 'monospace' }}>{shpObj.goodsReceipt.damagedQuantity.toLocaleString()} Units</strong></div>
                          <div>Condition: <strong>{shpObj.goodsReceipt.condition}</strong></div>
                          <div>Received Date: <strong>{shpObj.goodsReceipt.receivedDate}</strong></div>
                          <div>Received By: <strong>{shpObj.goodsReceipt.receivedBy}</strong></div>
                        </div>

                        {shpObj.goodsReceipt.receivingRemarks && (
                          <div style={{ fontSize: 12, color: '#166534', background: '#FFFFFF', padding: '6px 10px', borderRadius: 6, border: '1px solid #BBF7D0', marginTop: 2 }}>
                            <strong>Remarks:</strong> {shpObj.goodsReceipt.receivingRemarks}
                          </div>
                        )}

                        {shpObj.goodsReceipt.grnDocumentName && (
                          <div style={{ fontSize: 11.5, color: '#0F766E', fontWeight: 700, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FileText size={14} /> GRN Document: <strong>{shpObj.goodsReceipt.grnDocumentName}</strong>
                          </div>
                        )}
                      </div>
                    ) : shpObj && (shpObj.shipmentStatus === 'DELIVERED' || shpObj.shipmentStatus === 'POD_CONFIRMED' || shpObj.shipmentStatus === 'CLOSED') ? (
                      <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 800, color: '#B45309', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Package size={16} /> GOODS RECEIPT PENDING
                          </div>
                          <div style={{ fontSize: 11.5, color: '#78350F', marginTop: 2 }}>
                            Shipment delivered. Please inspect physical packages and confirm goods received.
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenGoodsReceivedModal(subCode, activeMasterOrder, sub, shpObj)}
                          style={{ padding: '8px 18px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 4px rgba(15,118,110,0.2)' }}
                        >
                          <Package size={15} /> Confirm Goods Received 📦
                        </button>
                      </div>
                    ) : null}

                    {/* Invoice Info Bar (If Generated) */}
                    {connectedInvoice ? (
                      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Receipt size={18} style={{ color: '#1D4ED8' }} />
                          <div>
                            <div style={{ fontSize: 12.5, fontWeight: 800, color: '#1E40AF' }}>
                              Tax Invoice: {connectedInvoice.invoiceNumber}
                            </div>
                            <div style={{ fontSize: 11.5, color: '#3B82F6', marginTop: 1 }}>
                              Amount: <strong>₹{connectedInvoice.totalAmount.toLocaleString()}</strong> · Status: <strong style={{ textTransform: 'uppercase' }}>{connectedInvoice.status}</strong>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => setTargetInvoiceModal(connectedInvoice)}
                            style={{ padding: '6px 14px', borderRadius: 6, background: '#1D4ED8', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                          >
                            <Eye size={14} /> View Invoice
                          </button>
                          <button
                            onClick={() => alert(`Downloading PDF Invoice ${connectedInvoice.invoiceNumber}...`)}
                            style={{ padding: '6px 14px', borderRadius: 6, background: '#FFF', border: '1px solid #BFDBFE', color: '#1D4ED8', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                          >
                            <Download size={14} /> Download PDF
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 11.5, color: '#64748B', background: '#F8FAFC', padding: 8, borderRadius: 6 }}>
                        Manufacturer Invoice: <span style={{ color: '#94A3B8' }}>Invoice will be generated by manufacturer after dispatch/delivery.</span>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          MODAL: VIEW B2B INVOICE (READ-ONLY FOR BUYER)
         ───────────────────────────────────────────────────────────────── */}
      {targetInvoiceModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setTargetInvoiceModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 640, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 26, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Tax Invoice #{targetInvoiceModal.invoiceNumber}</h3>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Manufacturer Commercial B2B Document</div>
              </div>
              <button onClick={() => setTargetInvoiceModal(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontSize: 12.5, background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <div>Master Order #: <strong style={{ fontFamily: 'monospace' }}>{targetInvoiceModal.orderNumber}</strong></div>
              <div>Sub-Order #: <strong style={{ fontFamily: 'monospace' }}>{targetInvoiceModal.subOrderNumber || 'SO-1001-01'}</strong></div>
              <div>Invoice Date: <strong>{targetInvoiceModal.invoiceDate}</strong></div>
              <div>Due Date: <strong>{targetInvoiceModal.dueDate}</strong></div>
              <div>Billed To: <strong>{targetInvoiceModal.customerName}</strong></div>
              <div>Issuer: <strong>{targetInvoiceModal.manufacturerName || 'SunBio LifeSciences Ltd.'}</strong></div>
            </div>

            {/* Line Items Table */}
            <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '8px 12px' }}>Product</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Qty</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Unit Price</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Tax</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {targetInvoiceModal.lines?.map((ln, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{ln.productName}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>{ln.quantity.toLocaleString()}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>₹{ln.unitPrice}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>₹{ln.taxAmount?.toLocaleString() || '0'}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>₹{ln.totalAmount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 12, color: '#64748B' }}>
                Payment Status: <strong style={{ color: targetInvoiceModal.status === 'PAID' ? '#16A34A' : '#D97706', textTransform: 'uppercase' }}>{targetInvoiceModal.status}</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase' }}>Grand Total</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>₹{targetInvoiceModal.totalAmount.toLocaleString()}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10 }}>
              <button type="button" onClick={() => setTargetInvoiceModal(null)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Close</button>
              <button type="button" onClick={() => alert(`Downloading Invoice PDF...`)} style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Download size={15} /> Download Official PDF →
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          MODAL: CONFIRM GOODS RECEIVED (BUYER PORTAL)
         ───────────────────────────────────────────────────────────────── */}
      {goodsReceivedContext && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10020, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setGoodsReceivedContext(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 580, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={20} style={{ color: '#0F766E' }} />
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Confirm Goods Received</h3>
              </div>
              <button onClick={() => setGoodsReceivedContext(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
            </div>

            {/* Read-Only Context Info */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, fontSize: 12.5, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>Master Order: <strong style={{ fontFamily: 'monospace' }}>{goodsReceivedContext.masterOrder.orderNumber}</strong></div>
              <div>Sub-Order: <strong style={{ fontFamily: 'monospace' }}>{goodsReceivedContext.subCode}</strong></div>
              <div>PO Number: <strong style={{ fontFamily: 'monospace' }}>{goodsReceivedContext.subOrder.poNumber || `PO-${goodsReceivedContext.subCode}`}</strong></div>
              <div>Tracking #: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{goodsReceivedContext.shipment.trackingNumber}</strong></div>
              <div>Manufacturer: <strong>{goodsReceivedContext.subOrder.manufacturerName}</strong></div>
              <div>Ordered Quantity: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{(goodsReceivedContext.subOrder.totalQuantity || 12000).toLocaleString()} Units</strong></div>
            </div>

            {grnFormError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: 10, borderRadius: 6, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={15} /> {grnFormError}
              </div>
            )}

            <form onSubmit={handleConfirmGoodsReceivedSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Received Quantity *</label>
                  <input
                    type="number"
                    value={receivedQtyInput}
                    onChange={e => setReceivedQtyInput(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, fontFamily: 'monospace', fontWeight: 700 }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Received Date *</label>
                  <input
                    type="date"
                    value={receivedDateInput}
                    onChange={e => setReceivedDateInput(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                    required
                  />
                </div>
              </div>

              {/* Calculated Missing Qty Display */}
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: 10, fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  Calculated Missing Quantity: <strong style={{ color: (goodsReceivedContext.subOrder.totalQuantity || 12000) - receivedQtyInput > 0 ? '#DC2626' : '#1D4ED8', fontFamily: 'monospace', fontSize: 13 }}>
                    {Math.max((goodsReceivedContext.subOrder.totalQuantity || 12000) - receivedQtyInput, 0).toLocaleString()} Units
                  </strong>
                </div>
                <div style={{ fontSize: 11, color: '#3B82F6', fontWeight: 700 }}>
                  Status: {receivedQtyInput === (goodsReceivedContext.subOrder.totalQuantity || 12000) && damagedQtyInput === 0 && conditionInput === 'Good / Accepted' ? 'Fully Received' : receivedQtyInput < (goodsReceivedContext.subOrder.totalQuantity || 12000) ? 'Partially Received' : 'Received with Issues'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Physical Package Condition *</label>
                  <select
                    value={conditionInput}
                    onChange={e => setConditionInput(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 600 }}
                  >
                    <option value="Good / Accepted">Good / Accepted</option>
                    <option value="Damaged">Damaged</option>
                    <option value="Short Quantity">Short Quantity</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Damaged Quantity</label>
                  <input
                    type="number"
                    value={damagedQtyInput}
                    onChange={e => setDamagedQtyInput(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, fontFamily: 'monospace', fontWeight: 700 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Warehouse Receiving Remarks {(receivedQtyInput < (goodsReceivedContext.subOrder.totalQuantity || 12000) || conditionInput === 'Damaged' || conditionInput === 'Short Quantity') ? '*' : ''}
                </label>
                <textarea
                  rows={2}
                  value={receivingRemarksInput}
                  onChange={e => setReceivingRemarksInput(e.target.value)}
                  placeholder="Enter carton inspection notes, warehouse verification details, etc..."
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              {/* Upload Receiving Evidence Document (GRN) */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Upload Goods Received Note (GRN) / Delivery Receipt</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <label style={{ padding: '6px 12px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F766E', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Upload size={14} /> Upload Document
                    <input type="file" accept="application/pdf,image/png,image/jpeg,image/jpg" onChange={e => setGrnFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                  </label>
                  {grnFile ? (
                    <div style={{ fontSize: 11.5, color: '#16A34A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText size={14} /> {grnFile.name}
                      <button type="button" onClick={() => setGrnFile(null)} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 2 }}><X size={14} /></button>
                    </div>
                  ) : (
                    <span style={{ fontSize: 11.5, color: '#94A3B8' }}>Supported: PDF, JPG, PNG (Optional)</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10, borderTop: '1px solid #E2E8F0' }}>
                <button type="button" onClick={() => setGoodsReceivedContext(null)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={16} /> Confirm Goods Received →
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
