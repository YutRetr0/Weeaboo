#version 330 core
out vec4 FragColor;
in vec2 vTexcoord;

uniform sampler2D uHDRInput;
uniform sampler2D uBloomBlur;

const float gamma = 2.2;
const float exposure = 1.0;

const float A = 2.51;
const float B = 0.03;
const float C = 2.43;
const float D = 0.59;
const float E = 0.14;
const float W = 11.2;

vec3 tonemap(vec3 x)
{
	return (x*(A*x+B))/(x*(C*x+D)+E);
}

void main()
{             
    vec3 hdrColor = texture(uHDRInput, vTexcoord).rgb;     
	vec3 bloom = texture(uBloomBlur, vTexcoord).rgb;
	hdrColor += bloom;

	vec3 mapped = tonemap(exposure * hdrColor);
	//vec3 whiteScale = 1.0/tonemap(vec3(W));
	//mapped = mapped*whiteScale;  
	mapped = pow(mapped, vec3(1/gamma));

    FragColor = vec4(mapped, 1.0f);
}
