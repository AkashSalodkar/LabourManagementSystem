export const moduleHomeStyles = {
  screen: {
    width: '100%', minHeight: '100vh', background: '#F4F5F7',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'flex', justifyContent: 'center', boxSizing: 'border-box',
  },
  scrollArea: { width: '100%', maxWidth: '460px', paddingBottom: '96px', boxSizing: 'border-box' },

  // Slate-grey header band: avatar + logo row, greeting and subtitle.
  header: {
    background: '#4B5563', borderRadius: '0 0 22px 22px', color: '#ffffff', boxSizing: 'border-box',
    padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 18px 16px',
  },
  headerRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' },
  brandRow: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' },
  logoTile: { width: '40px', height: '40px', borderRadius: '12px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoImg: { width: '28px', height: '28px', objectFit: 'contain', borderRadius: '8px' },
  brandName: { fontSize: '13px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.01em' },
  avatarWrap: { position: 'relative', width: '44px', height: '44px', flexShrink: 0 },
  avatarEditBadge: {
    position: 'absolute', right: '-4px', bottom: '-4px', width: '22px', height: '22px', borderRadius: '50%',
    background: '#ffffff', border: '1px solid #C9D3E6', boxSizing: 'border-box',
    display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
  },
  avatarButton: {
    width: '44px', height: '44px', borderRadius: '50%', border: '2px solid #ffffff', boxSizing: 'border-box',
    background: '#E7EAEE', color: '#4B5563', fontWeight: '700', fontSize: '17px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 0,
  },

  greetBlock: { marginBottom: 0 },
  greetTitle: { fontSize: 'clamp(18px, 5.4vw, 23px)', fontWeight: '700', color: '#ffffff', margin: '0 0 2px 0', letterSpacing: '-0.3px', overflowWrap: 'anywhere', lineHeight: '1.2' },
  greetSubtitle: { fontSize: '14px', color: '#E1E5EA', margin: 0, fontWeight: '400' },

  // Modules area: search box + one card per module (scrolls, so any number of modules fits).
  content: { padding: '16px 18px 0', boxSizing: 'border-box' },
  searchBox: {
    display: 'flex', alignItems: 'center', gap: '10px', background: '#ffffff', border: '1px solid #DFE5F0',
    borderRadius: '16px', padding: '0 14px', height: '48px', boxSizing: 'border-box',
  },
  searchInput: { border: 'none', flex: 1, minWidth: 0, fontSize: '15px', background: 'transparent', color: '#101828', fontFamily: 'inherit' },
  moduleList: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' },
  moduleCard: {
    display: 'flex', alignItems: 'center', gap: '14px', background: '#ffffff', borderRadius: '20px',
    padding: '16px', boxSizing: 'border-box', cursor: 'pointer', textAlign: 'left', width: '100%',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
  },
  moduleBadge: { width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  moduleText: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' },
  moduleTitle: { fontSize: '17px', fontWeight: '600', color: '#101828', lineHeight: '1.25', overflowWrap: 'break-word' },
  moduleSubtitle: { fontSize: '13px', fontWeight: '400', color: '#475569', lineHeight: '1.35' },
  modulePlayBtn: {
    width: '40px', height: '40px', background: 'transparent', border: 'none', cursor: 'pointer',
    color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0,
  },
  moreModulesCard: {
    display: 'flex', alignItems: 'center', gap: '14px', border: '2px dashed #AEBBD3', borderRadius: '20px',
    padding: '16px', boxSizing: 'border-box',
  },
  moreModulesBadge: { width: '56px', height: '56px', borderRadius: '16px', background: '#E8EDF7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  moreModulesText: { fontSize: '16px', fontWeight: '600', color: '#4A5468' },
  noResultText: { fontSize: '14px', color: '#475569', textAlign: 'center', margin: '24px 0 0 0' },

  quickActionBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    background: '#ffffff', border: '1px solid #F0F2F6', borderRadius: '16px',
    padding: '13px 12px', boxSizing: 'border-box', cursor: 'pointer', fontFamily: 'inherit',
    fontSize: '13.5px', fontWeight: '700', color: '#0F172A', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
  },
  quickActionIcon: { fontSize: '15px' },

  backRow: { display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px 0', marginBottom: '18px' },
  backLabel: { fontSize: '13px', fontWeight: '600', color: '#475569' },

  comingSoonCard: {
    background: '#ffffff', border: '1px solid #F0F2F6', borderRadius: '24px',
    padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center',
    textAlign: 'center', gap: '12px', marginTop: '40px',
  },
  comingSoonTitle: { fontSize: '18px', fontWeight: '700', color: '#0F172A', margin: 0 },
  comingSoonText: { fontSize: '13px', color: '#64748B', margin: 0, lineHeight: '1.5', maxWidth: '280px' },
};
