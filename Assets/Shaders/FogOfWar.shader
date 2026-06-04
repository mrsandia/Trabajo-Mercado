Shader "Custom/FogOfWar"
{
    Properties
    {
        _CurrentVisibility ("Current Visibility", 2D) = "black" {}
        _ExploredMap       ("Explored Map",        2D) = "black" {}
        _UnexploredColor   ("Unexplored Color",  Color) = (0,0,0,1)
        _ExploredColor     ("Explored Color",    Color) = (0,0,0,0.6)
        _EdgeSoftness      ("Edge Softness", Range(0,0.4)) = 0.15
    }

    SubShader
    {
        // Render after all opaque geometry, before UI
        Tags { "Queue"="Transparent+100" "RenderType"="Transparent" "IgnoreProjector"="True" }
        Blend SrcAlpha OneMinusSrcAlpha
        ZWrite Off
        Cull Off
        Lighting Off

        Pass
        {
            CGPROGRAM
            #pragma vertex   vert
            #pragma fragment frag
            #include "UnityCG.cginc"

            sampler2D _CurrentVisibility;
            sampler2D _ExploredMap;
            fixed4    _UnexploredColor;
            fixed4    _ExploredColor;
            float     _EdgeSoftness;

            struct appdata { float4 vertex : POSITION; float2 uv : TEXCOORD0; };
            struct v2f     { float4 pos    : SV_POSITION; float2 uv : TEXCOORD0; };

            v2f vert(appdata v)
            {
                v2f o;
                o.pos = UnityObjectToClipPos(v.vertex);
                o.uv  = v.uv;
                // On D3D the camera renders into RTs with Y flipped relative to UV (0,0) = bottom-left.
                // If fog appears vertically mirrored, uncomment the next line:
                // o.uv.y = 1.0 - o.uv.y;
                return o;
            }

            fixed4 frag(v2f i) : SV_Target
            {
                float current  = tex2D(_CurrentVisibility, i.uv).r;
                float explored = tex2D(_ExploredMap,       i.uv).r;

                float lo = 0.05;
                float hi = lo + _EdgeSoftness * 2.0 + 0.01;

                // 1 where player can see now, 0 where not
                float visible  = smoothstep(lo, hi, current);
                // 1 where player has explored before, 0 where not
                float wasHere  = smoothstep(lo, hi, explored);

                // Blend between unexplored (dark) and explored (dim) fog
                fixed4 baseFog = lerp(_UnexploredColor, _ExploredColor, wasHere);

                // Fade fog out where player currently sees
                float alpha = baseFog.a * (1.0 - visible);

                return fixed4(baseFog.rgb, alpha);
            }
            ENDCG
        }
    }
}
