namespace DungeonSystem
{
    /// <summary>
    /// Implemented by every Content_* script inside a room prefab.
    /// Room calls OnRoomEnter() the first time the player enters.
    /// </summary>
    public interface IRoomContent
    {
        void OnRoomEnter();
    }
}
