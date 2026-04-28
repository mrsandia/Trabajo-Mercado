using UnityEngine;

namespace DungeonSystem
{
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

        [Header("Content roots — one per room type (opcional)")]
        public GameObject contentNormal;
        public GameObject contentStart;
        public GameObject contentBoss;
        public GameObject contentTreasure;
        public GameObject contentShop;

        [Header("Player spawn point")]
        public Transform playerSpawnPoint;

        public Vector2Int GridPosition { get; private set; }
        public RoomType   RoomType     { get; private set; }

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

        public void LockDoors(bool locked)
        {
            Toggle(lockNorth, locked && doorNorth != null && doorNorth.activeSelf);
            Toggle(lockSouth, locked && doorSouth != null && doorSouth.activeSelf);
            Toggle(lockEast,  locked && doorEast  != null && doorEast.activeSelf);
            Toggle(lockWest,  locked && doorWest  != null && doorWest.activeSelf);
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
