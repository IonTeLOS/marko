// g-d.js

(async function() {
  // Helper function to get URL parameters
  function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  function getComplementaryColor(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const compR = 255 - r;
    const compG = 255 - g;
    const compB = 255 - b;
    return `#${((1 << 24) + (compR << 16) + (compG << 8) + compB).toString(16).slice(1).toUpperCase()}`;
  }

  async function extractColorsFromImage(imgSrc) {
    const loadImage = (src) => {
      return new Promise((resolveImg, rejectImg) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => resolveImg(img);
        img.onerror = (e) => rejectImg(e);
        img.src = src;
      });
    };

    const extractColors = (img) => {
      const colorThief = new ColorThief();
      let dominantColor = colorThief.getColor(img);
      let hexColor = `#${((1 << 24) + (dominantColor[0] << 16) + (dominantColor[1] << 8) + dominantColor[2]).toString(16).slice(1).toUpperCase()}`;

      if (hexColor === '#FFFFFF' || hexColor === '#000000') {
        const palette = colorThief.getPalette(img, 5);
        dominantColor = palette.find(([r, g, b]) => r !== 255 && g !== 255 && b !== 255 && r !== 0 && g !== 0 && b !== 0) || dominantColor;
      }

      const finalHex = `#${((1 << 24) + (dominantColor[0] << 16) + (dominantColor[1] << 8) + dominantColor[2]).toString(16).slice(1).toUpperCase()}`;
      const complementaryColor = getComplementaryColor(finalHex);

      return { color: finalHex, 'c-color': complementaryColor };
    };

    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imgSrc)}`;

    try {
      const img = await loadImage(proxyUrl);
      return extractColors(img);
    } catch (proxyError) {
      console.warn('Failed to load image through proxy. Attempting direct load...');
      try {
        const img = await loadImage(imgSrc);
        return extractColors(img);
      } catch (directError) {
        console.error('Error loading image:', directError);
        return { color: "", 'c-color': "" };
      }
    }
  }

  function resolveRelativeUrl(baseUrl, relativeUrl) {
    const urlObj = new URL(relativeUrl, baseUrl);
    return urlObj.href;
  }

  function getFaviconsAndOgImage(doc, baseUrl) {
    const faviconTags = [...doc.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')];
    const ogImageTag = doc.querySelector('meta[property="og:image"]');

    if (faviconTags.length === 0) return { fav: "", 'fav-': "", 'og:image': ogImageTag ? resolveRelativeUrl(baseUrl, ogImageTag.content) : "" };

    const faviconsWithSize = faviconTags.map(tag => {
      const size = tag.getAttribute('sizes');
      const width = size ? parseInt(size.split('x')[0], 10) : null;
      const href = resolveRelativeUrl(baseUrl, tag.getAttribute('href'));
      return { href, size: width || 0 };
    }).sort((a, b) => b.size - a.size);

    const result = {
      fav: faviconsWithSize[0]?.href || "",
      'fav-': faviconsWithSize.length > 1 ? faviconsWithSize[faviconsWithSize.length - 1]?.href : "",
      'og:image': ogImageTag ? resolveRelativeUrl(baseUrl, ogImageTag.content) : ""
    };

    return result;
  }

  async function fetchSiteData(siteUrl) {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(siteUrl)}`;
    try {
      const response = await axios.get(proxyUrl);
      const parser = new DOMParser();
      const doc = parser.parseFromString(response.data, "text/html");

      const metadata = {};

      metadata.title = doc.querySelector('title')?.innerText || "";
      metadata.shortname = siteUrl.replace(/https?:\/\//, '').split('/')[0] || "";
      metadata.description = doc.querySelector('meta[name="description"]')?.content || "";
      metadata.keywords = doc.querySelector('meta[name="keywords"]')?.content || "";
      metadata.language = doc.documentElement.lang || "";

      const results = getFaviconsAndOgImage(doc, siteUrl);
      metadata.fav = results.fav;
      metadata['fav-'] = results['fav-'];
      metadata['og:image'] = results['og:image'];

      if (results.fav) {
        try {
          const colors = await extractColorsFromImage(results.fav);
          Object.assign(metadata, colors);
        } catch (error) {
          console.error('Error extracting colors:', error);
          metadata.color = "";
          metadata['c-color'] = "";
        }
      }

      console.log(JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.error('Error fetching site data:', error);
      console.error(`Error: ${error.message}`);
    }
  }

  async function loadAndExecuteScript(url) {
    try {
      const response = await fetch(url);
      const scriptContent = await response.text();

      const script = document.createElement('script');
      script.textContent = scriptContent;
      document.head.appendChild(script);

      script.onload = () => {
        if (typeof window.fetchSiteData === 'function') {
          const siteUrl = getQueryParam('url');
          if (siteUrl) {
            window.fetchSiteData(siteUrl);
          } else {
            console.error('Error: No URL parameter provided.');
          }
        } else {
          console.error('No fetchSiteData function found in the script.');
        }
      };

      script.onerror = (e) => {
        console.error('Error loading script:', e);
      };
    } catch (error) {
      console.error('Error fetching script:', error);
    }
  }

  const remoteScriptUrl = 'https://teloslinux.org/marko/g-d.js'; // Update this URL
  loadAndExecuteScript(remoteScriptUrl);
})();
