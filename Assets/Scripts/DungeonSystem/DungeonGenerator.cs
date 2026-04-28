using System.Collections.Generic;
using UnityEngine;

namespace DungeonSystem
{
    /// <summary>
    /// Generates a Binding-of-Isaac-style dungeon on a 2D grid.
    /// All rooms share one prefab; the Room component activates the
    /// correct content section based on the assigned RoomType.
    /// </summary>
    public class DungeonGenerator : MonoBehaviour
    {
        [Header("Prefab")]
        public GameObject roomPrefab;

        [Header("Generation")]
        public bool  randomSeed    = true;
        public int   seed          = 0;
        [Range(5, 50)]
        public int   targetRooms   = 12;
        public Vector2 roomSize    = new Vector2(18f, 10f);

        [Header("Special rooms (placed on dead ends)")]
        public int treasureRooms = 1;
        public int shopRooms     = 1;

        private readonly Dictionary<Vector2Int, Room> _rooms = new();
        private Room _currentRoom;

        private static readonly Vector2Int[] Dirs =
            { Vector2Int.up, Vector2Int.down, Vector2Int.right, Vector2Int.left };

        void Start() => Generate();

        // ── Public API ───────────────────────────────────────────────────────

        public void Generate()
        {
            ClearExisting();
            if (randomSeed) seed = Random.Range(0, int.MaxValue);
            Random.InitState(seed);

            var layout  = BuildLayout();
            var typeMap = AssignTypes(layout);
            SpawnRooms(layout, typeMap);
            ApplyDoors();

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

        // ── Type assignment ──────────────────────────────────────────────────

        private Dictionary<Vector2Int, RoomType> AssignTypes(List<Vector2Int> layout)
        {
            var map     = new Dictionary<Vector2Int, RoomType>();
            var gridSet = new HashSet<Vector2Int>(layout);

            map[Vector2Int.zero]             = RoomType.Start;
            map[FarthestFrom(layout, Vector2Int.zero)] = RoomType.Boss;

            // Collect unassigned dead ends for special rooms
            var deadEnds = new List<Vector2Int>();
            foreach (Vector2Int pos in layout)
                if (!map.ContainsKey(pos) && NeighbourCount(gridSet, pos) == 1)
                    deadEnds.Add(pos);
            Shuffle(deadEnds);

            int idx = 0;
            for (int i = 0; i < treasureRooms && idx < deadEnds.Count; i++, idx++)
                map[deadEnds[idx]] = RoomType.Treasure;
            for (int i = 0; i < shopRooms    && idx < deadEnds.Count; i++, idx++)
                map[deadEnds[idx]] = RoomType.Shop;

            foreach (Vector2Int pos in layout)
                if (!map.ContainsKey(pos)) map[pos] = RoomType.Normal;

            return map;
        }

        // ── Spawning ─────────────────────────────────────────────────────────

        private void SpawnRooms(List<Vector2Int> layout, Dictionary<Vector2Int, RoomType> typeMap)
        {
            foreach (Vector2Int pos in layout)
            {
                GameObject go = Instantiate(roomPrefab, GridToWorld(pos), Quaternion.identity, transform);
                go.name = $"Room_{pos.x}_{pos.y}_{typeMap[pos]}";

                Room room = go.GetComponent<Room>();
                if (room == null) { Debug.LogError("roomPrefab is missing a Room component!"); continue; }

                room.Initialize(pos, typeMap[pos]);
                room.SetVisible(false);
                _rooms[pos] = room;
            }
        }

        private void ApplyDoors()
        {
            foreach (var (pos, room) in _rooms)
                room.SetDoors(
                    north: _rooms.ContainsKey(pos + Vector2Int.up),
                    south: _rooms.ContainsKey(pos + Vector2Int.down),
                    east:  _rooms.ContainsKey(pos + Vector2Int.right),
                    west:  _rooms.ContainsKey(pos + Vector2Int.left));
        }

        // ── Transitions ──────────────────────────────────────────────────────

        private void EnterRoom(Vector2Int pos)
        {
            if (_currentRoom != null) _currentRoom.SetVisible(false);
            _currentRoom = _rooms[pos];
            _currentRoom.SetVisible(true);
            RoomManager.Instance?.OnRoomEntered(_currentRoom);
        }

        // ── Helpers ──────────────────────────────────────────────────────────

        private int NeighbourCount(HashSet<Vector2Int> set, Vector2Int pos)
        {
            int n = 0;
            foreach (Vector2Int d in Dirs) if (set.Contains(pos + d)) n++;
            return n;
        }

        private Vector2Int FarthestFrom(List<Vector2Int> layout, Vector2Int origin)
        {
            Vector2Int best = origin;
            float maxDist = -1f;
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
    }
}
