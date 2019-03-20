#version 330

layout (points) in;
layout (triangle_strip) out;
layout (max_vertices = 6) out;

uniform mat4 uView;
uniform mat4 uVP;
uniform float uBillboardWidth;
uniform float uBillboardHeight;

out vec2 vTexcoord;

void main()
{
    vec3 Pos = gl_in[0].gl_Position.xyz;
	vec3 right = vec3(uView[0][0], uView[1][0], uView[2][0]);
	vec3 up = vec3(uView[0][1], uView[1][1], uView[2][1]);

    Pos -= (right * uBillboardWidth) * 0.5;
    Pos -= (up * uBillboardHeight) * 0.5;
    gl_Position = uVP * vec4(Pos, 1.0);
    vTexcoord = vec2(0.0, 1.0);
    EmitVertex();

    Pos += (up * uBillboardHeight);
    gl_Position = uVP * vec4(Pos, 1.0);
    vTexcoord = vec2(0.0, 0.0);
    EmitVertex();

    Pos += right * uBillboardWidth;
    gl_Position = uVP * vec4(Pos, 1.0);
    vTexcoord = vec2(1.0, 0.0);
    EmitVertex();
	EndPrimitive();

    gl_Position = uVP * vec4(Pos, 1.0);
    vTexcoord = vec2(1.0, 0.0);
    EmitVertex();

    Pos -= up * uBillboardHeight;
    gl_Position = uVP * vec4(Pos, 1.0);
    vTexcoord = vec2(1.0, 1.0);
    EmitVertex();

    Pos -= right * uBillboardWidth;
    gl_Position = uVP * vec4(Pos, 1.0);
    vTexcoord = vec2(0.0, 1.0);
    EmitVertex();

    EndPrimitive();
}
