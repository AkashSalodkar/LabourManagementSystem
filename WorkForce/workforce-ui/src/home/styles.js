export const moduleHomeStyles = {
  screen: {
    width: '100%', minHeight: '100vh',
    background: 'linear-gradient(180deg, #F6F9FF 0%, #F0F4FC 45%, #EAF0FB 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'flex', justifyContent: 'center', boxSizing: 'border-box',
  },
  scrollArea: { width: '100%', maxWidth: '460px', padding: '20px 18px 28px', boxSizing: 'border-box' },

  headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' },
  brandRow: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' },
  logoImg: { width: '30px', height: '30px', objectFit: 'contain', borderRadius: '8px' },
  brandName: { fontSize: '11px', fontWeight: '700', color: '#0F172A', letterSpacing: '-0.01em' },
  avatarButton: {
    width: '36px', height: '36px', borderRadius: '50%', border: 'none',
    background: 'linear-gradient(135deg, #0B3C9B, #2554EB)', color: '#ffffff',
    fontWeight: '700', fontSize: '13px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 0,
  },

  greetBlock: { marginBottom: '10px' },
  greetTitle: { fontSize: '22px', fontWeight: '800', color: '#0F172A', margin: '0 0 4px 0', letterSpacing: '-0.3px' },
  greetSubtitle: { fontSize: '13.5px', color: '#64748B', margin: 0, fontWeight: '500' },

  panel: { background: '#F1F2F6', borderRadius: '26px', padding: '18px 16px 20px', boxSizing: 'border-box' },
  panelLabel: { fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: '0 0 14px 4px' },

  tileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  tile: {
    position: 'relative',
    background: '#ffffff', border: '1px solid #F0F2F6', borderRadius: '20px',
    padding: '18px 14px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
    alignItems: 'flex-start', gap: '10px', cursor: 'pointer', textAlign: 'left',
    fontFamily: 'inherit', minHeight: '128px', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
  },
  tileBadge: { width: '40px', height: '40px', borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tileTitle: { fontSize: '14.5px', fontWeight: '700', color: '#0F172A', lineHeight: '1.25' },
  // Font auto-shrinks to fit the tile width as the label text grows (e.g. longer module names).
  // Shared by both home-page tiles so their typography (size/weight/line-height) stays identical.
  tileTitleAdjustable: {
    fontSize: 'clamp(11px, 3.4vw, 14.5px)', fontWeight: '700', color: '#0F172A',
    lineHeight: '1.25', overflowWrap: 'break-word', wordBreak: 'break-word', width: '100%',
  },
  tileSubtitle: { fontSize: '11.5px', fontWeight: '500', color: '#94A3B8', lineHeight: '1.35' },
  tilePlayBadge: {
    position: 'absolute', top: '10px', right: '10px', width: '26px', height: '26px', borderRadius: '50%',
    background: 'transparent', border: 'none', cursor: 'pointer', color: '#F59E0B',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', padding: 0, zIndex: 2,
  },

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
