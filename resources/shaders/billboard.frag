#version 330

uniform sampler2D uTexture;

in vec2 vTexcoord;
out vec4 FragColor;

void main()
{
    FragColor = texture2D(uTexture, vTexcoord);

	float brightness = dot(FragColor.rgb, vec3(0.2126, 0.7152, 0.0722));
	if (brightness < 0.1) {
		discard;
	}
}
