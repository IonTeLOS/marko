async function fetchSiteMetadata(siteUrl, requestedFieldsParam) {
  if (!siteUrl) return { error: 'No URL parameter provided.' };

  const requestedFields = requestedFieldsParam ? requestedFieldsParam.split(',') : null;

  try {
    // Proxy fetch using allOrigins API
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(siteUrl)}`;
    const response = await fetch(proxyUrl);
    
    // Check for valid HTML response
    const contentType = response.headers.get('Content-Type') || '';
    if (!contentType.includes('text/html')) return { error: 'Expected HTML content.' };
    
    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    
    // Metadata extraction
    const metadata = {};
    metadata.title = doc.querySelector('title')?.innerText || '';
    metadata.shortname = siteUrl.replace(/https?:\/\//, '').split('/')[0] || '';
    metadata.description = doc.querySelector('meta[name="description"]')?.content || '';
    metadata.keywords = doc.querySelector('meta[name="keywords"]')?.content || '';
    metadata.language = doc.documentElement.lang || '';

    const faviconsAndOgImage = getFaviconsAndOgImage(doc, siteUrl);
    metadata.fav = faviconsAndOgImage.fav;
    metadata['og:image'] = faviconsAndOgImage['og:image'];

    if (metadata.fav) {
      try {
        const colors = await extractColorsFromImage(metadata.fav);
        Object.assign(metadata, colors);
      } catch (error) {
        console.error('Error extracting colors:', error);
      }
    }

    // Filter requested fields
    if (requestedFields) {
      return requestedFields.reduce((filtered, field) => {
        if (metadata[field] !== undefined) filtered[field] = metadata[field];
        return filtered;
      }, {});
    }

    return metadata;
  } catch (error) {
    console.error('Error fetching site metadata:', error);
    return { error: error.message };
  }
}

function resolveRelativeUrl(baseUrl, relativeUrl) {
  return new URL(relativeUrl, baseUrl).href;
}

function getFaviconsAndOgImage(doc, baseUrl) {
  const faviconTags = [...doc.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]')];
  const ogImageTag = doc.querySelector('meta[property="og:image"]');

  const favicons = faviconTags.map(tag => ({
    href: resolveRelativeUrl(baseUrl, tag.getAttribute('href')),
    size: tag.getAttribute('sizes') || ''
  })).sort((a, b) => b.size - a.size);

  return {
    fav: favicons[0]?.href || '',
    'og:image': ogImageTag ? resolveRelativeUrl(baseUrl, ogImageTag.content) : ''
  };
}

async function extractColorsFromImage(imgSrc) {
  const loadImage = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });

  const extractColors = (img) => {
    const colorThief = new ColorThief();
    const dominantColor = colorThief.getColor(img);
    const hexColor = rgbToHex(dominantColor);
    const complementaryColor = getComplementaryColor(hexColor);
    return { color: hexColor, 'c-color': complementaryColor };
  };

  try {
    const img = await loadImage(imgSrc);
    return extractColors(img);
  } catch (error) {
    console.error('Error loading image:', error);
    return { color: '', 'c-color': '' };
  }
}

function rgbToHex([r, g, b]) {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

function getComplementaryColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const compR = 255 - r, compG = 255 - g, compB = 255 - b;
  return rgbToHex([compR, compG, compB]);
}

// Make the function globally accessible
window.fetchSiteMetadata = fetchSiteMetadata;
