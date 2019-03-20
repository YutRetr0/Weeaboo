#version 330 core

layout (location = 0) out vec4 FragColor;
layout (location = 1) out vec4 BrightColor;
in vec2 vTexcoord;

uniform sampler2D gPosition;
uniform sampler2D gNormal;
uniform sampler2D gAlbedoSpec;
uniform sampler2D uSSAOInput;
uniform samplerCube uDepthMap;

struct Light {
    vec3 position;
    vec3 color;

    float intensity;
    float linear;
    float quadratic;
};

const int NR_LIGHTS = 32;
uniform Light uLights[NR_LIGHTS];
uniform vec3 uViewPos;

uniform vec3 uShadowLightPos;
uniform int uShadowLightIndex;
uniform float uFarPlane;

const float PI = 3.1415926535897932384626433832795f;
const float bright_threshold = 0.5;

vec3 diffuseTerm(vec3 diffColor)
{
    return diffColor / PI;
}

float distributionGGX(float roughness, float NdotH)
{
    float m = roughness * roughness;
    float m2 = m * m;
    float d = (NdotH * m2 - NdotH) * NdotH + 1.0;
    return m2 / (d * d);
}

float geometricVisibilitySchlick(float roughness, float NdotV, float NdotL)
{
    float k = roughness * roughness * 0.5;
    float GSchlickV = NdotV * (1.0 - k) + k;
    float GSchlickL = NdotL * (1.0 - k) + k;
    return 0.25 / (GSchlickV * GSchlickL);
}

vec3 fresnelSchlick(vec3 specColor, float LdotH)
{
    return specColor + (1.0 - specColor) * pow((1.0 - LdotH), 5.0);
}

vec3 specularTerm(vec3 specColor, float roughness, vec3 V, vec3 N, vec3 L)
{
    vec3 H = normalize(V + L);
    float NdotL = clamp(dot(N, L), 0.0, 1.0);
    float NdotV = clamp(dot(N, V), 0.0, 1.0);
    float NdotH = clamp(dot(N, H), 0.0, 1.0);
    float LdotH = clamp(dot(L, V), 0.0, 1.0);

    float D = distributionGGX(roughness, NdotH);
    float  G = geometricVisibilitySchlick(roughness, NdotV, NdotL);
    vec3 F = fresnelSchlick(specColor, LdotH);

    return D * G * F / 4.0;

}

vec3 calc_lighting(vec3 lightDir, vec3 viewDir, vec3 normal, vec3 diffuse, vec3 lightColor, float roughness, float metallic)
{
    vec4 albedo = vec4(diffuse, 1.0f);
    vec3 diffColor = vec3(albedo * (1.0 - metallic));
    vec3 diffTerm = diffuseTerm(diffColor);

    vec3 specular = lightColor;

    vec3 specColor = specular * metallic + albedo.rgb * (1.0 - metallic);
    vec3 specTerm = specularTerm(specColor, roughness, viewDir, normal, lightDir);

    vec3 c = PI * ((1.0 - metallic) * diffTerm + metallic * specTerm) * lightColor * max(dot(normal, lightDir), 0.0);

    return c;
}

vec3 sampleOffsetDirections[20] = vec3[]
(
   vec3( 1,  1,  1), vec3( 1, -1,  1), vec3(-1, -1,  1), vec3(-1,  1,  1),
   vec3( 1,  1, -1), vec3( 1, -1, -1), vec3(-1, -1, -1), vec3(-1,  1, -1),
   vec3( 1,  1,  0), vec3( 1, -1,  0), vec3(-1, -1,  0), vec3(-1,  1,  0),
   vec3( 1,  0,  1), vec3(-1,  0,  1), vec3( 1,  0, -1), vec3(-1,  0, -1),
   vec3( 0,  1,  1), vec3( 0, -1,  1), vec3( 0, -1, -1), vec3( 0,  1, -1)
);

float calc_shadow(vec3 frag_pos)
{
    // Get vector between fragment position and light position
    vec3 fragToLight = frag_pos - uShadowLightPos;
    // Use the fragment to light vector to sample from the depth map
    //float closestDepth = texture(uDepthMap, fragToLight).r;
    // It is currently in linear range between [0,1]. Let's re-transform it back to original depth value
    //closestDepth *= uFarPlane;
    // Now get current linear depth as the length between the fragment and light position
    float currentDepth = length(fragToLight);
    // Now test for shadows
    //float bias = 0.1; // We use a much larger bias since depth is now in [near_plane, far_plane] range
    //float shadow = currentDepth -  bias > closestDepth ? 1.0 : 0.0;
    //return shadow;

    // with PCF
    float shadow = 0.0;
    float bias = 0.08;
    int samples = 20;
    float viewDistance = length(uViewPos - frag_pos);
    float diskRadius = 0.01;
    for(int i = 0; i < samples; ++i)
    {
        float closestDepth = texture(uDepthMap, fragToLight + sampleOffsetDirections[i] * diskRadius).r;
        closestDepth *= uFarPlane;   // Undo mapping [0;1]
        if(currentDepth - bias > closestDepth)
            shadow += 1.0;
    }
    shadow /= float(samples);
    return shadow;
}

void main()
{
    // Retrieve data from gbuffer
    vec3 frag_pos = texture(gPosition, vTexcoord).rgb;
    vec3 normal = texture(gNormal, vTexcoord).rgb;
    vec3 diffuse = texture(gAlbedoSpec, vTexcoord).rgb;
    float roughness = texture(gNormal, vTexcoord).a;
    float metallic = texture(gAlbedoSpec, vTexcoord).a;
    float ambient_occlusion = texture(uSSAOInput, vTexcoord).r;

    // Then calculate lighting as usual
    vec3 ambient = diffuse * 0.1 * ambient_occlusion;
    vec3 lighting  = ambient;
    vec3 viewDir = normalize(uViewPos - frag_pos);
    float shadow = calc_shadow(frag_pos);
    for(int i = 0; i < NR_LIGHTS; ++i)
    {
        vec3 lightDir = normalize(uLights[i].position - frag_pos);
        float distance = length(uLights[i].position - frag_pos);
        float attenuation = 1.0 / (1.0 + uLights[i].linear * distance + uLights[i].quadratic * distance * distance);
        vec3 c = calc_lighting(lightDir, viewDir, normal, diffuse, uLights[i].color, roughness, metallic);
        lighting += ((i == uShadowLightIndex) ? (1.0 - shadow) : 1.0) * c * attenuation * uLights[i].intensity;
    }

    FragColor = vec4(lighting, 1.0);

	float brightness = dot(FragColor.rgb, vec3(0.2126, 0.7152, 0.0722));
    if(brightness > bright_threshold)
       BrightColor = vec4(FragColor.rgb, 1.0);
}
