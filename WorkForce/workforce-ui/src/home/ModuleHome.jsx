// ===== Main page: the module picker =====
// Shown while no module is open (activeModule === null). It also hosts the Subscribe and Contact Us
// (help) pages and the bottom navigation. To add a tile for a new module, copy one of the two tiles below and pass your new module id to setActiveModule(...).

import { ATTENDANCE_TUTORIAL_VIDEO_URL, DOCUMENTS_TUTORIAL_VIDEO_URL } from './constants';
import { AppPopup } from '../shared/components';
import { Capacitor } from '@capacitor/core';
import { FaWhatsapp } from 'react-icons/fa';
import { FiArrowLeft, FiChevronRight, FiEdit2, FiFileText, FiPhone, FiPlayCircle, FiPlus, FiSearch } from 'react-icons/fi';
import { Fragment, useState } from 'react';
import { HiOutlineMail } from 'react-icons/hi';
import { HiOutlineUserGroup } from 'react-icons/hi2';
import { formatSubDate, handleWatchTutorialVideo } from './helpers';
import { getInitials } from '../shared/helpers';
import { moduleHomeStyles } from './styles';
import smartpayLogo from '../assets/icon.png';
import { themeStyles } from '../shared/styles';
import { useAppShell } from '../app/AppShellContext';

export default function ModuleHome() {
  const {
    activeModule,
    appPopup,
    closeAppPopup,
    homeDisplayName,
    isHelpPageOpen,
    isSubscribePageOpen,
    loadSubscriptionStatus,
    loggedInUser,
    profileImg,
    renderExitConfirmPopup,
    renderImageCropperModal,
    renderProfileModal,
    setActiveModule,
    setDraftProfileImg,
    setIsHelpPageOpen,
    setIsProfileModalOpen,
    setIsSubscribePageOpen,
    setSubError,
    setSubOrder,
    setSubOrderState,
    startUpiPayment,
    subError,
    subLoading,
    subLocked,
    subOrder,
    subOrderState,
    subStatus,
    t,
  } = useAppShell();

  // Search box on the main page filters the module cards by name / description.
  const [moduleSearch, setModuleSearch] = useState('');

  if (activeModule !== null) return null;

  // Full name for the greeting (falls back to the first name / 'there').
  const homeFullName = loggedInUser?.fullName?.trim() || homeDisplayName;

  // To add a new module: add one entry here (id is passed to setActiveModule).
  const homeModules = [
    {
      id: 'attendance',
      title: 'Projects, Attendance, Wages',
      badgeBg: 'linear-gradient(135deg, #2554EB, #0B3C9B)',
      icon: <HiOutlineUserGroup size={26} color="#ffffff" />,
      videoUrl: ATTENDANCE_TUTORIAL_VIDEO_URL,
      videoLabel: 'Watch Manage Employee video',
      keywords: 'employee attendance payment payments wages project manage',
    },
    {
      id: 'quotations',
      title: 'Quotation, Invoice & Business Docs',
      badgeBg: 'linear-gradient(135deg, #14B8A6, #0F766E)',
      icon: <FiFileText size={24} color="#ffffff" />,
      videoUrl: DOCUMENTS_TUTORIAL_VIDEO_URL,
      videoLabel: 'Watch Create Quotation, Invoice & Business Docs video',
      keywords: 'quotation invoice business docs documents bill',
    },
  ];
  const homeNavActive = { ...themeStyles.navItemTabActive, background: '#E3E7EC', color: '#4B5563' };
  const searchText = moduleSearch.trim().toLowerCase();
  const visibleModules = homeModules.filter((m) =>
    !searchText || `${m.title} ${m.keywords}`.toLowerCase().includes(searchText)
  );

    return (
      <div style={moduleHomeStyles.screen}>
        <div style={moduleHomeStyles.scrollArea}>
          <div style={moduleHomeStyles.header}>
            <div style={moduleHomeStyles.headerRow}>
              <div style={moduleHomeStyles.avatarWrap}>
                <button
                  type="button"
                  onClick={() => { setDraftProfileImg(undefined); setIsProfileModalOpen(true); }}
                  style={moduleHomeStyles.avatarButton}
                  aria-label="Edit profile photo and name"
                >
                  {profileImg ? (
                    <img src={profileImg} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    getInitials(loggedInUser?.fullName) || homeDisplayName.substring(0, 2).toUpperCase()
                  )}
                </button>
                {/* Small pencil badge so users know the photo / name can be edited */}
                <span style={moduleHomeStyles.avatarEditBadge} aria-hidden="true">
                  <FiEdit2 size={11} color="#4B5563" />
                </span>
              </div>
              <div style={moduleHomeStyles.brandRow}>
                <div style={moduleHomeStyles.logoTile}>
                  <img src={smartpayLogo} alt="SmartManage" style={moduleHomeStyles.logoImg} />
                </div>
                <span style={moduleHomeStyles.brandName}>SmartManage</span>
              </div>
            </div>

            <div style={moduleHomeStyles.greetBlock}>
              <h1 style={moduleHomeStyles.greetTitle}>{t('greetingHi')}, {homeFullName}</h1>
              <p style={moduleHomeStyles.greetSubtitle}>What would you like to do today?</p>
            </div>
          </div>

          <div style={moduleHomeStyles.content}>
            <label style={moduleHomeStyles.searchBox}>
              <FiSearch size={20} color="#4A5468" aria-hidden="true" />
              <input
                type="search"
                value={moduleSearch}
                onChange={(e) => setModuleSearch(e.target.value)}
                placeholder="Search modules"
                aria-label="Search modules"
                style={moduleHomeStyles.searchInput}
              />
            </label>

            <div style={moduleHomeStyles.moduleList}>
              {visibleModules.map((m) => (
                <div
                  key={m.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveModule(m.id)}
                  onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) setActiveModule(m.id); }}
                  style={moduleHomeStyles.moduleCard}
                >
                  <span style={{ ...moduleHomeStyles.moduleBadge, background: m.badgeBg }}>{m.icon}</span>
                  <span style={moduleHomeStyles.moduleText}>
                    <span style={moduleHomeStyles.moduleTitle}>{m.title}</span>
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleWatchTutorialVideo(m.videoUrl); }}
                    aria-label={m.videoLabel}
                    style={moduleHomeStyles.modulePlayBtn}
                  >
                    <FiPlayCircle size={24} />
                  </button>
                  <FiChevronRight size={20} color="#4A5468" aria-hidden="true" />
                </div>
              ))}

              {!searchText && (
                <div style={moduleHomeStyles.moreModulesCard}>
                  <span style={moduleHomeStyles.moreModulesBadge}><FiPlus size={26} color="#4A5468" /></span>
                  <span style={moduleHomeStyles.moreModulesText}>More modules coming soon</span>
                </div>
              )}
              {searchText && visibleModules.length === 0 && (
                <p style={moduleHomeStyles.noResultText}>No module found</p>
              )}
            </div>
          </div>
        </div>

        {/* Home / Subscribe / Contact Us — styled to match the Attendance module's bottom nav bar exactly */}
        <div style={themeStyles.bottomDockNavBar}>
          <button
            type="button"
            onClick={() => { setIsSubscribePageOpen(false); setIsHelpPageOpen(false); }}
            style={!isSubscribePageOpen && !isHelpPageOpen ? homeNavActive : themeStyles.navItemTab}
          >
            <span style={themeStyles.navTabIcon}>&#128193;</span>
            <span style={themeStyles.navTabLabel}>{t('navHome')}</span>
          </button>
          <button
            type="button"
            onClick={() => { setIsSubscribePageOpen(true); setIsHelpPageOpen(false); }}
            style={isSubscribePageOpen ? homeNavActive : themeStyles.navItemTab}
          >
            <span style={themeStyles.navTabIcon}>&#11088;</span>
            <span style={themeStyles.navTabLabel}>{t('navSubscribe')}</span>
          </button>
          <button
            type="button"
            onClick={() => { setIsHelpPageOpen(true); setIsSubscribePageOpen(false); }}
            style={isHelpPageOpen ? homeNavActive : themeStyles.navItemTab}
          >
            <span style={themeStyles.navTabIcon}>&#128222;</span>
            <span style={themeStyles.navTabLabel}>{t('navHelp')}</span>
          </button>
        </div>

        {isSubscribePageOpen && (() => {
          const s = subStatus;
          const state = s?.state; // 'trial' | 'trial_expired' | 'active' | 'expired'
          const needsPayment = state === 'trial_expired' || state === 'expired';
          const card = { backgroundColor: '#ffffff', borderRadius: '16px', padding: '18px', border: '1px solid #F1F5F9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' };
          const row = (label, value) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: '13px', color: '#64748B' }}>{label}</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B' }}>{value}</span>
            </div>
          );
          const daysBadge = (n) => (
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '26px', fontWeight: '700', color: '#0B3C9B', lineHeight: 1 }}>{n}</p>
              <span style={{ fontSize: '11px', color: '#94A3B8' }}>{n === 1 ? 'day left' : 'days left'}</span>
            </div>
          );
          return (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', backgroundColor: '#f4f6f9', zIndex: 1500, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
              <div style={{ padding: '18px 16px 14px 16px', backgroundColor: '#ffffff', borderBottom: '1px solid #E2E8F0', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                {!subLocked && (
                  <button type="button" onClick={() => setIsSubscribePageOpen(false)} aria-label="Back" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                    <FiArrowLeft size={19} color="#1E293B" />
                  </button>
                )}
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B', margin: 0 }}>Subscription</h2>
                  <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0 0' }}>30-day free trial, then ₹99 for 30 days</p>
                </div>
              </div>

              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                  {!s && (
                    <div style={{ ...card, textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>{subLoading ? 'Loading your subscription...' : (subError || 'Subscription status unavailable.')}</p>
                      {!subLoading && (
                        <button onClick={loadSubscriptionStatus} style={{ marginTop: '12px', padding: '10px 18px', borderRadius: '12px', border: '1px solid #0B3C9B', backgroundColor: '#ffffff', color: '#0B3C9B', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>Retry</button>
                      )}
                    </div>
                  )}

                  {/* ---- FREE TRIAL ---- */}
                  {s && (state === 'trial' || state === 'trial_expired') && (
                    <div style={{ ...card, border: state === 'trial' ? '2px solid #0B3C9B' : '1px solid #F1F5F9', opacity: state === 'trial' ? 1 : 0.85 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#1E293B' }}>30-Day Free Trial</h3>
                          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>Free for the first 30 days</p>
                        </div>
                        {state === 'trial'
                          ? daysBadge(s.daysRemaining)
                          : <span style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px' }}>ENDED</span>}
                      </div>
                      <div style={{ margin: '12px 0 4px 0' }}>
                        {['Full access to every feature', 'Trial starts automatically on your first login', 'Tied to your account, not your device'].map((f) => (
                          <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ color: '#10B981', fontSize: '13px', marginTop: '1px' }}>&#10003;</span>
                            <span style={{ fontSize: '13px', color: '#475569' }}>{f}</span>
                          </div>
                        ))}
                      </div>
                      {row('Trial started on', formatSubDate(s.trialStartAt))}
                      {row(state === 'trial' ? 'Trial ends on' : 'Trial ended on', formatSubDate(s.trialEndsAt))}
                      {state === 'trial' && row('Remaining', `${s.daysRemaining} ${s.daysRemaining === 1 ? 'day' : 'days'}`)}
                    </div>
                  )}

                  {/* ---- ACTIVE SUBSCRIPTION ---- */}
                  {s && state === 'active' && (
                    <div style={{ ...card, border: '2px solid #0B3C9B' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ backgroundColor: '#DCFCE7', color: '#15803D', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px' }}>&#10003; SUBSCRIPTION ACTIVE</span>
                          <h3 style={{ margin: '10px 0 0 0', fontSize: '17px', fontWeight: '700', color: '#1E293B' }}>Monthly Subscription</h3>
                          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>{'\u20B9'}{s.paidAmount || 99} paid &middot; Valid for 30 days</p>
                        </div>
                        {daysBadge(s.daysRemaining)}
                      </div>
                      <div style={{ marginTop: '10px' }}>
                        {row('Payment date', formatSubDate(s.paymentDate))}
                        {row('Subscription start date', formatSubDate(s.subscriptionStartAt))}
                        {row('Subscription expiry date', formatSubDate(s.subscriptionEndsAt))}
                        {row('Remaining days', `${s.daysRemaining} ${s.daysRemaining === 1 ? 'day' : 'days'}`)}
                        {s.paymentReference && row('Payment reference', s.paymentReference)}
                      </div>
                    </div>
                  )}

                  {/* ---- MONTHLY SUBSCRIPTION / UPI PAYMENT ---- */}
                  {s && (
                    <div style={{ ...card, border: needsPayment ? '2px solid #0B3C9B' : '1px solid #F1F5F9', boxShadow: needsPayment ? '0 4px 16px rgba(11,60,155,0.12)' : card.boxShadow }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#1E293B' }}>{state === 'active' ? 'Renew early' : 'Monthly Subscription'}</h3>
                          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>UPI payment only</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#0B3C9B' }}>{'\u20B9'}99</p>
                          <span style={{ fontSize: '11px', color: '#94A3B8' }}>/ 30 days</span>
                        </div>
                      </div>

                      {state === 'trial' && (
                        <p style={{ fontSize: '12.5px', color: '#64748B', margin: '12px 0 0 0' }}>
                          Your free trial gives you full access until {formatSubDate(s.trialEndsAt)}. You'll be asked to subscribe after that.
                        </p>
                      )}

                      {(needsPayment || state === 'active') && subOrderState === 'idle' && (
                        <button onClick={startUpiPayment} style={{ width: '100%', marginTop: '14px', padding: '13px', borderRadius: '12px', border: 'none', backgroundColor: '#0B3C9B', color: '#ffffff', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                          {state === 'active' ? 'Renew for \u20B999 via UPI' : 'Pay \u20B999 via UPI'}
                        </button>
                      )}

                      {subOrderState === 'creating' && (
                        <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748B', margin: '16px 0 0 0' }}>Generating your payment QR...</p>
                      )}

                      {(subOrderState === 'waiting' || subOrderState === 'paid') && subOrder && (
                        <div style={{ marginTop: '14px', textAlign: 'center' }}>
                          {subOrderState === 'waiting' && (
                            <Fragment>
                              <div style={{ display: 'inline-block', padding: '10px', backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '14px' }}>
                                <img src={subOrder.qrImage} alt="UPI QR code to pay ₹99" style={{ width: '210px', height: '210px', display: 'block' }} />
                              </div>
                              <p style={{ margin: '10px 0 0 0', fontSize: '15px', fontWeight: '700', color: '#1E293B' }}>Scan &amp; pay exactly {'\u20B9'}{subOrder.amount}</p>
                              {subOrder.upiUri && Capacitor.isNativePlatform() && (
                                <button onClick={() => { window.location.href = subOrder.upiUri; }} style={{ marginTop: '10px', padding: '10px 18px', borderRadius: '12px', border: '1px solid #0B3C9B', backgroundColor: '#ffffff', color: '#0B3C9B', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
                                  Open UPI app on this phone
                                </button>
                              )}
                            </Fragment>
                          )}

                          <div style={{ textAlign: 'left', marginTop: '14px', backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '12px 14px' }}>
                            <p style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>How to pay</p>
                            {['Open any UPI app (Google Pay, PhonePe, Paytm, BHIM...)', `Scan this QR code and pay exactly \u20B9${subOrder.amount}`, 'Keep this screen open - your payment is verified automatically', 'Your subscription activates for 30 days as soon as the bank confirms it'].map((t, i) => (
                              <p key={i} style={{ margin: '0 0 4px 0', fontSize: '12.5px', color: '#475569' }}>{i + 1}. {t}</p>
                            ))}
                          </div>

                          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            {subOrderState === 'waiting' ? (
                              <Fragment>
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#F59E0B', display: 'inline-block' }} />
                                <span style={{ fontSize: '13px', fontWeight: '600', color: '#92400E' }}>Waiting for payment confirmation...</span>
                              </Fragment>
                            ) : (
                              <Fragment>
                                <span style={{ color: '#10B981', fontSize: '15px' }}>&#10003;</span>
                                <span style={{ fontSize: '13px', fontWeight: '600', color: '#15803D' }}>Payment verified</span>
                              </Fragment>
                            )}
                          </div>
                          {subOrderState === 'waiting' && (
                            <p style={{ fontSize: '11.5px', color: '#94A3B8', margin: '6px 0 0 0' }}>
                              Only a bank-confirmed payment activates the plan. Screenshots are not accepted.
                            </p>
                          )}
                        </div>
                      )}

                      {(subOrderState === 'failed' || subOrderState === 'expired') && (
                        <div style={{ marginTop: '14px', textAlign: 'center' }}>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#B91C1C' }}>
                            {subOrderState === 'expired' ? 'This payment QR expired.' : 'Payment was not completed.'}
                          </p>
                          {subError && <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748B' }}>{subError}</p>}
                          <button onClick={() => { setSubOrder(null); setSubOrderState('idle'); setSubError(''); }} style={{ marginTop: '10px', padding: '11px 20px', borderRadius: '12px', border: 'none', backgroundColor: '#0B3C9B', color: '#ffffff', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>Try again</button>
                        </div>
                      )}
                      <p style={{ fontSize: '11px', color: '#94A3B8', margin: '14px 0 0 0', textAlign: 'center' }}>
                        If money was debited but access isn't active within a few minutes, it will be applied automatically once the bank confirms it. Contact Help with your UPI reference if not.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {isHelpPageOpen && (() => {
          const helpNumbers = ['+91 8237580362', '+91 9325461043'];
          const helpEmails = ['nilendra777@gmail.com', 'akash24101990@gmail.com'];
          return (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', backgroundColor: '#f4f6f9', zIndex: 1500, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
              <div style={{ padding: '18px 16px 14px 16px', backgroundColor: '#ffffff', borderBottom: '1px solid #E2E8F0', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button type="button" onClick={() => setIsHelpPageOpen(false)} aria-label="Back" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                  <FiArrowLeft size={19} color="#1E293B" />
                </button>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B', margin: 0 }}>{t('helpPageTitle')}</h2>
                </div>
              </div>

              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 16px 32px' }}>
                {/* Intro line */}
                <p style={{ fontSize: '14.5px', color: '#334155', fontWeight: '500', lineHeight: '1.5', margin: '0 0 22px 0' }}>
                  {t('helpPageSubtitle')}
                </p>

                {/* Let's Chat buttons (WhatsApp) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  {helpNumbers.map((number, idx) => (
                    <a
                      key={number}
                      href={`https://wa.me/${number.replace(/[^\d]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        backgroundColor: '#1E293B', borderRadius: '16px', padding: '16px',
                        boxShadow: '0 2px 8px rgba(15,23,42,0.12)',
                        textDecoration: 'none', cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: '15.5px', fontWeight: '700', color: '#ffffff' }}>{`${t('letsChat')} ${idx + 1}`}</span>
                      <FaWhatsapp size={20} color="#25D366" />
                    </a>
                  ))}
                </div>

                {/* App name, phone numbers, emails */}
                <div style={{
                  backgroundColor: '#ffffff', borderRadius: '16px', padding: '18px',
                  border: '1px solid #F1F5F9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                }}>
                  <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', margin: '0 0 14px 0' }}>{t('contactAppName')}</h3>

                  {helpNumbers.map((number) => (
                    <a
                      key={number}
                      href={`tel:${number.replace(/\s+/g, '')}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', margin: '0 0 10px 0' }}
                    >
                      <FiPhone size={16} color="#0B3C9B" />
                      <span style={{ fontSize: '14.5px', fontWeight: '600', color: '#0F172A' }}>{number}</span>
                    </a>
                  ))}

                  {helpEmails.map((email) => (
                    <a
                      key={email}
                      href={`mailto:${email}`}
                      onClick={(e) => { e.preventDefault(); window.location.href = `mailto:${email}`; }}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', margin: '0 0 10px 0' }}
                    >
                      <HiOutlineMail size={17} color="#0B3C9B" />
                      <span style={{ fontSize: '14.5px', fontWeight: '600', color: '#0F172A', wordBreak: 'break-all' }}>{email}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {renderProfileModal()}
        {renderImageCropperModal()}
        {renderExitConfirmPopup()}

        <AppPopup
          open={!!appPopup?.open}
          tone={appPopup?.tone}
          title={appPopup?.title}
          message={appPopup?.message}
          confirmLabel={appPopup?.confirmLabel}
          cancelLabel={appPopup?.cancelLabel}
          onConfirm={appPopup?.onConfirm || closeAppPopup}
          onCancel={closeAppPopup}
          onClose={closeAppPopup}
        />
      </div>
    );
  
}
