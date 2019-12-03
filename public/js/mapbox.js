/* eslint-disable */
export const displayMap = locations => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoibnZhbGxlZSIsImEiOiJjazNjdGJidGIwenBjM2pteHkzaTMwazgzIn0.ViiXGUKd1C3M3-Q79Bn9Gg';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/nvallee/ck3ctektf1wqz1cpi5cwgngmk',
    scrollZoom: false
    // center: [-96.7, 39.2],
    // zoom: 3,
    // interactive: false
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    // create marker
    const el = document.createElement('div');
    el.className = 'marker';
    // add the marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // add popup
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  });
};
