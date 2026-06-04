// Internal shader used by FogOfWarSystem to accumulate revealed areas.
// BlendOp Max keeps whichever value (src or dst) is larger, so the
// explored map only ever grows - it never forgets revealed areas.
Shader "Hidden/FogBlitMax"
{
    Properties { _MainTex ("", 2D) = "white" {} }

    SubShader
    {
        Cull Off ZTest Always ZWrite Off
        BlendOp Max
        Blend One One

        Pass
        {
            CGPROGRAM
            #pragma vertex   vert_img
            #pragma fragment frag
            #include "UnityCG.cginc"
            sampler2D _MainTex;
            fixed4 frag(v2f_img i) : SV_Target { return tex2D(_MainTex, i.uv); }
            ENDCG
        }
    }
}
