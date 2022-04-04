precision mediump float;

uniform float u_time;

varying vec2 UV;

void main(){
	UV=uv;
	vec4 localPosition=vec4(position,1.);
	localPosition.x += cos(u_time+uv.x);
	localPosition.x += sin(u_time+uv.y);
	localPosition.z += sin(u_time+uv.x+uv.y);
	vec4 worldPosition=modelMatrix*localPosition;
	vec4 viewPosition=viewMatrix*worldPosition;
	vec4 projectedPosition=projectionMatrix*viewPosition;
	
	gl_Position=projectedPosition;
}