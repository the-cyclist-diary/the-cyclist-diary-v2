/**
 * Initialisation des cartes Leaflet et graphiques d'élévation uPlot
 * pour le site the-cyclist-diary
 */

(function () {
    'use strict';

    /**
     * Initialise une carte Leaflet avec la trace
     * @param {string} mapId - ID de l'élément DOM de la carte
     * @param {Array<{lat: number, lon: number, elevation: number}>} points
     * @returns {Object} Instance de la carte et de la polyline
     */
    function initializeMap(mapId, points) {
        // Créer la carte
        const map = L.map(mapId, {
            zoomControl: true,
            scrollWheelZoom: true,
            fullscreenControl: true
        });

        // Ajouter la couche OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19
        }).addTo(map);

        // Convertir les points pour Leaflet (lat, lon)
        const latLngs = points.map(p => [p.lat, p.lon]);

        // Créer la polyline
        const polyline = L.polyline(latLngs, {
            color: '#e9ba3a',
            weight: 3,
            opacity: 0.8
        }).addTo(map);

        // Ajuster la vue pour afficher toute la trace
        map.fitBounds(polyline.getBounds(), {
            padding: [30, 30]
        });

        // Créer un marqueur pour l'interaction (initialement caché)
        const marker = L.circleMarker([0, 0], {
            radius: 6,
            fillColor: '#3498db',
            color: '#fff',
            weight: 2,
            opacity: 0,
            fillOpacity: 0
        }).addTo(map);

        return { map, polyline, marker, latLngs };
    }

    /**
     * Initialise le graphique d'élévation avec uPlot
     * @param {string} chartId - ID de l'élément DOM du graphique
     * @param {Array<{lat: number, lon: number, elevation: number}>} points - Points GPS avec élévation
     * @param {number} totalDistanceKm - Distance totale en kilomètres
     * @param {Function} onHover - Callback pour l'interaction
     * @returns {Object} Instance du graphique uPlot
     */
    function initializeElevationChart(chartId, points, totalDistanceKm, onHover) {
        const container = document.getElementById(chartId);
        if (!container) return null;

        // Calculer les distances cumulées (répartition linéaire)
        const distances = points.map((_, i) => (i / (points.length - 1)) * totalDistanceKm);

        // Extraire les élévations
        const elevations = points.map(p => p.elevation);

        // Calculer la largeur disponible de manière robuste
        function getContainerWidth() {
            const parentWidth = container.parentElement?.offsetWidth || container.parentElement?.clientWidth;
            const containerWidth = container.offsetWidth || container.clientWidth;
            const viewportWidth = window.innerWidth;

            // Prendre la plus petite valeur non nulle
            const widths = [parentWidth, containerWidth, viewportWidth].filter(w => w > 0);
            const width = Math.min(...widths);

            // Soustraire les marges/padding (estimation)
            return Math.max(width - 40, 200);
        }

        // Options du graphique
        const opts = {
            width: getContainerWidth(),
            height: 200,
            series: [
                {
                    label: 'Distance (km)',
                    value: (u, v) => v == null ? '-' : v.toFixed(2).replace('.', ',') + ' km'
                },
                {
                    label: 'Altitude (m)',
                    stroke: '#e9ba3a',
                    fill: '#fff1ca91',
                    width: 2,
                    value: (u, v) => v == null ? '-' : Math.round(v) + ' m'
                }
            ],
            axes: [
                {
                    label: 'Distance (km)',
                    labelSize: 20,
                    space: 40,
                    values: (u, vals) => vals.map(v => v.toFixed(1).replace('.', ','))
                },
                {
                    label: 'Altitude (m)',
                    labelSize: 30,
                    space: 50
                }
            ],
            cursor: {
                drag: {
                    x: false,
                    y: false
                }
            },
            hooks: {
                setCursor: [
                    (u) => {
                        const idx = u.cursor.idx;
                        if (idx !== null && onHover) {
                            onHover(idx);
                        }
                    }
                ]
            },
            scales: {
                x: {
                    time: false
                }
            }
        };

        // Données du graphique
        const data = [
            distances,
            elevations
        ];

        // Créer le graphique
        const plot = new uPlot(opts, data, container);

        // Responsive: redimensionner le graphique
        const resizeObserver = new ResizeObserver(() => {
            const newWidth = getContainerWidth();
            if (newWidth > 0) {
                plot.setSize({
                    width: newWidth,
                    height: 200
                });
            }
        });
        resizeObserver.observe(container);

        return plot;
    }

    /**
     * Initialise une carte interactive avec profile d'élévation
     * @param {string} mapId - ID de l'élément DOM de la carte
     * @param {string} chartId - ID de l'élément DOM du graphique
     * @param {string} jsonUrl - URL du fichier .polyline.json
     */
    async function initializeAdventureMap(mapId, chartId, jsonUrl) {
        try {
            // Charger et décoder les données avec métadonnées
            const { points, metadata } = await window.PolylineDecoder.loadPolylineWithMetadata(jsonUrl);

            if (!points || points.length === 0) {
                console.error('Aucun point trouvé dans le fichier polyline');
                return;
            }

            // Initialiser la carte
            const { map, marker, latLngs } = initializeMap(mapId, points);

            // Initialiser le graphique avec interaction
            const chart = initializeElevationChart(chartId, points, metadata.distanceKm || 0, (idx) => {
                if (idx >= 0 && idx < latLngs.length) {
                    const latLng = latLngs[idx];
                    marker.setLatLng(latLng);
                    marker.setStyle({
                        opacity: 1,
                        fillOpacity: 0.8
                    });
                }
            });

            // Cacher le marqueur quand la souris quitte le graphique
            const chartContainer = document.getElementById(chartId);
            if (chartContainer) {
                chartContainer.addEventListener('mouseleave', () => {
                    marker.setStyle({
                        opacity: 0,
                        fillOpacity: 0
                    });
                });
            }

            // Afficher les métadonnées
            displayMetadata(metadata);

        } catch (error) {
            console.error('Erreur lors de l\'initialisation de la carte:', error);

            // Afficher un message d'erreur à l'utilisateur
            const mapElement = document.getElementById(mapId);
            if (mapElement) {
                mapElement.innerHTML = '<div style="padding: 20px; text-align: center; color: #e74c3c;">Erreur lors du chargement de la carte</div>';
            }
        }
    }

    /**
     * Affiche les métadonnées de l'aventure dans le DOM
     * @param {Object} metadata - Métadonnées du fichier polyline
     */
    function displayMetadata(metadata) {
        // Distance
        const distanceEl = document.getElementById('adventure-distance');
        if (distanceEl && metadata.distanceKm) {
            distanceEl.textContent = metadata.distanceKm.toFixed(2).replace('.', ',') + ' km';
        }

        // Durée
        const durationEl = document.getElementById('adventure-duration');
        if (durationEl && metadata.durationFormatted) {
            durationEl.textContent = metadata.durationFormatted + ' h';
        }

        // Dénivelé
        const elevationEl = document.getElementById('adventure-elevation');
        if (elevationEl && metadata.elevationGainM) {
            elevationEl.textContent = Math.round(metadata.elevationGainM).toLocaleString('fr-FR') + ' m';
        }

        // Vitesse
        const speedEl = document.getElementById('adventure-speed');
        if (speedEl && metadata.averageSpeedKmh) {
            speedEl.textContent = metadata.averageSpeedKmh.toFixed(2).replace('.', ',') + ' km/h';
        }
    }

    // Exposer la fonction d'initialisation globalement
    window.initializeAdventureMap = initializeAdventureMap;

})();
