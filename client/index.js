window.LiveReloadOptions = { host: 'localhost' };
require('livereload-js');
window.THREE = require('../node_modules/three/three.js');
require('./lib/OrthographicTrackballControls.js');
window.CSG = require('./lib/csg.js');
require('./lib/ThreeCSG.js');
var exportSTL = require('./lib/STLExporter.js');

var units = {
  screen: 1,
  //mm: 40, // 25 micron resolution per mm
  mm: 10, // 100 micron resolution
  inches: 10 * 25.4
};

function mm(val) {
  return (val * units.mm).toFixed();
}

var scene = new THREE.Scene();
var width = window.innerWidth;
var height = window.innerHeight;
var camera = new THREE.OrthographicCamera(width / - 2, width / 2, height / 2, height / - 2, -1000, 1000);
camera.zoom = 0.5;

window.camera = camera;
//The X axis is red. The Y axis is green. The Z axis is blue.
var axisHelper = new THREE.AxisHelper( 500 );
scene.add( axisHelper );

var size = 500;
var step = 50;
var gridHelper = new THREE.GridHelper( size, step );
//scene.add( gridHelper );


var ambient = new THREE.AmbientLight(0xffffff);
  scene.add(ambient);

  //var light = new THREE.DirectionalLight(0xffffff);
  //light.position = camera.position;
  //scene.add(light);




var renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);

camera.position.z = 1;
camera.position.x = 0;
camera.position.y = 0;

var controls = new THREE.OrthographicTrackballControls(camera);
controls.addEventListener('end', function() {

  var state = {
    p: camera.position.toArray(),
    r: camera.rotation.toArray(),
    u: camera.up.toArray(),
    z: camera.zoom
  };

  window.history.pushState({ position: camera.position.clone(), rotation: camera.rotation.clone(), up: camera.up.clone(), zoom: camera.zoom }, "", "/#" + JSON.stringify(state));
});

window.onpopstate = function(event) {
  if(event.state && event.state.position) {
    camera.position.x = event.state.position.x;
    camera.position.y = event.state.position.y;
    camera.position.z = event.state.position.z;

    camera.rotation.x = event.state.rotation.x;
    camera.rotation.y = event.state.rotation.y;
    camera.rotation.z = event.state.rotation.z;

    camera.up.x = event.state.up.x;
    camera.up.y = event.state.up.y;
    camera.up.z = event.state.up.z;

    camera.zoom = event.state.zoom;
    camera.updateProjectionMatrix();
  } else {
    controls.reset();
  }
}

var hash = window.location.hash;
if(hash) {
  var state = JSON.parse(hash.substr(1));

  camera.position.x = state.p[0];
  camera.position.y = state.p[1];
  camera.position.z = state.p[2];

  camera.rotation.x = state.r[0];
  camera.rotation.y = state.r[1];
  camera.rotation.z = state.r[2];

  camera.up.x = state.u[0];
  camera.up.y = state.u[1];
  camera.up.z = state.u[2];

  camera.zoom = state.z;
  camera.updateProjectionMatrix();
}

//this.mesh.rotation.x = 20 * Math.PI / 180;


var plate = new Plate(mm(102), mm(127), mm(2.4));

window.plate = plate;
scene.add(plate.mesh);

//camera.up.set(new THREE.Vector3(0, 1, 0));
camera.lookAt(scene.position);
function draw() {
	requestAnimationFrame(draw);
  controls.update();
  renderer.render(scene, camera);
}
draw();

function Plate(width, height, thickness) {
  this.csg = CSG.cube({
    center: [0, 0, 0],
    radius: [width / 2, height / 2, thickness / 2]
  });

  this.geometry = THREE.CSG.fromCSG(this.csg);
  this.material = new THREE.MeshLambertMaterial({ color: 0xff8080, transparent: true, opacity: 0.5 });

  //this.material = new THREE.MeshBasicMaterial( { color: 0x00ff00, wireframe: true } );
  this.mesh = new THREE.Mesh(this.geometry, this.material);

  //this.mesh.rotation.x = 90 * Math.PI / 180;

  console.log(this.geometry);

  this.width = width;
  this.height = height;
  this.thickness = thickness;
}

function PlateHolder(plate, config) {
  var thickness = (plate.thickness + (config.inset * 2)) * 2;
  this.csg = CSG.cube({
    center: [0, 0, 0],
    radius: [(plate.width + config.border) / 2, (plate.height + config.border) / 2, thickness / 2]
  });

  this.geometry = THREE.CSG.fromCSG(this.csg);

  this.inset = config.inset;
  this.border = config.border;
}

var save = document.createElement('button');
save.innerHTML = 'Save';
document.body.appendChild(save);
save.className = 'save';

window.saveAs = require('filesaver.js').saveAs;
save.addEventListener('click', function() {
  exportSTL(scene, 'plate');
});

window.scene = scene;
