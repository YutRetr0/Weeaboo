#version 330 core
layout (location = 0) in vec2 aPosition;
layout (location = 1) in vec2 aTexcoord;
out vec2 vPosition;
out vec2 vTexcoord;

uniform mat4 uModel;
uniform mat4 uProjection;

void main()
{
    gl_Position = uModel * vec4(aPosition, 0.0, 1.0);
    vPosition = gl_Position.xy;
    gl_Position = uProjection * gl_Position;
    vTexcoord = aTexcoord;
}
