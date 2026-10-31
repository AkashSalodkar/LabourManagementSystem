export const themeStyles = {
  textInput: { width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', color: '#1E293B', outline: 'none', boxSizing: 'border-box', backgroundColor: '#F8FAFC' },

  authDashboardContainer: { width: '100%', height: '100vh', backgroundColor: '#f4f6f9', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', margin: 0, padding: 0, overflow: 'hidden' },
  authHeader: { backgroundColor: '#0B3C9B', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', height: '52px', boxSizing: 'border-box', flexShrink: 0 },
  profileRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatarBox: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 'bold', fontSize: '12px' },
  welcomeText: { color: '#ffffff', fontSize: '15px', fontWeight: '600', margin: 0 },
  logoutIconBtn: { background: 'rgba(255,255,255,0.15)', border: 'none', color: '#ffffff', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' },

  contentCardBody: { backgroundColor: '#f4f6f9', padding: '16px', borderRadius: '16px 16px 0 0', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  stickyActionZone: { flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '14px' },
  actionAddBtn: { width: '100%', backgroundColor: '#0B3C9B', color: '#ffffff', border: 'none', padding: '13px', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 10px rgba(11, 60, 155, 0.22)' },

  searchBarContainer: { position: 'relative' },
  searchField: { width: '100%', padding: '12px 14px 12px 40px', backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', color: '#1E293B' },
  searchIconMarker: { position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '14px' },
  projectDropdown: { padding: '0 10px', backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '13px', outline: 'none', color: '#1E293B', maxWidth: '130px' },
  matchedDropdown: { padding: '12px 14px', backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', outline: 'none', color: '#1E293B', boxSizing: 'border-box', minWidth: '130px', flexShrink: 0 },
  sortSelect: { padding: '6px 8px', backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '12px', outline: 'none', color: '#475569', fontWeight: '600', cursor: 'pointer' },

  sectionMetaRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexShrink: 0 },
  sectionLabel: { fontSize: '16px', fontWeight: '700', color: '#1E293B', margin: 0 },
  seeAllActionLink: { fontSize: '13px', fontWeight: '600', color: '#0B3C9B', cursor: 'pointer' },
  projectsScrollArea: { flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: '72px' },
  worksiteCard: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '14px', border: '1px solid #F1F5F9' },
  cardHeadingRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' },
  siteIconWrapper: { width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#475569' },
  siteTitle: { fontSize: '15px', fontWeight: '700', color: '#1E293B', margin: 0, flex: 1 },
  arrowNavIndicator: { color: '#94A3B8', fontSize: '14px' },
  metricsGridRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '8px', marginBottom: '6px' },
  metricCell: { display: 'flex', flexDirection: 'column', gap: '2px' },
  metricValue: { fontSize: '16px', fontWeight: '700', color: '#1E293B', margin: 0, lineHeight: '1.2' },
  metricValueDue: { fontSize: '16px', fontWeight: '700', color: '#DC2626', margin: 0, lineHeight: '1.2' },
  metricLabelText: { fontSize: '11px', color: '#94A3B8', fontWeight: '500', lineHeight: '1.2' },
  // Single-horizontal-line metrics row (Employees | Paid | Due | Bonus) used on the
  // Projects list cards so all metrics stay on one line even on narrow mobile screens.
  metricsRowLine: { display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', flexWrap: 'nowrap', gap: '4px', marginBottom: '6px' },
  metricCellFlat: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: '1 1 0' },
  metricDividerLine: { width: '1px', flexShrink: 0, backgroundColor: '#E2E8F0', alignSelf: 'stretch', marginTop: '2px', marginBottom: '2px' },
  metricValueFlat: { fontSize: '14px', fontWeight: '700', color: '#1E293B', margin: 0, lineHeight: '1.2', whiteSpace: 'nowrap' },
  metricValueDueFlat: { fontSize: '14px', fontWeight: '700', color: '#DC2626', margin: 0, lineHeight: '1.2', whiteSpace: 'nowrap' },
  metricLabelTextFlat: { fontSize: '10px', color: '#94A3B8', fontWeight: '500', lineHeight: '1.2', whiteSpace: 'nowrap' },
  payoutTrackLine: { width: '100%', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden', marginBottom: '6px' },
  payoutProgressValueBar: { height: '100%', backgroundColor: '#0EA5E9', borderRadius: '3px' },
  payoutMetaRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  payoutLabel: { fontSize: '11px', color: '#94A3B8', fontWeight: '500' },
  payoutPercentageText: { fontSize: '11px', color: '#475569', fontWeight: '600' },
  bottomDockNavBar: { position: 'fixed', bottom: 0, left: 0, width: '100%', height: '64px', backgroundColor: '#ffffff', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-around', alignItems: 'center', boxSizing: 'border-box', zIndex: 1600 },
  // Unselected tabs keep their normal, full-color look (no greying out) — they
  // just sit on a transparent background. The selected tab gets a light-blue
  // pill behind it so it's clearly the active one, without dulling the rest.
  navItemTab: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', color: '#334155', padding: '6px 14px', borderRadius: '16px', transition: 'background-color 0.15s ease, color 0.15s ease' },
  navItemTabActive: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', background: '#DBEAFE', border: 'none', cursor: 'pointer', color: '#0B3C9B', padding: '6px 14px', borderRadius: '16px', transition: 'background-color 0.15s ease, color 0.15s ease' },
  navTabIcon: { fontSize: '18px' },
  navTabLabel: { fontSize: '10px', fontWeight: '600' }
};

export const businessInfoStyles = {
  screen: { width: '100%', minHeight: '100vh', background: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  header: {
    background: '#0F766E', padding: '14px 14px', display: 'flex', alignItems: 'center', gap: '10px',
    position: 'sticky', top: 0, zIndex: 20,
  },
  headerIconBtn: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: '4px' },
  headerTitle: { flex: 1, color: '#ffffff', fontSize: '17px', fontWeight: '700', margin: 0, textAlign: 'center' },

  body: { padding: '22px 18px 32px', maxWidth: '460px', margin: '0 auto', boxSizing: 'border-box' },

  brandRow: { display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '26px' },
  brandTile: {
    position: 'relative', width: '128px', height: '128px', borderRadius: '20px',
    background: 'linear-gradient(160deg, #12786B, #0A3D38)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
  },
  brandTileText: { color: '#ffffff', fontWeight: '800', fontSize: '15px', textAlign: 'center', lineHeight: '1.3', letterSpacing: '0.3px' },
  brandTileImg: { width: '100%', height: '100%', objectFit: 'cover' },
  brandEditBadge: {
    position: 'absolute', top: '-8px', right: '-8px', width: '30px', height: '30px', borderRadius: '50%',
    background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.25)', border: '2px solid #0A3D38', padding: 0, margin: 0, cursor: 'pointer',
  },

  fieldBox: {
    background: '#F1F3F6', borderRadius: '16px', padding: '10px 16px 12px', marginBottom: '12px',
    display: 'flex', flexDirection: 'column', gap: '2px',
  },
  fieldLabel: { fontSize: '12px', color: '#64748B', fontWeight: '600' },
  fieldInputEl: {
    border: 'none', outline: 'none', background: 'transparent', fontSize: '16px', color: '#0F172A',
    fontWeight: '600', padding: '2px 0 0', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
  },

  selectRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' },
  selectInput: {
    border: 'none', outline: 'none', background: 'transparent', fontSize: '16px', color: '#0F172A',
    fontWeight: '600', padding: '2px 0 0', fontFamily: 'inherit', flex: 1, appearance: 'none', WebkitAppearance: 'none',
  },

  sectionBar: {
    background: '#DDE1E7', color: '#0F172A', fontWeight: '700', fontSize: '14.5px',
    borderRadius: '14px', padding: '13px 16px', margin: '18px 0 12px',
  },

  bankCard: {
    width: '100%', textAlign: 'left', background: '#F1F3F6', border: 'none', borderRadius: '16px',
    padding: '12px 16px 14px', marginBottom: '12px', display: 'flex', flexDirection: 'column',
    gap: '3px', fontFamily: 'inherit', boxSizing: 'border-box',
  },
  bankCardHeaderRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' },
  bankCardLabelBtn: {
    background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer', textAlign: 'left',
    fontFamily: 'inherit', flex: 1,
  },
  bankShareIconBtn: {
    background: '#E7F2F0', border: 'none', borderRadius: '50%', width: '30px', height: '30px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0,
  },
  bankCardBodyBtn: {
    width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: 0, margin: 0,
    cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '3px', fontFamily: 'inherit',
  },
  bankLine: { fontSize: '14.5px', color: '#1E293B', fontWeight: '600' },

  helperText: { fontSize: '12px', color: '#94A3B8', lineHeight: '1.5', margin: '-4px 2px 20px' },

  updateBtn: {
    width: '100%', height: '52px', borderRadius: '16px', border: 'none', background: '#0F766E',
    color: '#ffffff', fontSize: '15.5px', fontWeight: '700', letterSpacing: '1px', cursor: 'pointer',
  },

  // Reset + Update side-by-side row used on every document Settings screen. Reset is a
  // secondary/outlined button (left, less visual weight) and Update stays the filled
  // primary action (right) - same row, split roughly 40/60 so Update stays the clear
  // primary tap target on mobile.
  settingsFooterRow: { display: 'flex', gap: '12px', marginTop: '4px' },
  resetBtn: {
    flex: '0.8', height: '52px', borderRadius: '16px', border: '1.5px solid #CBD5E1', background: '#ffffff',
    color: '#334155', fontSize: '15px', fontWeight: '700', letterSpacing: '0.5px', cursor: 'pointer', fontFamily: 'inherit',
  },
  updateBtnHalf: {
    flex: '1', height: '52px', borderRadius: '16px', border: 'none', background: '#0F766E',
    color: '#ffffff', fontSize: '15px', fontWeight: '700', letterSpacing: '0.5px', cursor: 'pointer',
  },

  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px', boxSizing: 'border-box',
  },
  modalCard: { background: '#ffffff', width: '100%', maxWidth: '400px', borderRadius: '20px', padding: '20px', boxSizing: 'border-box' },
  modalHeaderRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' },
  modalTitle: { fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: 0 },
  modalCloseBtn: { background: 'none', border: 'none', fontSize: '22px', color: '#94A3B8', cursor: 'pointer', lineHeight: 1, padding: 0 },
  modalSaveBtn: { width: '100%', height: '46px', borderRadius: '14px', border: 'none', background: '#0F766E', color: '#ffffff', fontSize: '14.5px', fontWeight: '700', cursor: 'pointer', marginTop: '4px' },

  sheetActionRow: {
    display: 'flex', alignItems: 'center', gap: '14px', width: '100%', textAlign: 'left',
    background: 'none', border: 'none', borderBottom: '1px solid #F1F5F9', padding: '15px 4px',
    fontSize: '15px', fontWeight: '600', color: '#0F172A', cursor: 'pointer', fontFamily: 'inherit',
  },
};

export const customerModuleStyles = {
  screen: { width: '100%', minHeight: '100vh', background: '#F3F5F9', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },

  header: {
    background: '#0F766E', padding: '14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
    position: 'sticky', top: 0, zIndex: 20,
  },
  headerIconBtn: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: '4px', width: '27px' },
  headerTitle: { flex: 1, color: '#ffffff', fontSize: '19px', fontWeight: '700', margin: 0, textAlign: 'center' },

  // Filter / Sort dropdown menu (Newest to Oldest / Oldest to Newest)
  sortMenu: {
    position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#ffffff', borderRadius: '14px',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.18)', padding: '8px', minWidth: '200px', zIndex: 100,
  },
  sortMenuItem: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
    background: 'none', border: 'none', borderRadius: '10px', padding: '11px 12px', cursor: 'pointer',
    fontFamily: 'inherit', textAlign: 'left',
  },
  sortMenuItemLabel: { fontSize: '14px', fontWeight: '500', color: '#334155' },
  sortMenuItemLabelActive: { fontSize: '14px', fontWeight: '700', color: '#0F766E' },

  // Document list card (Quotation, Invoice, Purchase Order, Proforma Invoice,
  // Delivery Note, Receipt) — compact single row: avatar, name + doc#/date, amount +
  // status, chevron. Padding/gaps/font sizes are intentionally tight so more rows fit
  // on a mobile screen at once (redesigned from a taller 3-line stacked layout).
  docCard: {
    width: '100%', textAlign: 'left', background: '#ffffff', border: 'none', borderRadius: '14px',
    padding: '10px 12px', marginBottom: '8px', boxShadow: '0 1px 4px rgba(15, 23, 42, 0.06)',
    cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center',
    gap: '10px', boxSizing: 'border-box',
  },
  docCardAvatar: {
    width: '30px', height: '30px', borderRadius: '50%', background: '#E6F4F2', color: '#0F766E',
    fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  docCardMain: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' },
  docCardName: {
    fontSize: '14px', fontWeight: '700', color: '#0F172A',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  docCardSubRow: { display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 },
  docCardMeta: {
    fontSize: '11.5px', color: '#94A3B8', fontWeight: '500', whiteSpace: 'nowrap',
    overflow: 'hidden', textOverflow: 'ellipsis',
  },
  docCardRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', flexShrink: 0 },
  docCardAmount: { fontSize: '14px', fontWeight: '800', color: '#0F172A', whiteSpace: 'nowrap' },
  docCardStatusPill: {
    fontSize: '9px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', whiteSpace: 'nowrap',
  },

  // Customer List
  body: { padding: '18px 18px 110px', maxWidth: '460px', margin: '0 auto', boxSizing: 'border-box' },
  searchBox: {
    background: '#ffffff', borderRadius: '18px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px',
    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.06)', marginBottom: '16px',
  },
  searchInput: { border: 'none', outline: 'none', flex: 1, fontSize: '14.5px', color: '#0F172A', fontFamily: 'inherit', background: 'transparent' },
  customerCard: {
    width: '100%', textAlign: 'left', background: '#ffffff', border: 'none', borderRadius: '18px',
    padding: '18px 18px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)', cursor: 'pointer', fontFamily: 'inherit',
  },
  customerName: { fontSize: '16.5px', fontWeight: '700', color: '#0F172A' },
  editBadge: { width: '34px', height: '34px', borderRadius: '50%', background: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  editBadgeBtn: { width: '34px', height: '34px', borderRadius: '50%', background: '#0F766E', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' },
  // Flat icon-over-label row action button (Edit / Delete) - matches the look of the
  // Duplicate/Edit/Convert/Status/Delete bar on every document detail screen (no filled
  // circular background), so list-row actions look consistent with the document footer.
  rowActionBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', flexShrink: 0 },
  rowActionIconWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '18px', lineHeight: 1 },
  rowActionLabel: { fontSize: '10px', fontWeight: '600', lineHeight: 1 },
  selectRowBtn: { flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' },
  emptyText: { textAlign: 'center', color: '#94A3B8', fontSize: '13.5px', lineHeight: '1.5', marginTop: '40px', padding: '0 20px' },

  // Product List (compact card - name + actions on top row, Price/GST on one line below)
  productCard: {
    width: '100%', textAlign: 'left', background: '#ffffff', border: 'none', borderRadius: '14px',
    padding: '12px 14px', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '5px',
    boxShadow: '0 1px 6px rgba(15, 23, 42, 0.05)', cursor: 'pointer', fontFamily: 'inherit',
  },
  productCardSelected: { boxShadow: '0 0 0 2px #0F766E, 0 1px 6px rgba(15, 23, 42, 0.05)' },
  productCardTopRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' },
  productDetailRow: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  productDetailText: { fontSize: '13px', fontWeight: '500', color: '#64748B' },
  productDetailDivider: { fontSize: '13px', fontWeight: '400', color: '#CBD5E1' },
  // Legacy stacked price/GST row labels - kept in case other screens still reference them.
  productDetailLabel: { fontSize: '14.5px', fontWeight: '500', color: '#334155' },
  productDetailValue: { fontSize: '15.5px', fontWeight: '700', color: '#0F172A' },

  headerAddBtn: {
    background: '#ffffff', border: 'none', borderRadius: '11px', width: '36px', height: '36px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
  },
  termsTabRow: { padding: '18px 18px 0', maxWidth: '460px', margin: '0 auto', boxSizing: 'border-box' },
  termsTabActive: {
    display: 'inline-block', fontSize: '17px', fontWeight: '700', color: '#0F766E',
    borderBottom: '2px solid #0F766E', paddingBottom: '10px',
  },
  termCard: {
    width: '100%', textAlign: 'left', background: '#ffffff', border: 'none', borderRadius: '16px',
    padding: '16px 16px', marginBottom: '10px', fontSize: '14.5px', color: '#0F172A', fontWeight: '500',
    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)', cursor: 'pointer', fontFamily: 'inherit', lineHeight: '1.5',
  },
  termCardSelected: { boxShadow: '0 0 0 2px #0F766E, 0 2px 10px rgba(15, 23, 42, 0.05)' },
  doneBtnWrap: { position: 'fixed', left: 0, right: 0, bottom: '18px', padding: '0 18px', boxSizing: 'border-box' },
  doneBtn: {
    width: '100%', maxWidth: '460px', margin: '0 auto', display: 'block', height: '52px', borderRadius: '30px',
    border: 'none', background: '#0F766E', color: '#ffffff', fontSize: '15px', fontWeight: '700',
    letterSpacing: '1px', cursor: 'pointer',
  },

  // Modals / bottom sheets
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.5)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 2000,
  },
  bottomSheet: {
    background: '#ffffff', width: '100%', maxWidth: '460px', borderRadius: '24px 24px 0 0',
    padding: '10px 20px 28px', boxSizing: 'border-box', maxHeight: '85vh', overflowY: 'auto',
  },
  sheetHandle: { width: '40px', height: '4px', borderRadius: '2px', background: '#E2E8F0', margin: '4px auto 18px' },
  sheetTitle: { fontSize: '19px', fontWeight: '700', color: '#0F172A', margin: '0 0 16px' },
  sheetSmallLabel: { display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#64748B', letterSpacing: '0.4px', margin: '0 0 8px' },
  sheetSmallLabelInline: { fontSize: '14.5px', fontWeight: '500', color: '#334155' },
  taxableRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 2px 8px' },
  checkbox: { width: '20px', height: '20px', accentColor: '#0F766E', cursor: 'pointer' },

  fab: {
    position: 'fixed', right: '20px', bottom: '26px', width: '68px', height: '68px', borderRadius: '50%',
    background: '#0F766E', color: '#ffffff', border: 'none', cursor: 'pointer', zIndex: 30,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1px',
    fontSize: '8.5px', fontWeight: '700', letterSpacing: '0.2px', lineHeight: '1.15', padding: '4px',
    boxShadow: '0 10px 22px rgba(15, 118, 110, 0.4)',
  },
  fabCompact: {
    position: 'fixed', right: '20px', bottom: '26px', width: '68px', height: '68px', borderRadius: '50%',
    background: '#0F766E', color: '#ffffff', border: 'none', cursor: 'pointer', zIndex: 30,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1px',
    fontSize: '8.5px', fontWeight: '700', letterSpacing: '0.2px', lineHeight: '1.15', padding: '4px',
    boxShadow: '0 10px 22px rgba(15, 118, 110, 0.4)',
  },

  // Add / Edit Customer form
  formBody: { padding: '22px 18px 40px', maxWidth: '460px', margin: '0 auto', boxSizing: 'border-box', background: '#ffffff' },
  fieldInput: {
    width: '100%', boxSizing: 'border-box', background: '#F1F3F6', border: 'none', borderRadius: '16px',
    padding: '17px 16px', fontSize: '15px', color: '#0F172A', fontWeight: '500', fontFamily: 'inherit',
    outline: 'none', marginBottom: '12px',
  },
  nameFieldWrap: { position: 'relative' },
  nameFieldIcon: {
    position: 'absolute', right: '8px', top: '8px', width: '38px', height: '38px', borderRadius: '11px',
    background: 'linear-gradient(145deg, #12786B, #0A3D38)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  suffixFieldWrap: { position: 'relative' },
  suffixFieldIcon: {
    position: 'absolute', right: '16px', top: '17px', fontSize: '15px', fontWeight: '600', color: '#334155',
  },
  descriptionTextarea: {
    width: '100%', boxSizing: 'border-box', background: '#F1F3F6', border: 'none', borderRadius: '16px',
    padding: '16px', fontSize: '15px', color: '#0F172A', fontWeight: '500', fontFamily: 'inherit',
    outline: 'none', minHeight: '110px', resize: 'vertical', marginBottom: '4px',
  },
  charCount: { textAlign: 'right', fontSize: '12px', color: '#94A3B8', fontWeight: '500', marginBottom: '12px' },
  sectionBar: {
    background: '#EEF0F4', color: '#0F172A', fontWeight: '700', fontSize: '14.5px',
    borderRadius: '14px', padding: '13px 16px', margin: '18px 0 12px',
  },
  shippingTextarea: {
    width: '100%', boxSizing: 'border-box', background: '#F1F3F6', border: 'none', borderRadius: '16px',
    padding: '16px', fontSize: '15px', color: '#0F172A', fontWeight: '500', fontFamily: 'inherit',
    outline: 'none', minHeight: '110px', resize: 'vertical', marginBottom: '12px',
  },
  // Persistent-label fields (label always visible, never relies on placeholder alone)
  labeledFieldBox: {
    width: '100%', boxSizing: 'border-box', background: '#F1F3F6', border: '1.5px solid transparent',
    borderRadius: '16px', padding: '9px 16px 11px', marginBottom: '12px', fontFamily: 'inherit',
  },
  labeledFieldBoxError: { border: '1.5px solid #DC2626' },
  labeledFieldLabel: { display: 'block', fontSize: '11.5px', color: '#64748B', fontWeight: '600', marginBottom: '2px', letterSpacing: '0.1px' },
  labeledFieldInput: {
    width: '100%', border: 'none', outline: 'none', background: 'transparent', padding: 0,
    fontSize: '15px', color: '#0F172A', fontWeight: '500', fontFamily: 'inherit',
  },
  labeledFieldButton: {
    width: '100%', border: 'none', outline: 'none', background: 'transparent', padding: 0, textAlign: 'left',
    fontSize: '15px', color: '#0F172A', fontWeight: '500', fontFamily: 'inherit', cursor: 'pointer',
  },
  fieldErrorText: { color: '#DC2626', fontSize: '12px', fontWeight: '500', margin: '-8px 0 12px 4px' },

  addBtn: {
    width: '100%', height: '52px', borderRadius: '16px', border: 'none', background: '#0F766E',
    color: '#ffffff', fontSize: '15.5px', fontWeight: '700', letterSpacing: '1px', cursor: 'pointer', marginTop: '10px',
  },
};
