using UnityEngine;
using DungeonSystem;

namespace FogSystem
{
    /// <summary>
    /// Top-down Fog of War system inspired by kvachev's fog-mesh approach.
    ///
    /// How it works:
    ///   1. A secondary orthographic camera (FogCamera) renders only objects on the
    ///      "FogRevealer" layer (white gradient circles) into a R8 RenderTexture
    ///      (_currentRT). It is cleared to black every frame.
    ///   2. Each frame _currentRT is blitted into _exploredRT using BlendOp Max so
    ///      revealed areas are remembered permanently.
    ///   3. A large Quad (FogPlane) that covers the whole dungeon samples both
    ///      textures in Custom/FogOfWar.shader:
    ///        - currentRT bright  → transparent (player sees it now)
    ///        - exploredRT bright → dim fog color (was here before)
    ///        - both dark         → full fog color (never visited)
    ///
    /// Setup checklist (do once in your project):
    ///   A. Add a layer named "FogRevealer" via Edit > Project Settings > Tags and Layers.
    ///   B. In your main Camera, remove "FogRevealer" from the Culling Mask so it
    ///      doesn't render the reveal sprites.
    ///   C. Attach FogRevealer to your player GameObject and set a radius.
    ///   D. Add this component to a scene GameObject (e.g. "FogManager").
    ///      Set worldWidth/worldHeight to match your dungeon's total size.
    /// </summary>
    public class FogOfWarSystem : MonoBehaviour
    {
        public static FogOfWarSystem Instance { get; private set; }

        [Header("World Bounds  (must cover the entire dungeon)")]
        public float   worldWidth  = 200f;
        public float   worldHeight = 120f;
        public Vector2 worldCenter = Vector2.zero;

        [Header("Texture")]
        [Tooltip("512 is plenty for most dungeons. Use 1024 for sharper edges at the cost of memory.")]
        public int textureResolution = 512;

        [Header("Fog Appearance")]
        public Color unexploredColor = new Color(0f,   0f,   0f, 0.97f);
        public Color exploredColor   = new Color(0.05f,0.05f,0.05f, 0.6f);
        [Range(0f, 0.4f)]
        public float edgeSoftness = 0.15f;

        [Header("Rendering")]
        [Tooltip("SortingOrder of the fog quad. Must be above all game sprites.")]
        public int sortingOrder = 100;
        public string sortingLayerName = "Default";

        // ── Runtime ──────────────────────────────────────────────────────────

        private Camera        _fogCam;
        private RenderTexture _currentRT;
        private RenderTexture _exploredRT;
        private Material      _fogMat;
        private Material      _blitMaxMat;
        private GameObject    _fogPlane;

        // ── Lifecycle ────────────────────────────────────────────────────────

        void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
        }

        void Start()
        {
            CreateRenderTextures();
            CreateFogCamera();
            CreateFogPlane();

            if (RoomManager.Instance != null)
                RoomManager.Instance.OnRoomChanged += OnRoomChanged;
        }

        void LateUpdate()
        {
            // Accumulate current visibility into the permanent explored map
            if (_blitMaxMat != null)
                Graphics.Blit(_currentRT, _exploredRT, _blitMaxMat);
        }

        void OnDestroy()
        {
            if (RoomManager.Instance != null)
                RoomManager.Instance.OnRoomChanged -= OnRoomChanged;

            _currentRT?.Release();
            _exploredRT?.Release();
        }

        // ── Public API ───────────────────────────────────────────────────────

        /// <summary>
        /// Instantly reveal the entire explored map (e.g., for debug or cheat mode).
        /// </summary>
        public void RevealAll()
        {
            var prev = RenderTexture.active;
            RenderTexture.active = _exploredRT;
            GL.Clear(false, true, Color.white);
            RenderTexture.active = prev;
        }

        /// <summary>
        /// Reset fog completely (explored and current).
        /// </summary>
        public void ResetFog()
        {
            ClearRT(_exploredRT);
            ClearRT(_currentRT);
        }

        // ── Dungeon integration ──────────────────────────────────────────────

        private void OnRoomChanged(Room room)
        {
            // The player's FogRevealer will naturally reveal the room as they walk.
            // No extra work needed here unless you want instant full-room reveal.
            // Uncomment below to reveal the full room bounds immediately on enter:
            //
            // RevealRoomBounds(room);
        }

        // Reveals a rectangular area matching a room's world bounds.
        // Requires the Room component to have a Collider2D or known size.
        private void RevealRoomBounds(Room room)
        {
            // Place a temporary large FogRevealer at the room center for one frame.
            // The size covers the room diagonal so corners are reached.
            var go = new GameObject("_TempRoomRevealer");
            go.transform.position = room.transform.position;
            var fr = go.AddComponent<FogRevealer>();
            fr.radius   = 12f;   // Adjust to match your room size
            fr.softness = 0.2f;
            Destroy(go, 0.1f);   // alive for 2 frames, then removed
        }

        // ── Setup helpers ────────────────────────────────────────────────────

        void CreateRenderTextures()
        {
            _currentRT  = MakeRT();
            _exploredRT = MakeRT();

            Shader blitShader = Shader.Find("Hidden/FogBlitMax");
            if (blitShader != null)
                _blitMaxMat = new Material(blitShader) { hideFlags = HideFlags.HideAndDontSave };
            else
                Debug.LogError("[FogOfWar] Shader 'Hidden/FogBlitMax' not found. " +
                               "Make sure FogBlitMax.shader is in your project.");

            Shader fogShader = Shader.Find("Custom/FogOfWar");
            if (fogShader != null)
            {
                _fogMat = new Material(fogShader) { hideFlags = HideFlags.HideAndDontSave };
                SyncMaterialProperties();
            }
            else
                Debug.LogError("[FogOfWar] Shader 'Custom/FogOfWar' not found. " +
                               "Make sure FogOfWar.shader is in your project.");
        }

        void SyncMaterialProperties()
        {
            if (_fogMat == null) return;
            _fogMat.SetTexture("_CurrentVisibility", _currentRT);
            _fogMat.SetTexture("_ExploredMap",       _exploredRT);
            _fogMat.SetColor("_UnexploredColor",     unexploredColor);
            _fogMat.SetColor("_ExploredColor",       exploredColor);
            _fogMat.SetFloat("_EdgeSoftness",        edgeSoftness);
        }

        void CreateFogCamera()
        {
            var go = new GameObject("FogCamera") { hideFlags = HideFlags.DontSave };
            go.transform.SetParent(transform);

            _fogCam = go.AddComponent<Camera>();
            _fogCam.orthographic     = true;
            _fogCam.orthographicSize = worldHeight * 0.5f;
            _fogCam.aspect           = worldWidth / worldHeight;
            _fogCam.clearFlags       = CameraClearFlags.SolidColor;
            _fogCam.backgroundColor  = Color.black;
            _fogCam.cullingMask      = LayerMask.GetMask("FogRevealer");
            _fogCam.targetTexture    = _currentRT;
            _fogCam.depth            = -10;
            _fogCam.allowHDR         = false;
            _fogCam.allowMSAA        = false;

            // Position: looking straight down the -Z axis at the world center (2D game)
            go.transform.position = new Vector3(worldCenter.x, worldCenter.y, -100f);
        }

        void CreateFogPlane()
        {
            _fogPlane = GameObject.CreatePrimitive(PrimitiveType.Quad);
            _fogPlane.name = "FogPlane";
            _fogPlane.transform.SetParent(transform);

            // Place it slightly in front of the world so it renders on top of all sprites
            _fogPlane.transform.position   = new Vector3(worldCenter.x, worldCenter.y, -0.5f);
            _fogPlane.transform.localScale  = new Vector3(worldWidth, worldHeight, 1f);

            Destroy(_fogPlane.GetComponent<MeshCollider>());

            var mr = _fogPlane.GetComponent<MeshRenderer>();
            mr.shadowCastingMode    = UnityEngine.Rendering.ShadowCastingMode.Off;
            mr.receiveShadows       = false;
            mr.sortingLayerName     = sortingLayerName;
            mr.sortingOrder         = sortingOrder;

            if (_fogMat != null)
                mr.sharedMaterial = _fogMat;
        }

        // ── Utilities ────────────────────────────────────────────────────────

        RenderTexture MakeRT()
        {
            var rt = new RenderTexture(textureResolution, textureResolution, 0, RenderTextureFormat.R8);
            rt.filterMode = FilterMode.Bilinear;
            rt.wrapMode   = TextureWrapMode.Clamp;
            rt.Create();
            ClearRT(rt);
            return rt;
        }

        static void ClearRT(RenderTexture rt)
        {
            var prev = RenderTexture.active;
            RenderTexture.active = rt;
            GL.Clear(false, true, Color.black);
            RenderTexture.active = prev;
        }

        // Allow live-editing fog colors from the inspector during play
        void OnValidate() => SyncMaterialProperties();
    }
}
