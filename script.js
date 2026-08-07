/* ==========================================================================
   VISOR DE TARJETAS Y PUNTOS DE INTERÉS - SCRIPT COMPLETO Y OPTIMIZADO
   ========================================================================== */

const totalCards = 56;
const imageFolder = "image"; 
const extension = "jpg";

let currentIndex = 1;

let cardInner, imgFront, imgBack, txtCurrentIndex, cardTypeTitle, cardSelect, btnPrev, btnNext, cardLink;

// Variables para los botones y modal
let btnRoute, btnPoints, pointsModal, modalTitle, pointsList, closeModalBtn;

// Arreglo global para almacenar la información de los puntos de interés
let pointsData = [];

// Variables para el control de gestos táctiles (Swipe)
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

window.onload = function() {
    cardInner = document.getElementById('card-inner');
    imgFront = document.getElementById('img-front');
    imgBack = document.getElementById('img-back');
    txtCurrentIndex = document.getElementById('current-index');
    cardTypeTitle = document.getElementById('card-type-title');
    cardSelect = document.getElementById('card-select');
    btnPrev = document.getElementById('btn-prev');
    btnNext = document.getElementById('btn-next');
    cardLink = document.getElementById('card-link');

    // Referencias a los elementos del DOM del Modal y Botones
    btnRoute = document.getElementById('btn-route');
    btnPoints = document.getElementById('btn-points');
    pointsModal = document.getElementById('points-modal');
    modalTitle = document.getElementById('modal-title');
    pointsList = document.getElementById('points-list');
    closeModalBtn = document.getElementById('close-modal');

    // Asignación de Eventos
    if (btnRoute) btnRoute.onclick = openRoute;
    if (btnPoints) btnPoints.onclick = openPointsModal;
    if (closeModalBtn) closeModalBtn.onclick = closePointsModal;
    
    if (pointsModal) {
        window.onclick = function(e) {
            if (e.target === pointsModal) closePointsModal();
        };
    }

    // Estrategia de Carga Fallback para el JSON (Soporta ambos nombres)
    fetch('puntos.json')
        .then(response => {
            if (!response.ok) throw new Error("No se encontró puntos.json, intentando pointscards.json...");
            return response.json();
        })
        .catch(() => fetch('pointscards.json').then(res => res.json()))
        .then(data => {
            pointsData = data;
            console.log("JSON de puntos cargado con éxito. Total registros:", pointsData.length);
            updateCard();
        })
        .catch(error => {
            console.error('Error al cargar la base de datos de puntos:', error);
            updateCard();
        });

    initSelect();

    // Navegación con teclado
    document.addEventListener('keydown', (e) => {
        if (pointsModal && pointsModal.style.display === "block") return; // Si el modal está abierto, omitir

        if (e.key === 'ArrowRight') {
            e.preventDefault();
            nextCard();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            prevCard();
        } else if (e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            toggleFlip();
        }
    });

    // Navegación táctil (Swipe)
    const cardWrapper = document.querySelector('.card-wrapper');
    if (cardWrapper) {
        cardWrapper.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        cardWrapper.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            handleSwipe();
        }, { passive: true });
    }
};

function handleSwipe() {
    const swipeThreshold = 50; 
    const maxVerticalVariance = 40; 

    const diffX = touchEndX - touchStartX;
    const diffY = Math.abs(touchEndY - touchStartY);

    if (diffY < maxVerticalVariance) {
        if (diffX < -swipeThreshold) {
            nextCard();
        } else if (diffX > swipeThreshold) {
            prevCard();
        }
    }
}

// Función auxiliar para obtener metadatos seguros desde cardsData
function getCardMetadata(id) {
    if (typeof cardsData === "undefined" || !Array.isArray(cardsData)) return null;
    return cardsData.find(c => Number(c.id) === Number(id)) || null;
}

// Lista desplegable
function initSelect() {
    if (!cardSelect) return;
    cardSelect.innerHTML = ""; 

    for (let i = 1; i <= totalCards; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        
        const cardNumberFormatted = String(i).padStart(2, '0');
        
        // Obtener la información de la tarjeta desde cardsData
        const cardData = cardsData[i];
        const cardName = cardData && cardData.name ? cardData.name : `BATTERY PARK`;
        
        // Formato solicitado: Carta 01 - 1 BATTERY PARK
        opt.textContent = `Tarjeta ${cardNumberFormatted} - ${cardName}`;

        cardSelect.appendChild(opt);
    }
}

function updateCard() {
    if (!cardInner) return; 

    // Al cambiar de carta, reseteamos el estado de volteo
    cardInner.classList.remove('is-flipped');
    cardInner.classList.remove('flipped');

    const formattedNum = String(currentIndex).padStart(2, '0');

    const srcFront = `${imageFolder}/${formattedNum}_d.${extension}`;
    const srcBack = `${imageFolder}/${formattedNum}_t.${extension}`;

    if (imgFront) imgFront.src = srcFront;
    if (imgBack) imgBack.src = srcBack;

    if (imgFront) {
        imgFront.onerror = function() {
            imgFront.onerror = null; 
            if (imgFront.src.endsWith('.jpg')) {
                imgFront.src = `${imageFolder}/${formattedNum}_d.JPG`;
            }
        };
    }

    if (imgBack) {
        imgBack.onerror = function() {
            imgBack.onerror = null;
            if (imgBack.src.endsWith('.jpg')) {
                imgBack.src = `${imageFolder}/${formattedNum}_t.JPG`;
            }
        };
    }

    if (txtCurrentIndex) txtCurrentIndex.textContent = formattedNum;
    if (cardSelect) cardSelect.value = currentIndex;

    // --- ACTUALIZACIÓN BOTÓN YOUTUBE Y TÍTULO (LÓGICA ANTIGUA RESTAURADA) ---
    const currentData = cardsData[currentIndex];
    if (currentData) {
        if (cardTypeTitle) cardTypeTitle.textContent = currentData.name;
        
        if (cardLink) {
            if (currentData.url && currentData.url !== "#" && currentData.url.trim() !== "") {
                cardLink.href = currentData.url;
                cardLink.style.display = "block"; // O "inline-block" según prefieras en tu layout
            } else {
                cardLink.style.display = "none";
            }
        }
    } else {
        if (cardLink) cardLink.style.display = "none";
    }

    // Comprobar si la tarjeta actual tiene puntos en el JSON cargado
    const cardPointsData = getCardPointsData();
    const hasPoints = cardPointsData && cardPointsData.puntos && cardPointsData.puntos.length > 0;

    if (btnRoute) btnRoute.style.display = hasPoints ? "inline-block" : "none";
    if (btnPoints) btnPoints.style.display = hasPoints ? "inline-block" : "none";

    if (btnPrev) btnPrev.disabled = (currentIndex === 1);
    if (btnNext) btnNext.disabled = (currentIndex === totalCards);

    // Precarga silenciosa de imágenes adyacentes
    if (currentIndex < totalCards) {
        const nextNum = String(currentIndex + 1).padStart(2, '0');
        new Image().src = `${imageFolder}/${nextNum}_d.${extension}`;
        new Image().src = `${imageFolder}/${nextNum}_t.${extension}`;
    }
    if (currentIndex > 1) {
        const prevNum = String(currentIndex - 1).padStart(2, '0');
        new Image().src = `${imageFolder}/${prevNum}_d.${extension}`;
        new Image().src = `${imageFolder}/${prevNum}_t.${extension}`;
    }
}

// Función flexible para buscar puntos correspondientes a la tarjeta activa
function getCardPointsData() {
    if (!pointsData || !Array.isArray(pointsData) || pointsData.length === 0) return null;

    const num = Number(currentIndex);
    const formattedNum = String(currentIndex).padStart(2, '0');

    return pointsData.find(item => {
        const idVal = item.tarjetaId !== undefined ? item.tarjetaId : item.id;
        if (idVal === undefined) return false;

        const strId = String(idVal).trim();
        return strId === formattedNum || Number(strId) === num;
    });
}

// Lógica del botón "Crear Ruta"
function openRoute() {
    const cardData = getCardPointsData();
    if (!cardData || !cardData.puntos || cardData.puntos.length === 0) {
        alert("No hay puntos registrados para esta tarjeta.");
        return;
    }

    const coords = [];

    cardData.puntos.forEach(punto => {
        let raw = punto.coordenadas || punto.coordenada || punto.coords || punto.latlng || punto.location;

        if (raw && typeof raw === 'string') {
            coords.push(raw.trim());
            return;
        }

        const mapUrl = punto.url || punto.gmaps;
        if (mapUrl && typeof mapUrl === 'string') {
            // Captura patrones de coordenadas en URL (p. ej. ?q=40.7032,-74.0170 o @40.7032,-74.0170)
            const match = mapUrl.match(/(?:q=|@|=)(-?\d+\.\d+,\s*-?\d+\.\d+)/);
            if (match && match[1]) {
                coords.push(match[1].trim());
            }
        }
    });

    if (coords.length === 0) {
        alert("No se pudieron extraer las coordenadas de los puntos para calcular la ruta.");
        return;
    }

    let routeUrl = "";

    if (coords.length === 1) {
        routeUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coords[0])}`;
    } else {
        const origin = encodeURIComponent(coords[0]);
        const destination = encodeURIComponent(coords[coords.length - 1]);

        let waypointsParam = "";
        if (coords.length > 2) {
            const waypoints = coords.slice(1, -1).map(c => encodeURIComponent(c)).join('|');
            waypointsParam = `&waypoints=${waypoints}`;
        }

        routeUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointsParam}&travelmode=walking`;
    }

    window.open(routeUrl, '_blank');
}

// Lógica del Modal "Ver Puntos"
function openPointsModal() {
    const cardData = getCardPointsData();
    if (!cardData || !cardData.puntos || !pointsModal) return;

    modalTitle.textContent = cardData.titulo || `Puntos de Interés (${String(currentIndex).padStart(2, '0')})`;
    pointsList.innerHTML = "";

    // Ajustes de tamaño y scroll para permitir hasta 14+ puntos sin deformarse
    const modalContent = pointsModal.querySelector('.modal-content') || pointsModal.firstElementChild;
    if (modalContent) {
        modalContent.style.maxHeight = "85vh";
        modalContent.style.display = "flex";
        modalContent.style.flexDirection = "column";
        modalContent.style.overflow = "hidden";
    }

    // Aseguramos que la lista se pueda desplazar si supera el tamaño permitido
    pointsList.style.overflowY = "auto";
    pointsList.style.maxHeight = "calc(85vh - 100px)";
    pointsList.style.paddingRight = "5px";
    pointsList.style.listStyle = "none";
    pointsList.style.margin = "0";

    cardData.puntos.forEach((punto, index) => {
        const li = document.createElement('li');
        
        const num = punto.numero !== undefined ? punto.numero : (index + 1);
        const nombreText = punto.nombre || punto.title || punto.descripcion || `Punto ${num}`;
        const targetUrl = punto.url || punto.gmaps || "#";
        const hasUrl = targetUrl !== "#";

        if (hasUrl) {
            // Se convierte toda la fila en un enlace bloque
            li.innerHTML = `
                <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" 
                   style="display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 10px 8px; text-decoration: none; border-bottom: 1px solid #eee; border-radius: 6px; transition: background-color 0.2s ease;">
                    <div style="text-align: left; padding-right: 10px; font-size: 0.9rem; color: #222222; font-weight: 500; line-height: 1.2;">
                        <strong style="color: #000000;">${num}.</strong> ${nombreText}
                    </div>
                    <span style="color: #0066cc; font-weight: bold; white-space: nowrap; font-size: 0.85rem; flex-shrink: 0;">
                        🗺️ Ver mapa
                    </span>
                </a>
            `;

            // Efecto visual al pasar el ratón (Hover)
            const link = li.querySelector('a');
            link.addEventListener('mouseenter', () => link.style.backgroundColor = '#f0f7ff');
            link.addEventListener('mouseleave', () => link.style.backgroundColor = 'transparent');
        } else {
            // Estilo por defecto si el punto no tiene URL
            li.style.cssText = "padding: 10px 8px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;";
            li.innerHTML = `
                <div style="text-align: left; padding-right: 10px; font-size: 0.9rem; color: #222222; font-weight: 500; line-height: 1.2;">
                    <strong style="color: #000000;">${num}.</strong> ${nombreText}
                </div>
            `;
        }

        pointsList.appendChild(li);
    });

    pointsModal.style.display = "flex";
    pointsModal.style.alignItems = "center";
    pointsModal.style.justifyContent = "center";
}

function closePointsModal() {
    if (pointsModal) pointsModal.style.display = "none";
}

function closePointsModal() {
    if (pointsModal) pointsModal.style.display = "none";
}

// Funciones de control navegacional global
function toggleFlip() {
    if (cardInner) {
        cardInner.classList.toggle('is-flipped');
        cardInner.classList.toggle('flipped');
    }
}

function nextCard() {
    if (currentIndex < totalCards) {
        currentIndex++;
        updateCard();
    }
}

function prevCard() {
    if (currentIndex > 1) {
        currentIndex--;
        updateCard();
    }
}

function jumpToCard(value) {
    currentIndex = parseInt(value, 10);
    updateCard();
}