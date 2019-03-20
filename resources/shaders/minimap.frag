#version 330 core
in vec2 vTexcoord;
in vec2 vPosition;
out vec4 color;

uniform sampler2D uTexture;
uniform vec2 uCentre;
uniform float uRadius;

void main()
{
    float dist = sqrt((vPosition.x - uCentre.x) * (vPosition.x - uCentre.x) + (vPosition.y - uCentre.y) * (vPosition.y - uCentre.y));
    if (dist > uRadius) {
        discard;
    } else if (vTexcoord.r > 1.5) {
        color = vec4(0.0f, 0.0f, 0.0f, 0.3f);
    } else {
        color = vec4(vTexcoord, 0.0f, 1.0f);
        color = texture(uTexture, vTexcoord);
    }
}
