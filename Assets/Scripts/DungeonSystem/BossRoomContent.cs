using UnityEngine;

namespace DungeonSystem
{
    /// <summary>
    /// Attach to Content_Boss inside the room prefab.
    /// Spawns the boss on first entry, locks doors until it dies.
    /// The boss prefab must have a BossEnemy component (or any component
    /// that destroys/deactivates itself when it dies).
    /// </summary>
    public class BossRoomContent : MonoBehaviour, IRoomContent
    {
        public GameObject bossPrefab;
        public Transform  bossSpawnPoint;

        private Room       _room;
        private GameObject _boss;
        private bool       _defeated;

        private void Awake()
        {
            _room = GetComponentInParent<Room>();
        }

        public void OnRoomEnter()
        {
            if (_boss != null || _defeated) return;

            Vector3 spawnPos = bossSpawnPoint != null ? bossSpawnPoint.position : transform.position;
            _boss = Instantiate(bossPrefab, spawnPos, Quaternion.identity);
            _room.LockDoors(true);
        }

        private void Update()
        {
            if (_defeated || _boss != null) return;
            // _boss was set but is now null → destroyed = dead
            _defeated = true;
            _room.LockDoors(false);
            OnBossDefeated();
        }

        private void OnBossDefeated()
        {
            Debug.Log("[BossRoom] Boss defeated!");
            // Hook here: open path to next floor, play fanfare, etc.
        }
    }
}
