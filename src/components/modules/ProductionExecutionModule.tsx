import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Factory, Cpu, ShieldCheck, CheckCircle2, Clock, Package,
  AlertTriangle, FileText, ChevronRight, X, Play,
  CheckSquare, Square, Download, Thermometer, Layers,
  Calendar, User, Check, RefreshCw, ArrowRight, ArrowLeft, Truck
} from 'lucide-react';

interface ProductionExecutionModuleProps {
  onNavigateTab?: (tabId: string) => void;
}

export type ProductionStage =
  | 'PO_ACCEPTED'
  | 'SCHEDULED'
  | 'IN_PRODUCTION'
  | 'QUALITY_INSPECTION'
  | 'QUALITY_HOLD'
  | 'PACKAGING'
  | 'READY_TO_DISPATCH';

export const UNIFIED_STORAGE_KEY = 'factorygrid_unified_suborders_v11';

// Safe Number Formatter
export const formatNumber = (val: number | undefined | null, fallback = '0'): string => {
  if (val == null || isNaN(val)) return fallback;
  return val.toLocaleString();
};

export const ProductionExecutionModule: React.FC<ProductionExecutionModuleProps> = ({ onNavigateTab }) => {
  const { manufacturers, addAuditLog, setActiveTab, orders } = useApp();

  const myMfg = (manufacturers && manufacturers[0]) || null;
  const myMfgName = myMfg?.companyName || myMfg?.name || 'SunBio LifeSciences Ltd.';

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
                manufacturerName: so.manufacturerName || myMfgName,
                productName: so.lines?.[0]?.productName || 'Pharmaceutical Product',
                totalQuantity: so.lines?.reduce((sum: number, l: any) => sum + l.quantity, 0) || 10000,
                orderValue: so.totalAmount || 150000,
                requiredDeliveryDate: mo.expectedDeliveryDate || '2026-09-02',
                leadTimeDays: 14,
                productionStatus: 'PO_ACCEPTED',
                batchNumber: `BATCH-2026-${Math.floor(1000 + Math.random() * 8999)}`,
                manufacturingLine: 'Line A - Solid Oral Dosages',
                plannedStartDate: new Date().toISOString().split('T')[0],
                expectedCompletionDate: '2026-09-01',
                progressPercent: 0,
                rawMaterialIssued: false,
                manufacturingStarted: false,
                shipment: null,
                invoice: null
              };
            }
          });
        }
      });
    }

    return store;
  };

  const getInitialStore = () => {
    try {
      const saved = localStorage.getItem(UNIFIED_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : {};
      return syncSubOrdersWithContext(parsed);
    } catch (e) {
      console.error('Failed to parse unified suborders store', e);
      return syncSubOrdersWithContext({});
    }
  };

  const [subOrdersState, setSubOrdersState] = useState<Record<string, any>>(getInitialStore);

  const [selectedOrderCode, setSelectedOrderCode] = useState<string>(() => {
    try {
      const target = localStorage.getItem('factorygrid_target_suborder');
      if (target) return target;
    } catch (e) {}
    const keys = Object.keys(getInitialStore());
    return keys[keys.length - 1] || 'SO-1001-01';
  });

  // Synchronize state automatically on window focus & storage update
  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const saved = localStorage.getItem(UNIFIED_STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : {};
        const merged = syncSubOrdersWithContext(parsed);
        setSubOrdersState(merged);

        const target = localStorage.getItem('factorygrid_target_suborder');
        if (target && merged[target]) {
          setSelectedOrderCode(target);
        } else if (!merged[selectedOrderCode]) {
          const keys = Object.keys(merged);
          if (keys.length > 0) setSelectedOrderCode(keys[keys.length - 1]);
        }
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

  // Persist State Changes
  useEffect(() => {
    try {
      localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(subOrdersState));
    } catch (e) {
      console.error('Failed to save suborders store', e);
    }
  }, [subOrdersState]);

  // Robust Sub-Order Record Resolution (NEVER fall back to old completed state for a new order)
  const activeOrder = subOrdersState[selectedOrderCode] || {
    subOrderNumber: selectedOrderCode,
    poNumber: `PO-${selectedOrderCode}`,
    masterOrderNumber: 'MO-2026-1002',
    customerName: 'B2B Client Partner',
    manufacturerName: myMfgName,
    productName: 'Pharmaceutical Products',
    totalQuantity: 10000,
    orderValue: 150000,
    requiredDeliveryDate: '2026-09-02',
    leadTimeDays: 14,

    // FRESH PRODUCTION WORKFLOW — PO_ACCEPTED
    productionStatus: 'PO_ACCEPTED',
    batchNumber: `BATCH-2026-${Math.floor(1000 + Math.random() * 8999)}`,
    manufacturingLine: 'Line A - Solid Oral Dosages',
    progressPercent: 0,
    rawMaterialIssued: false,
    manufacturingStarted: false,
    shipment: null,
    invoice: null
  };

  // Modal Control States
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [showQcModal, setShowQcModal] = useState<boolean>(false);
  const [showPackagingModal, setShowPackagingModal] = useState<boolean>(false);

  // Form States for Modals
  const [schedLine, setSchedLine] = useState(activeOrder.manufacturingLine || 'Line A - Solid Oral Dosages');
  const [schedBatch, setSchedBatch] = useState(activeOrder.batchNumber || 'BATCH-2026-8801');
  const [schedStartDate, setSchedStartDate] = useState(activeOrder.plannedStartDate || '2026-08-16');
  const [schedFinishDate, setSchedFinishDate] = useState(activeOrder.expectedCompletionDate || '2026-08-28');

  // QC Form States
  const [qcTestedQty, setQcTestedQty] = useState(activeOrder.totalQuantity || 12000);
  const [qcPassedQty, setQcPassedQty] = useState(activeOrder.totalQuantity || 12000);
  const [qcFailedQty, setQcFailedQty] = useState(0);
  const [qcRemarksText, setQcRemarksText] = useState('Assay 99.8%, Dissolution compliant with IP specifications. COA attached.');

  // Packaging Form States
  const [packSize, setPackSize] = useState('10x10 Alu-Alu Blister Strip');
  const [masterCartons, setMasterCartons] = useState(120);



  // Synchronous Store Saver & Storage Event Dispatcher
  const saveAndSyncStore = (newStore: Record<string, any>) => {
    try {
      localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(newStore));
    } catch (e) {
      console.error('Failed to write suborders store to localStorage', e);
    }
    setSubOrdersState(newStore);
    try {
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Failed to dispatch storage event', e);
    }
  };

  // Step 1 -> Step 2: SCHEDULE PRODUCTION
  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...activeOrder,
      productionStatus: 'SCHEDULED',
      manufacturingLine: schedLine,
      batchNumber: schedBatch,
      plannedStartDate: schedStartDate,
      expectedCompletionDate: schedFinishDate
    };

    const newStore = { ...subOrdersState, [selectedOrderCode]: updated };
    saveAndSyncStore(newStore);
    setShowScheduleModal(false);
    addAuditLog('Production Engine', `Scheduled Production for ${selectedOrderCode}. Batch: ${schedBatch}`);
    alert(`✔ Production Scheduled!\n\nManufacturing Stage: SCHEDULED\nBatch #: ${schedBatch}`);
  };

  // Step 2 -> Step 3: START PRODUCTION
  const handleStartProduction = () => {
    const updated = {
      ...activeOrder,
      productionStatus: 'IN_PRODUCTION',
      progressPercent: 35,
      rawMaterialIssued: true,
      manufacturingStarted: true
    };
    const newStore = { ...subOrdersState, [selectedOrderCode]: updated };
    saveAndSyncStore(newStore);
    addAuditLog('Production Engine', `Started Manufacturing Execution for ${selectedOrderCode}`);
    alert(`✔ Manufacturing Started!\n\nManufacturing Stage: IN PRODUCTION`);
  };

  // Step 3 -> Step 4: COMPLETE PRODUCTION RUN
  const handleCompleteProduction = () => {
    const updated = {
      ...activeOrder,
      productionStatus: 'QUALITY_INSPECTION',
      progressPercent: 100
    };
    const newStore = { ...subOrdersState, [selectedOrderCode]: updated };
    saveAndSyncStore(newStore);
    addAuditLog('Production Engine', `Completed Manufacturing Run for ${selectedOrderCode}`);
    alert(`✔ Manufacturing Run Complete!\n\nManufacturing Stage: QUALITY INSPECTION`);
  };

  // Step 4 -> Step 5 or QUALITY HOLD: QC INSPECTION
  const handleQcSubmit = (e: React.FormEvent, result: 'PASS' | 'HOLD') => {
    e.preventDefault();
    if (result === 'PASS') {
      if (qcPassedQty + qcFailedQty !== qcTestedQty) {
        alert(`⚠ QC Validation Error!\n\nPassed Quantity (${qcPassedQty.toLocaleString()}) + Failed Quantity (${qcFailedQty.toLocaleString()}) must equal Tested Quantity (${qcTestedQty.toLocaleString()}).`);
        return;
      }

      const updated = {
        ...activeOrder,
        productionStatus: 'PACKAGING',
        qcInspectionResult: 'PASS',
        qcTestedQuantity: qcTestedQty,
        qcPassedQuantity: qcPassedQty,
        qcFailedQuantity: qcFailedQty,
        qcRemarks: qcRemarksText
      };
      const newStore = { ...subOrdersState, [selectedOrderCode]: updated };
      saveAndSyncStore(newStore);
      setShowQcModal(false);
      addAuditLog('QC Laboratory', `QC Passed for ${selectedOrderCode}`);
      alert(`✔ QC Assay Inspection PASSED!\n\nManufacturing Stage: PACKAGING`);
    } else {
      const updated = {
        ...activeOrder,
        productionStatus: 'QUALITY_HOLD',
        qcInspectionResult: 'HOLD',
        qcRemarks: qcRemarksText
      };
      const newStore = { ...subOrdersState, [selectedOrderCode]: updated };
      saveAndSyncStore(newStore);
      setShowQcModal(false);
      addAuditLog('QC Laboratory', `QC Placed on HOLD for ${selectedOrderCode}`);
      alert(`⚠ QC Placed on HOLD!\n\nShipment creation is blocked until QC issue is resolved.`);
    }
  };

  // Step 5 -> Step 6: COMPLETE PACKAGING -> READY_TO_DISPATCH
  const handlePackagingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...activeOrder,
      productionStatus: 'READY_TO_DISPATCH',
      packagingPackSize: packSize,
      packagingMasterCartons: masterCartons
    };
    const newStore = { ...subOrdersState, [selectedOrderCode]: updated };
    saveAndSyncStore(newStore);
    setShowPackagingModal(false);
    addAuditLog('Packaging Desk', `Packaging Completed for ${selectedOrderCode}`);
    alert(`✔ Packaging Completed!\n\nManufacturing Stage: READY TO DISPATCH\n\nShipment creation is now available in Dispatch & Tracking.`);
  };

  // Switch tab to Dispatch & Tracking
  const handleGoToDispatch = () => {
    try {
      localStorage.setItem('factorygrid_target_suborder', activeOrder.subOrderNumber);
    } catch (e) { console.error(e); }

    if (onNavigateTab) {
      onNavigateTab('shipments');
    } else if (setActiveTab) {
      setActiveTab('shipments');
    } else {
      alert(`Navigating to Dispatch & Tracking for Sub-Order ${activeOrder.subOrderNumber}...`);
    }
  };

  // Sequential Step Index Calculator (Strictly 6 Production Stages)
  const getManufacturingStepIndex = (stage: ProductionStage) => {
    switch (stage) {
      case 'PO_ACCEPTED': return 1;
      case 'SCHEDULED': return 2;
      case 'IN_PRODUCTION': return 3;
      case 'QUALITY_INSPECTION': return 4;
      case 'QUALITY_HOLD': return 4;
      case 'PACKAGING': return 5;
      case 'READY_TO_DISPATCH': return 6;
      default: return 1;
    }
  };

  const currentMfgStep = getManufacturingStepIndex(activeOrder.productionStatus || 'PO_ACCEPTED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC', color: '#0F172A' }}>

      {/* Command Header */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', marginBottom: 4 }}>
            <span>FactoryGrid</span>
            <span>/</span>
            <span>Supplier</span>
            <span>/</span>
            <span style={{ fontWeight: 700, color: '#0F172A' }}>Production Planning</span>
          </div>
          <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            PRODUCTION PLANNING & MANUFACTURING EXECUTION
          </h1>
          <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
            Dedicated manufacturing control for <strong style={{ color: '#0F766E' }}>{myMfgName}</strong> (Manufacturing ends at Ready To Dispatch)
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select
            value={selectedOrderCode}
            onChange={e => setSelectedOrderCode(e.target.value)}
            style={{ padding: '8px 12px', fontSize: 13, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F766E', fontWeight: 800, fontFamily: 'monospace', cursor: 'pointer' }}
          >
            {Object.values(subOrdersState).map((ord: any) => (
              <option key={ord.subOrderNumber} value={ord.subOrderNumber}>
                {ord.subOrderNumber} ({ord.customerName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Visual Boundary Banner */}
      <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 10, padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Factory size={18} style={{ color: '#0F766E' }} />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0F766E' }}>
            MANUFACTURING BOUNDARY: Production Planning controls execution up to READY TO DISPATCH. Logistics & shipment dispatch is managed in Dispatch & Tracking.
          </span>
        </div>
        {activeOrder.productionStatus === 'READY_TO_DISPATCH' && (
          <button
            onClick={handleGoToDispatch}
            style={{ padding: '6px 14px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            Open Dispatch & Tracking →
          </button>
        )}
      </div>

      {/* Sub-Order Header Info Card */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Sub-Order Code</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 2 }}>{activeOrder.subOrderNumber}</div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>PO Ref: {activeOrder.poNumber}</div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Customer</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{activeOrder.customerName}</div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>Master Order: {activeOrder.masterOrderNumber}</div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Quantity</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 2 }}>
            {formatNumber(activeOrder.totalQuantity)} Units
          </div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>Value: ₹{formatNumber(activeOrder.orderValue)}</div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Required Delivery</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#1D4ED8', marginTop: 2 }}>{activeOrder.requiredDeliveryDate || '2026-09-02'}</div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>Lead Time: {activeOrder.leadTimeDays || 14} Days</div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Current Stage</div>
          <span style={{ display: 'inline-block', marginTop: 4, padding: '4px 10px', borderRadius: 4, fontSize: 11.5, fontWeight: 800, background: activeOrder.productionStatus === 'READY_TO_DISPATCH' ? '#DCFCE7' : '#FEF3C7', color: activeOrder.productionStatus === 'READY_TO_DISPATCH' ? '#15803D' : '#B45309', border: '1px solid #CBD5E1' }}>
            {(activeOrder.productionStatus || 'PO_ACCEPTED').replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* MANUFACTURING LIFECYCLE TIMELINE (STRICTLY 6 PRODUCTION STEPS) */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.05em', marginBottom: 14 }}>
          MANUFACTURING EXECUTION LIFECYCLE (6 STAGES)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, fontSize: 11.5 }}>
          {[
            { label: 'PO Accepted', step: 1 },
            { label: 'Scheduled', step: 2 },
            { label: 'In Production', step: 3 },
            { label: 'Quality Inspection', step: 4 },
            { label: 'Packaging', step: 5 },
            { label: 'Ready To Dispatch', step: 6 }
          ].map(st => {
            const isCompleted = currentMfgStep > st.step;
            const isCurrent = currentMfgStep === st.step;
            const isLocked = currentMfgStep < st.step;

            return (
              <div
                key={st.step}
                style={{
                  background: isCurrent ? '#F0FDFA' : isCompleted ? '#F8FAFC' : '#F1F5F9',
                  border: isCurrent ? '2px solid #0F766E' : isCompleted ? '1px solid #86EFAC' : '1px solid #E2E8F0',
                  borderRadius: 8,
                  padding: 12,
                  opacity: isLocked ? 0.55 : 1
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: isCurrent ? '#0F766E' : isCompleted ? '#16A34A' : '#64748B' }}>STEP 0{st.step}</span>
                  {isCompleted ? (
                    <span style={{ color: '#16A34A', fontWeight: 800 }}>✓</span>
                  ) : isCurrent ? (
                    <span style={{ color: '#0F766E', fontWeight: 800 }}>●</span>
                  ) : (
                    <span style={{ color: '#94A3B8', fontSize: 10 }}>🔒</span>
                  )}
                </div>
                <div style={{ fontWeight: isCurrent || isCompleted ? 800 : 500, color: isCurrent ? '#0F766E' : isCompleted ? '#0F172A' : '#64748B', marginTop: 4 }}>
                  {st.label} {isCurrent ? '[CURRENT]' : isLocked ? '[LOCKED]' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MANUFACTURING ACTION PANEL */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
        
        {/* STAGE 1: PO ACCEPTED -> Schedule Production */}
        {activeOrder.productionStatus === 'PO_ACCEPTED' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Stage 1: Purchase Order Accepted</h3>
              <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0 0' }}>
                Purchase Order {activeOrder.poNumber} has been accepted. Schedule production parameters to proceed.
              </p>
            </div>
            <button
              onClick={() => setShowScheduleModal(true)}
              style={{ padding: '10px 22px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}
            >
              Schedule Production →
            </button>
          </div>
        )}

        {/* STAGE 2: SCHEDULED -> Start Production */}
        {activeOrder.productionStatus === 'SCHEDULED' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Stage 2: Production Scheduled</h3>
                <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0 0' }}>
                  Manufacturing line allocated: <strong>{activeOrder.manufacturingLine}</strong> | Batch: <strong>{activeOrder.batchNumber}</strong>
                </p>
              </div>
              <button
                onClick={handleStartProduction}
                style={{ padding: '10px 22px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}
              >
                Start Production →
              </button>
            </div>
          </div>
        )}

        {/* STAGE 3: IN PRODUCTION -> Complete Production */}
        {activeOrder.productionStatus === 'IN_PRODUCTION' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Stage 3: Manufacturing Execution In Progress</h3>
                <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0 0' }}>
                  Batch {activeOrder.batchNumber} active on {activeOrder.manufacturingLine}.
                </p>
              </div>

              <button
                onClick={handleCompleteProduction}
                style={{ padding: '10px 22px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}
              >
                Complete Production / Send to QC →
              </button>
            </div>
          </div>
        )}

        {/* STAGE 4: QUALITY INSPECTION -> Pass / Hold QC */}
        {(activeOrder.productionStatus === 'QUALITY_INSPECTION' || activeOrder.productionStatus === 'QUALITY_HOLD') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Stage 4: Quality Control & Lab Assay Testing</h3>
                <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0 0' }}>
                  Batch {activeOrder.batchNumber} requires lab assay testing before packaging.
                </p>
              </div>

              <button
                onClick={() => setShowQcModal(true)}
                style={{ padding: '10px 22px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}
              >
                Perform QC Inspection →
              </button>
            </div>

            {activeOrder.productionStatus === 'QUALITY_HOLD' && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: 14, color: '#991B1B', fontSize: 13, fontWeight: 600 }}>
                ⚠ QUALITY HOLD: Batch failed lab assay testing. Production cannot proceed until QC issue is resolved.
              </div>
            )}
          </div>
        )}

        {/* STAGE 5: PACKAGING -> Complete Packaging */}
        {activeOrder.productionStatus === 'PACKAGING' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Stage 5: Secondary Packaging & Labeling</h3>
              <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0 0' }}>
                QC passed. Complete secondary packaging into shipper cartons.
              </p>
            </div>

            <button
              onClick={() => setShowPackagingModal(true)}
              style={{ padding: '10px 22px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}
            >
              Complete Packaging →
            </button>
          </div>
        )}

        {/* STAGE 6: READY TO DISPATCH (READ-ONLY SHIPMENT CONTEXT) */}
        {activeOrder.productionStatus === 'READY_TO_DISPATCH' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#16A34A', textTransform: 'uppercase' }}>PRODUCTION COMPLETED ✓</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '2px 0 0 0' }}>Stage 6: Ready To Dispatch</h3>
                <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0 0' }}>
                  Manufacturing, Quality Control, and Packaging are 100% completed. Sub-Order is eligible for shipment creation in Dispatch & Tracking.
                </p>
              </div>

              <button
                onClick={handleGoToDispatch}
                style={{ padding: '12px 24px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(15,118,110,0.2)' }}
              >
                <Truck size={18} /> Go to Dispatch & Tracking →
              </button>
            </div>

            {/* Manufacturing Completion Summary Box */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 10, padding: 18, fontSize: 13, color: '#0F766E' }}>
              <div>Batch #: <strong style={{ fontFamily: 'monospace' }}>{activeOrder.batchNumber || 'BATCH-2026-8801'}</strong></div>
              <div>Quantity: <strong>{formatNumber(activeOrder.totalQuantity)} Units</strong></div>
              <div>QC Lab Assay: <strong style={{ color: '#16A34A' }}>PASSED ✓</strong></div>
              <div>Secondary Packaging: <strong>{activeOrder.packagingPackSize || 'Alu-Alu Blister Strip'}</strong></div>
            </div>

            {/* READ-ONLY SHIPMENT STATUS SECTION */}
            {activeOrder.shipment ? (
              <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 10, padding: 20, boxShadow: '0 2px 6px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    LOGISTICS CONTEXT (READ-ONLY INFORMATION)
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 800, padding: '4px 12px', borderRadius: 4, background: activeOrder.shipment.shipmentStatus === 'CLOSED' ? '#DCFCE7' : '#FEF3C7', color: activeOrder.shipment.shipmentStatus === 'CLOSED' ? '#15803D' : '#B45309', border: '1px solid #CBD5E1' }}>
                    LOGISTICS STATUS: {activeOrder.shipment.shipmentStatus.replace(/_/g, ' ')}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, fontSize: 13, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14 }}>
                  <div>Shipment Tracking #: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{activeOrder.shipment.trackingNumber}</strong></div>
                  <div>Logistics Status: <strong style={{ color: '#1D4ED8' }}>{activeOrder.shipment.shipmentStatus.replace(/_/g, ' ')}</strong></div>
                  <div>Transporter: <strong>{activeOrder.shipment.transporterName}</strong></div>
                  <div>Vehicle #: <strong style={{ fontFamily: 'monospace' }}>{activeOrder.shipment.vehicleNumber}</strong></div>
                  <div>Expected Delivery: <strong>{activeOrder.shipment.expectedDeliveryDate}</strong></div>
                </div>

                <div style={{ fontSize: 11, color: '#64748B', fontStyle: 'italic' }}>
                  (Read-Only Logistics Context — Actions such as Mark In Transit, Confirm Delivery, or POD belong exclusively to Dispatch & Tracking)
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 6 }}>
                  <button onClick={handleGoToDispatch} style={{ padding: '8px 18px', borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    Open Dispatch & Tracking →
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#64748B', background: '#F8FAFC', border: '1px dashed #CBD5E1', padding: 14, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Sub-Order is ready for dispatch. Open Dispatch & Tracking to initiate shipment creation.</span>
                <button onClick={handleGoToDispatch} style={{ padding: '6px 14px', borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                  Create Dispatch in Logistics →
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* MODAL 1: SCHEDULE PRODUCTION */}
      {showScheduleModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowScheduleModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Schedule Production Run</h3>
              <button onClick={() => setShowScheduleModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
            </div>

            <form onSubmit={handleScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Manufacturing Line *</label>
                <input type="text" required value={schedLine} onChange={e => setSchedLine(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }} />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Batch Number *</label>
                <input type="text" required value={schedBatch} onChange={e => setSchedBatch(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Start Date *</label>
                  <input type="date" required value={schedStartDate} onChange={e => setSchedStartDate(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Expected Finish Date *</label>
                  <input type="date" required value={schedFinishDate} onChange={e => setSchedFinishDate(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                <button type="button" onClick={() => setShowScheduleModal(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Confirm Schedule →</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: QC INSPECTION FORM */}
      {showQcModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowQcModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 500, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Quality Control Lab Assay</h3>
              <button onClick={() => setShowQcModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
            </div>

            <form onSubmit={e => handleQcSubmit(e, 'PASS')} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Tested Quantity</label>
                <input type="number" value={qcTestedQty} onChange={e => setQcTestedQty(Number(e.target.value))} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Passed Quantity *</label>
                  <input type="number" required value={qcPassedQty} onChange={e => setQcPassedQty(Number(e.target.value))} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Failed Quantity *</label>
                  <input type="number" required value={qcFailedQty} onChange={e => setQcFailedQty(Number(e.target.value))} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>QC Remarks / Lab Assay Notes</label>
                <textarea rows={3} value={qcRemarksText} onChange={e => setQcRemarksText(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, resize: 'none' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                <button type="button" onClick={e => handleQcSubmit(e as any, 'HOLD')} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#991B1B', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Place on QC Hold</button>
                <button type="submit" style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#166534', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Pass QC → Packaging</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PACKAGING FORM */}
      {showPackagingModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowPackagingModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 500, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Secondary Packaging</h3>
              <button onClick={() => setShowPackagingModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
            </div>

            <form onSubmit={handlePackagingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Packaging Pack Size *</label>
                <input type="text" required value={packSize} onChange={e => setPackSize(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }} />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Master Cartons Count</label>
                <input type="number" value={masterCartons} onChange={e => setMasterCartons(Number(e.target.value))} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                <button type="button" onClick={() => setShowPackagingModal(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Complete Packaging →</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
