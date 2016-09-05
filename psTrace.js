var psTraceSrc = 
` 	

	precision highp float;
		varying vec3 viewDir;
		uniform vec3 eye;
		uniform vec4 materials[16];
		mat4 quads[16];
		varying vec2 tex;
		uniform sampler2D texture;
		uniform int sampleCount;
		
mat4 makeSphere(float r, vec3 Pos)
{
	mat4 A = mat4(  1.0, 0.0, 0.0, -Pos.x,
					0.0, 1.0, 0.0, -Pos.y,
					0.0, 0.0, 1.0, -Pos.z,
					-Pos.x, -Pos.y, -Pos.z,-r*r+Pos.x*Pos.x+Pos.y*Pos.y+Pos.z*Pos.z);
	return A;
}

 float random(vec3 scale, float seed) {
     return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
  }
  
  vec3 sampleCosine(float seed, vec3 normal) {
     float u = random(vec3(12.9898, 78.233, 151.7182), seed);
     float v = random(vec3(63.7264, 10.873, 623.6736), seed);
     float r = sqrt(u);
     float angle = 6.283185307179586 * v;
      // compute basis from normal
     vec3 sdir, tdir;
     if (abs(normal.x)<.5) {
       sdir = normalize(cross(normal, vec3(1,0,0)));
     } else {
       sdir = normalize(cross(normal, vec3(0,1,0)));
     }
     tdir = cross(normal, sdir);
     return r*cos(angle)*sdir + r*sin(angle)*tdir + sqrt(1.-u)*normal;
   }
   
   //AABB metszo fuggveny
	float intersectBox(vec3 boxPoint1, vec3 boxPoint2, vec3 eye, vec3 dir)
	{	
		float tmin = (boxPoint1.x - eye.x) / dir.x;
		float tmax = (boxPoint2.x - eye.x) / dir.x;

		if (tmin > tmax) 
		{
			float temp = tmin;
			tmin = tmax;
			tmax = temp;		
		}
		
		float tymin = (boxPoint1.y - eye.y) / dir.y;
		float tymax = (boxPoint2.y - eye.y) / dir.y;

		if (tymin > tymax) 
		{
			float temp = tymin;
			tymin = tymax;
			tymax = temp;		
		}
		
		if ((tmin > tymax) || (tymin > tmax)) 
		{
			return -1.0;
		}
		
		if (tymin > tmin)  
		{
			tmin = tymin;
		}
		
		if (tymax < tmax)
		{
			tmax = tymax;
		}
		
		float tzmin = (boxPoint1.z - eye.z) / dir.z;
		float tzmax = (boxPoint2.z - eye.z) / dir.z;

		if (tzmin > tzmax) 
		{
			float temp = tzmin;
			tzmin = tzmax;
			tzmax = temp;				
		}

		if ((tmin > tzmax) || (tzmin > tmax))
		{
			return -1.0;
		}
		
		if (tzmin > tmin)
		{
			tmin = tzmin;
		}
		if (tzmax < tmax)
		{
			tmax = tzmax; 
		}
		return tmin;
	}  
	  
	float intersectQuadric(mat4 A,  vec4 rayPos, vec4 rayDir) 
	{
        float a = dot( rayDir, A * rayDir);
        float b = dot( rayPos, A * rayDir) + dot(rayDir, A * rayPos );
        float c = dot( rayPos, A * rayPos );
   
        float discr = b * b - 4.0 * a * c;
        if ( discr < 0.0 )
          return -1.0;
        float sqrt_discr = sqrt( discr );
        float t1 = (-b + sqrt_discr)/2.0/a;
        float t2 = (-b - sqrt_discr)/2.0/a;
     
   
        float t = (t1<t2)?t1:t2;
        if(t < 0.0)
          t = (t1<t2)?t2:t1;
        return t;
      }

	vec3 getQuadricNormal(mat4 A, vec4 hit)
	{
		return normalize((A*hit+hit*A)).xyz;
	}
	
	//A fenyforrason general egy random pontot
	vec3 getLightPoint(vec3 boundPoint1, vec3 boundPoint2)
	{
		vec3 randomNumbers = sampleCosine(float(sampleCount)*gl_FragCoord.x*gl_FragCoord.y*gl_FragCoord.z, normalize(boundPoint1-boundPoint2));
		return vec3(boundPoint1+randomNumbers*(boundPoint2-boundPoint1)  );
	}
	
	vec3 trace(inout vec4 rayPos, inout vec4 rayDir, inout float contrib)
    {
        float bestT = 10000.0;
        vec4 bestMaterial;
        mat4 bestQuadric;
		vec3 boundPoint1 = vec3(3,5,-2);
		vec3 boundPoint2 = vec3(4,6,-3);
			
		vec3 lightColor = vec3(1,1,1);
		vec3 skyColor = vec3(0.1,0.3,0.7); 
				
		vec3 color = vec3(0,0,0);
		
		for (int m=0;m<5;m++)
		{
			
			vec4 hit;
			vec3 normal;
			float t;
			
			
			//gombok metszese
			for(int i=0; i<4; i++) 
			{
				t = intersectQuadric(quads[i], rayPos, rayDir);
				if(t > 0.0 && t < bestT) 
				{
					bestT = t;
					bestQuadric = quads[i];
					bestMaterial = materials[2];
					hit = rayPos + rayDir*bestT;
					normal = getQuadricNormal(bestQuadric, hit);
				}
			}
			
			
			//asztal metszese
			t = intersectBox(vec3(-25,-3,-25),vec3(25,-2,25), rayPos.xyz, rayDir.xyz);
			if(t > 0.0 && t < bestT) {
				bestT = t;
				bestMaterial = materials[1];
				normal = vec3(0,1,0);
				hit = rayPos + rayDir*bestT;
			}
			
			
			//fenyforras metszese
			t = intersectBox(boundPoint1,boundPoint2, rayPos.xyz, rayDir.xyz);
			if(t > 0.0 && t < bestT) {
				bestT = t;
				if (contrib >= 0.99)
				return lightColor;
				else color+= lightColor*contrib;
				break;
			
			}
			
			if(bestT > 9999.0)
			{
				
				color+= skyColor*contrib;
				break;
			}// háttér
			
			//az arnyeksugar iranya a fenyforras mintavetelezese alapjan
			vec4 shadowDir= normalize(vec4(getLightPoint(boundPoint1,boundPoint2)-hit.xyz,1.0));
			vec4 shadowHit;
			
			float shadowT;
			float bestShadowT=10000.0;
			
			//gombok metszese az arnyeksugarral
			for(int i=0; i<4; i++) 
			{
				shadowT = intersectQuadric(quads[i], vec4(hit.xyz+normal*0.01,0.0), shadowDir);
				if(shadowT > 0.0 && shadowT < bestShadowT)
				{
					bestShadowT = shadowT;
			   
					shadowHit = hit + shadowDir*bestShadowT;
				}
			}
			
			
			//asztal metszese az arnyek sugarral
			shadowT = intersectBox(vec3(-25,-3,-25),vec3(25,-2,25), vec3(hit.xyz+normal*0.01), shadowDir.xyz);
			if(shadowT > 0.0 && shadowT < bestShadowT)
				{
					bestShadowT = shadowT;
			   
					shadowHit = hit + shadowDir*bestShadowT;
				}
				
				
			//arnyalas ha nincs arnyekban az adott pont
			if((bestShadowT>9999.0 || (length((hit.xyz) - shadowHit.xyz) > length(hit.xyz - boundPoint1))))
			{
				
				vec3 lightDir = normalize(getLightPoint(boundPoint1,boundPoint2)-hit.xyz);
				float cosalpha = clamp( dot( normal,lightDir ), 0.0, 1.0);		
				color += bestMaterial.xyz * cosalpha * lightColor * contrib;
								
				
			}
			//a sugar uj iranyanak es kezdopontjanak allitasa 
			rayDir = normalize(vec4(sampleCosine(float(sampleCount)*gl_FragCoord.x*gl_FragCoord.y*gl_FragCoord.z, normal), 1.0));
			rayPos = vec4(hit.xyz+normal*0.01,0.0);
			contrib*=0.1;
		}
		
		return color;	
	}

     

void main() { 
	vec4 rayDir = vec4(normalize(viewDir), 0.0);
	vec4 rayPos = vec4(eye, 1.0);
	
	float c=1.0;
	
	quads[0] = makeSphere(1.5, vec3(-2,0,0));		 
	quads[1] = makeSphere(1.0, vec3(2,1,0));
	quads[2] = makeSphere(3.0, vec3(-7,5,0));		 
	quads[3] = makeSphere(0.5, vec3(2,4,2));

  
	if (sampleCount==0)
		gl_FragColor = vec4(trace(rayPos, rayDir, c), 1.0);
	else
		gl_FragColor = texture2D(texture, tex) * 0.95 + vec4(trace(rayPos, rayDir, c), 1.0)*0.05;

} 



`
;