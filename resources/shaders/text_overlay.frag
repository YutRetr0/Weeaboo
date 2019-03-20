#version 330 core
in vec2 vTexcoord;
out vec4 color;

uniform sampler2D uText;
uniform vec3 uTextColor;

void main()
{
    vec4 sampled = vec4(1.0, 1.0, 1.0, texture(uText, vTexcoord).r);
    color = vec4(uTextColor, 1.0) * sampled;
}
