using UnityEngine;

namespace DungeonSystem
{
    /// <summary>
    /// Attach to Content_Start inside the room prefab.
    /// Positions the player at the room's spawn point on first entry.
    /// </summary>
    public class StartRoomContent : MonoBehaviour, IRoomContent
    {
        [Tooltip("Tag of the player GameObject")]
        public string playerTag = "Player";

        private bool _entered;

        public void OnRoomEnter()
        {
            if (_entered) return;
            _entered = true;

            Room room = GetComponentInParent<Room>();
            if (room == null || room.playerSpawnPoint == null) return;

            GameObject player = GameObject.FindGameObjectWithTag(playerTag);
            if (player != null)
                player.transform.position = room.playerSpawnPoint.position;
        }
    }
}
