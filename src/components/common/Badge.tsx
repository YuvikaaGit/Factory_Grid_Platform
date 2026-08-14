import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '', style: customStyle }) => {
  const normalized = status.toUpperCase();

  let dotColor = '#64748B'; // Default slate gray

  if (['ACTIVE', 'APPROVED', 'PASSED', 'VALID', 'PAID', 'DELIVERED', 'COMPLETED', 'PROVISIONED', 'QUALIFIED'].includes(normalized)) {
    dotColor = '#16A34A'; // Minimal success green dot
  } else if (['PENDING', 'SUBMITTED', 'AWAITING', 'CREATED', 'NEW', 'OPEN', 'SCHEDULED'].includes(normalized)) {
    dotColor = '#64748B'; // Slate gray dot
  } else if (['UNDER_REVIEW', 'IN_PROGRESS', 'IN_PRODUCTION', 'PRICING_IN_PROGRESS', 'PARTIAL_PAYMENT', 'DISPATCHED', 'IN_TRANSIT'].includes(normalized)) {
    dotColor = '#2563EB'; // Primary blue dot
  } else if (['REJECTED', 'EXPIRED', 'OVERDUE', 'FAILED', 'DISABLED', 'HIGH'].includes(normalized)) {
    dotColor = '#DC2626'; // Minimal error red dot
  }

  const formattedText = status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase());

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        fontWeight: 600,
        color: '#0F172A',
        background: 'transparent',
        border: 'none',
        padding: 0,
        whiteSpace: 'nowrap',
        ...customStyle,
      }}
    >
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
      <span>{formattedText}</span>
    </span>
  );
};
