using UnityEngine;

namespace DungeonSystem
{
    /// <summary>
    /// Singleton that centralises room-state logic (camera, music, minimap, etc.).
    /// Extend OnRoomEntered with your game's specific needs.
    /// </summary>
    public class RoomManager : MonoBehaviour
    {
        public static RoomManager Instance { get; private set; }

        [Header("Optional references")]
        public Camera mainCamera;

        public event System.Action<Room> OnRoomChanged;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
        }

        public void OnRoomEntered(Room room)
        {
            CenterCameraOnRoom(room);
            OnRoomChanged?.Invoke(room);
            Debug.Log($"[RoomManager] Entered room at {room.GridPosition} ({room.RoomType})");
        }

        private void CenterCameraOnRoom(Room room)
        {
            if (mainCamera == null) return;
            Vector3 pos = room.transform.position;
            mainCamera.transform.position = new Vector3(pos.x, pos.y, mainCamera.transform.position.z);
        }
    }
}
