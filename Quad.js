var Quad = function(gl)
{
	this.vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array( [ 
               -1.0, -1.0,
               -1.0,  1.0,
                1.0, -1.0,
                1.0, 1.0 ] ),
                gl.STATIC_DRAW);
    this.vertexBuffer.itemSize = 2;
    this.vertexBuffer.numItems = 4;
	this.vertexShader = gl.createShader(gl.VERTEX_SHADER);
	
	
	// a ping-pong hoz hasznalt texturak beallitasa 
	this.textures =[];
	this.sampleCount = 0;
	this.framebuffer = gl.createFramebuffer();
	for(i = 0; i < 2; i++) 
	{
		this.textures[i] = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.textures[i]);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 800, 800, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
    }
	gl.bindTexture(gl.TEXTURE_2D, null);
	
    gl.shaderSource(this.vertexShader, vsQuadSrc );
	
    gl.compileShader(this.vertexShader);
    output.textContent += gl.getShaderInfoLog(this.vertexShader);
	this.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	
    gl.shaderSource(this.fragmentShader, psTraceSrc );
	
    gl.compileShader(this.fragmentShader);
    output.textContent +=   gl.getShaderInfoLog(this.fragmentShader); 
				
	this.program = gl.createProgram();
    gl.attachShader(this.program, this.vertexShader);
    gl.attachShader(this.program, this.fragmentShader);
    gl.linkProgram(this.program);
    output.textContent += gl.getProgramInfoLog(this.program);
	this.positionAttributeIndex = gl.getAttribLocation(this.program, 'vPosition');
	
	this.viewDirMatrixLocation = gl.getUniformLocation(this.program,'viewDirMatrix');
    this.eyeLocation = gl.getUniformLocation(this.program,'eye');
	

	this.materialsLocation = gl.getUniformLocation(this.program,'materials');
	this.textureLocation = gl.getUniformLocation(this.program,'texture');
	this.sampleCountLocation = gl.getUniformLocation(this.program,'sampleCount');

	this.materialData =   new Float32Array(16*4);


	this.materialData[0] = 1;
    this.materialData[1] = 1;
    this.materialData[2] = 1;
    this.materialData[3] = 0;
	
	this.materialData[4] = 0;
    this.materialData[5] = 1;
    this.materialData[6] = 0;
    this.materialData[7] = 0;
	
	this.materialData[8] = 1;
    this.materialData[9] = 1;
    this.materialData[10] = 0;
    this.materialData[11] = 0;
} // Quad constructor ends


Quad.prototype.makeSphere = function(){
    return new Matrix4( 1.0, 0.0, 0.0, 0.0,
                        0.0, 1.0, 0.0, 0.0,
                        0.0, 0.0, 1.0, 0.0,                        
                        0.0, 0.0, 0.0,-1.0);
  }


Quad.prototype.draw = function(gl, camera)  {
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.enableVertexAttribArray( this.positionAttributeIndex);
	gl.vertexAttribPointer( this.positionAttributeIndex,2, gl.FLOAT, false, 8, 0);
		  
		  

    gl.uniform4fv(this.materialsLocation, this.materialData);
	viewDirMatrixData = new Float32Array(16);
	camera.viewDirMatrix.copyIntoArray(viewDirMatrixData, 0);
	gl.uniformMatrix4fv(this.viewDirMatrixLocation, false, viewDirMatrixData);
	gl.uniform3f(this.eyeLocation, camera.position.x, camera.position.y, camera.position.z);
	gl.uniform1i(this.textureLocation, 0);
	gl.uniform1i(this.sampleCountLocation, this.sampleCount);
 
    gl.bindTexture(gl.TEXTURE_2D, this.textures[0]);
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER,	 gl.COLOR_ATTACHMENT0,	gl.TEXTURE_2D, this.textures[1], 0);

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	
	tmpTexture = this.textures[0];
    this.textures[0] = this.textures[1];
    this.textures[1] = tmpTexture;
    this.sampleCount++;    
     
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[0]);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  }
  
  