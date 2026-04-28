using System.Collections.Generic;
using UnityEngine;

namespace DungeonSystem
{
    public enum RoomType { Normal, Start, Boss, Treasure, Shop }

    [System.Flags]
    public enum DoorDirection { None = 0, North = 1, South = 2, East = 4, West = 8 }

    [CreateAssetMenu(fileName = "NewRoomData", menuName = "Dungeon/Room Data")]
    public class RoomData : ScriptableObject
    {
        public RoomType roomType;
        [Tooltip("Which exits this prefab variant supports")]
        public DoorDirection supportedDoors;
    }
}
