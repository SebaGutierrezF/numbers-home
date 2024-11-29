// Importar estilos
import './styles/main.css';

let map = null;
let marker = null;

// Coordenadas de países
const countryCoordinates = {
  'US': { lat: 37.0902, lng: -95.7129 },
  'GB': { lat: 55.3781, lng: -3.4360 },
  'ES': { lat: 40.4637, lng: -3.7492 },
  'CL': { lat: -35.6751, lng: -71.5430 },
};

// Función para inicializar el mapa
function initMap() {
  const mapContainer = document.getElementById('map');
  if (!mapContainer) {
    console.error('Contenedor del mapa no encontrado');
    return false;
  }

  try {
    if (!map) {
      map = L.map('map', {
        center: [0, 0],
        zoom: 2
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: ' OpenStreetMap contributors'
      }).addTo(map);

      // Forzar actualización del tamaño del mapa
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
    return true;
  } catch (error) {
    console.error('Error al inicializar el mapa:', error);
    return false;
  }
}

// Función para validar el número de teléfono
async function validatePhoneNumber(phoneNumber) {
  try {
    const apiKey = import.meta.env.VITE_NUMLOOKUP_API_KEY;
    if (!apiKey) {
      throw new Error('API key no configurada');
    }

    const response = await fetch(`https://api.numlookupapi.com/v1/validate/${phoneNumber}?apikey=${apiKey}`);
    if (!response.ok) {
      throw new Error('Error en la respuesta de la API');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error validando número:', error);
    return { error: error.message };
  }
}

// Función para actualizar el mapa
function updateMap(countryCode) {
  const mapContainer = document.getElementById('map');
  if (!mapContainer) return;

  // Mostrar el contenedor del mapa
  mapContainer.classList.remove('hidden');

  // Asegurarse que el mapa esté inicializado
  if (!map && !initMap()) {
    console.error('No se pudo inicializar el mapa');
    return;
  }

  const coordinates = countryCoordinates[countryCode];
  if (!coordinates) {
    console.warn('Coordenadas no disponibles para:', countryCode);
    return;
  }

  // Eliminar marcador anterior si existe
  if (marker) {
    map.removeLayer(marker);
  }

  // Añadir nuevo marcador y centrar el mapa
  marker = L.marker([coordinates.lat, coordinates.lng]).addTo(map);
  map.setView([coordinates.lat, coordinates.lng], 4);
  map.invalidateSize();
}

// Función para mostrar resultados
function displayResult(data) {
  const resultContent = document.querySelector('.result-content');
  const resultDiv = document.getElementById('result');

  if (!resultContent || !resultDiv) {
    console.error('Elementos de resultado no encontrados');
    return;
  }

  if (!data || data.error) {
    resultContent.innerHTML = `
      <div class="result-item error">
        <span>Error: ${data?.error || 'Error desconocido al validar el número'}</span>
      </div>
    `;
    resultDiv.classList.remove('hidden');
    return;
  }

  resultContent.innerHTML = `
    <div class="result-item">
      <span>Número:</span>
      <span>${data.phone || 'No disponible'}</span>
    </div>
    <div class="result-item">
      <span>País:</span>
      <span>${data.country_name || 'No disponible'}</span>
    </div>
    <div class="result-item">
      <span>Código de país:</span>
      <span>${data.country_prefix || 'No disponible'}</span>
    </div>
    <div class="result-item">
      <span>Formato internacional:</span>
      <span>${data.international_format || 'No disponible'}</span>
    </div>
    <div class="result-item">
      <span>Válido:</span>
      <span>${data.valid ? ' Sí' : ' No'}</span>
    </div>
  `;

  resultDiv.classList.remove('hidden');
  
  if (data.country_code) {
    updateMap(data.country_code);
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  const validateButton = document.getElementById('validate');
  const phoneInput = document.getElementById('phone');

  if (!validateButton || !phoneInput) {
    console.error('Elementos del formulario no encontrados');
    return;
  }

  validateButton.addEventListener('click', async () => {
    const phoneNumber = phoneInput.value.trim();
    if (!phoneNumber) {
      alert('Por favor ingresa un número telefónico');
      return;
    }

    validateButton.disabled = true;
    validateButton.textContent = 'Validando...';

    try {
      const result = await validatePhoneNumber(phoneNumber);
      displayResult(result);
    } catch (error) {
      console.error('Error:', error);
      displayResult({ error: 'Error al procesar la solicitud' });
    } finally {
      validateButton.disabled = false;
      validateButton.textContent = 'Validar';
    }
  });
});
