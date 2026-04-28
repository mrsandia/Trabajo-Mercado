using UnityEngine;

namespace DungeonSystem
{
    /// <summary>
    /// Attach to Content_Shop inside the room prefab.
    /// Places shop items at designated slots on first entry.
    /// Each slot is a child Transform of this object.
    /// </summary>
    public class ShopRoomContent : MonoBehaviour, IRoomContent
    {
        [Tooltip("Items available in the shop. One item per child Transform slot.")]
        public ShopItem[] shopItems;

        private bool _spawned;

        public void OnRoomEnter()
        {
            if (_spawned) return;
            _spawned = true;

            int slotCount = transform.childCount;
            for (int i = 0; i < shopItems.Length && i < slotCount; i++)
            {
                if (shopItems[i].prefab == null) continue;
                Transform slot = transform.GetChild(i);
                GameObject go  = Instantiate(shopItems[i].prefab, slot.position, Quaternion.identity);

                // Let the spawned object know its price so it can display it
                ShopItemDisplay display = go.GetComponent<ShopItemDisplay>();
                if (display != null) display.SetPrice(shopItems[i].price);
            }
        }

        [System.Serializable]
        public struct ShopItem
        {
            public GameObject prefab;
            public int        price;
        }
    }
}
