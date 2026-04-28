using UnityEngine;

namespace DungeonSystem
{
    /// <summary>
    /// Attach to the room prefab root.
    ///
    /// Prefab structure:
    ///   RoomRoot  (Room component)
    ///   ├── DoorNorth / DoorSouth / DoorEast / DoorWest
    ///   │     └── DoorLock  ← child GO shown while doors are locked
    ///   ├── Content_Normal   (NormalRoomContent component)
    ///   ├── Content_Start    (StartRoomContent component)
    ///   ├── Content_Boss     (BossRoomContent component)
    ///   ├── Content_Treasure (TreasureRoomContent component)
    ///   └── Content_Shop     (ShopRoomContent component)
    /// </summary>
    public class Room : MonoBehaviour
    {
        [Header("Doors (enabled when a neighbour exists)")]
        public GameObject doorNorth;
        public GameObject doorSouth;
        public GameObject doorEast;
        public GameObject doorWest;

        [Header("Door lock overlays (shown while enemies are alive)")]
        public GameObject lockNorth;
        public GameObject lockSouth;
        public GameObject lockEast;
        public GameObject lockWest;

        [Header("Content roots — one per room type")]
        public GameObject contentNormal;
        public GameObject contentStart;
        public GameObject contentBoss;
        public GameObject contentTreasure;
        public GameObject contentShop;

        [Header("Player spawn point")]
        public Transform playerSpawnPoint;

        public Vector2Int GridPosition { get; private set; }
        public RoomType   RoomType     { get; private set; }

        private IRoomContent _activeContent;

        // ── Generator API ────────────────────────────────────────────────────

        public void Initialize(Vector2Int gridPos, RoomType type)
        {
            GridPosition = gridPos;
            RoomType     = type;
            ActivateContent(type);
        }

        public void SetDoors(bool north, bool south, bool east, bool west)
        {
            Toggle(doorNorth, north);
            Toggle(doorSouth, south);
            Toggle(doorEast,  east);
            Toggle(doorWest,  west);
        }

        /// <summary>Locks/unlocks all doors that exist (called by content scripts).</summary>
        public void LockDoors(bool locked)
        {
            // Only lock directions that actually have a door
            Toggle(lockNorth, locked && doorNorth != null && doorNorth.activeSelf);
            Toggle(lockSouth, locked && doorSouth != null && doorSouth.activeSelf);
            Toggle(lockEast,  locked && doorEast  != null && doorEast.activeSelf);
            Toggle(lockWest,  locked && doorWest  != null && doorWest.activeSelf);
        }

        // ── Visibility / lifecycle ───────────────────────────────────────────

        public void SetVisible(bool visible)
        {
            gameObject.SetActive(visible);
            if (visible) _activeContent?.OnRoomEnter();
        }

        // ── Internal ─────────────────────────────────────────────────────────

        private void ActivateContent(RoomType type)
        {
            Toggle(contentNormal,   type == RoomType.Normal);
            Toggle(contentStart,    type == RoomType.Start);
            Toggle(contentBoss,     type == RoomType.Boss);
            Toggle(contentTreasure, type == RoomType.Treasure);
            Toggle(contentShop,     type == RoomType.Shop);

            GameObject active = type switch
            {
                RoomType.Normal   => contentNormal,
                RoomType.Start    => contentStart,
                RoomType.Boss     => contentBoss,
                RoomType.Treasure => contentTreasure,
                RoomType.Shop     => contentShop,
                _                 => null
            };

            _activeContent = active != null ? active.GetComponent<IRoomContent>() : null;
        }

        private static void Toggle(GameObject go, bool active)
        {
            if (go != null) go.SetActive(active);
        }
    }
}
