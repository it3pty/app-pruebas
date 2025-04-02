// Inicializar el mapa Mapbox con coordenadas de Panamá
mapboxgl.accessToken = 'TU_TOKEN_DE_ACCESO_MAPBOX'; // Reemplaza con tu token de acceso de Mapbox
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11', // Elige un estilo de mapa base
    center: [-79.5199, 8.9824], // Coordenadas de Panamá
    zoom: 12
});

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
        marker.remove(); // Eliminar el marcador del mapa
    });
    currentMarkers = []; // Limpiar la lista de marcadores
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
    try {
        const url = 'https://it3pty.github.io/app-pruebas/visitas.json'; // Reemplaza con la URL correcta
        const respuesta = await fetch(url);

        // Verifica la respuesta antes de procesarla
        if (!respuesta.ok) {
            console.error('Error al obtener los datos:', respuesta.status, respuesta.statusText);
            return [];
        }

        const datos = await respuesta.json();

        // Verifica los datos que se obtienen del JSON
        console.log('Datos obtenidos del JSON:', datos);

        // Filtra las visitas por el día seleccionado (sin importar mayúsculas/minúsculas o espacios adicionales)
        return datos.visitas.filter(visita => {
            console.log('Filtrando visita:', visita.dia); // Verifica qué valores se están comparando
            return visita.dia.toLowerCase() === day.trim().toLowerCase();
        });
    } catch (error) {
        console.error('Error al cargar datos:', error);
        return [];
    }
}

// Función para cargar las visitas según el día seleccionado
async function loadVisits() {
    const selectedDay = document.getElementById('visitDay').value;
    console.log('Día seleccionado:', selectedDay); // Verifica qué valor tiene selectedDay

    try {
        const visitas = await getVisitsForDay(selectedDay);
        console.log('Datos de visitas filtrados:', visitas); // Muestra los datos filtrados

        // Asegúrate de que tienes la función showVisits definida correctamente
        showVisits(visitas);
    } catch (error) {
        console.error('Error al cargar visitas:', error);
    }
}

// Función para mostrar las visitas en la lista y agregar marcadores al mapa
function showVisits(visits) {
    const clientList = document.getElementById('clientList');
    clientList.innerHTML = '';

    // Limpiar marcadores anteriores
    clearMarkers();

    visits.forEach((visit, index) => {
        // Crear marcador en el mapa con Mapbox
        const marker = new mapboxgl.Marker()
            .setLngLat([visit.cliente.longitud, visit.cliente.latitud])
            .setPopup(new mapboxgl.Popup().setHTML(`
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
            `))
            .addTo(map);

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
            map.flyTo({ center: [visit.cliente.longitud, visit.cliente.latitud], zoom: 13 });
            marker.togglePopup();
        });

        clientList.appendChild(clientCard);
    });

    // Ajustar el mapa para mostrar todos los marcadores
    if (currentMarkers.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        currentMarkers.forEach(marker => {
            bounds.extend(marker.getLngLat());
        });
        map.fitBounds(bounds, { padding: 50 });
    }
}

// Actualizar datos cada 30 minutos (1800000 milisegundos)
setInterval(async () => {
    console.log('Actualizando datos...');
    await loadVisits();
}, 1800000);

// Llamar a loadVisits cuando cambia el día seleccionado
document.getElementById('visitDay').addEventListener('change', async () => {
    await loadVisits();
});

// Función para mostrar la posición del usuario en el mapa
function showPosition(position) {
    console.log("Latitude: " + position.coords.latitude + ", Longitude: " + position.coords.longitude);
    map.flyTo({ center: [position.coords.longitude, position.coords.latitude], zoom: 13 });
    new mapboxgl.Marker()
        .setLngLat([position.coords.longitude, position.coords.latitude])
        .setPopup(new mapboxgl.Popup().setHTML("<b>Mi Ubicación</b>"))
        .addTo(map);
}

// Función del botón navegar
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

// Función detalles
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

// Función para validar coordenadas
function isValidCoordinate(coord) {
    return typeof coord === 'number' && !isNaN(coord);
}

// Variable para almacenar la capa de la línea de la ruta
let routeSource = null;

// Variable para almacenar el marcador de la ubicación del usuario
let userMarker = null;

// Función para mostrar el marcador de la ubicación del usuario
function displayUserMarker(lat, lng) {
    // Eliminar el marcador anterior si existe
    if (userMarker) {
        userMarker.remove();
    }

    userMarker = new mapboxgl.Marker()
        .setLngLat([lng, lat])
        .setPopup(new mapboxgl.Popup().setHTML("Mi Ubicación"))
        .addTo(map);
}

// Función para optimizar la ruta con OSRM
async function optimizeRoute() {
    try {
        // Obtener el día seleccionado
        const selectedDay = document.getElementById('visitDay').value;

        // Obtener las visitas para el día seleccionado
        const visitas = await getVisitsForDay(selectedDay);

        // Validar que hay visitas
        if (!visitas || visitas.length === 0) {
            console.error('No hay visitas para el día seleccionado.');
            return;
        }

        // Crear una lista de coordenadas a partir de las visitas
        const coordinates = visitas.map(visita => [visita.cliente.longitud, visita.cliente.latitud]);

        // Obtener la ubicación actual del usuario
        navigator.geolocation.getCurrentPosition(async function(position) {
            const startPoint = [position.coords.longitude, position.coords.latitude];

            // Validar coordenadas
            if (!isValidCoordinate(startPoint[0]) || !isValidCoordinate(startPoint[1])) {
                console.error('Ubicación del usuario no válida:', startPoint);
                return;
            }

            if (coordinates.some(coordPair => !isValidCoordinate(coordPair[0]) || !isValidCoordinate(coordPair[1]))) {
                console.error('Coordenadas de visitas no válidas:', coordinates);
                return;
            }

            // Mostrar marcador de la ubicación del usuario
            displayUserMarker(position.coords.latitude, position.coords.longitude);

            // Construir la URL de la API de OSRM
            const url = `https://router.project-osrm.org/trip/v1/driving/${startPoint.join(',')};${coordinates.map(c => c.join(',')).join(';')}?source=first&roundtrip=false`;

            // Realizar la solicitud a la API de OSRM
            const response = await fetch(url);
            const data = await response.json();

            // Procesar la respuesta de la API de OSRM
            if (data.code === 'Ok') {
                // Mostrar la ruta en el mapa
                displayRoute(data.trips[0].geometry);
            } else {
                console.error('Error al obtener la ruta:', data.message);
            }
        }, function(error) {
            console.error('Error al obtener la ubicación del usuario:', error);
        });
    } catch (error) {
        console.error('Error al optimizar la ruta:', error);
    }
}

// Función para mostrar la ruta en el mapa
function displayRoute(geometry) {
    if (routeSource) {
        map.removeLayer('route');
        map.removeSource('route');
    }

    const decoded = polyline.decode(geometry);
    const geojson = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'LineString',
            coordinates: decoded.map(coord => [coord[1], coord[0]]) // Invertir coordenadas para Mapbox
        }
    };

    map.addSource('route', {
        type: 'geojson',
        data: geojson
    });

    map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': 'red',
            'line-width': 3
        }
    });

    const bounds = new mapboxgl.LngLatBounds();
    decoded.forEach(coord => {
        bounds.extend([coord[1], coord[0]]); // Invertir coordenadas para Mapbox
    });
    map.fitBounds(bounds, { padding: 50 });
}

// Agregar evento click al botón "Optimizar Ruta"
document.getElementById('optimizeRouteBtn').addEventListener('click', optimizeRoute);

// Agregar evento change al selector de día
document.getElementById('visitDay').addEventListener('change', function() {
    // Eliminar la capa de la ruta cuando cambia el día
    if (routeSource) {
        map.removeLayer('route');
        map.removeSource('route');
        routeSource = null;
    }

    // Eliminar el marcador de la ubicación del usuario cuando cambia el día
    if (userMarker) {
        userMarker.remove();
        userMarker = null;
    }
});