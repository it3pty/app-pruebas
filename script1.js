// Inicializar el mapa Leaflet con coordenadas de Panamá
const map = L.map('map').setView([8.9824, -79.5199], 12); // Coordenadas de Panamá

// Agregar una capa de mapa base (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let currentMarkers = []; // Lista para almacenar los marcadores actuales
let markersLoaded = false; // Variable para verificar si los marcadores ya se cargaron
let visits = [];



function getCurrentDay() {
    const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const today = new Date();
    const dayIndex = today.getDay();
    return daysOfWeek[dayIndex];
}

window.addEventListener('DOMContentLoaded', async () => {
    const currentDay = getCurrentDay();
    document.getElementById('visitDay').value = currentDay;
    await loadVisits();
});

// Función para borrar los marcadores del mapa
function clearMarkers() {
    currentMarkers.forEach(marker => {
        map.removeLayer(marker);
    });
    currentMarkers = []; // Limpiar la lista de marcadores
}

// Función para optimizar la ruta
function optimizeRoute() {
    console.log('Optimizando ruta...');
    // Aquí iría la lógica para optimizar la ruta (usando Leaflet Routing Machine, por ejemplo)
}

// Función para localizar al usuario
function locateUser() {
    console.log('Localizando usuario...');
    // Aquí iría la lógica para obtener la ubicación del usuario (usando Geolocation API)
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        console.log("Geolocation is not supported by this browser.");
    }
}

// Función auxiliar para obtener visitas para un día (simulación)
async function getVisitsForDay(day) {
    console.log('getVisitsForDay called with day:', day);
    try {
        const url = 'https://it3pty.github.io/app-pruebas/visitas.json';
        const respuesta = await fetch(url);
        const datos = await respuesta.json();
        return datos.visitas.filter(visita => visita.dia === day);
    } catch (error) {
        console.error('Error al cargar datos:', error);
        return [];
    }
}

// Ejemplo de cómo llamar a loadVisits desde un controlador de eventos:
document.getElementById('visitDay').addEventListener('change', async () => {
    await loadVisits();
});

// Ejemplo de cómo llamar a loadVisits al cargar la página:
window.addEventListener('DOMContentLoaded', async () => {
    await loadVisits();
});

  async function loadVisits() {
    const selectedDay = document.getElementById('visitDay').value;
    console.log('Cargando visitas para:', selectedDay);
    // ... el resto de tu código
}



// Función para mostrar las visitas en la lista y agregar marcadores al mapa
function showVisits(visits) {
    const clientList = document.getElementById('clientList');
    clientList.innerHTML = '';

    // Limpiar marcadores anteriores
    clearMarkers();

    visits.forEach((visit, index) => {
        // Crear marcador en el mapa con Leaflet
        const marker = L.marker([visit.cliente.latitud, visit.cliente.longitud]).addTo(map)
            .bindPopup(`
                <div style="padding: 8px; max-width: 250px;">
                    <h6 style="margin: 0; color: #4361ee;">${visit.cliente.nombre}</h6>
                    <p style="margin: 5px 0; font-size: 12px; color: #64748b;">
                        <i class="mdi mdi-map-marker" style="color: #4361ee;"></i> 
                        ${visit.cliente.direccion}
                    </p>
                    <p style="margin: 0; font-size: 12px;">
                        <strong>Hora:</strong> ${visit.hora_visita}
                    </p>
                </div>
            `);

        // Almacenar el marcador para futuras referencias
        currentMarkers.push(marker);

        // Crear tarjeta de cliente
        const clientCard = document.createElement('div');
        clientCard.className = `client-card fade-in ${visit.estado === 'completado' ? 'active' : ''}`;
        clientCard.style.animationDelay = `${index * 0.1}s`;
        clientCard.innerHTML = `
            <div class="client-number">${index + 1}</div>
            <div class="client-name">${visit.cliente.nombre}</div>
            <div class="client-address">
                <i class="mdi mdi-map-marker"></i>
                ${visit.cliente.direccion}
            </div>
            <div class="d-flex justify-content-between align-items-center mt-2">
                <span class="badge ${visit.estado === 'completado' ? 'badge-success' : 'badge-warning'}">
                    ${visit.estado}
                </span>
                <small class="text-muted">
                    <i class="mdi mdi-clock"></i> ${visit.hora_visita}
                </small>
            </div>
            <div class="client-actions">
                <button class="action-btn btn-outline" onclick="event.stopPropagation(); showClientDetails(JSON.parse(decodeURIComponent('${encodeURIComponent(JSON.stringify(visit))}')))">
                    <i class="mdi mdi-information"></i> Detalles
                </button>
                <button class="action-btn btn-primary" onclick="event.stopPropagation(); navigateToClient(${visit.cliente.latitud}, ${visit.cliente.longitud})">
                    <i class="mdi mdi-navigation"></i> Navegar
                </button>
            </div>
        `;

        clientCard.addEventListener('click', () => {
            // Resaltar la tarjeta seleccionada
            document.querySelectorAll('.client-card').forEach(card => {
                card.classList.remove('active');
            });
            clientCard.classList.add('active');

            // Centrar el mapa en el marcador
            map.setView([visit.cliente.latitud, visit.cliente.longitud], 13);
            marker.openPopup();
        });

        clientList.appendChild(clientCard);
    });

    // Ajustar el mapa para mostrar todos los marcadores
    if (currentMarkers.length > 0) {
        const group = L.featureGroup(currentMarkers);
        map.fitBounds(group.getBounds(), { padding: [50, 50] });
    }
}

// Función para mostrar la posición del usuario en el mapa
function showPosition(position) {
    console.log("Latitude: " + position.coords.latitude + ", Longitude: " + position.coords.longitude);
    map.setView([position.coords.latitude, position.coords.longitude], 13);
    L.marker([position.coords.latitude, position.coords.longitude]).addTo(map)
        .bindPopup("<b>Mi Ubicación</b>");
}

//Funcion del botón navegar
function navigateToClient(latitud, longitud) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            const googleMapsUrl = `https://www.google.com/maps/dir/${userLat},${userLng}/${latitud},${longitud}`;
            window.open(googleMapsUrl, '_blank');
        }, function (error) {
            const googleMapsUrl = `https://www.google.com/maps/dir//${latitud},${longitud}`;
            window.open(googleMapsUrl, '_blank');
        }, { enableHighAccuracy: true });
    } else {
        const googleMapsUrl = `https://www.google.com/maps/dir//${latitud},${longitud}`;
        window.open(googleMapsUrl, '_blank');
    }
}

//función detalles
let selectedClient; // Variable global para almacenar el cliente seleccionado

// Inicializar el modal de Bootstrap 5
const clientModal = new bootstrap.Modal(document.getElementById('clientModal'));

// Función para mostrar los detalles del cliente en el modal
function showClientDetails(visit) {
    console.log("Mostrando detalles del cliente:", visit);
    const modalBody = document.getElementById('clientModalBody');
    modalBody.innerHTML = `
        <p><strong>${visit.cliente.nombre}</strong></p>
        <p><i class="mdi mdi-map-marker"></i> ${visit.cliente.direccion}</p>
        <p><strong>Día:</strong> ${visit.dia_visita} <strong>Hora:</strong> ${visit.hora_visita} <strong>Estado:</strong> <span class="badge ${visit.estado === 'completado' ? 'badge-success' : 'badge-warning'}">${visit.estado}</span></p>
        <p><strong>Notas:</strong> ${visit.notas || 'No hay notas'}</p>
        <p><strong>Teléfono:</strong> <a href="tel:${visit.cliente.telefono}">${visit.cliente.telefono}</a></p>
    `;

    // Configurar botones del footer
    const navigateButton = document.getElementById('navigateButton');
    navigateButton.onclick = () => {
        navigateToClient(visit.cliente.latitud, visit.cliente.longitud);
    };

    const completeButton = document.getElementById('completeButton');
    completeButton.onclick = () => {
        markAsCompleted(visit.id); // Pasa el ID de la visita a la función
    };

    // Mostrar el modal
    const clientModal = new bootstrap.Modal(document.getElementById('clientModal'));
    clientModal.show();
}

// Función para navegar al cliente seleccionado
function navigateToSelectedClient() {
    if (selectedClient) {
        navigateToClient(selectedClient.cliente.latitud, selectedClient.cliente.longitud);
    } else {
        console.log("No se ha seleccionado ningún cliente.");
    }
}

// Función para marcar el cliente como completado
function markAsCompleted(visitId) {
    // 1. Buscar la visita por su ID
    const visit = visits.find(v => v.id === visitId);

    if (visit) {
        // 2. Actualizar el estado de la visita
        visit.estado = 'completado';

        // 3. Actualizar la interfaz de usuario
        updateClientCard(visit);

        // 4. Cerrar el modal
        const clientModal = bootstrap.Modal.getInstance(document.getElementById('clientModal'));
        clientModal.hide();
    }
}

function updateClientCard(visit) {
    const clientCard = document.querySelector(`.client-card:nth-child(${visit.id})`); // Ajusta el selector según tu estructura HTML
    if (clientCard) {
        clientCard.querySelector('.badge').textContent = 'completado';
        clientCard.querySelector('.badge').classList.remove('badge-warning');
        clientCard.querySelector('.badge').classList.add('badge-success');
    }
}