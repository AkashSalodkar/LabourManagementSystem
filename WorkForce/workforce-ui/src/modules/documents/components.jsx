import { DOCUMENT_STATUS_OPTIONS } from './constants';
import { FiChevronRight } from 'react-icons/fi';
import { Fragment } from 'react';
import { businessInfoStyles, customerModuleStyles } from '../../shared/styles';
import { docStyles, quotationSettingsStyles } from './styles';
import { documentStatusColors } from './helpers';
import smartpayLogo from '../../assets/icon.png';

// Persistent-label form field: label always shown above the value, so a
// filled-in field never becomes unreadable/ambiguous the way a bare
// `placeholder`-only input does once it has a value. Used throughout the
// single shared Add/Edit Customer form (all 6 document tiles + Manage ->
// Customers all render the exact same form/component, so this applies
// everywhere at once).
export function LabeledField({ label, as = 'input', error, rightElement, boxStyle, inputStyle, children, ...fieldProps }) {
  const box = { ...customerModuleStyles.labeledFieldBox, ...(error ? customerModuleStyles.labeledFieldBoxError : null), ...boxStyle };
  return (
    <div>
      <div style={box}>
        <label style={customerModuleStyles.labeledFieldLabel}>{label}</label>
        {/* The field itself lives in a flex:1 wrapper so a fixed-size rightElement
            (e.g. the contact-picker icon) always sits pinned to the right edge and
            vertically centered on this row, no matter how wide/narrow the input's
            own content makes it. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {as === 'textarea' ? (
              <textarea {...fieldProps} style={{ ...customerModuleStyles.labeledFieldInput, resize: 'vertical', minHeight: '64px', ...inputStyle }} />
            ) : as === 'button' ? (
              <button type="button" {...fieldProps} style={{ ...customerModuleStyles.labeledFieldButton, ...inputStyle }}>
                {children}
              </button>
            ) : (
              <input {...fieldProps} style={{ ...customerModuleStyles.labeledFieldInput, ...inputStyle }} />
            )}
          </div>
          {rightElement}
        </div>
      </div>
      {error && typeof error === 'string' && <p style={customerModuleStyles.fieldErrorText}>{error}</p>}
    </div>
  );
}

export const DocumentStatusBadge = ({ status }) => {
    if (!status) return null;
    const meta = documentStatusColors[status] || documentStatusColors['In-Progress'];
    return (
      <div style={{ position: 'absolute', top: '10px', right: '16px', background: meta.bg, color: meta.text, padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', zIndex: 5, boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
        {status}
      </div>
    );
  };

  // Reusable "Quotation Status"-style bottom sheet used by every document module's More > Status action.
  // `options` lets individual document modules (e.g. Invoice) show their own status list instead of
  // the default DOCUMENT_STATUS_OPTIONS.
export const DocumentStatusSheet = ({ open, title, onSelect, onClose, options }) => {
    if (!open) return null;
    const statusOptions = options || DOCUMENT_STATUS_OPTIONS;
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 9999 }} onClick={onClose}>
        <div style={{ background: '#ffffff', width: '100%', maxWidth: '500px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '12px 20px 30px', boxSizing: 'border-box' }} onClick={(e) => e.stopPropagation()}>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: '#E2E8F0', margin: '4px auto 20px' }} />
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0F172A', margin: '0 0 20px' }}>{title}</h3>
          {statusOptions.map((status, idx) => (
            <button
              key={status}
              onClick={() => onSelect(status)}
              style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '14px 0', borderBottom: idx < statusOptions.length - 1 ? '1px solid #F1F5F9' : 'none', fontSize: '17px', color: '#0F172A', cursor: 'pointer' }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Reusable document-list row card: customer/company name on the left,
  // document number / date / amount (+ status when present) stacked on the
  // right — used by every list screen in the Quotation Module (Quotation,
  // Invoice, Purchase Order, Proforma Invoice, Delivery Note, Receipt) so
  // the information hierarchy stays identical across document types.
  // Pass either `amount` (a number, rendered as ₹X) or `amountText` (a raw
  // string, e.g. "2 items") for document types that don't carry a price.
  // Compact single-card-row layout: a small initial avatar for quick scanning, name +
  // doc#/date stacked tightly on two lines in the middle, amount + status stacked on the
  // right, and a trailing chevron for affordance. Deliberately kept to two text lines and
  // tight padding so noticeably more documents fit on screen without a scroll.
export const DocumentListCard = ({ name, docNumber, date, amount, amountText, status, onClick, rightAccessory }) => {
    const statusMeta = status ? (documentStatusColors[status] || documentStatusColors['In-Progress']) : null;
    const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
    return (
      <button type="button" onClick={onClick} style={customerModuleStyles.docCard}>
        <div style={customerModuleStyles.docCardAvatar}>{initial}</div>
        <div style={customerModuleStyles.docCardMain}>
          <span style={customerModuleStyles.docCardName}>{name}</span>
          <div style={customerModuleStyles.docCardSubRow}>
            <span style={customerModuleStyles.docCardMeta}>{docNumber} · {date}</span>
            {rightAccessory}
          </div>
        </div>
        <div style={customerModuleStyles.docCardRight}>
          <span style={customerModuleStyles.docCardAmount}>
            {amountText !== undefined ? amountText : `₹${Number(amount || 0).toLocaleString('en-IN')}`}
          </span>
          {statusMeta && (
            <span style={{ ...customerModuleStyles.docCardStatusPill, background: statusMeta.bg, color: statusMeta.text }}>
              {status}
            </span>
          )}
        </div>
        <FiChevronRight size={15} color="#CBD5E1" style={{ flexShrink: 0 }} />
      </button>
    );
  };

  // Renders the full document body (header/logo, To+Date, greeting, item table, totals,
  // other info, closing text, terms, signature + signature image, brand footer) from a
  // model built by buildDocModel/buildQuotationDocModel — the exact same visual structure
  // Quotation Detail uses, reused by every other document type's in-app preview.
export const GeneratedDocumentPreview = ({ model }) => {
  // These settings-driven flags default to "on" (undefined !== false) for document types
  // that don't define them (Invoice/Purchase Order/Proforma Invoice/Delivery Note), so
  // their preview keeps behaving exactly as before. Only Quotation sets them explicitly,
  // driven by Quotation Settings.
  const showHsn = model.showHsn !== false;
  const showGst = model.showGst !== false;
  const showSignature = model.showSignature !== false;
  const showShippingAddress = !!model.showShippingAddress && !!model.shippingAddress;
  const showBankInfo = !!model.showBankInfo && (model.bankAccountName || model.bankAccountNumber || model.bankName || model.ifscCode);
  const showUpi = !!model.showUpi && (model.upiId || model.qrCodeImg);
  const showReceivedBy = !!model.showReceivedBy;
  const totalCols = 2 + (showHsn ? 1 : 0) + 1 + (model.pricing ? (1 + (showGst ? 1 : 0) + 1) : 0);
  const footerColSpan = totalCols - 1;
  return (
    <>
      {/* Header: Doc title (top, centered), then Business info + logo below */}
      <div style={{ marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid #E2E8F0' }}>
        <p style={{ ...docStyles.docTypeLabel, textTransform: 'none', textAlign: 'center', margin: '0 0 12px' }}>{model.docTitle}</p>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={docStyles.businessName}>{model.businessName}</h2>
            {model.businessPhone && <p style={docStyles.contactLine}>{model.businessPhone}</p>}
            {model.businessEmail && <p style={docStyles.contactLine}>{model.businessEmail}</p>}
          </div>
          {model.logoImg && (
            <img src={model.logoImg} alt="Business Logo" style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0, border: '1px solid #E2E8F0' }} />
          )}
        </div>
      </div>

      {/* To, (left) | Date (right) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: showShippingAddress ? '10px' : '16px' }}>
        <div style={{ flex: 1 }}>
          <p style={{ ...docStyles.sectionLabel, textTransform: 'none' }}>{model.toLabel}</p>
          {model.customerLines.map((line, idx) => (
            <p key={idx} style={idx === 0 ? docStyles.toName : docStyles.contactLine}>{line}</p>
          ))}
        </div>
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <p style={docStyles.docMetaLine}>Date: {model.date}</p>
        </div>
      </div>

      {/* Shipping Address (Quotation only, when enabled in Quotation Settings) */}
      {showShippingAddress && (
        <div style={{ marginBottom: '16px' }}>
          <p style={{ ...docStyles.sectionLabel, textTransform: 'none' }}>Shipping Address</p>
          <p style={docStyles.contactLine}>{model.shippingAddress}</p>
        </div>
      )}

      {model.greetingLines.length > 0 && (
        <p style={docStyles.bodyText}>
          {model.greetingLines.map((line, idx) => (
            <Fragment key={idx}>
              {line}
              {idx < model.greetingLines.length - 1 ? <br /> : null}
            </Fragment>
          ))}
        </p>
      )}

      {/* Table */}
      <div style={docStyles.tableWrap}>
        <table style={docStyles.table}>
          <thead>
            <tr>
              <th style={{ ...docStyles.th, width: model.pricing ? '6%' : '10%' }}>#</th>
              <th style={{ ...docStyles.th, width: model.pricing ? '22%' : '42%', wordBreak: 'break-word' }}>Item</th>
              {showHsn && <th style={{ ...docStyles.th, width: model.pricing ? '11%' : '23%', wordBreak: 'break-word' }}>{model.hsnLabel}</th>}
              <th style={{ ...docStyles.th, textAlign: 'center', width: model.pricing ? '11%' : '25%' }}>Qty</th>
              {model.pricing && <th style={{ ...docStyles.th, textAlign: 'right', width: '17%' }}>Price</th>}
              {model.pricing && showGst && <th style={{ ...docStyles.th, textAlign: 'right', width: '15%' }}>GST</th>}
              {model.pricing && <th style={{ ...docStyles.th, textAlign: 'right', width: '18%' }}>Total</th>}
            </tr>
          </thead>
          <tbody>
            {model.rows.map((r) => (
              <tr key={r.index}>
                <td style={docStyles.td}>{r.index}</td>
                <td style={docStyles.td}>
                  <div style={docStyles.tdBold}>{r.name}</div>
                </td>
                {showHsn && (
                  <td style={{ ...docStyles.td, whiteSpace: 'pre-line', wordBreak: 'break-all' }}>
                    {String(r.hsn || '').match(/.{1,4}/g)?.join('\n') || r.hsn}
                  </td>
                )}
                <td style={{ ...docStyles.td, textAlign: 'center' }}>
                  {r.qty}{r.unit ? <span style={{ fontSize: '9px', color: '#94A3B8' }}> {r.unit}</span> : null}
                </td>
                {model.pricing && <td style={{ ...docStyles.td, textAlign: 'right' }}>₹{Number(r.price).toFixed(2)}</td>}
                {model.pricing && showGst && (
                  <td style={{ ...docStyles.td, textAlign: 'right' }}>
                    {r.gstPct}%
                    <div style={{ fontSize: '9px', color: '#94A3B8' }}>₹{r.gstAmt.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                  </td>
                )}
                {model.pricing && <td style={{ ...docStyles.td, ...docStyles.tdBold, textAlign: 'right' }}>₹{r.total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>}
              </tr>
            ))}
          </tbody>
          {model.pricing && (
            <tfoot>
              <tr>
                <td colSpan={footerColSpan} style={docStyles.totalsLabel}>
                  Sub Total
                  {model.gstTotal > 0 && (
                    <span style={{ display: 'block', fontSize: '9px', color: '#64748B', fontWeight: '500' }}>
                      Tax: ₹{model.gstTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  )}
                </td>
                <td style={docStyles.totalsValue}>
                  ₹{(model.subTotal + model.gstTotal).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </td>
              </tr>
              {/* Updated Other Charges with tax breakdown */}
              {(model.otherChargesRows || []).map((c, idx) => {
                const taxAmount = c.taxable ? (c.amount * c.gstPercent / 100) : 0;
                const totalWithTax = c.amount + taxAmount;
                return (
                  <tr key={idx}>
                    <td colSpan={footerColSpan} style={docStyles.totalsLabel}>
                      {c.label}
                      {c.taxable && c.gstPercent > 0 && (
                        <span style={{ display: 'block', fontSize: '9px', color: '#64748B', fontWeight: '500' }}>
                          Tax ({c.gstPercent}%): ₹{taxAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                      )}
                    </td>
                    <td style={docStyles.totalsValue}>
                      ₹{totalWithTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
              <tr style={{ borderTop: '1.5px solid #0F172A' }}>
                <td colSpan={footerColSpan} style={docStyles.grandTotalLabel}>Grand Total</td>
                <td style={docStyles.grandTotalValue}>₹{model.grandTotal.toLocaleString('en-IN')}</td>
              </tr>
              {model.hasPayment && model.paidTotal > 0 && (
                <>
                  <tr>
                    <td colSpan={footerColSpan} style={{ padding: '6px 5px', textAlign: 'right', fontWeight: '600', fontSize: '10.5px', color: '#16A34A' }}>Paid</td>
                    <td style={{ padding: '6px 5px', textAlign: 'right', fontWeight: '700', fontSize: '10.5px', color: '#16A34A' }}>₹{model.paidTotal.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td colSpan={footerColSpan} style={{ ...docStyles.totalsLabel, fontWeight: '700', color: '#0F172A' }}>Balance Due</td>
                    <td style={{ ...docStyles.totalsValue, fontSize: '11.5px', fontWeight: '800' }}>₹{model.balanceDue.toLocaleString('en-IN')}</td>
                  </tr>
                </>
              )}
            </tfoot>
          )}
        </table>
      </div>

      {/* Other Info - full width, above the bottom-message/terms/payment grid */}
      {model.otherInfo && (
        <p style={{ ...docStyles.bodyText, margin: '4px 0 14px' }}>{model.otherInfo}</p>
      )}

      {/* Bottom message (row 1, spans all 3 cols) / Terms & Conditions (row 2, spans all
          3 cols) / Payment Instructions (row 3, col 1) + QR Code (row 3, col 2, col 3 left
          empty) - laid out as a single 3-column grid so the QR code sits right next to
          Payment Instructions instead of drifting to the far right. */}
      {(model.closingText || model.termsLines.length > 0 || showBankInfo || showUpi) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr', columnGap: '18px', rowGap: '14px', margin: '0 0 18px' }}>
          {model.closingText && (
            <p style={{ ...docStyles.closingText, gridColumn: '1 / -1', margin: 0 }}>{model.closingText}</p>
          )}

          {model.termsLines.length > 0 && (
            <div style={{ gridColumn: '1 / -1' }}>
              <p style={{ ...docStyles.sectionLabel, textTransform: 'uppercase', margin: '0 0 4px' }}>Terms & Conditions</p>
              {model.termsLines.map((term, idx) => (
                <p key={idx} style={{ ...docStyles.addressLine, margin: idx === 0 ? 0 : '2px 0 0' }}>
                  {'\u2022'} {term}
                </p>
              ))}
            </div>
          )}

          {showBankInfo && (
            <div style={{ minWidth: 0, gridColumn: '1' }}>
              <p style={{ ...docStyles.sectionLabel, textTransform: 'uppercase', margin: '0 0 6px' }}>Payment Instructions</p>
              {model.bankAccountName && <p style={{ ...docStyles.addressLine, margin: '0 0 2px' }}>Account Holder Name: {model.bankAccountName}</p>}
              {model.bankAccountNumber && <p style={{ ...docStyles.addressLine, margin: '0 0 2px' }}>Account Number: {model.bankAccountNumber}</p>}
              {model.bankName && <p style={{ ...docStyles.addressLine, margin: '0 0 2px' }}>Bank Name: {model.bankName}</p>}
              {model.ifscCode && <p style={{ ...docStyles.addressLine, margin: 0 }}>IFSC Code: {model.ifscCode}</p>}
            </div>
          )}
          {showUpi && (
            <div style={{ textAlign: 'center', flexShrink: 0, gridColumn: '2' }}>
              {model.qrCodeImg && (
                <img src={model.qrCodeImg} alt="UPI QR Code" style={{ width: '76px', height: '76px', objectFit: 'contain', background: '#ffffff', padding: '4px', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'block', imageRendering: 'pixelated' }} />
              )}
              {model.upiId && <p style={{ ...docStyles.addressLine, margin: '4px 0 0', fontSize: '9px' }}>{model.upiId}</p>}
            </div>
          )}
        </div>
      )}

      {/* Payment History */}
      {model.hasPayment && model.paidInfo.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <p style={docStyles.sectionLabel}>Payment History</p>
          {model.paidInfo.map((p) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#475569', padding: '4px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span>{p.date}{p.note ? ` — ${p.note}` : ''}</span>
              <span style={{ fontWeight: '600', color: '#0F172A' }}>₹{p.amount}</span>
            </div>
          ))}
        </div>
      )}

      {/* Signature - standalone row, bottom right, below Terms & Conditions / Payment
          Instructions / QR above. Skipped for Delivery Note, where it is drawn instead
          alongside the "Received By" acknowledgement block right below. */}
      {showSignature && !showReceivedBy && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '18px' }}>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={docStyles.signatureLabel}>For, {model.signatureName}</p>
            {model.signatureImg ? (
              <img src={model.signatureImg} alt="Authorized Signature" style={{ height: '34px', maxWidth: '160px', objectFit: 'contain', marginLeft: 'auto', display: 'block' }} />
            ) : (
              <div style={{ height: '34px' }}></div>
            )}
            <p style={docStyles.signatureCaption}>Authorized Signature</p>
          </div>
        </div>
      )}

      {/* Received By (Delivery Note only) - Name/Date/Signature acknowledgement on the
          left, business's own Authorized Signature on the right, both at the very
          bottom, below Terms & Conditions / Payment Instructions / QR above. */}
      {showReceivedBy && (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', marginTop: '6px', marginBottom: '18px' }}>
          <div style={{ flex: 1, maxWidth: '260px' }}>
            <p style={{ ...docStyles.sectionLabel, textTransform: 'none', margin: '0 0 14px' }}>Received By:</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '20px' }}>
              <span style={docStyles.addressLine}>Name:</span>
              <span style={{ flex: 1, borderBottom: '1px solid #94A3B8', height: '1px' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '20px' }}>
              <span style={docStyles.addressLine}>Date:</span>
              <span style={{ flex: 1, borderBottom: '1px solid #94A3B8', height: '1px' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={docStyles.addressLine}>Signature:</span>
              <span style={{ flex: 1, borderBottom: '1px solid #94A3B8', height: '1px' }} />
            </div>
          </div>
          {showSignature && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={docStyles.signatureLabel}>For, {model.signatureName}</p>
              {model.signatureImg ? (
                <img src={model.signatureImg} alt="Authorized Signature" style={{ height: '34px', maxWidth: '160px', objectFit: 'contain', marginLeft: 'auto', display: 'block' }} />
              ) : (
                <div style={{ height: '34px' }}></div>
              )}
              <p style={docStyles.signatureCaption}>Authorized Signature</p>
            </div>
          )}
        </div>
      )}

      {/* Generated with SmartManage - brand footer */}
      <div style={{ marginTop: '24px', paddingTop: '14px', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img src={smartpayLogo} alt="SmartManage" style={{ width: '20px', height: '20px', borderRadius: '5px', objectFit: 'cover', display: 'block' }} />
        <span style={{ fontSize: '11px', fontWeight: '600', color: '#94A3B8', letterSpacing: '0.2px' }}>Generated with SmartManage</span>
      </div>
    </>
  );
};

export function FieldInput({ label, value, onChange, type = 'text', error, ...inputProps }) {
  return (
    <div>
      <div style={{ ...businessInfoStyles.fieldBox, ...(error ? { border: '1.5px solid #DC2626' } : null) }}>
        <span style={businessInfoStyles.fieldLabel}>{label}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={businessInfoStyles.fieldInputEl}
          {...inputProps}
        />
      </div>
      {error && typeof error === 'string' && <p style={customerModuleStyles.fieldErrorText}>{error}</p>}
    </div>
  );
}

// Compact inline toggle switch used for every Yes/No "Display" setting row (GST, HSN,
// Shipping Address, Bank info, QR Code, Signature). Tapping the switch flips the value
// directly - no bottom sheet needed. Sized to sit comfortably inside the existing row
// so it never looks oversized on small screens.
export function ToggleSwitchRow({ icon, label, value, onChange }) {
  const isYes = value === 'Yes';
  return (
    <div style={quotationSettingsStyles.toggleRow}>
      <span style={quotationSettingsStyles.toggleRowIcon}>{icon}</span>
      <span style={quotationSettingsStyles.toggleRowLabel}>{label}</span>
      <span style={quotationSettingsStyles.toggleRowRight}>
        <button
          type="button"
          role="switch"
          aria-checked={isYes}
          aria-label={label}
          onClick={() => onChange(isYes ? 'No' : 'Yes')}
          style={{
            ...quotationSettingsStyles.switchTrack,
            ...(isYes ? quotationSettingsStyles.switchTrackOn : quotationSettingsStyles.switchTrackOff),
          }}
        >
          <span
            style={{
              ...quotationSettingsStyles.switchThumb,
              transform: isYes ? 'translateX(18px)' : 'translateX(0)',
            }}
          />
        </button>
        <span style={{ ...quotationSettingsStyles.toggleRowValueText, color: isYes ? '#0F766E' : '#64748B' }}>{isYes ? 'Yes' : 'No'}</span>
      </span>
    </div>
  );
}

// Inline 3-option segmented control used for Top/Bottom Message mode rows
// (Default / Custom / Hide). `options` is an array of { value, label } - value is what
// gets passed to onChange / stored (e.g. "Customize"), label is what's shown on the
// button (e.g. "Custom"), so existing business logic keyed on "Customize" keeps working.
export function SegmentedModeRow({ icon, label, value, options, onChange }) {
  return (
    <div style={quotationSettingsStyles.segmentedWrap}>
      <div style={quotationSettingsStyles.segmentedHeader}>
        <span style={quotationSettingsStyles.toggleRowIcon}>{icon}</span>
        <span style={quotationSettingsStyles.toggleRowLabel}>{label}</span>
      </div>
      <div style={quotationSettingsStyles.segmentedControl}>
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              style={{
                ...quotationSettingsStyles.segmentedBtn,
                ...(active ? quotationSettingsStyles.segmentedBtnActive : {}),
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
