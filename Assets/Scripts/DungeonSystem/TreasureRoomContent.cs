using UnityEngine;

namespace DungeonSystem
{
    /// <summary>
    /// Attach to Content_Treasure inside the room prefab.
    /// Picks a random item from the list and places it on the pedestal.
    /// </summary>
    public class TreasureRoomContent : MonoBehaviour, IRoomContent
    {
        [Tooltip("Item prefabs to choose from")]
        public GameObject[] itemPrefabs;
        [Tooltip("Where to place the item")]
        public Transform pedestal;

        private bool _spawned;

        public void OnRoomEnter()
        {
            if (_spawned || itemPrefabs == null || itemPrefabs.Length == 0) return;
            _spawned = true;

            Vector3 pos = pedestal != null ? pedestal.position : transform.position;
            GameObject item = itemPrefabs[Random.Range(0, itemPrefabs.Length)];
            Instantiate(item, pos, Quaternion.identity);
        }
    }
}
