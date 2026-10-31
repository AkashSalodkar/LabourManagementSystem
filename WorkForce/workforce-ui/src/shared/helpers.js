import { Capacitor } from '@capacitor/core';

// ===== Native "pick a contact" helper =====
// Opens the phone's own Contacts app so the user can choose an existing contact,
// then hands back whatever we could read off it. Used by both the Add/Edit
// Customer form and the Add/Edit Employee form's contact-book icon.
// - On a native Capacitor build this uses @capacitor-community/contacts, which
//   shows the real system contact picker and (once the user picks someone) only
//   returns that one contact's details - no broad "read all contacts" permission
//   prompt is needed for the picker itself.
// - In a mobile browser that supports the web Contact Picker API, we fall back to
//   navigator.contacts.select so the icon still works there.
// - Anywhere else (e.g. desktop browser preview) it simply does nothing.
// Returns { name, phone, email } (fields may be empty strings) or null if the
// user cancelled, denied permission, or no contact API is available.
export async function pickPhoneContact() {
  try {
    if (Capacitor.isNativePlatform()) {
      const { Contacts } = await import('@capacitor-community/contacts');
      const permission = await Contacts.requestPermissions();
      if (permission?.contacts && permission.contacts !== 'granted') return null;
      const result = await Contacts.pickContact({
        projection: { name: true, phones: true, emails: true },
      });
      const contact = result?.contact;
      if (!contact) return null;
      const name = contact.name?.display
        || [contact.name?.given, contact.name?.family].filter(Boolean).join(' ')
        || '';
      const rawPhone = contact.phones?.[0]?.number || '';
      const phone = rawPhone.replace(/\D/g, '').slice(-10);
      const email = contact.emails?.[0]?.address || '';
      return { name: name.trim(), phone, email: email.trim() };
    }
    if (typeof navigator !== 'undefined' && navigator.contacts && navigator.contacts.select) {
      const [contact] = await navigator.contacts.select(['name', 'tel', 'email'], { multiple: false });
      if (!contact) return null;
      const name = (contact.name && contact.name[0]) || '';
      const rawPhone = (contact.tel && contact.tel[0]) || '';
      const phone = rawPhone.replace(/\D/g, '').slice(-10);
      const email = (contact.email && contact.email[0]) || '';
      return { name: name.trim(), phone, email: email.trim() };
    }
  } catch (err) {
    // User cancelling the picker, or permission being denied, both land here -
    // treat it the same as "nothing picked" rather than surfacing an error.
    console.error('Contact pick failed:', err);
  }
  return null;
}

  // Shared initials fallback (e.g. "Nilendra Gokhe" -> "NG") used everywhere the
  // profile photo is missing/removed - keeps the header avatar and the Update
  // Profile modal avatar consistent.
export const getInitials = (fullName) => {
    if (!fullName || !fullName.trim()) return '';
    return fullName.trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Single source of truth for the Quotation document's content: both the in-app
  // "Quotation Detail" preview and the shared PDF read from this exact same model,
  // so the two can never drift apart again (header layout, To/Date, table rows,
  // Sub Total / Other Charges / Grand Total, Terms & Conditions, signature block).
export const getDocDisplayNumber = (docNo) => {
    const match = String(docNo || '').match(/(\d+)\s*$/);
    return match ? match[1] : (docNo || '');
  };

export const productLineSummary = (p) => `${p.name} x${p.qty}${p.unit ? ' ' + p.unit : ''} - ₹${Math.round((p.price || 0) * (p.qty || 0) * (1 + (p.gst || 0) / 100)).toLocaleString('en-IN')}`;

export const formatConversationalDate = (dateString) => {
    if (!dateString) return '';
    const parsedDate = new Date(dateString);
    if (isNaN(parsedDate.getTime())) return dateString;
    return parsedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

export const formatWeekday = (dateString) => {
    if (!dateString) return '';
    const parsedDate = new Date(dateString);
    if (isNaN(parsedDate.getTime())) return '';
    return parsedDate.toLocaleDateString('en-GB', { weekday: 'long' });
  };

export const computeProjectPresentToday = (project) => {
    const todayStr = toLocalISODate(new Date());
    return (project.employees || []).filter(w => {
      const rec = w.attendance?.[todayStr];
      return rec && (rec.status === 'P' || rec.status === 'HD');
    }).length;
  };

export const toLocalISODate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

export const getThisWeekRange = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    return { from: toLocalISODate(monday), to: toLocalISODate(today) };
  };

export const getThisMonthRange = () => {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: toLocalISODate(firstOfMonth), to: toLocalISODate(today) };
  };

export const getCustomWeekRange = (startDay) => {
    const today = new Date();
    const diff = (today.getDay() - startDay + 7) % 7;
    const start = new Date(today);
    start.setDate(today.getDate() - diff);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { from: toLocalISODate(start), to: toLocalISODate(end) };
  };
