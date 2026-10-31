import { DOC_FONT } from './constants';

export const docStyles = {
    page: {
      background: '#ffffff', padding: '26px 22px 24px', borderRadius: '10px',
      boxShadow: '0 1px 8px rgba(15,23,42,0.06)', minHeight: '70vh',
      fontFamily: DOC_FONT, WebkitTextSizeAdjust: '100%', textSizeAdjust: '100%',
    },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid #E2E8F0', gap: '12px' },
    // Matches toName (the customer name, e.g. under "To,") so the business name and
    // customer name render in the same font/size/weight across every document type.
    businessName: { fontSize: '12.5px', fontWeight: '700', color: '#0F172A', margin: 0, lineHeight: 1.4 },
    contactLine: { fontSize: '10px', color: '#64748B', margin: '2px 0 0', lineHeight: 1.4 },
    docTypeLabel: { fontSize: '13px', fontWeight: '700', color: '#0F172A', margin: 0, textTransform: 'uppercase', letterSpacing: '0.6px' },
    docMetaLine: { fontSize: '10.5px', fontWeight: '500', color: '#64748B', margin: '3px 0 0', lineHeight: 1.4 },
    sectionLabel: { fontSize: '10px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px', margin: '0 0 5px', textTransform: 'uppercase' },
    toName: { fontSize: '12.5px', fontWeight: '700', color: '#0F172A', margin: 0, lineHeight: 1.4 },
    addressLine: { fontSize: '10.5px', color: '#64748B', margin: '2px 0 0', lineHeight: 1.4 },
    bodyText: { fontSize: '11px', color: '#475569', lineHeight: 1.55, margin: '0 0 14px' },
    tableWrap: { marginBottom: '14px' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '10.5px', tableLayout: 'fixed' },
    th: { textAlign: 'left', padding: '7px 5px', fontSize: '9.5px', fontWeight: '700', color: '#475569', letterSpacing: '0.4px', textTransform: 'uppercase', borderTop: '1.5px solid #0F172A', borderBottom: '1.5px solid #0F172A' },
    td: { padding: '8px 5px', fontSize: '10.5px', color: '#334155', borderBottom: '1px solid #EEF1F5', verticalAlign: 'top' },
    tdBold: { fontWeight: '600', color: '#0F172A' },
    totalsLabel: { padding: '5px 5px', textAlign: 'right', fontSize: '10.5px', color: '#64748B', fontWeight: '500' },
    totalsValue: { padding: '5px 5px', textAlign: 'right', fontSize: '10.5px', color: '#334155', fontWeight: '600' },
    grandTotalLabel: { padding: '9px 5px', textAlign: 'right', fontSize: '11.5px', fontWeight: '700', color: '#0F172A', letterSpacing: '0.3px' },
    grandTotalValue: { padding: '9px 5px', textAlign: 'right', fontSize: '13.5px', fontWeight: '800', color: '#0F172A' },
    closingText: { fontSize: '10.5px', color: '#64748B', lineHeight: 1.55, margin: '14px 0 26px' },
    signatureLabel: { fontSize: '11.5px', fontWeight: '700', color: '#0F172A', margin: 0 },
    signatureCaption: { fontSize: '9px', color: '#94A3B8', margin: 0, letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: '600' },
  };

  // Shared footer action bar (Duplicate / Edit / Invoice / Status / Delete) used on every
  // document detail screen. Every action — including Delete — shares the same button shape
  // and a fixed-height icon wrapper, so emoji icons and the FiTrash2 svg icon all sit on the
  // exact same baseline instead of Delete appearing to float higher than the rest.
export const docActionBarStyles = {
    bar: { background: '#ffffff', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '10px 0 16px', flexShrink: 0, boxShadow: '0 -4px 10px rgba(0,0,0,0.05)' },
    btn: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: '4px', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 0 },
    iconWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '22px', lineHeight: 1 },
    label: { fontSize: '11px', fontWeight: '600', lineHeight: 1 },
  };

export const quotationModuleStyles = {
  screen: {
    width: '100%', height: '100vh', background: 'linear-gradient(180deg, #F5FBFA 0%, #F0F8F6 45%, #EAF5F2 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden',
  },

  bodyRow: { flex: 1, minHeight: 0, width: '100%', display: 'flex', justifyContent: 'center', overflowY: 'auto' },
  bodyInner: { width: '100%', maxWidth: '460px', display: 'flex', flexDirection: 'column', gap: '22px', padding: '16px 18px 32px', boxSizing: 'border-box' },

  sectionLabel: { fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: '0 0 14px 2px', flexShrink: 0 },

  // ===== Manage section: horizontal row of equal-width tiles (was a vertical column) =====
  manageSection: { width: '100%', boxSizing: 'border-box' },
  manageRow: { display: 'flex', flexDirection: 'row', gap: '12px', width: '100%' },
  manageItemHorizontal: {
    flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
    background: '#ffffff', border: '1px solid #DCEEEA', borderRadius: '18px', cursor: 'pointer',
    padding: '16px 8px', boxSizing: 'border-box', boxShadow: '0 1px 2px rgba(15, 118, 110, 0.05)',
  },
  manageIconCircle: {
    width: '46px', height: '46px', borderRadius: '14px', background: '#E7F5F1',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  manageLabelHorizontal: { fontSize: '12px', fontWeight: '700', color: '#0F172A', letterSpacing: '0.2px', textAlign: 'center' },

  // ===== Discover section: full-width grid below Manage (was a side column) =====
  discoverSection: { width: '100%', boxSizing: 'border-box' },
  discoverGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  discoverTile: {
    background: '#ffffff', border: '1px solid #DCEEEA', borderRadius: '16px',
    padding: '14px 12px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
    alignItems: 'flex-start', gap: '10px', cursor: 'pointer', textAlign: 'left',
    fontFamily: 'inherit', minHeight: '80px', boxShadow: '0 1px 2px rgba(15, 118, 110, 0.05)',
  },
  discoverBadge: {
    width: '36px', height: '36px', borderRadius: '12px', background: 'linear-gradient(145deg, #12786B, #0A3D38)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  // Single-line, auto-shrinking label so short titles (Quotation, Invoice, Receipt) and
  // longer ones (Purchase Order, Proforma Invoice, Delivery Note) render consistently
  // on one line without wrapping. Floor matches the Manage tile label size (12px).
  discoverTitle: {
    fontSize: 'clamp(12px, 3.4vw, 14px)', fontWeight: '700', color: '#0F172A', lineHeight: '1.25',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', display: 'block',
  },
  discoverSubtitle: { fontSize: '10px', fontWeight: '500', color: '#94A3B8', lineHeight: '1.35' },
};

export const quotationSettingsStyles = {
  row: {
    width: '100%', textAlign: 'left', background: '#F1F3F6', border: 'none', borderRadius: '18px',
    padding: '15px 16px', marginBottom: '14px', display: 'flex', alignItems: 'flex-start', gap: '14px',
    cursor: 'pointer', fontFamily: 'inherit', boxSizing: 'border-box',
  },
  rowIcon: { width: '22px', flexShrink: 0, marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' },
  rowLabel: { fontSize: '13.5px', color: '#64748B', fontWeight: '500' },
  rowValue: { fontSize: '17px', color: '#0F172A', fontWeight: '500', lineHeight: '1.3' },
  // Chevron shown on every tappable settings row (e.g. GST Display, Quotation Top/Bottom
  // Message) so users can see at a glance that the row opens a menu of other options,
  // instead of looking like a plain read-only label that gives no hint it's interactive.
  rowChevron: { flexShrink: 0, marginTop: '4px' },
  inputEl: {
    border: 'none', outline: 'none', background: 'transparent', fontSize: '17px', color: '#0F172A',
    fontWeight: '500', padding: 0, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
  },
  textareaEl: {
    border: 'none', outline: 'none', background: 'transparent', fontSize: '15px', color: '#0F172A',
    fontWeight: '500', padding: 0, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
    resize: 'vertical', lineHeight: '1.45',
  },

  // ----- Inline Yes/No toggle-switch row (replaces the old tap-to-open-sheet row for
  // binary Display fields like GST / HSN / Shipping Address / Bank / QR / Signature). -----
  toggleRow: {
    width: '100%', background: '#F1F3F6', border: 'none', borderRadius: '18px',
    padding: '13px 16px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '12px',
    boxSizing: 'border-box',
  },
  toggleRowIcon: { width: '22px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  toggleRowLabel: { flex: 1, minWidth: 0, fontSize: '14px', color: '#0F172A', fontWeight: '600', lineHeight: '1.3' },
  toggleRowRight: { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 },
  toggleRowValueText: { fontSize: '13px', fontWeight: '700', minWidth: '24px', textAlign: 'left' },
  // Switch itself is intentionally compact (42x24) so it never grows past the row it sits in.
  switchTrack: {
    width: '42px', height: '24px', borderRadius: '999px', border: 'none', cursor: 'pointer',
    position: 'relative', padding: 0, flexShrink: 0, transition: 'background-color 0.15s ease',
  },
  switchTrackOn: { background: '#0F766E' },
  switchTrackOff: { background: '#CBD5E1' },
  switchThumb: {
    position: 'absolute', top: '2px', left: '2px', width: '20px', height: '20px', borderRadius: '50%',
    background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'transform 0.15s ease',
  },

  // ----- Inline 3-option segmented control (Default / Custom / Hide) -----
  segmentedWrap: {
    width: '100%', background: '#F1F3F6', borderRadius: '18px', padding: '13px 14px 14px',
    marginBottom: '14px', boxSizing: 'border-box',
  },
  segmentedHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '11px' },
  segmentedControl: {
    display: 'flex', alignItems: 'center', gap: '6px', background: '#E7EAEF', borderRadius: '12px', padding: '4px',
  },
  segmentedBtn: {
    flex: 1, textAlign: 'center', background: 'transparent', border: 'none', borderRadius: '9px',
    padding: '8px 6px', fontSize: '12.5px', fontWeight: '700', color: '#475569', cursor: 'pointer',
    fontFamily: 'inherit', letterSpacing: '0.1px', whiteSpace: 'nowrap',
  },
  segmentedBtnActive: { background: '#0F766E', color: '#ffffff', boxShadow: '0 1px 4px rgba(15,23,42,0.15)' },
};

export const makeQuotationStyles = {
  infoPanel: { background: '#F3F5F9', borderRadius: '16px', padding: '16px 16px 18px', marginBottom: '16px' },
  infoRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' },
  infoLabel: { fontSize: '13px', color: '#334155', fontWeight: '500' },
  infoValue: { fontSize: '17px', fontWeight: '700', color: '#0F172A', marginTop: '4px' },
  otherInfoRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  otherInfoInput: {
    flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '14.5px',
    color: '#0F172A', fontFamily: 'inherit', fontWeight: '500', borderBottom: '1px solid #CBD5E1', padding: '2px 0',
  },

  sectionCard: {
    width: '100%', textAlign: 'left', background: '#F3F5F9', border: 'none', borderRadius: '16px',
    padding: '16px 16px', marginBottom: '14px', cursor: 'pointer', fontFamily: 'inherit', display: 'block',
  },
  sectionCardTopRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  sectionCardLabel: { fontSize: '15.5px', fontWeight: '800', color: '#0F172A', letterSpacing: '0.3px' },
  plusBadge: {
    width: '32px', height: '32px', borderRadius: '50%', background: '#0F766E',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  sectionCardBody: { marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' },
  sectionCardLine: { fontSize: '14px', fontWeight: '600', color: '#1E293B' },
  sectionCardSubLine: { fontSize: '12.5px', fontWeight: '500', color: '#64748B', margin: 0 },
  lineRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  lineRowRight: { display: 'flex', alignItems: 'center', gap: '10px' },
  removeX: { fontSize: '17px', color: '#94A3B8', cursor: 'pointer', lineHeight: 1, padding: '0 2px' },
  // Standardized Remove icon button for the Quotation Module - matches the Remove icon
  // and styling used in the Attendance Module for the Project Name field (plain FiTrash2
  // icon, no background badge, consistent red color and size). Use this everywhere a
  // Remove action appears within the Quotation Module so it never renders as a black
  // icon or an "X" cross.
  removeIconBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '28px', height: '28px', padding: 0, background: 'transparent',
    border: 'none', cursor: 'pointer', flexShrink: 0,
  },
  // Small pencil indicator shown on rows/cards that are tappable to edit (product lines,
  // other charges, terms). Purely a visual cue - the row itself already carries the click
  // handler, this icon does not need its own onClick.
  editIconBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '28px', height: '28px', padding: 0, background: 'transparent',
    border: 'none', cursor: 'pointer', flexShrink: 0,
  },

  bottomBar: {
    position: 'fixed', left: '18px', right: '18px', bottom: '18px', maxWidth: '424px', margin: '0 auto',
    background: '#0F766E', borderRadius: '30px', padding: '12px 12px 12px 22px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 10px 24px rgba(15,23,42,0.3)',
  },
  bottomBarLabel: { fontSize: '12px', color: '#CBD5E1', fontWeight: '500' },
  bottomBarAmount: { fontSize: '19px', color: '#ffffff', fontWeight: '700', marginTop: '2px' },
  generateBtn: {
    background: '#ffffff', border: 'none', borderRadius: '24px', padding: '14px 30px',
    fontSize: '15px', fontWeight: '700', color: '#0F172A', cursor: 'pointer',
  },
};
