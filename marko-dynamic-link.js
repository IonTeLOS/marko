// Function to compute and store colors in localStorage
function computeAndStoreColors() {
    // Check if the color is already stored in localStorage
    let finalColor = localStorage.getItem('Marko-found-color');
    let compColor = localStorage.getItem('Marko-comp-color');

    if (!finalColor || !compColor) {
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        finalColor = themeColorMeta ? themeColorMeta.content : null;

        if (!finalColor) {
            const mostCommonColor = getMostCommonColor();
            if (mostCommonColor) {
                finalColor = mostCommonColor;
            }
        }

        if (!finalColor) {
            finalColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
        }

        compColor = tinycolor(finalColor).complement().toHexString();

        // Store the colors in localStorage
        localStorage.setItem('Marko-found-color', finalColor);
        localStorage.setItem('Marko-comp-color', compColor);
    }

    return { finalColor, compColor };
}

async function getFavicon() {
            // 1. Try to get favicon from current page
            let faviconElement = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
            if (faviconElement) {
                return faviconElement.href;
            }

            // 2. Try to get favicon from home page
            const baseUrl = window.location.origin; // Root of the domain
            try {
                const response = await fetch(`${baseUrl}/favicon.ico`);
                if (response.ok) {
                    return `${baseUrl}/favicon.ico`;
                }
            } catch (e) {
                console.log("Error fetching favicon from home page:", e);
            }

            // 3. Try to get icon from manifest
            const manifestLink = document.querySelector('link[rel="manifest"]');
            if (manifestLink) {
                try {
                    const manifestUrl = manifestLink.href;
                    const response = await fetch(manifestUrl);
                    const manifest = await response.json();
                    if (manifest.icons && manifest.icons.length > 0) {
                        return new URL(manifest.icons[0].src, baseUrl).href; // Resolve the relative URL if needed
                    }
                } catch (e) {
                    console.log("Error fetching icon from manifest:", e);
                }
            }

            // 4. Try to get og:image
            const ogImageElement = document.querySelector('meta[property="og:image"]');
            if (ogImageElement) {
                return ogImageElement.content;
            }

            // 5. Fallback to Google Favicon service
            return `https://www.google.com/s2/favicons?domain=${baseUrl}&sz=64`;
        }

        function getMostCommonColor() {
            const elements = document.querySelectorAll('*');
            const colorCounts = {};

            elements.forEach(element => {
                const style = window.getComputedStyle(element);
                const color = style.getPropertyValue('color');

                if (color) {
                    colorCounts[color] = (colorCounts[color] || 0) + 1;
                }
            });

            let mostCommonColor = null;
            let maxCount = 0;

            for (const color in colorCounts) {
                if (colorCounts[color] > maxCount) {
                    mostCommonColor = color;
                    maxCount = colorCounts[color];
                }
            }

            return mostCommonColor;
        }

        async function handleMarkoButtonClick(event) {
        event.preventDefault();
    const button = event.currentTarget;

    // First click: expand the button to a chip
    if (!button.classList.contains('expanded')) {
        button.classList.add('expanded');
        return;
    }

    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);

    const favicon = encodeURIComponent(await getFavicon());

    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    let finalColor = themeColorMeta ? themeColorMeta.content : null;

    if (!finalColor) {
        const mostCommonColor = getMostCommonColor();
        if (mostCommonColor) {
            finalColor = mostCommonColor;
        }
    }

    if (!finalColor) {
        finalColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    }

    const encodedColor = encodeURIComponent(finalColor);

    const finalUrl = `https://teloslinux.org/marko/newfile?type=website&link=${url}&title=${title}&icon=${favicon}&color=${encodedColor}&createMarko=true`;

    window.open(finalUrl, '_blank');
}

// Function to get the system language and translate "Add Marko"
function getTranslatedText() {
    const translations = {
        en: 'Add Marko',
        es: 'Agregar Marko',
        zh: '添加马可',
        hi: 'मार्को जोड़ें',
        ar: 'أضف ماركو',
        ru: 'Добавить Марко',
        pt: 'Adicionar Marko',
        fr: 'Ajouter Marko',
        de: 'Marko hinzufügen',
        ja: 'マルコを追加'
    };

    const language = navigator.language.split('-')[0];
    return translations[language] || translations['en'];
}


// Function to create and style the button dynamically
async function styleButton() {
    const button = document.getElementById('dynamicMarkoButton');
    if (!button) {
        console.error('Button with ID "dynamicMarkoButton" not found.');
        return;
    }

    const { finalColor, compColor } = computeAndStoreColors();

    button.style.borderColor = compColor;
    button.style.backgroundColor = finalColor;

    button.addEventListener('click', handleMarkoButtonClick);

    // Set the text data attribute for the expanded button
    button.setAttribute('data-text', getTranslatedText());
}

// Load tinycolor for color manipulation
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tinycolor/1.4.2/tinycolor.min.js';
script.onload = styleButton;
document.head.appendChild(script);
