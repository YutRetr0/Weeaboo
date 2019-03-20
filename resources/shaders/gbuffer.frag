#version 330 core

/* G-Buffer layout:
 |  0  |  1  |  2  |    3    |
 -----------------------------
 |      Pos.       |  Depth  |
 |     Normal      | Roughn. |
 |     Albedo      | Metall. |
 -----------------------------
*/
layout (location = 0) out vec4 gPosition;
layout (location = 1) out vec4 gNormal;
layout (location = 2) out vec4 gAlbedoSpec;

in vec2 vTexcoord;
in vec3 vFragPos;
in vec3 vNormal;
in vec3 vTangent;

uniform sampler2D uDiffuse;
uniform sampler2D uNormalMap;

uniform float uRoughness;
uniform float uMetallic;

const float NEAR = 0.1f;
const float FAR = 100.0f;
float linearize(float depth)
{
    float z = depth * 2.0 - 1.0;
    return (2.0 * NEAR * FAR) / (FAR + NEAR - z * (FAR - NEAR));
}

void main()
{
    // Store the fragment position vector in the first gbuffer texture
    gPosition.xyz = vFragPos;
    gPosition.a = gl_FragCoord.z;

    // Calculate bumped normal
    vec3 normal = normalize(vNormal);
    vec3 tangent = normalize(vTangent);
    tangent = normalize(tangent - dot(tangent, normal) * normal);
    vec3 bitangent = cross(tangent, normal);
    //vec3 BumpMapnormal = texture(gnormalMap, TexCoord0).xyz;
    vec3 bump_normal = texture(uNormalMap, vTexcoord).xyz;
    bump_normal = 2.0 * bump_normal - vec3(1.0, 1.0, 1.0);
    vec3 new_normal;
    mat3 TBN = mat3(tangent, bitangent, normal);
    new_normal = TBN * bump_normal;
    new_normal = normalize(new_normal);

    // Also store the per-fragment normals into the gbuffer
    gNormal.xyz = new_normal;
    gNormal.a = uRoughness;
    // And the diffuse per-fragment color
    gAlbedoSpec.rgb = texture(uDiffuse, vTexcoord).rgb;
    // Store specular intensity in gAlbedoSpec's alpha component
    gAlbedoSpec.a = uMetallic;
}

