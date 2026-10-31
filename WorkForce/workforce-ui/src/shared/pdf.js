import { RUPEE_FONT_BOLD_BASE64, RUPEE_FONT_NAME, RUPEE_FONT_REGULAR_BASE64 } from './constants';

// ===== jsPDF is loaded on demand =====
// jsPDF is a large library and is only needed when the user exports/shares a PDF, so it is
// no longer imported at the top of the file (which forced the WebView to download/parse it
// on every app start). ensureJsPDF() loads it the first time a PDF is generated.
export let jsPDF = null;

export const ensureJsPDF = async () => {
  if (jsPDF) return jsPDF;
  try {
    jsPDF = (await import('jspdf')).jsPDF;
  } catch (e) {
    throw new Error('jsPDF library not loaded');
  }
  return jsPDF;
};

// Registers the embedded Rupee-glyph font on a jsPDF document instance. jsPDF's added
// fonts are per-document, so this must be called once for every `new jsPDF(...)`
// instance before drawAmountText() is used on it.
export const registerRupeeFont = (doc) => {
  try {
    doc.addFileToVFS('NotoSansRupee-Regular.ttf', RUPEE_FONT_REGULAR_BASE64);
    doc.addFont('NotoSansRupee-Regular.ttf', RUPEE_FONT_NAME, 'normal');
    doc.addFileToVFS('NotoSansRupee-Bold.ttf', RUPEE_FONT_BOLD_BASE64);
    doc.addFont('NotoSansRupee-Bold.ttf', RUPEE_FONT_NAME, 'bold');
  } catch (e) { /* Falls back to plain doc.text() rendering below if this ever fails */ }
};

// Draws a single-line string that may start with "₹" - optionally preceded by a "+" or
// "-" sign (e.g. "₹1,234.56", "-₹1,500", "+₹1,500") - rendering the ₹ character with the
// embedded Rupee font and the sign/rest with Helvetica in the caller's current font
// style/size - so every existing doc.setFont/doc.setFontSize call before it keeps working
// unchanged. Supports the same `align` values as doc.text ('left' default, 'right',
// 'center'). Strings that don't match that pattern are drawn exactly as doc.text() would
// draw them, so this is a safe drop-in replacement anywhere an amount is drawn.
export const drawAmountText = (doc, text, x, y, opts = {}) => {
  const str = String(text);
  // Matches an optional leading sign (e.g. "-₹1,500" from Advance History or
  // "+₹1,500" from Bonus History/wage credits) followed by the rupee symbol.
  const match = str.match(/^([+-]?)₹(.*)$/);
  if (!match) {
    doc.text(str, x, y, opts);
    return;
  }
  const [, sign, rest] = match;
  const align = opts.align || 'left';
  const currentFont = doc.internal.getFont();
  const style = currentFont.fontStyle === 'bold' ? 'bold' : 'normal';
  const size = doc.internal.getFontSize();
  const gap = size * 0.06;

  doc.setFont('helvetica', style);
  doc.setFontSize(size);
  const signWidth = sign ? doc.getTextWidth(sign) : 0;
  const restWidth = doc.getTextWidth(rest);
  doc.setFont(RUPEE_FONT_NAME, style);
  doc.setFontSize(size);
  const symWidth = doc.getTextWidth('₹');

  if (align === 'right') {
    doc.setFont('helvetica', style);
    doc.text(rest, x, y, { align: 'right' });
    doc.setFont(RUPEE_FONT_NAME, style);
    doc.text('₹', x - restWidth - gap, y, { align: 'right' });
    if (sign) {
      doc.setFont('helvetica', style);
      doc.text(sign, x - restWidth - gap - symWidth, y, { align: 'right' });
    }
  } else if (align === 'center') {
    const totalWidth = signWidth + symWidth + gap + restWidth;
    let startX = x - totalWidth / 2;
    if (sign) {
      doc.setFont('helvetica', style);
      doc.text(sign, startX, y);
      startX += signWidth;
    }
    doc.setFont(RUPEE_FONT_NAME, style);
    doc.text('₹', startX, y);
    doc.setFont('helvetica', style);
    doc.text(rest, startX + symWidth + gap, y);
  } else {
    let startX = x;
    if (sign) {
      doc.setFont('helvetica', style);
      doc.text(sign, startX, y);
      startX += signWidth;
    }
    doc.setFont(RUPEE_FONT_NAME, style);
    doc.text('₹', startX, y);
    doc.setFont('helvetica', style);
    doc.text(rest, startX + symWidth + gap, y);
  }

  doc.setFont('helvetica', style);
};

  // Renders a clean, professional business-document PDF: consistent typography hierarchy,
  // a bold-but-not-oversized Grand Total, and a small "Generated with SmartManage" brand
  // mark bottom-left — the same design system used across every module in the app.
  // Single, shared "deliver this PDF" step used by every document type's Share action
  // (Quotation, Invoice, Purchase Order, Proforma Invoice, Delivery Note, Receipt, Bank
  // Info). Previously each PDF-generation function carried its own copy of this dispatch
  // logic; keeping only one copy guarantees every document type behaves identically -
  // there is no way for one doc type to open the OS share sheet while another silently
  // falls back to a direct download, because they all now call this exact function.
export const deliverGeneratedPdf = async (doc, sanitizedFileName) => {
    const dataUrl = doc.output('datauristring');
    const pdfBase64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;

    if (window.AndroidFileSaver && typeof window.AndroidFileSaver.saveBase64Pdf === 'function') {
      window.AndroidFileSaver.saveBase64Pdf(pdfBase64, sanitizedFileName);
      return;
    }
    if (window.Capacitor?.isNativePlatform?.() && window.Capacitor?.Plugins?.Filesystem) {
      const { Filesystem, Share } = window.Capacitor.Plugins;
      const writeResult = await Filesystem.writeFile({ path: sanitizedFileName, data: pdfBase64, directory: 'CACHE' });
      if (Share?.share) await Share.share({ title: sanitizedFileName, url: writeResult.uri });
      return;
    }
    // Web/browser fallback: use the native OS share sheet when available, otherwise just
    // download the PDF.
    if (navigator.share) {
      try {
        const blob = doc.output('blob');
        const file = new File([blob], sanitizedFileName, { type: 'application/pdf' });
        if (!navigator.canShare || navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: sanitizedFileName });
          return;
        }
      } catch (shareErr) {
        // User cancelled the share sheet, or the browser refused - fall through to download.
      }
    }
    const ua = navigator.userAgent || '';
    const isBareAndroidWebView = /Android/.test(ua) && /; wv\)/.test(ua);
    if (isBareAndroidWebView) {
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${pdfBase64}`;
      link.download = sanitizedFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      doc.save(sanitizedFileName);
    }
  };

export const downloadPdfFromAndroid = (base64String, filename) => {
    if (window.AndroidFileSaver && typeof window.AndroidFileSaver.saveBase64Pdf === 'function') {
      const cleanBase64 = base64String.replace(/^data:application\/pdf;base64,/, "");
      window.AndroidFileSaver.saveBase64Pdf(cleanBase64, filename);
    } else {
      console.warn("Android native interface not found. Falling back to browser download.");
    }
  };
