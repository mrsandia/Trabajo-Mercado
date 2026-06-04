using UnityEngine;

namespace FogSystem
{
    /// <summary>
    /// Attach to the player (or any light source) to carve visibility into the fog.
    /// Renders a soft white circle on the "FogRevealer" layer so only the fog
    /// camera picks it up, not the main camera.
    /// </summary>
    public class FogRevealer : MonoBehaviour
    {
        [Tooltip("Reveal radius in world units")]
        public float radius = 6f;

        [Range(0f, 1f), Tooltip("0 = hard circle edge, 1 = full soft gradient")]
        public float softness = 0.5f;

        private SpriteRenderer _sr;
        private float _lastRadius;
        private float _lastSoftness;

        void Awake()
        {
            int layer = LayerMask.NameToLayer("FogRevealer");
            if (layer == -1)
            {
                Debug.LogError("[FogRevealer] Layer 'FogRevealer' does not exist. " +
                               "Add it in Edit > Project Settings > Tags and Layers.");
                return;
            }

            var go = new GameObject("_FogRevealSprite");
            go.transform.SetParent(transform);
            go.transform.localPosition = Vector3.zero;
            go.layer = layer;

            _sr = go.AddComponent<SpriteRenderer>();
            _sr.color  = Color.white;
            _sr.sprite = BuildCircleSprite(128, softness);

            RefreshScale();
            _lastRadius   = radius;
            _lastSoftness = softness;
        }

        void Update()
        {
            // Hot-reload in editor if inspector values change
            if (Mathf.Approximately(_lastRadius, radius) &&
                Mathf.Approximately(_lastSoftness, softness)) return;

            _sr.sprite = BuildCircleSprite(128, softness);
            RefreshScale();
            _lastRadius   = radius;
            _lastSoftness = softness;
        }

        void RefreshScale() =>
            _sr.transform.localScale = Vector3.one * radius * 2f;

        // Generates a radial gradient circle: opaque white in center, transparent at edge.
        static Sprite BuildCircleSprite(int res, float softness)
        {
            var tex    = new Texture2D(res, res, TextureFormat.RGBA32, false);
            tex.filterMode = FilterMode.Bilinear;
            float center = res * 0.5f;
            // exponent: low softness → high exponent → sharper edge
            float exp = Mathf.Lerp(5f, 0.6f, softness);

            Color[] pixels = new Color[res * res];
            for (int y = 0; y < res; y++)
            {
                for (int x = 0; x < res; x++)
                {
                    float dist  = Vector2.Distance(new Vector2(x + 0.5f, y + 0.5f),
                                                   new Vector2(center, center));
                    float t     = Mathf.Clamp01(1f - dist / center);
                    float alpha = Mathf.Pow(t, exp);
                    pixels[y * res + x] = new Color(1f, 1f, 1f, alpha);
                }
            }
            tex.SetPixels(pixels);
            tex.Apply();

            return Sprite.Create(tex, new Rect(0, 0, res, res), new Vector2(0.5f, 0.5f), res);
        }
    }
}
