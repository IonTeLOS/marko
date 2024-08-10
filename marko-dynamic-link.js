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
async function createDynamicButton(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID "${containerId}" not found.`);
        return;
    }

    const button = document.createElement('button');
    button.id = 'dynamicMarkoButton';
    button.className = 'circle-button';

    const icon = document.createElement('img');
    icon.src = 'https://raw.githubusercontent.com/IonTeLOS/marko/main/triskelion.svg';
    icon.alt = 'Icon';
    button.appendChild(icon);

    button.onclick = handleMarkoButtonClick;

    container.appendChild(button);

    const { finalColor, compColor } = computeAndStoreColors();

    const style = document.createElement('style');
    style.innerHTML = `
        #${containerId} {
            position: relative;
            z-index: 9999;
            width: 64px;
            height: 64px;
        }

        #dynamicButton.circle-button {
            display: inline-block;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 5px solid ${compColor};
            background-color: ${finalColor};
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease-in-out;
            cursor: pointer;
            overflow: hidden;
            position: absolute;
            top: 0;
            left: 0;
        }

        #dynamicButton.circle-button img {
            width: 50%;
            height: 50%;
        }

        #dynamicButton.expanded {
            border-radius: 25px;
            width: auto;
            padding: 0 20px;
            background-color: white;
            border: 2px solid ${compColor};
        }

        #dynamicButton.expanded img {
            width: 24px;
            height: 24px;
            margin-right: 10px;
        }

        #dynamicButton.expanded::after {
            content: "${getTranslatedText()}";
            color: ${compColor};
            white-space: nowrap;
        }
    `;

    document.head.appendChild(style);
}

// Load tinycolor for color manipulation
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tinycolor/1.4.2/tinycolor.min.js';
script.onload = function() {
    createDynamicButton('buttonMarkoContainer'); // ID of the container element in your HTML
};
document.head.appendChild(script);
