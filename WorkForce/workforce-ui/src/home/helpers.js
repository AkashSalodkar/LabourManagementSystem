import { Browser } from '@capacitor/browser';

export const formatSubDate = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

export const handleWatchTutorialVideo = async (videoUrl) => {
    try {
      await Browser.open({ url: videoUrl });
    } catch (error) {
      console.error('Unable to open tutorial video via Browser plugin:', error);
      window.open(videoUrl, '_blank');
    }
  };
