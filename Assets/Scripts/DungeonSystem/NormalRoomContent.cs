using System.Collections.Generic;
using UnityEngine;

namespace DungeonSystem
{
    /// <summary>
    /// Attach to Content_Normal inside the room prefab.
    /// Spawns enemies when the player first enters; locks doors until all are dead.
    /// Spawn points are child GameObjects of this object.
    /// </summary>
    public class NormalRoomContent : MonoBehaviour, IRoomContent
    {
        [Tooltip("Enemy prefabs to choose from (picked randomly per spawn point)")]
        public GameObject[] enemyPrefabs;

        private Room _room;
        private readonly List<GameObject> _enemies = new();
        private bool _cleared;
        private bool _entered;

        private void Awake()
        {
            _room = GetComponentInParent<Room>();
        }

        public void OnRoomEnter()
        {
            if (_entered || _cleared) return;
            _entered = true;
            SpawnEnemies();
        }

        private void SpawnEnemies()
        {
            if (enemyPrefabs == null || enemyPrefabs.Length == 0) return;

            foreach (Transform spawnPoint in transform)
            {
                GameObject prefab = enemyPrefabs[Random.Range(0, enemyPrefabs.Length)];
                GameObject enemy  = Instantiate(prefab, spawnPoint.position, Quaternion.identity);
                _enemies.Add(enemy);
            }

            if (_enemies.Count > 0)
                _room.LockDoors(true);
        }

        private void Update()
        {
            if (_cleared || !_entered || _enemies.Count == 0) return;

            _enemies.RemoveAll(e => e == null);

            if (_enemies.Count == 0)
            {
                _cleared = true;
                _room.LockDoors(false);
            }
        }
    }
}
