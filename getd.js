// gd.js
const fetchSiteMetadata = (() => {
  const resolveRelativeUrl = (baseUrl, relativeUrl) => new URL(relativeUrl, baseUrl).href;

  const getMetadata = (doc, siteUrl) => {
    const metadata = {
      title: doc.querySelector('title')?.innerText || "",
      shortname: siteUrl.replace(/https?:\/\//, '').split('/')[0] || "",
      description: doc.querySelector('meta[name="description"]')?.content || "",
      keywords: doc.querySelector('meta[name="keywords"]')?.content || "",
      language: doc.documentElement.lang || "",
    };

    const faviconTags = [...doc.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')]
      .map(tag => ({
        href: resolveRelativeUrl(siteUrl, tag.getAttribute('href')),
        size: parseInt(tag.getAttribute('sizes')?.split('x')[0], 10) || 0
      }))
      .sort((a, b) => b.size - a.size);

    metadata.fav = faviconTags[0]?.href || '';
    metadata['fav-'] = faviconTags.length > 1 ? faviconTags[faviconTags.length - 1].href : '';
    metadata['og:image'] = resolveRelativeUrl(siteUrl, doc.querySelector('meta[property="og:image"]')?.content || '');

    return metadata;
  };

  const extractColors = async (imgSrc) => {
    const img = await new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = `https://api.allorigins.win/raw?url=${encodeURIComponent(imgSrc)}`;
    });

    const colorThief = new ColorThief();
    let [r, g, b] = colorThief.getColor(img);
    if (r === 255 && g === 255 && b === 255 || r === 0 && g === 0 && b === 0) {
      [r, g, b] = colorThief.getPalette(img, 5).find(([r, g, b]) => r !== 255 && g !== 255 && b !== 255 && r !== 0 && g !== 0 && b !== 0) || [r, g, b];
    }

    const toHex = (r, g, b) => `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
    const color = toHex(r, g, b);
    const complementary = toHex(255 - r, 255 - g, 255 - b);

    return { color, 'c-color': complementary };
  };

  return async (siteUrl, requestedFieldsParam = '') => {
    if (!siteUrl) return { error: 'No URL parameter provided.' };

    const requestedFields = requestedFieldsParam ? requestedFieldsParam.split(',') : null;

    try {
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(siteUrl)}`);
      const contentType = response.headers.get('Content-Type') || '';
      
      if (contentType.includes('text/html')) {
        return { error: 'Received HTML content. There may be an issue with the proxy or URL.' };
      }

      const text = await response.text();
      const doc = new DOMParser().parseFromString(text, 'text/html');

      const metadata = getMetadata(doc, siteUrl);

      if (metadata.fav) {
        try {
          Object.assign(metadata, await extractColors(metadata.fav));
        } catch (error) {
          console.error('Error extracting colors:', error);
          metadata.color = "";
          metadata['c-color'] = "";
        }
      }

      return requestedFields
        ? Object.fromEntries(requestedFields.map(field => [field, metadata[field]]).filter(([, value]) => value !== undefined))
        : metadata;

    } catch (error) {
      console.error('Error fetching site data:', error);
      return { error: error.message };
    }
  };
})();

// Expose function globally
window.fetchSiteMetadata = fetchSiteMetadata;
