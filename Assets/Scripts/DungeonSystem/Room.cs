using UnityEngine;

namespace DungeonSystem
{
    /// <summary>
    /// Attach to the room prefab root.
    ///
    /// Prefab structure expected:
    ///   RoomRoot  (this component)
    ///   ├── DoorNorth / DoorSouth / DoorEast / DoorWest   ← wall/door GOs
    ///   ├── Content_Normal
    ///   ├── Content_Start
    ///   ├── Content_Boss
    ///   ├── Content_Treasure
    ///   └── Content_Shop
    ///
    /// On Initialize() the matching Content_* child is enabled; the rest stay off.
    /// </summary>
    public class Room : MonoBehaviour
    {
        [Header("Doors (enabled when a neighbour exists)")]
        public GameObject doorNorth;
        public GameObject doorSouth;
        public GameObject doorEast;
        public GameObject doorWest;

        [Header("Content roots — one per room type")]
        public GameObject contentNormal;
        public GameObject contentStart;
        public GameObject contentBoss;
        public GameObject contentTreasure;
        public GameObject contentShop;

        [Header("Player spawn point inside this room")]
        public Transform playerSpawnPoint;

        public Vector2Int GridPosition { get; private set; }
        public RoomType RoomType      { get; private set; }

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

        public void SetVisible(bool visible) => gameObject.SetActive(visible);

        private void ActivateContent(RoomType type)
        {
            Toggle(contentNormal,   type == RoomType.Normal);
            Toggle(contentStart,    type == RoomType.Start);
            Toggle(contentBoss,     type == RoomType.Boss);
            Toggle(contentTreasure, type == RoomType.Treasure);
            Toggle(contentShop,     type == RoomType.Shop);
        }

        private static void Toggle(GameObject go, bool active)
        {
            if (go != null) go.SetActive(active);
        }
    }
}
