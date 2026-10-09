#!/system/bin/sh
# Device-side lease: screen wake lock is transient and disappears on reboot.
D=/data/local/tmp/nexo-work-screen
SCRIPT=/data/local/tmp/nexo-screen-guard.sh
TYPE=SCREEN_BRIGHT_WAKE_LOCK
mkdir -p "$D"
boot=$(cat /proc/sys/kernel/random/boot_id)
oldboot=$(cat "$D/boot" 2>/dev/null)
if [ "$oldboot" != "$boot" ]; then
    rm -rf "$D/update" "$D/guard"
    rm -f "$D/until"
    echo "$boot" > "$D/boot"
fi
lock() {
    tries=0
    until mkdir "$D/update" 2>/dev/null; do
        tries=$((tries+1))
        [ "$tries" -ge 30 ] && return 1
        sleep 0.1
    done
}
unlock() { rmdir "$D/update" 2>/dev/null; }
held() {
    cmd power set-wakelock list | grep -q 'SCREEN_BRIGHT_WAKE_LOCK:.*held=true'
}
release_lock() {
    if held; then cmd power set-wakelock release "$TYPE" >/dev/null; fi
}
case "$1" in
renew)
    seconds="$2"
    case "$seconds" in ''|*[!0-9]*) exit 2;; esac
    [ "$seconds" -ge 5 ] && [ "$seconds" -le 1800 ] || exit 2
    lock || exit 3
    trap unlock EXIT HUP INT TERM
    until_at=$(($(date +%s)+seconds))
    echo "$until_at" > "$D/until.tmp"
    mv "$D/until.tmp" "$D/until"
    if ! held; then
        cmd power set-wakelock acquire "$TYPE" >/dev/null || exit 4
    fi
    pid=$(cat "$D/guard/pid" 2>/dev/null)
    if [ -z "$pid" ] || ! kill -0 "$pid" 2>/dev/null; then
        rm -rf "$D/guard"
        mkdir "$D/guard"
        nohup sh "$SCRIPT" watch </dev/null >"$D/guard.log" 2>&1 &
        echo "$!" > "$D/guard/pid"
    fi
    echo "ACTIVE until=$until_at"
    ;;
watch)
    while true; do
        lock || { sleep 1; continue; }
        until_at=$(cat "$D/until" 2>/dev/null)
        case "$until_at" in ''|*[!0-9]*) until_at=0;; esac
        if [ "$(date +%s)" -ge "$until_at" ]; then
            release_lock
            rm -f "$D/until"
            rm -rf "$D/guard"
            unlock
            exit 0
        fi
        unlock
        sleep 2
    done
    ;;
release)
    lock || exit 3
    trap unlock EXIT HUP INT TERM
    rm -f "$D/until"
    release_lock
    echo RELEASED
    ;;
status)
    cmd power set-wakelock list
    echo "deadline=$(cat "$D/until" 2>/dev/null)"
    ;;
*) exit 2;;
esac
