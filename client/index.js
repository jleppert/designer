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
  return parseInt((val * units.mm).toFixed());
}

var scene = new THREE.Scene();
var width = window.innerWidth;
var height = window.innerHeight;
var camera = new THREE.OrthographicCamera(width / - 2, width / 2, height / 2, height / - 2, -2000, 2000);

camera.zoom = 0.5;

window.camera = camera;

var gridHelper = new THREE.GridHelper( mm(200), mm(5) );
gridHelper.setColors(0xff0000, 0x666666);
gridHelper.rotation.x = 90 * Math.PI / 180;
//scene.add( gridHelper );

//The X axis is red. The Y axis is green. The Z axis is blue.
function buildAxes(length) {
  var axes = new THREE.Object3D();

  axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( length, 0, 0 ), 0xFF0000, false ) ); // +X
  axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( -length, 0, 0 ), 0xFF0000, true) ); // -X
  axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, length, 0 ), 0x00FF00, false ) ); // +Y
  axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, -length, 0 ), 0x00FF00, true ) ); // -Y
  axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, length ), 0x0000FF, false ) ); // +Z
  axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, -length ), 0x0000FF, true ) ); // -Z

  return axes;
}

function buildAxis(src, dst, colorHex, dashed) {
  var geom = new THREE.Geometry(),
      mat;

  var d = 4;
  if(dashed) {
    mat = new THREE.LineDashedMaterial({ linewidth: 3, color: colorHex, dashSize: 3*d, gapSize: 3*d });
  } else {
    mat = new THREE.LineBasicMaterial({ linewidth: 3, color: colorHex });
  }

  geom.vertices.push( src.clone() );
  geom.vertices.push( dst.clone() );
  geom.computeLineDistances();

  var axis = new THREE.Line( geom, mat, THREE.LinePieces );

  return axis;
}

var axes = buildAxes( 1000 );
scene.add( axes );

var ambient = new THREE.AmbientLight(0x404040);
  scene.add(ambient);

  var light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(100, 100, 50);
  scene.add(light);

  var hemLight = new THREE.HemisphereLight(0xffe5bb, 0xFFBF00, .1);
scene.add(hemLight);




var renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);

camera.position.z = 1;
camera.position.x = 0;
camera.position.y = 0;

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

var inchToMetric = 25.4;
var plate = new Plate(mm(127), mm(102), mm(2.4));
var plateHolder = new PlateHolder(plate, {
  border: mm(10),
  inset: mm(1),
  apetureBorder: mm(3),
  mountHole: mm((13/64) * inchToMetric),
  thickness: 3.5
});

window.plate = plate;
//scene.add(plate.mesh);
scene.add(plateHolder.mesh);

//camera.up.set(new THREE.Vector3(0, 1, 0));
camera.lookAt(scene.position);

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
  var thickness = (plate.thickness + (config.inset * 2)) * config.thickness;
  var csg = CSG.cube({
    center: [0, 0, 0],
    radius: [(plate.width + config.border + config.inset) / 2, (plate.height + config.border + config.inset) / 2, thickness / 2]
  });

  var apeture = CSG.cube({
    center: [0, 0, 0],
    radius: [(plate.width - config.apetureBorder) / 2, (plate.height - config.apetureBorder) / 2, thickness / 2]
  });

  var plateInset = CSG.cube({
    center: [0, 0, mm(5)],
    radius: [(plate.width + config.inset) / 2, (plate.height + (config.inset * 2)) / 2, (plate.thickness + config.inset) / 2]
  });

  var mount = CSG.cube({
    center: [0, -(plate.height + config.border) / 2 + -thickness/2 + -config.inset/2, 0],
    radius: [(plate.width + config.border + config.inset) / 2, thickness / 2, thickness / 2]
  });

  var opening = CSG.cube({
    center: [0, (plate.height + config.border + config.inset) / 2, mm(5)],
    radius: [(plate.width + config.border + config.inset) / 2, thickness / 2, (plate.thickness + config.inset) / 2]
  });

  var center = 0;
  var count = Math.floor((plate.width + config.border + config.inset - config.mountHole) / mm(inchToMetric));

  var start = 0;
  var isEven = count % 2 === 0;
  start = center - Math.floor(count / 2) * mm(inchToMetric);

  var csg = this.csg = csg.subtract(apeture).union(mount).subtract(plateInset).subtract(opening);
  //even cases need center hole var yOffset = - ((plate.height + config.border) / 2) + (thickness / 2); var holeStart = [center, yOffset, -(thickness / 2)]; var holeEnd = [center, yOffset, (thickness / 2)]; var holeRadius = config.mountHole / 2; var a = CSG.cylinder({ radius: holeRadius, start: holeStart, end: holeEnd }); var b = a.clone(); var translation = new THREE.Vector3(0, -yOffset, -yOffset); b = rotate(b, new THREE.Euler(Math.PI  / 2, 0, 0, 'XYZ'), translation); this.csg = this.csg.subtract(a).subtract(b); //
  for(var i = 0; i<=count + 1; i++) {
    var yOffset =  - (plate.height + thickness)  / 2;
    var holeStart = [(start + i * mm(inchToMetric)), yOffset, -(thickness)];
    var holeEnd = [(start + i * mm(inchToMetric)), yOffset, (thickness)];
    var holeRadius = config.mountHole / 2;
    //console.log("yOffset: ", yOffset, " holeStart: ", holeStart, " holeEnd: ", holeEnd, " holeRadius: ", holeRadius);
    console.log(" count: ", count, "condition: ", plate.width/2 - config.border, " holeStart[0]: ", holeStart[0]);
    if (holeStart[0] > (- plate.width / 2 + config.border) && holeStart[0] < plate.width/2 - config.border) {
      var a = CSG.cylinder({ radius: holeRadius, start: holeStart, end: holeEnd });
      var b = a.clone();
      var translation = new THREE.Vector3(0, -yOffset, -yOffset);
      b = rotate(b, new THREE.Euler(Math.PI  / 2, 0, 0, 'XYZ'), translation);
      this.csg = this.csg.subtract(a).subtract(b);
    }
  }




  this.geometry = THREE.CSG.fromCSG(this.csg);
  this.material = new THREE.MeshLambertMaterial({ color: 0xffffff, wireframe: false });
  this.mesh = new THREE.Mesh(this.geometry, this.material);

  this.inset = config.inset;
  this.border = config.border;
}

function rotate(csg, rotation, translation) {
  return THREE.CSG.toCSG(THREE.CSG.fromCSG(csg), translation, rotation);
}

/*function makeCircles(points, radius, geometry, bufferWidth) {
  points = points.sort((a, b) => a.x - b.x);
  var minX = points[0].x;
  var maxX = points[points.length - 1].x;
  var xWidth = maxX - minX;
  
  var fullCircleWidth = 2 * radius + bufferWidth; //width of circle AND buffer 
  var numHoles = Math.floor(xWidth / fullCircleWidth);
  var offset = ((xWidth / fullCircleWidth) - numHoles) * fullCircleWidth / 2; // number of holes doesn't always evenly divide xWidth, that's why we take
  //Math.floor, but this means there will be some extra width to be apportioned. We find this width ('offset') and divide by two so we can evenly distribute on both sides

  for (var i = 0; i < numHoles; i++) {
    // you need to write placehole, it takes an x and y coordinate on a geometry and draws a circle of radius r 
    placeHole(i * fullCircleWidth + offset, findYClosestToX(i*fullCircleWidth+offset, points), radius, geometry); 
  }
}

//Assuming the points are ordered on x, we can find the nearest y coordinate by just finding the first point that's larger than x and 
//using its x coordinate. This is only accurate if points is dense - otherwise you need to do some averaging scheme
function findYClosestToX(x, points) {
  for (var i = 0; i < points.length; i++) {
    if (points[i] >= x) {
      return points[i].y;
    }
  }
}*/




var save = document.createElement('button');
save.innerHTML = 'Save';
document.body.appendChild(save);
save.className = 'save';

window.saveAs = require('filesaver.js').saveAs;
save.addEventListener('click', function() {
  exportSTL(scene, 'plate');
});

window.scene = scene;
