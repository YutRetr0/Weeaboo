#version 330 core
in vec2 vTexcoord;
out vec4 color;

uniform sampler2D uText;

void main()
{
    color = texture(uText, vTexcoord);
}
