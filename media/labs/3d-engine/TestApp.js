function TestApp() {
  this.world;
  this.scene;
  this.cube;

  this.init();
}

TestApp.prototype.init = function() {
  this.createWorld();
  this.populateScene();
  // this.createCustomMaterialMesh();
  this.createAnimations();
}

TestApp.prototype.createWorld = function() {
  console.log(Oomph3D);
  this.world = new Oomph3D.World('test-canvas');
  this.scene = new Oomph3D.Scene();
  this.camera = new Oomph3D.cameras.FreeCamera({
    fieldOfView: 60,
    z: 500,
    x: 500,
    y: 100,
    distanceMultiplier: 0,
  });
  this.camera.angleY = 20;
  this.camera.angleX = 14;
  this.scene.camera = this.camera;

  this.light = new Oomph3D.lights.DirectionalLight({
    directionX: Math.cos(Oomph3D.utils.degreesToRadians(120)),
    directionY: 0,
    directionZ: Math.sin(Oomph3D.utils.degreesToRadians(120)),
  });

  this.scene.addLight(this.light);
  this.world.scene = this.scene;
  this.world.onUpdate = this.onUpdate.bind(this);
}

TestApp.prototype.populateScene = function() {
  this.cube = new Oomph3D.meshes.Cube({
    width: 100,
    material: new Oomph3D.materials.Texture('TestAppAssets/teapot.jpg'),
  });
  this.cube.x = 200;
  this.cube.z = 50;

  this.cylinderMaterial = new Oomph3D.materials.FlatColor({ r: 255, g: 0, b: 0 });
  this.cylinder = new Oomph3D.meshes.Cylinder({
    radius: 50,
    height: 100,
    material: this.cylinderMaterial,
  });
  this.cylinder.x = 600;
  this.cylinder.y = 400;

  this.cylinder2 = new Oomph3D.meshes.Cylinder({
    radius: 50,
    height: 100,
    material: new Oomph3D.materials.Texture('TestAppAssets/teapot.jpg'),
  });
  this.cylinder2.x = 400;
  this.cylinder2.y = 400;

  this.sphere = new Oomph3D.meshes.Sphere({
    radius: 50,
    material: new Oomph3D.materials.FlatColor({ r: 0, g: 200, b: 200 }),
  });

  this.fShape = new Oomph3D.meshes.FShape({
    width: 100,
    material: new Oomph3D.materials.Texture('TestAppAssets/teapot.jpg'),//new Oomph3D.materials.FlatColor({ r: 200, g: 0, b: 200 }),
  });

  this.fShape.x = 50;
  this.fShape.y = 0;

  this.sphere = new Oomph3D.meshes.Sphere({
    radius: 50,
    material: new Oomph3D.materials.Texture('TestAppAssets/crate-2.jpg'),//new Oomph3D.materials.FlatColor({ r: 200, g: 200, b: 0 }),
  });
  this.sphere.x = 300;
  this.sphere.y = 200;
  this.sphere.rotationX = 0;

  this.plane = new Oomph3D.meshes.Plane({
    width: 100,
    widthDivisions: 2,
    depthDivisions: 2,
    material: new Oomph3D.materials.Texture('TestAppAssets/teapot.jpg'),
  });
  this.plane.rotationX = 90;

  this.modalLoader = new Oomph3D.loaders.ObjLoader('TestAppAssets/girl.obj', meshData => {
    this.girlMesh = new Oomph3D.meshes.Mesh({
      vertices: meshData.vertices,
      normals: meshData.normals,
      indices: meshData.indices,
      uvs: meshData.uvs,
      material: new Oomph3D.materials.Texture('TestAppAssets/girl.png'),
    });
    this.girlMesh.scale = 24;
    this.girlMesh.x = 300;
    this.girlMesh.z = 200;
    this.scene.addChild(this.girlMesh);
  });

  this.scene.addChild(this.fShape);
  this.scene.addChild(this.cube);
  this.scene.addChild(this.cylinder);
  this.scene.addChild(this.cylinder2);
  this.scene.addChild(this.sphere);
  this.scene.addChild(this.plane);
  if (this.camera.lookAt) this.camera.lookAt(this.cube);
  if (this.camera.followMesh) this.camera.followMesh(this.cube, 400);
  if (this.camera.enableControls) this.camera.enableControls();
}

TestApp.prototype.createCustomMaterialMesh = function() {
  const testMaterial = new Oomph3D.materials.BaseMaterial();
  testMaterial.colorInUnits = {r: 0, g: 0.5, b: 0.5, a: 1};
  testMaterial.vertexShader = `#version 300 es
    in vec4 a_position;
    in vec3 a_normal;

    // Uniforms
    uniform mat4 u_matrix;
    uniform mat4 u_worldMatrix;

    out vec3 v_normal;

    highp float random(vec2 co) {
      highp float a = 12.9898;
      highp float b = 78.233;
      highp float c = 43758.5453;
      highp float dt= dot(co.xy ,vec2(a,b));
      highp float sn= mod(dt,3.14);
      return fract(sin(sn) * c);
    }

    void main() {
      vec4 newPos = a_position;
      newPos.y = random(vec2(a_position.xz)) * 50.0;
      gl_Position = u_matrix * newPos;
      v_normal = mat3(u_worldMatrix) * a_normal;
    }
  `;
  testMaterial.fragmentShader = `#version 300 es
    precision mediump float;

    in vec3 v_normal;

    uniform vec3 u_reverseLightDirection;
    uniform vec3 u_lightColor;
    uniform vec4 u_color;

    out vec4 outColor;

    void main() {
      vec3 normal = normalize(v_normal);

      float light = dot(normal, u_reverseLightDirection);

      outColor = u_color;
      outColor.rgb *= light * u_lightColor;
    }
  `;

  this.customCube = new Oomph3D.meshes.Plane({
    width: 100,
    widthDivisions: 10,
    depthDivisions: 10,
    material: testMaterial,
  });
  this.customCube.rotationX = 45;
  this.customCube.x = 500;
  this.customCube.z = 150;

  this.scene.addChild(this.customCube);
}

TestApp.prototype.createAnimations = function() {

  // Mesh rotation
  Oomph3D.Motion.start(this.sphere, {
    to: { rotationX: 360 },
    duration: 10000,
    easing: Oomph3D.Motion.easing.inOutQuad,
    bounce: true,
  });

  Oomph3D.Motion.start(this.cylinder2, {
    to: { rotationX: 360 },
    duration: 3000,
    loops: true,
  });

  // Mesh rotation
  Oomph3D.Motion.timeline(this.cylinder, [
    {
      to: { rotationX: 180 },
      duration: 2000,
      easing: Oomph3D.Motion.easing.inOutQuad,
    },
    {
      to: { rotationZ: 180 },
      duration: 2000,
      easing: Oomph3D.Motion.easing.inOutQuad,
    },
  ],
  {
    bounce: true,
  });

  // rgba colour
  Oomph3D.Motion.start(this.cylinderMaterial, {
    to: { color: {r: 0, g: 255, b: 0, a: 1} },
    duration: 2000,
    bounce: true,
  });

  /*
  // Colour string
  Oomph3D.Motion.start('rgba(255, 255, 255, 1)', {
    to: 'rgba(0, 0, 0, 0)',
    duration: 2000,
    onUpdate: function(data) {
      console.log(data.value);
    },
  });
  */
  /*
  // Number
  Oomph3D.Motion.start(10, {
    to: 200,
    duration: 2000,
    onUpdate: function(data) {
      console.log(data.value);
    },
  });
  */

  /*
  // Number array
  Oomph3D.Motion.start([10, 10, 10], {
    to: [200, 200, 200],
    duration: 2000,
    onUpdate: function(data) {
      console.log(data.value);
    },
  });
  */
}

TestApp.prototype.onUpdate = function(elapsedTime) {
  this.fShape.rotationX += (elapsedTime * 60);
  //this.fShape.rotationY += (elapsedTime * 60);

}

var app = new TestApp();
