function setEntityState(entity, next) {
    const cState = entity.getComponent(ComponentTypes.CState);
    if (!cState || cState.current === next) return;
    const from = playerStateCallbacks.get(cState.current);
    const to = playerStateCallbacks.get(next);

    // exit old
    from?.exit?.(entity);
    // switch
    cState.current = next;
    // enter new
    to?.entry?.(entity);
}
export { setEntityState };
export default playerStateCallbacks;
