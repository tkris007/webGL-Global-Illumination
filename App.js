var app;
var output;
lastTime = 0;

var App = function (canvas, output) {
    this.canvas = canvas;

    this.gl = canvas.getContext("experimental-webgl");
    if (this.gl == null) {
        output.textContent = ">>> No WebGL support <<<";
        return;
    }

    this.canvas.width = 800;
    this.canvas.height = 800;
	
	this.camera = new Camera();
	
	this.quad = new Quad(this.gl);
	
this.gl.viewport(0,0,this.canvas.width,this.canvas.height);


}

function start() {
    var canvas = document.getElementById("container");
    output = document.getElementById("output");
	
	app = new App(canvas, output);
	
	document.addEventListener('mozpointerlockchange', function(event){  app.pointerLockChange(event); }, false);
canvas.onclick = function(event) { app.clicked(event); } ;
document.onkeydown = function(event){  app.keyDown(event); };
document.onkeyup = function(event){  app.keyUp(event); };
document.onmousemove = function(event){  app.mouseMove(event);};
  
window.requestAnimationFrame(function (){ app.update();}); 


}
App.prototype.update = function()
{
    this.gl.clearColor(0.6, 0.0, 0.3, 1.0);
    this.gl.clearDepth(1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
	
	time = new Date();
	dt = (time - lastTime) / 1000.0;
    lastTime = time;
	
	this.camera.update(dt);
	
	this.quad.draw(this.gl, this.camera);
	output.textContent = this.quad.sampleCount;
	window.requestAnimationFrame(function (){ app.update();});
}




App.prototype.clicked = function(event) {
 this.canvas.mozRequestPointerLock(); 
 //console.log('deb');
}

App.prototype.pointerLockChange = function(event) {
//console.log('loc');
    this.ownMouse = (this.canvas == document.mozPointerLockElement); 
  }
  
App.prototype.keyDown = function(event) {
    if (!this.ownMouse) return;
	this.quad.sampleCount = 0;
    this.camera.keydown(event.keyCode);
	//console.log('debkey');
  }
  
App.prototype.keyUp = function(event) {
    if (!this.ownMouse)  return;
	this.quad.sampleCount = 0;
    this.camera.keyup(event.keyCode);      
  }
  
App.prototype.mouseMove = function(event) {
//console.log('debmove');
    if (!this.ownMouse) return;
	//console.log('debmove');
	this.quad.sampleCount = 0;
    this.camera.mouseDelta.add( new Vector2(event.movementX, event.movementY));
    event.preventDefault();  
}
