// Development-only harness: not included in the production Vite entry point.
import { ensureLeafletAssets, ensureLeafletRotation, setMapInteractionForDrawing } from '../src/components/ProductMap';

const result = document.getElementById('result');
const button = document.getElementById('run');
const container = document.getElementById('map');
const frame = () => new Promise(resolve => requestAnimationFrame(resolve));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const log = message => { result.textContent += message + '\n'; };

try {
  const L = await ensureLeafletAssets();
  const ready = await ensureLeafletRotation(L);
  assert(ready, 'Extensão não carregada');
  const map = L.map(container, { rotate: true, touchRotate: true, dragRotate: true, shiftKeyRotate: true,
    rotateControl: false, zoomAnimation: false, inertia: false }).setView([41.6,12.5],15);
  setMapInteractionForDrawing(map, false);
  const Grid = L.GridLayer.extend({ createTile(coords) {
    const tile = document.createElement('div'); tile.className = 'test-tile';
    tile.textContent = 'N ↑ ' + coords.x + '/' + coords.y; return tile;
  }});
  new Grid().addTo(map);
  const company = L.marker([41.601,12.502], {icon:L.divIcon({className:'test-marker',html:'Empresa',iconSize:[70,24],iconAnchor:[35,24]})}).addTo(map);
  const visitor = L.circleMarker([41.6,12.5], {radius:7,color:'blue'}).addTo(map);
  const polygon = L.polygon([[41.599,12.499],[41.602,12.499],[41.602,12.503]], {color:'green'}).addTo(map);
  let clicked;
  map.on('click', event => { clicked = event.latlng; });
  map.on('rotate', () => { container.dataset.bearing = String(map.getBearing()); });
  result.textContent = 'Pronto. Pode girar com Shift + rolagem e testar os controles.\n';
  button.disabled = false;

  function touch(type, angle, distance = 100, empty = false) {
    const rect = container.getBoundingClientRect();
    const x = rect.left + 200, y = rect.top + 280, a = angle * Math.PI / 180;
    const touches = empty ? [] : [-1,1].map((side,index) => new Touch({
      identifier:index,target:container,clientX:x+side*Math.cos(a)*distance/2,clientY:y+side*Math.sin(a)*distance/2,
    }));
    container.dispatchEvent(new TouchEvent(type,{touches,targetTouches:touches,changedTouches:touches,bubbles:true,cancelable:true}));
  }

  button.onclick = async () => {
    button.disabled = true; result.textContent = '';
    try {
      assert(map.touchGestures.enabled() && !map.touchZoom.enabled(), 'Dois handlers de pinça ativos');
      const distance = visitor.getLatLng().distanceTo(company.getLatLng());
      for (const angle of [0,45,90,180,270]) {
        map.setBearing(angle); await frame();
        const point = map.latLngToContainerPoint(company.getLatLng());
        const roundTrip = map.containerPointToLatLng(point);
        assert(roundTrip.distanceTo(company.getLatLng()) < 3, 'Coordenadas desalinhadas em ' + angle);
        const rect = container.getBoundingClientRect();
        container.dispatchEvent(new MouseEvent('click',{clientX:rect.left+point.x,clientY:rect.top+point.y,bubbles:true}));
        assert(clicked?.distanceTo(company.getLatLng()) < 5, 'Toque selecionou outro ponto em ' + angle);
        const icon = company.getElement().getBoundingClientRect();
        assert(Math.abs(icon.left+35-rect.left-point.x)<2 && Math.abs(icon.bottom-rect.top-point.y)<2,'Marcador desalinhado');
        assert(visitor.getLatLng().distanceTo(company.getLatLng()) === distance, 'Distância geográfica alterada');
        assert(map.hasLayer(polygon), 'Desenho perdido');
      }
      log('PASS: marcadores, clique e distância em 0°, 45°, 90°, 180° e 270°');
      map.setBearing(45);
      map.panBy([40,25],{animate:false}); map.zoomIn();
      assert(map.getBearing() === 45, 'Zoom perdeu rotação');
      map.fitBounds([visitor.getLatLng(),company.getLatLng()],{padding:[48,48],maxZoom:16,animate:false});
      for (const marker of [visitor,company]) {
        const p = map.latLngToContainerPoint(marker.getLatLng());
        assert(p.x>=0 && p.x<=400 && p.y>=0 && p.y<=560,'Enquadramento deixou um marcador fora');
      }
      log('PASS: arrastar, zoom e enquadramento do visitante com a empresa');
      map.setBearing(0); map.setView([41.6,12.5],15);
      touch('touchstart',0); touch('touchmove',40); await frame(); touch('touchmove',70); await frame(); touch('touchend',70,100,true);
      map.touchGestures._stopRotateInertia();
      assert(Math.abs(map.getBearing()-30)<2, 'Gesto de dois dedos não girou');
      assert(map.dragging.enabled(), 'Arrasto ficou bloqueado depois do giro');
      const zoom = map.getZoom();
      touch('touchstart',0); touch('touchmove',0,200); await frame(); touch('touchend',0,200,true);
      assert(map.getZoom()>zoom,'Pinça não aumentou o zoom');
      log('PASS: giro e pinça com dois dedos; arrasto restaurado');
      setMapInteractionForDrawing(map,true);
      const bearing = map.getBearing();
      touch('touchstart',0); touch('touchmove',70); touch('touchend',70,100,true);
      assert(map.getBearing()===bearing && !map.dragging.enabled(),'Desenho não bloqueou os gestos');
      setMapInteractionForDrawing(map,false);
      assert(map.touchGestures.enabled() && !map.touchZoom.enabled() && map.dragging.enabled(),'Gestos não restaurados');
      log('PASS: desenho de área bloqueia e restaura gestos sem duplicar a pinça');
      company.bindPopup('Empresa próxima').openPopup(); await frame();
      assert(company.isPopupOpen(),'Balão não abriu após a rotação');
      log('PASS: balão do marcador continua abrindo');
      log('TODOS OS TESTES PASSARAM');
    } catch (error) { log('FAIL: ' + error.message); }
    finally { button.disabled = false; }
  };
} catch (error) { result.textContent = 'FAIL: ' + error.message; }
