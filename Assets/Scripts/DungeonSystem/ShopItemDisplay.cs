using UnityEngine;
using TMPro;

namespace DungeonSystem
{
    /// <summary>
    /// Attach to a shop item prefab.
    /// Receives its price from ShopRoomContent and shows it via a TextMeshPro label.
    /// </summary>
    public class ShopItemDisplay : MonoBehaviour
    {
        public TextMeshPro priceLabel;
        public int Price { get; private set; }

        public void SetPrice(int price)
        {
            Price = price;
            if (priceLabel != null) priceLabel.text = price.ToString();
        }
    }
}
