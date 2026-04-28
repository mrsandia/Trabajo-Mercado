using System.Collections.Generic;
using UnityEngine;

namespace DungeonSystem
{
    /// <summary>
    /// Genera un mapa al estilo Binding of Isaac.
    /// Cada habitación usa el prefab cuya combinación de puertas coincide
    /// con sus vecinos en la grilla (Norte/Sur/Este/Oeste).
    /// </summary>
    public class DungeonGenerator : MonoBehaviour
    {
        [Header("Prefabs por combinación de puertas")]
        [Tooltip("Añade una entrada por cada forma de habitación que tengas. " +
                 "Marca las puertas que tiene ese prefab.")]
        public RoomPrefabEntry[] roomPrefabs;

        [Header("Generación")]
        public bool    randomSeed  = true;
        public int     seed        = 0;
        [Range(5, 50)]
        public int     targetRooms = 12;
        [Tooltip("Tamaño en unidades de mundo de cada celda")]
        public Vector2 roomSize    = new Vector2(18f, 10f);

        [Header("Habitaciones especiales (0 = desactivadas)")]
        public int treasureRooms = 0;
        public int shopRooms     = 0;

        private readonly Dictionary<Vector2Int, Room> _rooms = new();
        private Room _currentRoom;

        private static readonly Vector2Int[] Dirs =
            { Vector2Int.up, Vector2Int.down, Vector2Int.right, Vector2Int.left };

        void Start() => Generate();

        // ── API pública ──────────────────────────────────────────────────────

        public void Generate()
        {
            ClearExisting();
            if (randomSeed) seed = Random.Range(0, int.MaxValue);
            Random.InitState(seed);

            var layout  = BuildLayout();
            var typeMap = AssignTypes(layout);
            SpawnRooms(layout, typeMap);

            EnterRoom(Vector2Int.zero);
        }

        public void TransitionToRoom(Vector2Int gridPos)
        {
            if (!_rooms.ContainsKey(gridPos) || _rooms[gridPos] == _currentRoom) return;
            EnterRoom(gridPos);
        }

        public Vector3 GridToWorld(Vector2Int pos) =>
            new Vector3(pos.x * roomSize.x, pos.y * roomSize.y, 0f);

        public IReadOnlyDictionary<Vector2Int, Room> Rooms => _rooms;
        public Room CurrentRoom => _currentRoom;

        // ── Layout ───────────────────────────────────────────────────────────

        private List<Vector2Int> BuildLayout()
        {
            var visited = new HashSet<Vector2Int> { Vector2Int.zero };
            var queue   = new Queue<Vector2Int>();
            var result  = new List<Vector2Int> { Vector2Int.zero };
            queue.Enqueue(Vector2Int.zero);

            while (result.Count < targetRooms && queue.Count > 0)
            {
                Vector2Int current = queue.Dequeue();
                Vector2Int[] dirs  = (Vector2Int[])Dirs.Clone();
                Shuffle(dirs);

                foreach (Vector2Int dir in dirs)
                {
                    if (result.Count >= targetRooms) break;
                    Vector2Int next = current + dir;
                    if (visited.Contains(next)) continue;
                    if (NeighbourCount(visited, next) > 1) continue;

                    visited.Add(next);
                    queue.Enqueue(next);
                    result.Add(next);
                }
            }
            return result;
        }

        // ── Tipos de habitación ──────────────────────────────────────────────

        private Dictionary<Vector2Int, RoomType> AssignTypes(List<Vector2Int> layout)
        {
            var map     = new Dictionary<Vector2Int, RoomType>();
            var gridSet = new HashSet<Vector2Int>(layout);

            map[Vector2Int.zero] = RoomType.Start;
            map[FarthestFrom(layout, Vector2Int.zero)] = RoomType.Boss;

            var deadEnds = new List<Vector2Int>();
            foreach (Vector2Int pos in layout)
                if (!map.ContainsKey(pos) && NeighbourCount(gridSet, pos) == 1)
                    deadEnds.Add(pos);
            Shuffle(deadEnds);

            int idx = 0;
            for (int i = 0; i < treasureRooms && idx < deadEnds.Count; i++, idx++)
                map[deadEnds[idx]] = RoomType.Treasure;
            for (int i = 0; i < shopRooms && idx < deadEnds.Count; i++, idx++)
                map[deadEnds[idx]] = RoomType.Shop;

            foreach (Vector2Int pos in layout)
                if (!map.ContainsKey(pos)) map[pos] = RoomType.Normal;

            return map;
        }

        // ── Instanciado ──────────────────────────────────────────────────────

        private void SpawnRooms(List<Vector2Int> layout, Dictionary<Vector2Int, RoomType> typeMap)
        {
            var layoutSet = new HashSet<Vector2Int>(layout);

            foreach (Vector2Int pos in layout)
            {
                bool n = layoutSet.Contains(pos + Vector2Int.up);
                bool s = layoutSet.Contains(pos + Vector2Int.down);
                bool e = layoutSet.Contains(pos + Vector2Int.right);
                bool w = layoutSet.Contains(pos + Vector2Int.left);

                GameObject prefab = GetPrefabForDoors(n, s, e, w);
                if (prefab == null)
                {
                    Debug.LogWarning($"No hay prefab para la combinación N:{n} S:{s} E:{e} W:{w} en {pos}. Se omite.");
                    continue;
                }

                GameObject go = Instantiate(prefab, GridToWorld(pos), Quaternion.identity, transform);
                go.name = $"Room_{pos.x}_{pos.y}_{typeMap[pos]}";

                Room room = go.GetComponent<Room>();
                if (room == null)
                {
                    Debug.LogError($"El prefab '{prefab.name}' no tiene componente Room.", prefab);
                    continue;
                }

                room.Initialize(pos, typeMap[pos]);
                room.SetVisible(false);
                _rooms[pos] = room;
            }
        }

        // Busca coincidencia exacta; si no existe, usa el primer prefab como fallback.
        private GameObject GetPrefabForDoors(bool n, bool s, bool e, bool w)
        {
            foreach (var entry in roomPrefabs)
                if (entry.north == n && entry.south == s && entry.east == e && entry.west == w)
                    return entry.prefab;

            // Fallback: prefab con más puertas en común
            int bestScore = -1;
            GameObject best = null;
            foreach (var entry in roomPrefabs)
            {
                if (entry.prefab == null) continue;
                int score = (entry.north == n ? 1 : 0) + (entry.south == s ? 1 : 0)
                          + (entry.east  == e ? 1 : 0) + (entry.west  == w ? 1 : 0);
                if (score > bestScore) { bestScore = score; best = entry.prefab; }
            }
            return best;
        }

        // ── Transiciones ─────────────────────────────────────────────────────

        private void EnterRoom(Vector2Int pos)
        {
            if (_currentRoom != null) _currentRoom.SetVisible(false);
            _currentRoom = _rooms[pos];
            _currentRoom.SetVisible(true);
            RoomManager.Instance?.OnRoomEntered(_currentRoom);
        }

        // ── Utilidades ───────────────────────────────────────────────────────

        private int NeighbourCount(HashSet<Vector2Int> set, Vector2Int pos)
        {
            int n = 0;
            foreach (Vector2Int d in Dirs) if (set.Contains(pos + d)) n++;
            return n;
        }

        private Vector2Int FarthestFrom(List<Vector2Int> layout, Vector2Int origin)
        {
            Vector2Int best = origin;
            float maxDist   = -1f;
            foreach (Vector2Int pos in layout)
            {
                float d = (pos - origin).sqrMagnitude;
                if (d > maxDist) { maxDist = d; best = pos; }
            }
            return best;
        }

        private void ClearExisting()
        {
            foreach (Room r in _rooms.Values) if (r) Destroy(r.gameObject);
            _rooms.Clear();
            _currentRoom = null;
        }

        private void Shuffle<T>(IList<T> list)
        {
            for (int i = list.Count - 1; i > 0; i--)
            {
                int j = Random.Range(0, i + 1);
                (list[i], list[j]) = (list[j], list[i]);
            }
        }

        // ── Struct serializable ──────────────────────────────────────────────

        [System.Serializable]
        public struct RoomPrefabEntry
        {
            [Tooltip("Puertas que tiene este prefab")]
            public bool north, south, east, west;
            public GameObject prefab;
        }
    }
}
