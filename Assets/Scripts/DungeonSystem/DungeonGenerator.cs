using System.Collections.Generic;
using UnityEngine;

namespace DungeonSystem
{
    /// <summary>
    /// Generates a dungeon layout using a random-walk algorithm,
    /// then instantiates room prefabs on a grid — Binding of Isaac style.
    /// </summary>
    public class DungeonGenerator : MonoBehaviour
    {
        [Header("Prefabs")]
        [Tooltip("Default room prefab. Must have a Room component.")]
        public GameObject roomPrefab;
        [Tooltip("Optional: prefab overrides per room type. Falls back to roomPrefab.")]
        public RoomPrefabEntry[] roomPrefabOverrides;

        [Header("Generation settings")]
        public int seed = 0;
        [Tooltip("Use 0 for a random seed each run")]
        public bool randomSeed = true;
        [Range(5, 50)]
        public int targetRoomCount = 12;
        [Tooltip("World-space size of one room cell")]
        public Vector2 roomSize = new Vector2(18f, 10f);

        [Header("Special room counts")]
        public int treasureRooms = 1;
        public int shopRooms = 1;

        // Runtime state
        private Dictionary<Vector2Int, Room> _rooms = new Dictionary<Vector2Int, Room>();
        private Room _currentRoom;

        // Neighbour offsets: North, South, East, West
        private static readonly Vector2Int[] Directions =
        {
            Vector2Int.up, Vector2Int.down, Vector2Int.right, Vector2Int.left
        };

        void Start()
        {
            Generate();
        }

        public void Generate()
        {
            ClearExisting();

            if (randomSeed) seed = Random.Range(0, int.MaxValue);
            Random.InitState(seed);

            List<Vector2Int> layout = BuildLayout();
            AssignRoomTypes(layout, out Dictionary<Vector2Int, RoomType> typeMap);
            SpawnRooms(layout, typeMap);
            ApplyDoors();

            _currentRoom = _rooms[Vector2Int.zero];
            ShowRoom(_currentRoom);
        }

        // ── Layout generation ────────────────────────────────────────────────

        private List<Vector2Int> BuildLayout()
        {
            var visited = new HashSet<Vector2Int>();
            var queue = new Queue<Vector2Int>();
            var result = new List<Vector2Int>();

            Vector2Int start = Vector2Int.zero;
            visited.Add(start);
            queue.Enqueue(start);
            result.Add(start);

            while (result.Count < targetRoomCount && queue.Count > 0)
            {
                Vector2Int current = queue.Dequeue();

                // Shuffle directions for variety
                Vector2Int[] dirs = (Vector2Int[])Directions.Clone();
                Shuffle(dirs);

                foreach (Vector2Int dir in dirs)
                {
                    if (result.Count >= targetRoomCount) break;

                    Vector2Int neighbour = current + dir;
                    if (visited.Contains(neighbour)) continue;

                    // Avoid rooms with 3+ existing neighbours (keeps map readable)
                    if (NeighbourCount(visited, neighbour) > 1) continue;

                    visited.Add(neighbour);
                    queue.Enqueue(neighbour);
                    result.Add(neighbour);
                }
            }

            return result;
        }

        private int NeighbourCount(HashSet<Vector2Int> visited, Vector2Int pos)
        {
            int count = 0;
            foreach (Vector2Int dir in Directions)
                if (visited.Contains(pos + dir)) count++;
            return count;
        }

        // ── Room type assignment ─────────────────────────────────────────────

        private void AssignRoomTypes(List<Vector2Int> layout, out Dictionary<Vector2Int, RoomType> typeMap)
        {
            typeMap = new Dictionary<Vector2Int, RoomType>();

            // Start room is always at origin
            typeMap[Vector2Int.zero] = RoomType.Start;

            // Boss room: farthest from start
            Vector2Int bossPos = FarthestFrom(layout, Vector2Int.zero);
            typeMap[bossPos] = RoomType.Boss;

            // Dead ends (single neighbour), excluding start and boss
            var deadEnds = new List<Vector2Int>();
            var layoutSet = new HashSet<Vector2Int>(layout);
            foreach (Vector2Int pos in layout)
            {
                if (typeMap.ContainsKey(pos)) continue;
                if (NeighbourCount(layoutSet, pos) == 1) deadEnds.Add(pos);
            }

            Shuffle(deadEnds);

            int specialIndex = 0;
            for (int i = 0; i < treasureRooms && specialIndex < deadEnds.Count; i++, specialIndex++)
                typeMap[deadEnds[specialIndex]] = RoomType.Treasure;
            for (int i = 0; i < shopRooms && specialIndex < deadEnds.Count; i++, specialIndex++)
                typeMap[deadEnds[specialIndex]] = RoomType.Shop;

            // Everything else is Normal
            foreach (Vector2Int pos in layout)
                if (!typeMap.ContainsKey(pos)) typeMap[pos] = RoomType.Normal;
        }

        private Vector2Int FarthestFrom(List<Vector2Int> layout, Vector2Int origin)
        {
            Vector2Int farthest = origin;
            float maxDist = -1f;
            foreach (Vector2Int pos in layout)
            {
                float d = (pos - origin).sqrMagnitude;
                if (d > maxDist) { maxDist = d; farthest = pos; }
            }
            return farthest;
        }

        // ── Spawning ─────────────────────────────────────────────────────────

        private void SpawnRooms(List<Vector2Int> layout, Dictionary<Vector2Int, RoomType> typeMap)
        {
            foreach (Vector2Int pos in layout)
            {
                RoomType type = typeMap[pos];
                GameObject prefab = GetPrefabForType(type);
                Vector3 worldPos = GridToWorld(pos);

                GameObject go = Instantiate(prefab, worldPos, Quaternion.identity, transform);
                go.name = $"Room_{pos.x}_{pos.y}_{type}";

                Room room = go.GetComponent<Room>();
                if (room == null)
                {
                    Debug.LogError($"Prefab for {type} is missing a Room component!", prefab);
                    continue;
                }

                room.Initialize(pos, type);
                room.SetVisible(false);
                _rooms[pos] = room;
            }
        }

        private void ApplyDoors()
        {
            foreach (var kvp in _rooms)
            {
                Vector2Int pos = kvp.Key;
                Room room = kvp.Value;
                room.SetDoors(
                    north: _rooms.ContainsKey(pos + Vector2Int.up),
                    south: _rooms.ContainsKey(pos + Vector2Int.down),
                    east:  _rooms.ContainsKey(pos + Vector2Int.right),
                    west:  _rooms.ContainsKey(pos + Vector2Int.left)
                );
            }
        }

        // ── Room transitions ─────────────────────────────────────────────────

        /// <summary>Call this when the player steps through a door.</summary>
        public void TransitionToRoom(Vector2Int gridPos)
        {
            if (!_rooms.TryGetValue(gridPos, out Room next)) return;
            if (next == _currentRoom) return;

            if (_currentRoom != null) _currentRoom.SetVisible(false);
            _currentRoom = next;
            ShowRoom(_currentRoom);
        }

        private void ShowRoom(Room room)
        {
            room.SetVisible(true);
            RoomManager.Instance?.OnRoomEntered(room);
        }

        // ── Utilities ────────────────────────────────────────────────────────

        public Vector3 GridToWorld(Vector2Int gridPos) =>
            new Vector3(gridPos.x * roomSize.x, gridPos.y * roomSize.y, 0f);

        private GameObject GetPrefabForType(RoomType type)
        {
            foreach (var entry in roomPrefabOverrides)
                if (entry.roomType == type && entry.prefab != null) return entry.prefab;
            return roomPrefab;
        }

        private void ClearExisting()
        {
            foreach (var room in _rooms.Values)
                if (room != null) Destroy(room.gameObject);
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

        public IReadOnlyDictionary<Vector2Int, Room> Rooms => _rooms;
        public Room CurrentRoom => _currentRoom;

        [System.Serializable]
        public struct RoomPrefabEntry
        {
            public RoomType roomType;
            public GameObject prefab;
        }
    }
}
