/**
 * Utilitaires pour décoder les polylines avec altitude
 * Compatible avec le format généré par the-cyclist-diary-editor
 */

/**
 * Décode une polyline Google standard (latitude/longitude)
 * @param {string} encoded - Polyline encodée
 * @returns {Array<[number, number]>} Tableau de [lat, lon]
 */
function decodePolyline(encoded) {
    const points = [];
    let index = 0;
    let lat = 0;
    let lon = 0;

    while (index < encoded.length) {
        // Décoder latitude
        let result = 0;
        let shift = 0;
        let b;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);

        const deltaLat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
        lat += deltaLat;

        // Décoder longitude
        result = 0;
        shift = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);

        const deltaLon = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
        lon += deltaLon;

        points.push([lat / 1e5, lon / 1e5]);
    }

    return points;
}

/**
 * Décode les altitudes encodées en Base64 (Int16Array en décimètres)
 * @param {string} base64String - String Base64
 * @returns {Array<number>} Altitudes en mètres
 */
function decodeElevations(base64String) {
    const binary = atob(base64String);
    const bytes = new Uint8Array(binary.length);
    
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    
    const int16Array = new Int16Array(bytes.buffer);
    return Array.from(int16Array).map(e => e / 10);
}

/**
 * Décode un fichier polyline complet et retourne les points avec altitude
 * @param {Object} data - Objet JSON chargé depuis .polyline.json
 * @returns {Array<{lat: number, lon: number, elevation: number}>}
 */
function decodePolylineWithElevation(data) {
    // Gérer l'encodage Base64 pour le path si nécessaire
    let pathString = data.path;
    if (data.pathEncoding === 'base64-polyline') {
        pathString = atob(data.path);
    }
    
    const path = decodePolyline(pathString);
    const elevations = decodeElevations(data.elevations);
    
    if (path.length !== elevations.length) {
        throw new Error(`Point count mismatch: ${path.length} coords vs ${elevations.length} elevations`);
    }
    
    return path.map(([lat, lon], i) => ({
        lat,
        lon,
        elevation: elevations[i]
    }));
}

/**
 * Charge et décode un fichier polyline depuis une URL
 * @param {string} url - URL du fichier .polyline.json
 * @returns {Promise<Array<{lat: number, lon: number, elevation: number}>>}
 */
async function loadPolyline(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status} lors du chargement de ${url}`);
    }
    
    const text = await response.text();
    
    try {
        const data = JSON.parse(text);
        return decodePolylineWithElevation(data);
    } catch (error) {
        console.error('Erreur de parsing JSON:', error.message);
        console.error('Position de l\'erreur:', error);
        console.error('Extrait du JSON:', text.substring(0, 500));
        throw new Error(`Erreur de parsing JSON: ${error.message}. Vérifiez le format du fichier ${url}`);
    }
}

/**
 * Charge un fichier polyline avec ses métadonnées
 * @param {string} url - URL du fichier .polyline.json
 * @returns {Promise<{points: Array, metadata: Object}>}
 */
async function loadPolylineWithMetadata(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status} lors du chargement de ${url}`);
    }
    
    const text = await response.text();
    
    try {
        const data = JSON.parse(text);
        const points = decodePolylineWithElevation(data);
        
        return {
            points: points,
            metadata: data.metadata || {}
        };
    } catch (error) {
        console.error('Erreur de parsing JSON:', error.message);
        console.error('Position de l\'erreur:', error);
        console.error('Extrait du JSON:', text.substring(0, 500));
        throw new Error(`Erreur de parsing JSON: ${error.message}. Vérifiez le format du fichier ${url}`);
    }
}

/**
 * Calcule les statistiques d'un tracé
 * @param {Array<{lat: number, lon: number, elevation: number}>} points
 * @returns {Object} Statistiques (min, max, gain, perte)
 */
function calculateElevationStats(points) {
    let minElevation = Infinity;
    let maxElevation = -Infinity;
    let totalGain = 0;
    let totalLoss = 0;
    
    points.forEach((point, i) => {
        minElevation = Math.min(minElevation, point.elevation);
        maxElevation = Math.max(maxElevation, point.elevation);
        
        if (i > 0) {
            const diff = point.elevation - points[i - 1].elevation;
            if (diff > 0) {
                totalGain += diff;
            } else {
                totalLoss += Math.abs(diff);
            }
        }
    });
    
    return {
        minElevation: Math.round(minElevation),
        maxElevation: Math.round(maxElevation),
        totalGain: Math.round(totalGain),
        totalLoss: Math.round(totalLoss)
    };
}

// Export pour utilisation en browser
window.PolylineDecoder = {
    decodePolyline,
    decodeElevations,
    decodePolylineWithElevation,
    loadPolyline,
    loadPolylineWithMetadata,
    calculateElevationStats
};
