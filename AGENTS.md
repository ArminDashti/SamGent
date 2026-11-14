# SamGent agent rules

## Export APK after every change

After **any** change that affects the Android app (or when finishing a task that touched `android-app/`), the agent **must** build and export a debug APK before ending the turn.

### Destination

- Full path: `android-app/apks/SamGent-x-y-z.apk` (create `android-app/apks/` if missing)
- Absolute example: `C:/Users/armin/GitHub/SamGent/android-app/apks/SamGent-x-y-z.apk`
- `x.y.z` = `versionName` from `android-app/app/build.gradle.kts` (`defaultConfig.versionName`)
- Dots in the version become hyphens in the filename
- Example: `versionName = "1.0.0"` → `android-app/apks/SamGent-1-0-0.apk`

### How

```powershell
cd android-app
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.21.21-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;" + $env:PATH
New-Item -ItemType Directory -Force -Path apks | Out-Null
.\gradlew.bat assembleDebug
Copy-Item -Force "app\build\outputs\apk\debug\app-debug.apk" "apks\SamGent-<x>-<y>-<z>.apk"
```

Replace `<x>-<y>-<z>` with the current `versionName` using hyphens.

**Gotcha:** Default `java` on this machine is 8; AGP 8.7 needs JDK 11+. Set `JAVA_HOME` to Microsoft JDK 17 (or Android Studio `jbr`) before `gradlew`.

### Rules

1. Always overwrite the APK for the current version (same `SamGent-x-y-z.apk` path).
2. If you bump `versionName` / `versionCode`, export under the **new** filename.
3. Report the final path of the exported APK in the completion notes.
4. Skip only when the task did not change anything under `android-app/` and no Android rebuild is needed; say so explicitly.
