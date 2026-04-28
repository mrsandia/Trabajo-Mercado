using UnityEngine;

namespace DungeonSystem
{
    /// <summary>
    /// Attach to room prefab root. Holds references to door GameObjects
    /// so the generator can open/close them after layout is built.
    /// </summary>
    public class Room : MonoBehaviour
    {
        [Header("Door GameObjects (walls that open when neighbour exists)")]
        public GameObject doorNorth;
        public GameObject doorSouth;
        public GameObject doorEast;
        public GameObject doorWest;

        [Header("Spawn points")]
        public Transform enemySpawnParent;
        public Transform playerSpawnPoint;

        public Vector2Int GridPosition { get; private set; }
        public RoomType RoomType { get; private set; }

        public void Initialize(Vector2Int gridPos, RoomType type)
        {
            GridPosition = gridPos;
            RoomType = type;
        }

        public void SetDoors(bool north, bool south, bool east, bool west)
        {
            SetDoor(doorNorth, north);
            SetDoor(doorSouth, south);
            SetDoor(doorEast, east);
            SetDoor(doorWest, west);
        }

        private void SetDoor(GameObject door, bool open)
        {
            if (door != null) door.SetActive(open);
        }

        public void SetVisible(bool visible)
        {
            gameObject.SetActive(visible);
        }
    }
}
