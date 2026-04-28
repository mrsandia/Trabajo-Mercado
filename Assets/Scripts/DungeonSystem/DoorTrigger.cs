using UnityEngine;

namespace DungeonSystem
{
    /// <summary>
    /// Place on each door collider inside the room prefab.
    /// When the player enters, it tells DungeonGenerator to transition.
    /// </summary>
    public class DoorTrigger : MonoBehaviour
    {
        [Tooltip("Tag of the player GameObject")]
        public string playerTag = "Player";

        [Tooltip("Direction this door leads (relative to parent room)")]
        public Vector2Int direction;

        private DungeonGenerator _generator;

        private void Awake()
        {
            _generator = FindObjectOfType<DungeonGenerator>();
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (!other.CompareTag(playerTag)) return;
            Room parentRoom = GetComponentInParent<Room>();
            if (parentRoom == null) return;

            Vector2Int targetGrid = parentRoom.GridPosition + direction;
            _generator.TransitionToRoom(targetGrid);
        }
    }
}
